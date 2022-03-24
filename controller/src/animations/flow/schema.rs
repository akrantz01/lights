use super::error::SyntaxError;
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    fmt::{self, Display, Formatter},
    time::Duration,
};

/// An animation to be interpreted and executed
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Schema {
    #[serde(default)]
    pub functions: HashMap<String, Function>,
    #[serde(default)]
    pub globals: HashMap<String, Literal>,
    #[serde(default)]
    pub operations: Vec<Operation>,
}

/// A subroutine to be called by the animation
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Function {
    pub args: Vec<String>,
    pub operations: Vec<Operation>,
}

/// The possible operations that can be used in a flow. Every flow must
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
    fn validate(
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
                if let Some(arg_count) = functions.get(name.as_str()) {
                    if *arg_count == args.len() {
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
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub(crate) enum Literal {
    Null,
    Boolean(bool),
    Number(Number),
    String(String),
}

impl<T> From<Option<T>> for Literal
where
    T: Into<Literal>,
{
    fn from(o: Option<T>) -> Self {
        match o {
            Some(v) => v.into(),
            None => Literal::Null,
        }
    }
}

macro_rules! literal_from {
    ($t:ty => $wrapper:ident) => {
        impl From<$t> for Literal {
            fn from(v: $t) -> Self {
                Self::$wrapper(v.into())
            }
        }
    };
}

literal_from!(bool => Boolean);
literal_from!(Number => Number);
literal_from!(&str => String);
literal_from!(String => String);
literal_from!(i64 => Number);
literal_from!(i32 => Number);
literal_from!(i16 => Number);
literal_from!(i8 => Number);
literal_from!(u32 => Number);
literal_from!(u16 => Number);
literal_from!(u8 => Number);
literal_from!(f64 => Number);
literal_from!(f32 => Number);

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub(crate) enum Number {
    Integer(i64),
    Float(f64),
}

macro_rules! number_from {
    ($t:ty => $wrapper:ident) => {
        impl From<$t> for Number {
            fn from(n: $t) -> Self {
                Self::$wrapper(n.into())
            }
        }
    };
}

number_from!(i64 => Integer);
number_from!(i32 => Integer);
number_from!(i16 => Integer);
number_from!(i8 => Integer);
number_from!(u32 => Integer);
number_from!(u16 => Integer);
number_from!(u8 => Integer);
number_from!(f64 => Float);
number_from!(f32 => Float);

/// The different ways in which a value can be compared
#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum Comparator {
    Equal,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
}

/// The operations that can be performed on a single value
#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum UnaryOperator {
    Negate,
    BitwiseNot,
}

/// The operations that can be performed on two values
#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum BinaryOperator {
    Add,
    Subtract,
    Multiply,
    Divide,
    Power,
    Modulo,
    BitwiseAnd,
    BitwiseOr,
    BitwiseXor,
}
