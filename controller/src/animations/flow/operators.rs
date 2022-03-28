use super::{error::TypeError, literal::Literal};
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

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

impl Comparator {
    /// Evaluate the comparison
    pub(crate) fn evaluate(&self, lhs: &Literal, rhs: &Literal) -> Result<Literal, TypeError> {
        let ordering = lhs.try_partial_cmp(rhs)?;

        let result = match self {
            Comparator::Equal => matches!(ordering, Some(Ordering::Equal)),
            Comparator::GreaterThan => matches!(ordering, Some(Ordering::Greater)),
            Comparator::LessThan => matches!(ordering, Some(Ordering::Less)),
            Comparator::GreaterThanOrEqual => {
                matches!(ordering, Some(Ordering::Greater | Ordering::Equal))
            }
            Comparator::LessThanOrEqual => {
                matches!(ordering, Some(Ordering::Less | Ordering::Equal))
            }
        };
        Ok(Literal::Boolean(result))
    }
}

/// The operations that can be performed on a single value
#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum UnaryOperator {
    Negate,
    BitwiseNot,
}

impl UnaryOperator {
    /// Evaluate the operator
    pub(crate) fn evaluate(&self, value: Literal) -> Result<Literal, TypeError> {
        match self {
            UnaryOperator::BitwiseNot => value.try_not(),
            UnaryOperator::Negate => value.try_neg(),
        }
    }
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

impl BinaryOperator {
    pub(crate) fn evaluate(&self, lhs: Literal, rhs: Literal) -> Result<Literal, TypeError> {
        match self {
            BinaryOperator::Add => lhs.try_add(rhs),
            BinaryOperator::Subtract => lhs.try_sub(rhs),
            BinaryOperator::Multiply => lhs.try_mul(rhs),
            BinaryOperator::Divide => lhs.try_div(rhs),
            BinaryOperator::Power => lhs.try_pow(rhs),
            BinaryOperator::Modulo => lhs.try_modulo(rhs),
            BinaryOperator::BitwiseAnd => lhs.try_bitand(rhs),
            BinaryOperator::BitwiseOr => lhs.try_bitor(rhs),
            BinaryOperator::BitwiseXor => lhs.try_bitxor(rhs),
        }
    }
}
