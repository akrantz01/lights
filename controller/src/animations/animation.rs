use super::{BuildError, LoadError, SaveError};
use crate::pixels::Pixels;
use async_trait::async_trait;
use std::{
    error::Error,
    io::{self, ErrorKind},
    path::Path,
};
use tokio::fs;
use tracing::instrument;

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

    /// Load a pre-compiled animation from disk
    async fn load(id: &str, base: &Path, pixels: Pixels) -> Result<Box<dyn Animation>, LoadError>
    where
        Self: Sized;

    /// Save an animation to a file
    async fn save(&self, id: &str, base: &Path) -> Result<(), SaveError>;

    /// Run a single animation frame
    fn animate(&self) -> Result<(), Box<dyn Error>>;
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
