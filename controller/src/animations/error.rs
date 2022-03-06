use std::io::{self, ErrorKind};
use thiserror::Error;
use wasmer::{CompileError, DeserializeError, ExportError, InstantiationError, SerializeError};

#[derive(Debug, Error)]
pub enum BuildError {
    #[error("failed to compile animation")]
    Compilation(#[from] CompileError),
    #[error("failed to load animation")]
    Instantiation(#[from] InstantiationError),
    #[error("invalid signature for animate function")]
    InvalidSignature,
    #[error("missing animate function")]
    MethodNotFound,
}

impl From<ExportError> for BuildError {
    fn from(e: ExportError) -> Self {
        match e {
            ExportError::IncompatibleType => Self::InvalidSignature,
            ExportError::Missing(_) => Self::MethodNotFound,
        }
    }
}

#[derive(Debug, Error)]
pub enum LoadError {
    #[error("couldn't find the animation")]
    NotFound,
    #[error("failed to read file")]
    IO(#[source] io::Error),
    #[error("failed to parse animation")]
    Deserialization(#[from] DeserializeError),
    #[error("failed to load animation")]
    Instantiation(#[from] InstantiationError),
}

impl From<io::Error> for LoadError {
    fn from(e: io::Error) -> Self {
        match e.kind() {
            ErrorKind::NotFound => LoadError::NotFound,
            _ => LoadError::IO(e),
        }
    }
}

#[derive(Debug, Error)]
pub enum RegistrationError {
    #[error("failed to build animation")]
    BuildError(#[from] BuildError),
    #[error("failed to save animation")]
    SaveError(#[from] SaveError),
}

#[derive(Debug, Error)]
pub enum SaveError {
    #[error("failed to write to file")]
    IO(#[from] io::Error),
    #[error("failed to serialize animation")]
    Serialization(#[from] SerializeError),
}
