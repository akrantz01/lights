use thiserror::Error;

#[derive(Debug, Error)]
pub enum SyntaxError {
    #[error("the main function cannot return a value")]
    InvalidReturn,
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
}

#[derive(Debug, Error)]
pub enum RuntimeError {}
