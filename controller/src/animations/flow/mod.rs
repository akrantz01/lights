use super::{animation::Animation, BuildError, LoadError, SaveError};
use crate::pixels::Pixels;
use async_trait::async_trait;
use std::{
    collections::{HashMap, HashSet},
    error::Error,
};
use tracing::{debug, instrument};

mod error;
mod schema;

pub use error::SyntaxError;
use schema::{Literal, Operation, Schema};

/// An interpreted, user-editable animation
pub(crate) struct Flow {
    globals: HashMap<String, Literal>,
    functions: HashMap<String, Function>,
    frame: Function,
    pixels: Pixels,
}

#[async_trait]
impl Animation for Flow {
    #[instrument(skip_all)]
    fn build<B>(
        content: B,
        _development: bool,
        pixels: Pixels,
    ) -> Result<Box<dyn Animation>, BuildError>
    where
        B: AsRef<[u8]>,
        Self: Sized,
    {
        let ast = serde_json::from_slice::<Schema>(content.as_ref())?;
        debug!(globals = %ast.globals.len(), functions = %ast.functions.len(), "loaded abstract syntax tree");

        // Ensure the flow is valid
        let flow = Flow {
            globals: ast.globals,
            functions: ast
                .functions
                .into_iter()
                .map(|(name, function)| (name, function.into()))
                .collect(),
            frame: ast.operations.into(),
            pixels,
        };
        flow.validate()?;
        debug!("syntactically valid flow");

        Ok(Box::new(flow))
    }

    #[instrument(skip_all)]
    fn serialize(&self) -> Result<Vec<u8>, SaveError> {
        todo!()
    }

    #[instrument(skip_all)]
    fn deserialize(content: Vec<u8>, pixels: Pixels) -> Result<Box<dyn Animation>, LoadError>
    where
        Self: Sized,
    {
        todo!()
    }

    fn animate(&self) -> Result<(), Box<dyn Error>> {
        todo!()
    }
}

impl Flow {
    /// Ensure the entire flow is valid
    #[instrument(skip_all)]
    fn validate(&self) -> Result<(), SyntaxError> {
        // Get the names of all known functions and globals
        let functions = self
            .functions
            .iter()
            .map(|(name, f)| (name.as_str(), f.args.len()))
            .collect::<HashMap<_, _>>();
        let global_variables = self
            .globals
            .keys()
            .map(String::as_str)
            .collect::<HashSet<_>>();

        // Validate each supporting function
        for (name, f) in &self.functions {
            let mut scoped_variables = global_variables.clone();
            scoped_variables.extend(f.args.iter().map(String::as_str));

            f.validate(&functions, scoped_variables, true)?;
            debug!(%name, "validated function")
        }

        // Finally validate the frame function
        self.frame.validate(&functions, global_variables, false)
    }
}

/// A function with its own local scope that can be called
struct Function {
    variables: HashMap<String, Literal>,
    args: Vec<String>,
    operations: Vec<Operation>,
}

impl From<schema::Function> for Function {
    fn from(f: schema::Function) -> Self {
        Function {
            variables: HashMap::new(),
            args: f.args,
            operations: f.operations,
        }
    }
}

impl From<Vec<Operation>> for Function {
    fn from(operations: Vec<Operation>) -> Self {
        Function {
            variables: HashMap::new(),
            args: Vec::new(),
            operations,
        }
    }
}

impl Function {
    /// Check that the function is syntactically valid
    fn validate<'s>(
        &'s self,
        functions: &HashMap<&str, usize>,
        mut variables: HashSet<&'s str>,
        can_return: bool,
    ) -> Result<(), SyntaxError> {
        // Ensure the last operation is always End for the frame function
        if !can_return && !matches!(self.operations.last(), Some(&Operation::End)) {
            return Err(SyntaxError::ExpectedEnd);
        }

        for operation in &self.operations {
            if !can_return && matches!(operation, &Operation::Return { .. }) {
                return Err(SyntaxError::InvalidReturn);
            }

            operation.validate(functions, &mut variables)?;
        }

        Ok(())
    }
}
