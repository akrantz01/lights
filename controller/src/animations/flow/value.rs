use super::{
    error::{RuntimeError, SyntaxError},
    function::{function_call_is_valid, Function},
    literal::Literal,
    operators::{BinaryOperator, Comparator, UnaryOperator},
    scope::Scope,
};
use crate::pixels::Pixels;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// The possible sources for a value
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case", tag = "type")]
pub(crate) enum Value {
    /// Retrieves a value from a dynamic variable or constant by name
    Variable { name: String },
    /// An inline constant
    Literal { value: Literal },
    /// Perform an operation on a single value
    UnaryExpression {
        operator: UnaryOperator,
        value: Box<Value>,
    },
    /// Perform an operation on two values
    BinaryExpression {
        operator: BinaryOperator,
        lhs: Box<Value>,
        rhs: Box<Value>,
    },
    /// Compare two values to produce a boolean
    Comparison {
        comparator: Comparator,
        lhs: Box<Value>,
        rhs: Box<Value>,
    },
    /// Call a function by name with some arguments
    Function { name: String, args: Vec<Value> },
}

impl Value {
    pub(crate) fn validate(
        &self,
        functions: &HashMap<&str, usize>,
        variables: &HashSet<&str>,
    ) -> Result<(), SyntaxError> {
        match self {
            Value::Variable { name } => {
                if variables.contains(name.as_str()) {
                    Ok(())
                } else {
                    Err(SyntaxError::UnknownVariable {
                        name: name.to_owned(),
                    })
                }
            }
            // A literal is always valid
            Value::Literal { .. } => Ok(()),
            Value::UnaryExpression { value, .. } => value.validate(functions, variables),
            Value::BinaryExpression { rhs, lhs, .. } | Value::Comparison { rhs, lhs, .. } => lhs
                .validate(functions, variables)
                .and(rhs.validate(functions, variables)),
            Value::Function { name, args } => {
                function_call_is_valid(variables, functions, name, args)
            }
        }
    }

    /// Resolve the value/expression/function call to a concrete value
    pub(crate) fn evaluate(
        &self,
        scope: &mut Scope,
        functions: &HashMap<String, Function>,
        pixels: &Pixels,
    ) -> Result<Literal, RuntimeError> {
        match self {
            Value::Variable { name } => scope
                .get(name)
                .cloned()
                .ok_or_else(|| RuntimeError::NameError(name.to_owned())),
            Value::Literal { value } => Ok(value.clone()),
            Value::UnaryExpression { operator, value } => {
                let value = value.evaluate(scope, functions, pixels)?;
                Ok(operator.evaluate(value)?)
            }
            Value::BinaryExpression { operator, lhs, rhs } => {
                let lhs = lhs.evaluate(scope, functions, pixels)?;
                let rhs = rhs.evaluate(scope, functions, pixels)?;
                Ok(operator.evaluate(lhs, rhs)?)
            }
            Value::Comparison {
                comparator,
                lhs,
                rhs,
            } => {
                let lhs = lhs.evaluate(scope, functions, pixels)?;
                let rhs = rhs.evaluate(scope, functions, pixels)?;
                Ok(comparator.evaluate(&lhs, &rhs)?)
            }
            Value::Function { name, args } => functions
                .get(name)
                .ok_or_else(|| RuntimeError::NameError(name.to_owned()))?
                .execute_with_args(&mut scope.nested(), args, functions, pixels),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        super::{error::TypeError, literal::Number, operation::Operation},
        BinaryOperator, Comparator, Function, Literal, RuntimeError, UnaryOperator, Value,
    };
    use crate::evaluate;

    #[test]
    fn evaluate_literal() {
        let value = Value::Literal {
            value: Literal::from(56),
        };
        evaluate!(value => Ok(Literal::Number(Number::Integer(56))));
    }

    #[test]
    fn evaluate_missing_variable() {
        let value = Value::Variable {
            name: String::from("i-dont-exist"),
        };
        evaluate!(value => Err(RuntimeError::NameError(n)) if n == "i-dont-exist");
    }

    #[test]
    fn evaluate_variable() {
        let value = Value::Variable {
            name: String::from("something"),
        };
        evaluate!(
            value => Ok(Literal::Boolean(true)),
            with globals
                "something" => true,
        );
    }

    #[test]
    fn evaluate_simple_unary_expression() {
        // Equivalent to -73.4
        let value = Value::UnaryExpression {
            operator: UnaryOperator::Negate,
            value: Box::new(Value::Literal {
                value: Literal::from(73.4),
            }),
        };
        evaluate!(value => Ok(Literal::Number(Number::Float(f))) if f == -73.4);
    }

    #[test]
    fn evaluate_nested_unary_expression() {
        // Equivalent to ~true
        let value = Value::UnaryExpression {
            operator: UnaryOperator::BitwiseNot,
            value: Box::new(Value::Variable {
                name: String::from("boolean"),
            }),
        };

        evaluate!(
            value => Ok(Literal::Boolean(false)),
            with globals
                "boolean" => true,
        );
    }

    #[test]
    fn evaluate_failing_unary_expression() {
        // Equivalent to -null
        let value = Value::UnaryExpression {
            operator: UnaryOperator::Negate,
            value: Box::new(Value::Literal {
                value: Literal::Null,
            }),
        };

        evaluate!(
            value => Err(RuntimeError::TypeError(TypeError::UnaryOperator {
                kind: "null",
                operator: "negate",
            }))
        );
    }

    #[test]
    fn evaluate_simple_binary_expression() {
        // Equivalent to "hello " + "world"
        let value = Value::BinaryExpression {
            operator: BinaryOperator::Add,
            lhs: Box::new(Value::Literal {
                value: Literal::from("hello "),
            }),
            rhs: Box::new(Value::Literal {
                value: Literal::from("world"),
            }),
        };

        evaluate!(value => Ok(Literal::String(s)) if s == "hello world");
    }

    #[test]
    fn evaluate_nested_binary_expression() {
        // Equivalent to (a - 6) * ~b
        let value = Value::BinaryExpression {
            operator: BinaryOperator::Multiply,
            lhs: Box::new(Value::BinaryExpression {
                operator: BinaryOperator::Subtract,
                lhs: Box::new(Value::Variable {
                    name: String::from("a"),
                }),
                rhs: Box::new(Value::Literal {
                    value: Literal::from(6),
                }),
            }),
            rhs: Box::new(Value::UnaryExpression {
                operator: UnaryOperator::BitwiseNot,
                value: Box::new(Value::Variable {
                    name: String::from("b"),
                }),
            }),
        };

        evaluate!(
            value => Ok(Literal::Number(Number::Integer(-104))),
            with globals
                "a" => 32,
                "b" => 3,
        );
    }

    #[test]
    fn evaluate_failing_binary_expression() {
        // Equivalent to 5.6 | null
        let value = Value::BinaryExpression {
            operator: BinaryOperator::BitwiseOr,
            lhs: Box::new(Value::Literal {
                value: Literal::from(5.6),
            }),
            rhs: Box::new(Value::Literal {
                value: Literal::Null,
            }),
        };

        evaluate!(
            value => Err(RuntimeError::TypeError(TypeError::BinaryOperator {
                operator: "bitwise or",
                a: "float",
                b: "null",
            }))
        );
    }

    #[test]
    fn evaluate_simple_comparison() {
        let value = Value::Comparison {
            comparator: Comparator::Equal,
            lhs: Box::new(Value::Literal {
                value: Literal::from(6),
            }),
            rhs: Box::new(Value::Literal {
                value: Literal::from(6),
            }),
        };

        evaluate!(value => Ok(Literal::Boolean(true)));
    }

    #[test]
    fn evaluate_nested_comparison() {
        let value = Value::Comparison {
            comparator: Comparator::GreaterThanOrEqual,
            lhs: Box::new(Value::BinaryExpression {
                operator: BinaryOperator::Modulo,
                lhs: Box::new(Value::Literal {
                    value: Literal::from(9),
                }),
                rhs: Box::new(Value::Variable {
                    name: String::from("a"),
                }),
            }),
            rhs: Box::new(Value::Literal {
                value: Literal::from(6),
            }),
        };

        evaluate!(
            value => Ok(Literal::Boolean(false)),
            with globals
                "a" => 5,
        );
    }

    #[test]
    fn evaluate_failing_comparison() {
        let value = Value::Comparison {
            comparator: Comparator::LessThan,
            lhs: Box::new(Value::Literal {
                value: Literal::from("abc"),
            }),
            rhs: Box::new(Value::Literal {
                value: Literal::from(5),
            }),
        };

        evaluate!(
            value => Err(RuntimeError::TypeError(TypeError::Comparison {
                a: "string",
                b: "integer",
            }))
        );
    }

    #[test]
    fn evaluate_empty_function() {
        let function = Function::from(vec![]);
        let value = Value::Function {
            name: String::from("empty"),
            args: Vec::new(),
        };

        evaluate!(
            value => Ok(Literal::Null),
            with functions
                "empty" => function,
        );
    }

    #[test]
    fn evaluate_simple_function() {
        let function = Function::from(vec![Operation::Return {
            result: Value::Literal {
                value: Literal::from(true),
            },
        }]);

        let value = Value::Function {
            name: String::from("simple"),
            args: Vec::new(),
        };

        evaluate!(
            value => Ok(Literal::Boolean(true)),
            with functions
                "simple" => function,
        );
    }

    #[test]
    fn evaluate_function_with_args() {
        let args = vec![String::from("v"), String::from("unused")];
        let operations = vec![Operation::Return {
            result: Value::Variable {
                name: String::from("v"),
            },
        }];
        let function = Function::from((args, operations));

        let value = Value::Function {
            name: String::from("i-have-args"),
            args: vec![
                Value::Literal {
                    value: Literal::from("value"),
                },
                Value::Literal {
                    value: Literal::Null,
                },
            ],
        };

        evaluate!(
            value => Ok(Literal::String(s)) if s == "value",
            with functions
                "i-have-args" => function,
        );
    }

    #[test]
    fn evaluate_nested_function() {
        let function = Function::from(vec![Operation::Return {
            result: Value::Literal {
                value: Literal::from(6),
            },
        }]);
        let value = Value::BinaryExpression {
            operator: BinaryOperator::Divide,
            lhs: Box::new(Value::Function {
                name: String::from("six"),
                args: Vec::new(),
            }),
            rhs: Box::new(Value::Literal {
                value: Literal::from(2.0),
            }),
        };

        evaluate!(
            value => Ok(Literal::Number(Number::Float(f))) if f == 3.0,
            with functions
                "six" => function,
        );
    }

    #[test]
    fn evaluate_nonexistent_function() {
        let value = Value::Function {
            name: String::from("nonexistent"),
            args: Vec::new(),
        };

        evaluate!(value => Err(RuntimeError::NameError(s)) if s == "nonexistent");
    }
}
