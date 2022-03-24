use serde::{Deserialize, Serialize};
use std::{collections::HashMap, time::Duration};

/// An animation to be interpreted and executed
#[derive(Debug, Default, Deserialize, Serialize)]
pub(crate) struct Flow {
    constants: HashMap<String, serde_json::Value>,
    functions: HashMap<String, Function>,
    operations: Vec<Operation>,
}

/// A subroutine to be called by the animation
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Function {
    args: Vec<String>,
    operations: Vec<Operation>,
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

/// The possible sources for a value
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case", tag = "type")]
pub(crate) enum Value {
    /// Retrieves a value from a dynamic variable or constant by name
    Variable { name: String },
    /// An inline constant
    Literal { value: serde_json::Value },
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

/// The different ways in which a value can be compared
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum Comparator {
    Equal,
    GreaterThan,
    LessThan,
    GreaterThanOrEqual,
    LessThanOrEqual,
}

/// The operations that can be performed on a single value
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum UnaryOperator {
    Negate,
    BitwiseNot,
}

/// The operations that can be performed on two values
#[derive(Debug, Deserialize, Serialize)]
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
