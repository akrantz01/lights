use super::{
    error::SyntaxError,
    literal::Literal,
    operators::{BinaryOperator, Comparator, UnaryOperator},
};
use crate::animations::flow::function::function_call_is_valid;
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
}
