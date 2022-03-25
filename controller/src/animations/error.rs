use super::flow::SyntaxError;
use serde_json::Error as SerdeError;
use std::io::{self, ErrorKind};
use thiserror::Error;
use wasmer::{CompileError, DeserializeError, ExportError, InstantiationError, SerializeError};

// TODO: re-work error handling

#[derive(Debug, Error)]
pub enum BuildError {
    #[error("failed to compile animation: {0}")]
    Compilation(#[from] CompileError),
    #[error("failed to load animation: {0}")]
    Instantiation(#[from] InstantiationError),
    #[error("failed to parse animation: {0}")]
    Parsing(#[from] SerdeError),
    #[error("syntax error: {0}")]
    Syntax(#[from] SyntaxError),
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
    #[error("unknown animation type")]
    Unknown,
    #[error("failed to read file: {0}")]
    IO(#[source] io::Error),
    #[error("failed to parse animation: {0}")]
    Deserialization(#[source] DeserializationInner),
    #[error("failed to load animation: {0}")]
    Instantiation(#[from] InstantiationError),
}

#[derive(Debug, Error)]
pub enum DeserializationInner {
    #[error(transparent)]
    Wasmer(#[from] DeserializeError),
    #[error(transparent)]
    Serde(#[from] SerdeError),
}

impl From<io::Error> for LoadError {
    fn from(e: io::Error) -> Self {
        match e.kind() {
            ErrorKind::NotFound => LoadError::NotFound,
            _ => LoadError::IO(e),
        }
    }
}

impl From<DeserializeError> for LoadError {
    fn from(e: DeserializeError) -> Self {
        LoadError::Deserialization(e.into())
    }
}

impl From<SerdeError> for LoadError {
    fn from(e: SerdeError) -> Self {
        LoadError::Deserialization(e.into())
    }
}

#[derive(Debug, Error)]
pub enum RegistrationError {
    #[error("failed to build animation: {0}")]
    BuildError(#[from] BuildError),
    #[error("failed to save animation: {0}")]
    SaveError(#[from] SaveError),
}

#[derive(Debug, Error)]
pub enum SaveError {
    #[error("failed to write to file: {0}")]
    IO(#[from] io::Error),
    #[error("failed to serialize animation: {0}")]
    Serialization(#[source] SerializationInner),
}

#[derive(Debug, Error)]
pub enum SerializationInner {
    #[error(transparent)]
    Wasmer(#[from] SerializeError),
    #[error(transparent)]
    Serde(#[from] SerdeError),
}

impl From<SerializeError> for SaveError {
    fn from(e: SerializeError) -> Self {
        SaveError::Serialization(e.into())
    }
}

impl From<SerdeError> for SaveError {
    fn from(e: SerdeError) -> Self {
        SaveError::Serialization(e.into())
    }
}
