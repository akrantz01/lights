use std::error::Error;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SyntaxError {
    #[error("the main function cannot return a value")]
    InvalidReturn,
    #[error("cannot break from outside a loop")]
    InvalidBreak,
    #[error("the main function must have an explicit end")]
    ExpectedEnd,
    #[error("variable {name:?} referenced before assignment")]
    UnknownVariable { name: String },
    #[error("function {name:?} is undefined")]
    UnknownFunction { name: String },
    #[error("function {name:?} expects {expected} arguments, got {actual} arguments")]
    MismatchArguments {
        name: String,
        expected: usize,
        actual: usize,
    },
    #[error("all function arguments must have unique names")]
    NonUniqueArguments,
    #[error("the entrypoint cannot take any arguments")]
    InvalidEntrypoint,
}

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("variable '{0}' referenced before assignment")]
    Name(String),
    #[error(transparent)]
    Type(#[from] TypeError),
    #[error("invalid format for '{to}': {source}")]
    Format {
        to: &'static str,
        #[source]
        source: Box<dyn Error>,
    },
    #[error("operation '{0}' not allowed here")]
    Structural(&'static str),
}

#[derive(Debug, Error)]
pub enum TypeError {
    #[error("cannot convert from '{found}' to '{expected}'")]
    Conversion {
        expected: &'static str,
        found: &'static str,
    },
    #[error("cannot compare types '{a}' and '{b}'")]
    Comparison { a: &'static str, b: &'static str },
    #[error("operator '{operator}' is not defined for '{kind}'")]
    UnaryOperator {
        operator: &'static str,
        kind: &'static str,
    },
    #[error("operator '{operator}' is not defined on '{a}' and '{b}'")]
    BinaryOperator {
        operator: &'static str,
        a: &'static str,
        b: &'static str,
    },
}
