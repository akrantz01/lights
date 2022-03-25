use super::{error::SyntaxError, literal::Literal, operation::Operation};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// A function with its own local scope that can be called
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Function {
    #[serde(skip)]
    variables: HashMap<String, Literal>,
    args: Vec<String>,
    operations: Vec<Operation>,
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
    /// Get the number of arguments required for the function
    pub(crate) fn num_args(&self) -> usize {
        self.args.len()
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
}
