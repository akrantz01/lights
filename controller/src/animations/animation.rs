use super::{BuildError, Flow, LoadError, SaveError, Wasm};
use crate::{lights::AnimationKind, pixels::Pixels};
use async_trait::async_trait;
use std::{
    error::Error,
    io::{self, ErrorKind},
    path::Path,
};
use tokio::fs;
use tracing::{debug, instrument};

/// An animation to be run by the animator
#[async_trait]
pub(crate) trait Animation: Send + Sync {
    /// Load and compile an animation from bytes
    fn build<B>(
        content: B,
        development: bool,
        pixels: Pixels,
    ) -> Result<Box<dyn Animation>, BuildError>
    where
        B: AsRef<[u8]>,
        Self: Sized;

    /// Serialize an animation so it can be saved to a file
    fn serialize(&self) -> Result<Vec<u8>, SaveError>;

    /// Deserialize an animation from a file's contents
    fn deserialize(content: Vec<u8>, pixels: Pixels) -> Result<Box<dyn Animation>, LoadError>
    where
        Self: Sized;

    /// Save an animation to a file
    async fn save(&self, id: &str, kind: AnimationKind, base: &Path) -> Result<(), SaveError> {
        let mut content = self.serialize()?;

        // Add an identifier for the type of animation
        content.insert(0, kind as i32 as u8);

        fs::write(base.join(id), &content).await?;
        Ok(())
    }

    /// Run a single animation frame
    fn animate(&self) -> Result<(), Box<dyn Error>>;
}

/// Load an animation from disk
#[instrument(skip(base, pixels))]
pub(crate) async fn load(
    id: &str,
    base: &Path,
    pixels: Pixels,
) -> Result<Box<dyn Animation>, LoadError> {
    // Read the animation
    let mut content = fs::read(base.join(id)).await?;
    debug!("read animation");

    // Determine what type of animation it is
    let kind = AnimationKind::from_i32(content[0] as i32).unwrap_or(AnimationKind::Unknown);
    content.remove(0);
    debug!("loading animation of type {kind:?}");

    match kind {
        AnimationKind::Wasm => Wasm::deserialize(content, pixels),
        AnimationKind::Flow => Flow::deserialize(content, pixels),
        AnimationKind::Unknown => Err(LoadError::Unknown),
    }
}

/// Delete an animation from disk
#[instrument(skip(base))]
pub(crate) async fn remove(id: &str, base: &Path) -> Result<(), io::Error> {
    let path = base.join(id);
    if let Err(e) = fs::remove_file(path).await {
        match e.kind() {
            ErrorKind::NotFound => Ok(()),
            _ => Err(e),
        }
    } else {
        Ok(())
    }
}
