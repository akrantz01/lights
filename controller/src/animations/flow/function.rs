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

impl From<(Vec<String>, Vec<Operation>)> for Function {
    fn from((args, operations): (Vec<String>, Vec<Operation>)) -> Self {
        Self { args, operations }
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
    ) -> Result<(), SyntaxError> {
        // Track the known variables
        let mut variables = self.args.iter().map(String::as_str).collect::<HashSet<_>>();
        let unique_args = variables.len();
        variables.extend(globals);

        // Ensure the arguments are unique
        if unique_args != self.num_args() {
            return Err(SyntaxError::NonUniqueArguments);
        }

        for operation in &self.operations {
            match operation {
                Operation::Break => return Err(SyntaxError::InvalidBreak),
                op => op.validate(functions, &mut variables)?,
            }
        }

        Ok(())
    }

    /// Check that an entry point function is syntactically valid. This differs from
    /// [`Function::validate`] by disallowing function arguments, returning, and requires that the
    /// last operation must be an [`Operation::End`].
    pub(crate) fn validate_entrypoint<'s>(
        &'s self,
        functions: &HashMap<&str, usize>,
        globals: &HashSet<&'s str>,
    ) -> Result<(), SyntaxError> {
        if self.num_args() != 0 {
            return Err(SyntaxError::InvalidEntrypoint);
        }

        // Ensure the last operation is always End for the frame function
        if !matches!(self.operations.last(), Some(&Operation::End)) {
            return Err(SyntaxError::ExpectedEnd);
        }

        let mut variables = globals.clone();
        for operation in &self.operations {
            match operation {
                Operation::Return { .. } => return Err(SyntaxError::InvalidReturn),
                Operation::Break => return Err(SyntaxError::InvalidBreak),
                op => op.validate(functions, &mut variables)?,
            }
        }

        Ok(())
    }

    /// Evaluate all the operations in the function
    pub(crate) fn evaluate(
        &self,
        scope: &mut Scope,
        functions: &HashMap<String, Function>,
        pixels: &Pixels,
    ) -> Result<Literal, RuntimeError> {
        for op in &self.operations {
            match op.evaluate(scope, functions, pixels)? {
                ReturnType::Break => return Err(RuntimeError::StructuralError("break")),
                ReturnType::Continue => {}
                ReturnType::End => break,
                ReturnType::Return(value) => return Ok(value),
            }
        }

        Ok(Literal::Null)
    }

    /// Associate positional values with the function arguments
    pub(crate) fn associate_args(
        &self,
        scope: &mut Scope,
        values: &[Value],
        functions: &HashMap<String, Function>,
        pixels: &Pixels,
    ) -> Result<HashMap<String, Literal>, RuntimeError> {
        let mut associated = HashMap::new();

        for (name, arg) in zip(&self.args, values) {
            let value = arg.evaluate(scope, functions, pixels)?;
            associated.insert(name.to_owned(), value);
        }

        Ok(associated)
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

#[cfg(test)]
mod tests {
    use super::{
        super::{
            literal::{Literal, Number},
            operation::Operation,
            operators::{BinaryOperator, Comparator, UnaryOperator},
            value::Value,
        },
        Function, RuntimeError, SyntaxError,
    };
    use crate::{evaluate, validate};

    #[test]
    fn empty() {
        let f = Function::from(vec![]);

        evaluate!(f => Ok(Literal::Null));
        validate!(f => Ok(()));
    }

    #[test]
    fn simple() {
        let f = Function::from(vec![Operation::Return {
            result: Value::Literal {
                value: Literal::from(true),
            },
        }]);

        evaluate!(f => Ok(Literal::Boolean(true)));
        validate!(f => Ok(()));
    }

    #[test]
    fn early_exit() {
        let f = Function::from(vec![
            Operation::End,
            Operation::Return {
                result: Value::Literal {
                    value: Literal::from(false),
                },
            },
        ]);

        evaluate!(f => Ok(Literal::Null));
        validate!(f => Ok(()));
    }

    #[test]
    fn early_return() {
        let f = Function::from(vec![
            Operation::Return {
                result: Value::Literal {
                    value: Literal::from(true),
                },
            },
            Operation::End,
        ]);

        evaluate!(f => Ok(Literal::Boolean(true)));
        validate!(f => Ok(()));
    }

    #[test]
    fn invalid_break() {
        let f = Function::from(vec![Operation::Break]);

        evaluate!(f => Err(RuntimeError::StructuralError("break")));
        validate!(f => Err(SyntaxError::InvalidBreak));
    }

    #[test]
    fn valid_break() {
        let f = Function::from(vec![
            // Iterate from 0 to 10
            Operation::For {
                start: Value::Literal {
                    value: Literal::from(0),
                },
                end: Value::Literal {
                    value: Literal::from(10),
                },
                index: String::from("i"),
                operations: vec![
                    // Check if sum == 5
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
                        // Break
                        truthy: vec![Operation::Break],
                        // Increment by one
                        falsy: vec![Operation::Variable {
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
                        }],
                    },
                ],
            },
            // Return sum
            Operation::Return {
                result: Value::Variable {
                    name: String::from("sum"),
                },
            },
        ]);

        evaluate!(
            f => Ok(Literal::Number(Number::Integer(5))),
            with globals
                "sum" => 0,
        );
        validate!(
            f => Ok(()),
            with variables = ["sum"]
        );
    }

    #[test]
    fn local_variables() {
        let f = Function::from(vec![
            // Create a variable
            Operation::Variable {
                name: String::from("hello"),
                value: Value::Literal {
                    value: Literal::from(true),
                },
            },
            // Modify it
            Operation::Variable {
                name: String::from("hello"),
                value: Value::UnaryExpression {
                    operator: UnaryOperator::BitwiseNot,
                    value: Box::new(Value::Variable {
                        name: String::from("hello"),
                    }),
                },
            },
            // Read it
            Operation::Return {
                result: Value::Variable {
                    name: String::from("hello"),
                },
            },
        ]);

        evaluate!(f => Ok(Literal::Boolean(false)));
        validate!(f => Ok(()));
    }

    #[test]
    fn global_variables() {
        let f = Function::from(vec![Operation::Return {
            result: Value::BinaryExpression {
                operator: BinaryOperator::Divide,
                lhs: Box::new(Value::Variable {
                    name: String::from("f"),
                }),
                rhs: Box::new(Value::Literal {
                    value: Literal::from(2),
                }),
            },
        }]);

        evaluate!(
            f => Ok(Literal::Number(Number::Float(f))) if f == 2.5,
            with globals
                "f" => 5.0,
        );
        validate!(
            f => Ok(()),
            with variables = ["f"]
        );
    }

    #[test]
    fn local_and_global_variables() {
        let f = Function::from(vec![
            Operation::If {
                // If value > 20
                condition: Value::Comparison {
                    comparator: Comparator::GreaterThan,
                    lhs: Box::new(Value::Variable {
                        name: String::from("value"),
                    }),
                    rhs: Box::new(Value::Literal {
                        value: Literal::from(20),
                    }),
                },
                // result = value % 9
                truthy: vec![Operation::Variable {
                    name: String::from("result"),
                    value: Value::BinaryExpression {
                        operator: BinaryOperator::Modulo,
                        lhs: Box::new(Value::Variable {
                            name: String::from("value"),
                        }),
                        rhs: Box::new(Value::Literal {
                            value: Literal::from(9),
                        }),
                    },
                }],
                // result = 2
                falsy: vec![Operation::Variable {
                    name: String::from("result"),
                    value: Value::Literal {
                        value: Literal::from(2),
                    },
                }],
            },
            // result = value ** result
            Operation::Variable {
                name: String::from("result"),
                value: Value::BinaryExpression {
                    operator: BinaryOperator::Power,
                    lhs: Box::new(Value::Variable {
                        name: String::from("value"),
                    }),
                    rhs: Box::new(Value::Variable {
                        name: String::from("result"),
                    }),
                },
            },
            // Return result
            Operation::Return {
                result: Value::Variable {
                    name: String::from("result"),
                },
            },
        ]);

        evaluate!(
            f => Ok(Literal::Number(Number::Integer(5489031744))),
            with globals
                "value" => 42,
        );
        validate!(
            f => Ok(()),
            with variables = ["value"]
        );
    }

    #[test]
    fn nested_calls() {
        let six = Function::from(vec![Operation::Return {
            result: Value::Literal {
                value: Literal::from(6),
            },
        }]);
        let seven = Function::from(vec![Operation::Return {
            result: Value::Literal {
                value: Literal::from(7),
            },
        }]);
        let f = Function::from(vec![Operation::Return {
            result: Value::BinaryExpression {
                operator: BinaryOperator::Multiply,
                lhs: Box::new(Value::Function {
                    name: String::from("seven"),
                    args: Vec::new(),
                }),
                rhs: Box::new(Value::Function {
                    name: String::from("six"),
                    args: Vec::new(),
                }),
            },
        }]);

        evaluate!(
            f => Ok(Literal::Number(Number::Integer(42))),
            with functions
                "six" => six,
                "seven" => seven,
        );
        validate!(
            f => Ok(()),
            with functions = {
                "six" => 0,
                "seven" => 0
            }
        );
    }

    #[test]
    fn with_arguments() {
        let args = vec![String::from("arg")];
        let operations = vec![Operation::Return {
            result: Value::Variable {
                name: String::from("arg"),
            },
        }];
        let takes_args = Function::from((args, operations));

        let f = Function::from(vec![Operation::Return {
            result: Value::Function {
                name: String::from("takes-args"),
                args: vec![Value::Literal {
                    value: Literal::from(true),
                }],
            },
        }]);

        evaluate!(
            f => Ok(Literal::Boolean(true)),
            with functions
                "takes-args" => takes_args,
        );
        validate!(
            f => Ok(()),
            with functions = {
                "takes-args" => 1
            }
        );
    }

    #[test]
    fn with_arguments_and_globals() {
        let args = vec![String::from("arg")];
        let operations = vec![
            Operation::Variable {
                name: String::from("global"),
                value: Value::Literal {
                    value: Literal::from(8),
                },
            },
            Operation::Return {
                result: Value::Variable {
                    name: String::from("arg"),
                },
            },
        ];
        let takes_args = Function::from((args, operations));

        let f = Function::from(vec![Operation::Return {
            result: Value::Function {
                name: String::from("takes-args"),
                args: vec![Value::Literal {
                    value: Literal::from(true),
                }],
            },
        }]);

        let scope = evaluate!(
            f => Ok(Literal::Boolean(true)),
            with globals
                "global" => None::<bool>;
            with functions
                "takes-args" => takes_args,
        );
        assert_eq!(scope.get("global"), Some(&Literal::from(8)));
        validate!(
            f => Ok(()),
            with variables = ["global"];
            with functions = {
                "takes-args" => 1
            }
        );
    }

    #[test]
    fn with_arguments_locals_and_globals() {
        let args = vec![String::from("arg")];
        let operations = vec![
            Operation::Variable {
                name: String::from("global"),
                value: Value::Literal {
                    value: Literal::from(8),
                },
            },
            Operation::Variable {
                name: String::from("local"),
                value: Value::Literal {
                    value: Literal::from("callee"),
                },
            },
            Operation::Return {
                result: Value::Variable {
                    name: String::from("arg"),
                },
            },
        ];
        let takes_args = Function::from((args, operations));

        let f = Function::from(vec![
            Operation::Variable {
                name: String::from("local"),
                value: Value::Literal {
                    value: Literal::from("caller"),
                },
            },
            Operation::Return {
                result: Value::Function {
                    name: String::from("takes-args"),
                    args: vec![Value::Literal {
                        value: Literal::from(true),
                    }],
                },
            },
        ]);

        let scope = evaluate!(
            f => Ok(Literal::Boolean(true)),
            with globals
                "global" => None::<bool>;
            with functions
                "takes-args" => takes_args,
        );
        assert_eq!(scope.get("global"), Some(&Literal::from(8)));
        assert_eq!(scope.get("local"), Some(&Literal::from("caller")));

        validate!(
            f => Ok(()),
            with variables = ["global"];
            with functions = {
                "takes-args" => 1
            }
        );
    }

    #[test]
    fn recursive() {
        let args = vec![String::from("n")];
        let operations = vec![Operation::If {
            // n == 0
            condition: Value::Comparison {
                comparator: Comparator::Equal,
                lhs: Box::new(Value::Variable {
                    name: String::from("n"),
                }),
                rhs: Box::new(Value::Literal {
                    value: Literal::from(0),
                }),
            },
            // return 1
            truthy: vec![Operation::Return {
                result: Value::Literal {
                    value: Literal::from(1),
                },
            }],
            // return n * factorial(n - 1)
            falsy: vec![Operation::Return {
                result: Value::BinaryExpression {
                    operator: BinaryOperator::Multiply,
                    lhs: Box::new(Value::Variable {
                        name: String::from("n"),
                    }),
                    rhs: Box::new(Value::Function {
                        name: String::from("factorial"),
                        args: vec![Value::BinaryExpression {
                            operator: BinaryOperator::Subtract,
                            lhs: Box::new(Value::Variable {
                                name: String::from("n"),
                            }),
                            rhs: Box::new(Value::Literal {
                                value: Literal::from(1),
                            }),
                        }],
                    }),
                },
            }],
        }];
        let factorial = Function::from((args, operations));

        let f = Function::from(vec![Operation::Return {
            result: Value::Function {
                name: String::from("factorial"),
                args: vec![Value::Literal {
                    value: Literal::from(5),
                }],
            },
        }]);

        evaluate!(
            f => Ok(Literal::Number(Number::Integer(120))),
            with functions
                "factorial" => factorial,
        );
        validate!(
            f => Ok(()),
            with functions = {
                "factorial" => 1
            }
        );
    }

    #[test]
    fn invalid_entrypoint_with_args() {
        let f = Function::from((vec![String::from("a"), String::from("b")], vec![]));

        validate!(f => Err(SyntaxError::InvalidEntrypoint), using validate_entrypoint);
    }

    #[test]
    fn invalid_entrypoint_no_end() {
        let f = Function::from(vec![]);

        validate!(f => Err(SyntaxError::ExpectedEnd), using validate_entrypoint);
    }

    #[test]
    fn invalid_entrypoint_return() {
        let f = Function::from(vec![
            Operation::Return {
                result: Value::Literal {
                    value: Literal::from(true),
                },
            },
            Operation::End,
        ]);

        validate!(f => Err(SyntaxError::InvalidReturn), using validate_entrypoint);
    }

    #[test]
    fn invalid_entrypoint_break() {
        let f = Function::from(vec![Operation::Break, Operation::End]);

        validate!(f => Err(SyntaxError::InvalidBreak), using validate_entrypoint);
    }
}
