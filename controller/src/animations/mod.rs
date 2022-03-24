use crate::{lights::AnimationKind, pixels::Pixels};
use std::{io, path::PathBuf, sync::Arc};
use tokio::{
    sync::mpsc::{self, error::TryRecvError, Receiver, Sender},
    task::{self, JoinHandle},
};
use tracing::{error, info, instrument};

mod animation;
mod error;
mod flow;
mod wasm;

use animation::Animation;
pub use error::{BuildError, LoadError, RegistrationError, SaveError};
use wasm::Wasm;

/// The action for the executor to perform
#[derive(Debug)]
enum Action {
    /// Start the animation with the specified id
    Start(String),
    /// Stop any currently running animation
    Stop,
    /// Shutdown the animation executor
    Shutdown,
}

pub type SharedAnimator = Arc<Animator>;

/// Handle running animations on the light strip
#[derive(Clone, Debug)]
pub struct Animator {
    base_path: PathBuf,
    development: bool,
    pixels: Pixels,
    tx: Sender<Action>,
}

impl Animator {
    /// Create and start a new animator
    pub fn new<P: Into<PathBuf>>(
        base_path: P,
        development: bool,
        pixels: Pixels,
    ) -> (SharedAnimator, JoinHandle<()>) {
        let base_path = base_path.into();

        // Create the control channel
        let (tx, rx) = mpsc::channel(5);

        // Launch the executor
        let executor_path = base_path.clone();
        let executor_pixels = pixels.clone();
        let handle = task::spawn(executor(executor_path, executor_pixels, rx));

        (
            Arc::new(Self {
                base_path,
                development,
                pixels,
                tx,
            }),
            handle,
        )
    }

    /// Compile and save an animation to disk
    #[instrument(skip(self, data))]
    pub async fn register<B: AsRef<[u8]>>(
        &self,
        id: &str,
        data: B,
        kind: AnimationKind,
    ) -> Result<(), RegistrationError> {
        let animation = match kind {
            AnimationKind::Wasm => Wasm::build(data, self.development, self.pixels.clone())?,
            AnimationKind::Flow => todo!(),
            _ => unreachable!(),
        };
        animation.save(id, &self.base_path).await?;

        Ok(())
    }

    /// Delete an animation from disk
    #[instrument(skip(self))]
    pub async fn remove(&self, id: &str) -> Result<(), io::Error> {
        animation::remove(id, &self.base_path).await
    }

    /// Start an animation
    #[instrument(skip(self))]
    pub async fn start(&self, id: &str) {
        if let Err(err) = self.tx.send(Action::Start(id.into())).await {
            error!(%err, "failed to start animation");
        }
    }

    /// Stop the currently running animation
    #[instrument(skip(self))]
    pub async fn stop(&self) {
        if let Err(err) = self.tx.send(Action::Stop).await {
            error!(%err, "failed to stop animation");
        }
    }

    /// Shutdown the executor
    #[instrument(skip(self))]
    pub async fn shutdown(&self) {
        if let Err(err) = self.tx.send(Action::Shutdown).await {
            error!(%err, "failed to shutdown executor");
        }
    }
}

/// Waits for an animation to be received and then runs it
#[instrument(name = "animator", skip_all)]
async fn executor(path: PathBuf, pixels: Pixels, mut actions: Receiver<Action>) {
    info!("animator started");
    let mut animation: Option<Box<dyn Animation>> = None;

    loop {
        match &animation {
            None => match actions.recv().await {
                Some(Action::Start(id)) => match Wasm::load(&id, &path, pixels.clone()).await {
                    Ok(a) => animation = Some(a),
                    Err(err) => error!(%err, "failed to load animation"),
                },
                Some(Action::Stop) => continue, // Already stopped, nothing to do
                Some(Action::Shutdown) | None => break, // Exit when the channel closes
            },
            Some(a) => {
                // Execute a frame
                if let Err(err) = a.animate() {
                    animation = None;
                    error!(%err, "an error occurred while executing the animation");
                }

                // Check if there is an action waiting
                match actions.try_recv() {
                    Ok(Action::Start(id)) => match Wasm::load(&id, &path, pixels.clone()).await {
                        Ok(a) => animation = Some(a),
                        Err(err) => error!(%err, "failed to load animation"),
                    },
                    Ok(Action::Stop) => animation = None, // Stop the animation
                    Err(TryRecvError::Empty) => continue, // No action, just continue to the next frame
                    Ok(Action::Shutdown) | Err(TryRecvError::Disconnected) => break, // Exit when channel closes
                }
            }
        }
    }

    info!("shutdown successfully")
}
