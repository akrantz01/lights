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
    /// Break stops the execution of the innermost loop. It can only be used within the context
    /// of for loops.
    Break,
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
            Operation::End | Operation::Break | Operation::Show | Operation::Sleep { .. } => Ok(()),

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
            Operation::Break => Ok(ReturnType::Break),
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
                            r => return Ok(r),
                        }
                    }
                } else {
                    for op in falsy {
                        match op.evaluate(scope, functions, pixels)? {
                            ReturnType::Continue => {}
                            r => return Ok(r),
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

                'iter: for i in start..end {
                    scope.set(index.to_owned(), i.into());

                    for op in operations {
                        match op.evaluate(scope, functions, pixels)? {
                            ReturnType::Break => break 'iter,
                            ReturnType::Continue => {}
                            r => return Ok(r),
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

                let args = function.associate_args(scope, args, functions, pixels)?;
                function.evaluate(&mut scope.nested(args), functions, pixels)?;

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
            Operation::Break => "break",
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
    Break,
    Continue,
    Return(Literal),
    End,
}

#[cfg(test)]
mod tests {
    use super::{
        super::{
            literal::{Literal, Number},
            operators::{BinaryOperator, Comparator},
        },
        Function, Operation, Pixels, ReturnType, RuntimeError, Value,
    };
    use crate::evaluate;
    use faux::when;
    use std::time::Instant;

    #[test]
    fn end() {
        evaluate!(Operation::End => Ok(ReturnType::End));
    }

    #[test]
    fn r#break() {
        evaluate!(Operation::Break => Ok(ReturnType::Break));
    }

    #[test]
    fn r#return() {
        let op = Operation::Return {
            result: Value::Literal {
                value: Literal::from(true),
            },
        };

        evaluate!(op => Ok(ReturnType::Return(Literal::Boolean(true))));
    }

    #[test]
    fn if_truthy() {
        let op = Operation::If {
            condition: Value::Literal {
                value: Literal::from(true),
            },
            truthy: vec![Operation::Return {
                result: Value::Literal {
                    value: Literal::from("truthy"),
                },
            }],
            falsy: vec![Operation::Return {
                result: Value::Literal {
                    value: Literal::from("falsy"),
                },
            }],
        };

        evaluate!(op => Ok(ReturnType::Return(Literal::String(s))) if s == "truthy");
    }

    #[test]
    fn if_falsy() {
        let op = Operation::If {
            condition: Value::Literal {
                value: Literal::from(false),
            },
            truthy: vec![Operation::Return {
                result: Value::Literal {
                    value: Literal::from("truthy"),
                },
            }],
            falsy: vec![Operation::Return {
                result: Value::Literal {
                    value: Literal::from("falsy"),
                },
            }],
        };

        evaluate!(op => Ok(ReturnType::Return(Literal::String(s))) if s == "falsy");
    }

    #[test]
    fn for_simple() {
        let op = Operation::For {
            start: Value::Literal {
                value: Literal::from(1),
            },
            end: Value::Literal {
                value: Literal::from(10),
            },
            index: String::from("i"),
            operations: vec![Operation::Variable {
                name: String::from("factorial"),
                value: Value::BinaryExpression {
                    operator: BinaryOperator::Multiply,
                    lhs: Box::new(Value::Variable {
                        name: String::from("i"),
                    }),
                    rhs: Box::new(Value::Variable {
                        name: String::from("factorial"),
                    }),
                },
            }],
        };

        let scope = evaluate!(
            op => Ok(ReturnType::Continue),
            with globals
                "factorial" => 1,
        );

        assert_eq!(scope.get("factorial"), Some(&Literal::from(362880)));
    }

    #[test]
    fn for_break() {
        let op = Operation::For {
            start: Value::Literal {
                value: Literal::from(0),
            },
            end: Value::Literal {
                value: Literal::from(10),
            },
            index: String::from("i"),
            operations: vec![
                Operation::Variable {
                    name: String::from("sum"),
                    value: Value::BinaryExpression {
                        operator: BinaryOperator::Add,
                        lhs: Box::new(Value::Variable {
                            name: String::from("sum"),
                        }),
                        rhs: Box::new(Value::Literal {
                            value: Literal::from(1),
                        }),
                    },
                },
                Operation::If {
                    condition: Value::Comparison {
                        comparator: Comparator::Equal,
                        lhs: Box::new(Value::Variable {
                            name: String::from("sum"),
                        }),
                        rhs: Box::new(Value::Literal {
                            value: Literal::from(5),
                        }),
                    },
                    truthy: vec![Operation::Break],
                    falsy: vec![],
                },
            ],
        };

        let scope = evaluate!(
            op => Ok(ReturnType::Continue),
            with globals
                "sum" => 0,
        );

        assert_eq!(scope.get("sum"), Some(&Literal::from(5)));
    }

    #[test]
    fn for_return() {
        let op = Operation::For {
            start: Value::Literal {
                value: Literal::from(0),
            },
            end: Value::Literal {
                value: Literal::from(10),
            },
            index: String::from("i"),
            operations: vec![Operation::If {
                condition: Value::Comparison {
                    comparator: Comparator::Equal,
                    lhs: Box::new(Value::Variable {
                        name: String::from("i"),
                    }),
                    rhs: Box::new(Value::Literal {
                        value: Literal::from(5),
                    }),
                },
                truthy: vec![Operation::Return {
                    result: Value::Variable {
                        name: String::from("i"),
                    },
                }],
                falsy: vec![],
            }],
        };

        evaluate!(op => Ok(ReturnType::Return(Literal::Number(Number::Integer(5)))));
    }

    #[test]
    fn variable() {
        let op = Operation::Variable {
            name: String::from("testing"),
            value: Value::Literal {
                value: Literal::from(true),
            },
        };

        let scope = evaluate!(op => Ok(ReturnType::Continue));
        assert_eq!(scope.get("testing"), Some(&Literal::Boolean(true)));
    }

    #[test]
    fn function_empty() {
        let function = Function::from(Vec::new());
        let op = Operation::Function {
            name: String::from("empty"),
            args: Vec::new(),
        };

        evaluate!(
            op => Ok(ReturnType::Continue),
            with functions
                "empty" => function,
        );
    }

    #[test]
    fn function_simple() {
        let function = Function::from(vec![Operation::Variable {
            name: String::from("return"),
            value: Value::Literal {
                value: Literal::from(true),
            },
        }]);
        let op = Operation::Function {
            name: String::from("simple"),
            args: Vec::new(),
        };

        let scope = evaluate!(
            op => Ok(ReturnType::Continue),
            with globals
                "return" => false;
            with functions
                "simple" => function,
        );
        assert_eq!(scope.get("return"), Some(&Literal::Boolean(true)));
    }

    #[test]
    fn function_with_args() {
        let args = vec![String::from("v"), String::from("unused")];
        let operations = vec![Operation::Variable {
            name: String::from("return"),
            value: Value::Variable {
                name: String::from("v"),
            },
        }];
        let function = Function::from((args, operations));

        let op = Operation::Function {
            name: String::from("args"),
            args: vec![
                Value::Literal {
                    value: Literal::from(true),
                },
                Value::Literal {
                    value: Literal::Null,
                },
            ],
        };

        let scope = evaluate!(
            op => Ok(ReturnType::Continue),
            with globals
                "return" => Literal::Null;
            with functions
                "args" => function,
        );
        assert_eq!(scope.get("return"), Some(&Literal::from(true)));
    }

    #[test]
    fn nonexistent_function() {
        let op = Operation::Function {
            name: String::from("nonexistent"),
            args: Vec::new(),
        };

        evaluate!(op => Err(RuntimeError::NameError(s)) if s == "nonexistent");
    }

    #[test]
    fn brightness() {
        let mut pixels = Pixels::faux();
        when!(pixels.brightness(8)).once().then(|_| ());

        let op = Operation::Brightness {
            value: Value::Literal {
                value: Literal::from(8),
            },
        };

        evaluate!(
            op => Ok(ReturnType::Continue),
            with pixels = pixels
        );
    }

    #[test]
    fn fill() {
        let mut pixels = Pixels::faux();
        when!(pixels.fill(255, 0, 0)).once().then(|_| ());

        let op = Operation::Fill {
            red: Value::Literal {
                value: Literal::from(255),
            },
            green: Value::Literal {
                value: Literal::from(0),
            },
            blue: Value::Literal {
                value: Literal::from(0),
            },
        };

        evaluate!(
            op => Ok(ReturnType::Continue),
            with pixels = pixels
        );
    }

    #[test]
    fn set() {
        let mut pixels = Pixels::faux();
        when!(pixels.set(54, 0, 255, 0)).once().then(|_| ());

        let op = Operation::Set {
            index: Value::Literal {
                value: Literal::from(54),
            },
            red: Value::Literal {
                value: Literal::from(0),
            },
            green: Value::Literal {
                value: Literal::from(255),
            },
            blue: Value::Literal {
                value: Literal::from(0),
            },
        };

        evaluate!(
            op => Ok(ReturnType::Continue),
            with pixels = pixels
        );
    }

    #[test]
    fn show() {
        let mut pixels = Pixels::faux();
        when!(pixels.show()).once().then(|_| ());

        evaluate!(
            Operation::Show => Ok(ReturnType::Continue),
            with pixels = pixels
        );
    }

    #[test]
    fn sleep() {
        let op = Operation::Sleep {
            duration: Value::Literal {
                value: Literal::from(500), // 500ms
            },
        };

        let start = Instant::now();

        evaluate!(op => Ok(ReturnType::Continue));

        assert_eq!(start.elapsed().as_millis(), 500);
    }
}
