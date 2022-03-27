use super::{
    error::{RuntimeError, SyntaxError},
    function::{function_call_is_valid, Function},
    literal::Literal,
    scope::Scope,
    value::Value,
};
use crate::pixels::Pixels;
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fmt::{self, Display, Formatter},
    thread,
};

/// The possible operations that can be used in a flow. Every flow must///
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase", tag = "op")]
pub(crate) enum Operation {
    // Structural operations
    /// The ending point for the flow. Multiple [`Operation::End`]s can exist in a flow,
    /// however, every flow must always terminate with an [`Operation::End`].
    End,
    /// Return can only be used within functions to end the flow and propagate
    /// a value to the caller. To end a function flow without returning, see
    /// [`Operation::End`].
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
    /// Call a function by name with some arguments
    Function { name: String, args: Vec<Value> },

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
    Sleep { duration: Value },
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

            // Check the function exists and its arguments are valid
            Operation::Function { name, args } => {
                function_call_is_valid(variables, functions, name, args)
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

    /// Evaluate the operation
    pub(crate) fn evaluate(
        &self,
        scope: &mut Scope,
        functions: &HashMap<String, Function>,
        pixels: &Pixels,
    ) -> Result<ReturnType, RuntimeError> {
        match self {
            Operation::End => Ok(ReturnType::End),
            Operation::Return { result } => Ok(ReturnType::Return(
                result.evaluate(scope, functions, pixels)?,
            )),

            Operation::If {
                condition,
                truthy,
                falsy,
            } => {
                let condition = condition.evaluate(scope, functions, pixels)?.as_boolean()?;
                if condition {
                    for op in truthy {
                        match op.evaluate(scope, functions, pixels)? {
                            ReturnType::Continue => {}
                            ReturnType::End => break,
                            ReturnType::Return(value) => return Ok(ReturnType::Return(value)),
                        }
                    }
                } else {
                    for op in falsy {
                        match op.evaluate(scope, functions, pixels)? {
                            ReturnType::Continue => {}
                            ReturnType::End => break,
                            ReturnType::Return(value) => return Ok(ReturnType::Return(value)),
                        }
                    }
                }

                Ok(ReturnType::Continue)
            }
            Operation::For {
                start,
                end,
                index,
                operations,
            } => {
                let start = start
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;
                let end = end
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;

                for i in start..end {
                    scope.set(index.to_owned(), i.into());

                    for op in operations {
                        match op.evaluate(scope, functions, pixels)? {
                            ReturnType::Continue => {}
                            ReturnType::End => break,
                            ReturnType::Return(value) => return Ok(ReturnType::Return(value)),
                        }
                    }
                }

                Ok(ReturnType::Continue)
            }
            Operation::Variable { name, value } => {
                let value = value.evaluate(scope, functions, pixels)?;
                scope.set(name.to_owned(), value);

                Ok(ReturnType::Continue)
            }
            Operation::Function { name, args } => {
                let function = functions
                    .get(name)
                    .ok_or_else(|| RuntimeError::NameError(name.to_owned()))?;
                function.execute_with_args(&mut scope.nested(), args, functions, pixels)?;

                Ok(ReturnType::Continue)
            }

            Operation::Brightness { value } => {
                let value = value
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;

                pixels.brightness(value as u8);
                Ok(ReturnType::Continue)
            }
            Operation::Fill { red, green, blue } => {
                let red = red
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;
                let green = green
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;
                let blue = blue
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;

                pixels.fill(red as u8, blue as u8, green as u8);
                Ok(ReturnType::Continue)
            }
            Operation::Set {
                index,
                red,
                green,
                blue,
            } => {
                let index = index
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;
                let red = red
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;
                let green = green
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;
                let blue = blue
                    .evaluate(scope, functions, pixels)?
                    .as_non_null_integer()?;

                pixels.set(index as u16, red as u8, green as u8, blue as u8);
                Ok(ReturnType::Continue)
            }
            Operation::Show => {
                pixels.show();
                Ok(ReturnType::Continue)
            }

            Operation::Sleep { duration } => {
                let duration = duration
                    .evaluate(scope, functions, pixels)?
                    .try_into()
                    .map_err(|e| RuntimeError::FormatError {
                        to: "duration",
                        source: Box::new(e),
                    })?;
                thread::sleep(duration);

                Ok(ReturnType::Continue)
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
            Operation::Function { .. } => "function",
            Operation::Brightness { .. } => "brightness",
            Operation::Fill { .. } => "fill",
            Operation::Set { .. } => "set",
            Operation::Show => "show",
            Operation::Sleep { .. } => "sleep",
        }
    }
}

/// A control value used by operations
#[derive(Debug)]
pub(crate) enum ReturnType {
    Continue,
    Return(Literal),
    End,
}
