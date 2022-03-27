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
