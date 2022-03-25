use super::{error::SyntaxError, value::Value};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fmt::{self, Display, Formatter},
    time::Duration,
};

/// The possible operations that can be used in a flow. Every flow must///
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase", tag = "op")]
pub(crate) enum Operation {
    // Structural operations
    /// The ending point for the flow. Multiple [`End`]s can exist in a flow,
    /// however, every flow must always terminate with an [`End`].
    End,
    /// Return can only be used within functions to end the flow and propagate
    /// a value to the caller. To end a function flow without returning, see
    /// [`End`].
    Return { result: Value },

    // Control flow operations
    /// Evaluate a conditional and run the operations based on whether it was `true` or `false`
    If {
        condition: Value,
        truthy: Vec<Operation>,
        falsy: Vec<Operation>,
    },
    /// Run a set of operations over a range of values
    For {
        start: Value,
        end: Value,
        index: String,
        operations: Vec<Operation>,
    },
    /// Create or update a variable with a name and value
    Variable { name: String, value: Value },

    // Pixel operations
    /// Set the brightness of the strip
    Brightness { value: Value },
    /// Set all pixels to the same color
    Fill {
        red: Value,
        green: Value,
        blue: Value,
    },
    /// Set the color of an individual pixel
    Set {
        index: Value,
        red: Value,
        green: Value,
        blue: Value,
    },
    /// Write any queued changes to the strip
    Show,

    // System operations
    /// Pause for the specified amount of time
    Sleep { duration: Duration },
}

impl Display for Operation {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name())
    }
}

impl Operation {
    /// Ensure an operation is valid
    pub(crate) fn validate<'s>(
        &'s self,
        functions: &HashMap<&str, usize>,
        variables: &mut HashSet<&'s str>,
    ) -> Result<(), SyntaxError> {
        match self {
            // Nothing to do here
            Operation::End | Operation::Show | Operation::Sleep { .. } => Ok(()),

            // Check operations only using values
            Operation::Return { result: value } | Operation::Brightness { value } => {
                value.validate(functions, variables)
            }
            Operation::Fill { red, green, blue } => red
                .validate(functions, variables)
                .and(blue.validate(functions, variables))
                .and(green.validate(functions, variables)),
            Operation::Set {
                index,
                red,
                green,
                blue,
            } => index
                .validate(functions, variables)
                .and(red.validate(functions, variables))
                .and(blue.validate(functions, variables))
                .and(green.validate(functions, variables)),

            // Register any new variables, ensuring their value cannot be used before they are defined
            Operation::Variable { name, value } => {
                value.validate(functions, variables)?;
                variables.insert(name.as_str());
                Ok(())
            }

            // Check operations with nested operations
            Operation::If {
                condition,
                truthy,
                falsy,
            } => {
                condition.validate(functions, variables)?;
                for operation in truthy {
                    operation.validate(functions, variables)?;
                }
                for operation in falsy {
                    operation.validate(functions, variables)?;
                }
                Ok(())
            }
            Operation::For {
                start,
                end,
                operations,
                index,
            } => {
                start.validate(functions, variables)?;
                end.validate(functions, variables)?;
                variables.insert(index.as_ref());
                for operation in operations {
                    operation.validate(functions, variables)?;
                }
                Ok(())
            }
        }
    }

    /// Get the name of the operation
    pub(crate) fn name(&self) -> &'static str {
        match self {
            Operation::End => "end",
            Operation::Return { .. } => "return",
            Operation::If { .. } => "if",
            Operation::For { .. } => "for",
            Operation::Variable { .. } => "variable",
            Operation::Brightness { .. } => "brightness",
            Operation::Fill { .. } => "fill",
            Operation::Set { .. } => "set",
            Operation::Show => "show",
            Operation::Sleep { .. } => "sleep",
        }
    }
}
