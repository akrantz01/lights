use super::{animation::Animation, BuildError, LoadError, SaveError};
use crate::pixels::Pixels;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    error::Error,
};
use tracing::{debug, instrument};

mod error;
mod function;
mod literal;
mod operation;
mod operators;
mod value;

pub use error::SyntaxError;
use function::Function;
use literal::Literal;
use operation::Operation;

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
        let ast = serde_json::from_slice::<Ast>(content.as_ref())?;
        debug!(globals = %ast.globals.len(), functions = %ast.functions.len(), "loaded abstract syntax tree");

        // Ensure the flow is valid
        let flow = Flow::from_ast(ast, pixels);
        flow.validate()?;
        debug!("syntactically valid flow");

        Ok(Box::new(flow))
    }

    #[instrument(skip_all)]
    fn serialize(&self) -> Result<Vec<u8>, SaveError> {
        // Remove the need to clone parts
        #[derive(Serialize)]
        struct BorrowedAst<'b> {
            functions: &'b HashMap<String, Function>,
            globals: &'b HashMap<String, Literal>,
            operations: &'b Vec<Operation>,
        }

        let borrowed = BorrowedAst {
            functions: &self.functions,
            globals: &self.globals,
            operations: self.frame.as_operations(),
        };
        Ok(serde_json::to_vec(&borrowed)?)
    }

    #[instrument(skip_all)]
    fn deserialize(content: Vec<u8>, pixels: Pixels) -> Result<Box<dyn Animation>, LoadError>
    where
        Self: Sized,
    {
        let ast = serde_json::from_slice::<Ast>(content.as_ref())?;
        let flow = Flow::from_ast(ast, pixels);
        Ok(Box::new(flow))
    }

    fn animate(&self) -> Result<(), Box<dyn Error>> {
        todo!()
    }
}

impl Flow {
    /// Convert an [`Ast`] to a flow
    fn from_ast(ast: Ast, pixels: Pixels) -> Self {
        Flow {
            globals: ast.globals,
            functions: ast.functions,
            frame: ast.operations.into(),
            pixels,
        }
    }

    /// Ensure the entire flow is valid
    #[instrument(skip_all)]
    fn validate(&self) -> Result<(), SyntaxError> {
        // Get the names of all known functions and globals
        let functions = self
            .functions
            .iter()
            .map(|(name, f)| (name.as_str(), f.num_args()))
            .collect::<HashMap<_, _>>();
        let global_variables = self
            .globals
            .keys()
            .map(String::as_str)
            .collect::<HashSet<_>>();

        // Validate each supporting function
        for (name, f) in &self.functions {
            f.validate(&functions, &global_variables, true)?;
            debug!(%name, "validated function")
        }

        // Finally validate the frame function
        self.frame.validate(&functions, &global_variables, false)
    }
}

#[derive(Debug, Deserialize)]
pub(crate) struct Ast {
    #[serde(default)]
    pub functions: HashMap<String, Function>,
    #[serde(default)]
    pub globals: HashMap<String, Literal>,
    #[serde(default)]
    pub operations: Vec<Operation>,
}
