use super::flow::SyntaxError;
use serde_json::Error as SerdeError;
use std::{
    error,
    fmt::{self, Debug, Display, Formatter},
    io::{self, ErrorKind},
};
use strum::Display;
use thiserror::Error;
use wasmer::{CompileError, DeserializeError, ExportError, InstantiationError, SerializeError};

/// A wrapper around a generic error with added context
#[derive(Debug, Error)]
pub struct Error<K: Debug + Display> {
    kind: K,
    #[source]
    source: Option<Box<dyn error::Error + Send + Sync>>,
}

impl<K> Error<K>
where
    K: Debug + Display,
{
    pub(crate) fn new(kind: K) -> Self {
        Self { kind, source: None }
    }

    fn with_source<I>(kind: K, source: I) -> Self
    where
        I: Into<Box<dyn error::Error + Send + Sync>>,
    {
        Self {
            kind,
            source: Some(source.into()),
        }
    }
}

impl<K> Display for Error<K>
where
    K: Debug + Display,
{
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match &self.source {
            Some(e) => write!(f, "{}: {e}", self.kind),
            None => write!(f, "{}", self.kind),
        }
    }
}

macro_rules! specialize_error {
    ($name:ident<$kind:ident>: $error:ty => $variant:ident, $($rest:tt)*) => {
        pub type $name = Error<$kind>;
        specialize_error!(@inner $name $kind | $error => $variant, $($rest)*);
    };
    ($name:ident<$kind:ident>: $error:ty [source] => $variant:ident, $($rest:tt)*) => {
        pub type $name = Error<$kind>;
        specialize_error!(@inner $name $kind | $error [source] => $variant, $($rest)*);
    };
    (@inner $name:ident $kind:ident | $error:ty => $variant:ident, $($rest:tt)*) => {
        impl From<$error> for $name {
            fn from(_: $error) -> $name {
                $name::new($kind::$variant)
            }
        }
        specialize_error!(@inner $name $kind | $($rest)*);
    };
    (@inner $name:ident $kind:ident | $error:ty [source] => $variant:ident, $($rest:tt)*) => {
        impl From<$error> for $name {
            fn from(e: $error) -> $name {
                $name::with_source($kind::$variant, e)
            }
        }
        specialize_error!(@inner $name $kind | $($rest)*);
    };
    (@inner $name:ident $kind:ident |) => {};
}

#[derive(Debug, Display)]
pub enum BuildKind {
    #[strum(to_string = "unable to load from bytes")]
    Parsing,
    #[strum(to_string = "failed to compile animation")]
    Compilation,
    #[strum(to_string = "failed to finalize instance")]
    Finalization,
}

specialize_error!(
    BuildError<BuildKind>:
        SerdeError [source] => Parsing,
        SyntaxError [source] => Parsing,
        CompileError [source] => Compilation,
        InstantiationError [source] => Finalization,
        ExportError [source] => Finalization,
);

#[derive(Debug, Display)]
pub enum LoadKind {
    #[strum(to_string = "animation not found")]
    NotFound,
    #[strum(to_string = "unknown animation type")]
    UnknownType,
    #[strum(to_string = "failed to load from bytes")]
    Loading,
    #[strum(to_string = "failed to read file")]
    IO,
    #[strum(to_string = "failed to finalize instance")]
    Finalization,
}

specialize_error!(
    LoadError<LoadKind>:
        InstantiationError [source] => Finalization,
        SerdeError [source] => Loading,
        DeserializeError [source] => Loading,
);

impl From<io::Error> for LoadError {
    fn from(e: io::Error) -> Self {
        match e.kind() {
            ErrorKind::NotFound => LoadError::new(LoadKind::NotFound),
            _ => LoadError::with_source(LoadKind::IO, e),
        }
    }
}

#[derive(Debug, Display)]
pub enum SaveKind {
    #[strum(to_string = "failed to write to string")]
    IO,
    #[strum(to_string = "failed to serialize animation")]
    Serialization,
}

specialize_error!(
    SaveError<SaveKind>:
        io::Error [source] => IO,
        SerializeError [source] => Serialization,
        SerdeError [source] => Serialization,
);

#[derive(Debug, Error)]
pub enum RegistrationError {
    #[error("failed to build animation: {0}")]
    BuildError(#[from] BuildError),
    #[error("failed to save animation: {0}")]
    SaveError(#[from] SaveError),
}
