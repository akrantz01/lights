use super::{
    error::{RuntimeError, SyntaxError},
    literal::Literal,
    operation::{Operation, ReturnType},
    scope::Scope,
    value::Value,
};
use crate::pixels::Pixels;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::iter::zip;

/// A function with its own local scope that can be called
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Function {
    args: Vec<String>,
    operations: Vec<Operation>,
}

impl From<Vec<Operation>> for Function {
    fn from(operations: Vec<Operation>) -> Self {
        Function {
            args: Vec::new(),
            operations,
        }
    }
}

impl Function {
    /// Get the number of arguments required for the function
    pub(crate) fn num_args(&self) -> usize {
        self.args.len()
    }

    /// Get the operations of the function. Only for use serializing the main function
    pub(crate) fn as_operations(&self) -> &Vec<Operation> {
        &self.operations
    }

    /// Check that the function is syntactically valid
    pub(crate) fn validate<'s>(
        &'s self,
        functions: &HashMap<&str, usize>,
        globals: &HashSet<&'s str>,
        can_return: bool,
    ) -> Result<(), SyntaxError> {
        // Track the known variables
        let mut variables = self.args.iter().map(String::as_str).collect::<HashSet<_>>();
        let unique_args = variables.len();
        variables.extend(globals);

        // Ensure the arguments are unique
        if unique_args != self.num_args() {
            return Err(SyntaxError::NonUniqueArguments);
        }

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

    /// Evaluate all the operations in the function
    pub(crate) fn execute(
        &self,
        scope: &mut Scope,
        functions: &HashMap<String, Function>,
        pixels: &Pixels,
    ) -> Result<Literal, RuntimeError> {
        for op in &self.operations {
            match op.evaluate(scope, functions, pixels)? {
                ReturnType::Continue => {}
                ReturnType::End => break,
                ReturnType::Return(value) => return Ok(value),
            }
        }

        Ok(Literal::Null)
    }

    /// Execute a function with some arguments
    pub(crate) fn execute_with_args(
        &self,
        scope: &mut Scope,
        args: &[Value],
        functions: &HashMap<String, Function>,
        pixels: &Pixels,
    ) -> Result<Literal, RuntimeError> {
        // Add the arguments to the current scope
        for (name, arg) in zip(&self.args, args) {
            let value = arg.evaluate(scope, functions, pixels)?;
            scope.set(name.to_owned(), value);
        }

        self.execute(scope, functions, pixels)
    }
}

/// Check that a function call is valid
pub(crate) fn function_call_is_valid(
    known_variables: &HashSet<&str>,
    known_functions: &HashMap<&str, usize>,
    name: &str,
    args: &Vec<Value>,
) -> Result<(), SyntaxError> {
    if let Some(arg_count) = known_functions.get(name) {
        if *arg_count == args.len() {
            for arg in args {
                arg.validate(known_functions, known_variables)?;
            }
            Ok(())
        } else {
            Err(SyntaxError::MismatchArguments {
                name: name.to_owned(),
                expected: *arg_count,
                actual: args.len(),
            })
        }
    } else {
        Err(SyntaxError::UnknownFunction {
            name: name.to_owned(),
        })
    }
}
