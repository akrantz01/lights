use super::error::TypeError;
use serde::{Deserialize, Serialize};
use std::{
    cmp::Ordering,
    iter::repeat,
    ops::{Add, Div, Mul, Neg, Rem, Sub},
    time::Duration,
};
use thiserror::Error;

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(untagged)]
pub(crate) enum Literal {
    Null,
    Boolean(bool),
    Number(Number),
    String(String),
}

impl Literal {
    /// Cast the literal to a boolean
    pub(crate) fn as_boolean(&self) -> Result<bool, TypeError> {
        match self {
            Literal::Null => Ok(false),
            Literal::Boolean(b) => Ok(*b),
            Literal::Number(n) => match n {
                Number::Integer(i) => Ok(*i != 0),
                Number::Float(f) => Ok(*f != 0.0),
            },
            Literal::String(s) => Ok(s.len() != 0),
        }
    }

    /// Cast the literal to an integer
    pub(crate) fn as_integer(&self) -> Result<Option<i64>, TypeError> {
        match self {
            Literal::Null => Ok(None),
            Literal::Boolean(_) => Err(TypeError::Conversion {
                expected: "integer",
                found: "boolean",
            }),
            Literal::Number(n) => match n {
                Number::Integer(i) => Ok(Some(*i)),
                Number::Float(f) => Ok(Some(*f as i64)),
            },
            Literal::String(_) => Err(TypeError::Conversion {
                expected: "integer",
                found: "string",
            }),
        }
    }

    /// Cast the literal to a non-null integer
    pub(crate) fn as_non_null_integer(&self) -> Result<i64, TypeError> {
        self.as_integer()?.ok_or(TypeError::Conversion {
            expected: "integer",
            found: "null",
        })
    }

    /// Cast the literal to a float
    pub(crate) fn as_float(&self) -> Result<Option<f64>, TypeError> {
        match self {
            Literal::Null => Ok(None),
            Literal::Boolean(_) => Err(TypeError::Conversion {
                expected: "float",
                found: "boolean",
            }),
            Literal::Number(n) => match n {
                Number::Integer(i) => Ok(Some(*i as f64)),
                Number::Float(f) => Ok(Some(*f)),
            },
            Literal::String(_) => Err(TypeError::Conversion {
                expected: "float",
                found: "string",
            }),
        }
    }

    /// Cast the literal to a non-null integer
    pub(crate) fn as_non_null_float(&self) -> Result<f64, TypeError> {
        self.as_float()?.ok_or(TypeError::Conversion {
            expected: "float",
            found: "null",
        })
    }

    /// Cast the literal to a string
    pub(crate) fn as_string(&self) -> Result<Option<&str>, TypeError> {
        match self {
            Literal::Null => Ok(None),
            Literal::Boolean(_) => Err(TypeError::Conversion {
                expected: "string",
                found: "boolean",
            }),
            Literal::Number(_) => Err(TypeError::Conversion {
                expected: "string",
                found: "number",
            }),
            Literal::String(s) => Ok(Some(s)),
        }
    }

    /// Cast the literal to a non-null integer
    pub(crate) fn as_non_null_string(&self) -> Result<&str, TypeError> {
        self.as_string()?.ok_or(TypeError::Conversion {
            expected: "string",
            found: "null",
        })
    }

    /// Attempt to compare two literals
    pub(crate) fn try_partial_cmp(&self, other: &Self) -> Result<Option<Ordering>, TypeError> {
        match (self, other) {
            (Literal::Null, Literal::Null) => Ok(Some(Ordering::Equal)),
            (Literal::Boolean(a), Literal::Boolean(b)) => Ok(a.partial_cmp(b)),
            (Literal::String(a), Literal::String(b)) => Ok(a.partial_cmp(b)),
            (Literal::Number(a), Literal::Number(b)) => Ok(a.partial_cmp(b)),
            (Literal::Boolean(a), b) => Ok(a.partial_cmp(&b.as_boolean()?)),
            (a, Literal::Boolean(b)) => Ok(a.as_boolean()?.partial_cmp(&b)),
            (a, b) => Err(TypeError::Comparison {
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform negation
    pub(crate) fn try_neg(self) -> Result<Literal, TypeError> {
        match self {
            Literal::Number(n) => Ok(Literal::Number(-n)),
            _ => Err(TypeError::UnaryOperator {
                operator: "negate",
                kind: self.kind(),
            }),
        }
    }

    /// Attempt to perform logical negation
    pub(crate) fn try_not(self) -> Result<Literal, TypeError> {
        match self {
            Literal::Boolean(b) => Ok(Literal::Boolean(!b)),
            Literal::Number(n) => Ok(Literal::Number(n.try_not()?)),
            _ => Err(TypeError::UnaryOperator {
                operator: "bitwise not",
                kind: self.kind(),
            }),
        }
    }

    /// Attempt to perform addition
    pub(crate) fn try_add(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a + b)),
            (Literal::String(mut a), Literal::String(b)) => {
                a.push_str(&b);
                Ok(Literal::String(a))
            }
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "add",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform subtraction
    pub(crate) fn try_sub(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a - b)),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "subtract",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform multiplication
    pub(crate) fn try_mul(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a * b)),
            (Literal::String(a), Literal::Number(Number::Integer(b))) => {
                Ok(Literal::String(repeat(a).take(b as usize).collect()))
            }
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "multiply",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform division
    pub(crate) fn try_div(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a / b)),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "divide",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to raise to the power
    pub(crate) fn try_pow(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a.pow(b))),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "power",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform modulo
    pub(crate) fn try_modulo(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a % b)),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "modulo",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform logical and
    pub(crate) fn try_bitand(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Boolean(a), Literal::Boolean(b)) => Ok(Literal::Boolean(a & b)),
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a.try_bitand(b)?)),
            (Literal::Number(a), Literal::Boolean(b))
            | (Literal::Boolean(b), Literal::Number(a)) => {
                Ok(Literal::Number(a.try_bitand(b.into())?))
            }
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "bitwise and",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform logical or
    pub(crate) fn try_bitor(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Boolean(a), Literal::Boolean(b)) => Ok(Literal::Boolean(a | b)),
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a.try_bitor(b)?)),
            (Literal::Number(a), Literal::Boolean(b))
            | (Literal::Boolean(b), Literal::Number(a)) => {
                Ok(Literal::Number(a.try_bitor(b.into())?))
            }
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "bitwise or",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform logical exclusive-or
    pub(crate) fn try_bitxor(self, other: Literal) -> Result<Literal, TypeError> {
        match (self, other) {
            (Literal::Boolean(a), Literal::Boolean(b)) => Ok(Literal::Boolean(a ^ b)),
            (Literal::Number(a), Literal::Number(b)) => Ok(Literal::Number(a.try_bitxor(b)?)),
            (Literal::Number(a), Literal::Boolean(b))
            | (Literal::Boolean(b), Literal::Number(a)) => {
                Ok(Literal::Number(a.try_bitxor(b.into())?))
            }
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "bitwise or",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    pub(crate) fn kind(&self) -> &'static str {
        match self {
            Literal::Null => "null",
            Literal::Boolean(_) => "boolean",
            Literal::String(_) => "string",
            Literal::Number(n) => n.kind(),
        }
    }
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

#[derive(Debug, Error)]
pub enum DurationParseError {
    #[error("invalid duration")]
    InvalidDuration,
    #[error("missing unit in duration")]
    MissingUnit,
    #[error("unknown unit '{0}' in duration")]
    UnknownUnit(String),
    #[error(transparent)]
    TypeError(#[from] TypeError),
}

impl TryFrom<Literal> for Duration {
    type Error = DurationParseError;

    // Adapted from the implementation for https://pkg.go.dev/time#ParseDuration
    fn try_from(value: Literal) -> Result<Self, Self::Error> {
        // format matches ([0-9]*(\.[0-9]*)?[a-z]+)+
        let raw = value.as_non_null_string()?.to_lowercase();

        if raw.len() == 0 {
            return Err(DurationParseError::InvalidDuration);
        } else if raw == "0" {
            return Ok(Duration::from_millis(0));
        }

        let mut nanos: u64 = 0;

        let mut i = 0;
        loop {
            let c = match raw.chars().nth(i) {
                Some(c) => c,
                None => break,
            };

            // Next character must be [0-9.]
            if !(c == '.' || '0' <= c && c <= '9') {
                return Err(DurationParseError::InvalidDuration);
            }

            // Consume [0-9]*
            let num = raw
                .chars()
                .skip(i)
                .take_while(|c| '0' <= *c && *c <= '9')
                .collect::<String>();
            i += num.len();

            let pre = num.len() != 0;
            let v = num.parse::<u64>().unwrap();

            // Consume (\.[0-9]*)?
            let (post, f, scale) = if matches!(raw.chars().skip(i).next(), Some('.')) {
                let num = raw
                    .chars()
                    .skip(i + 1)
                    .take_while(|c| '0' <= *c && *c <= '9')
                    .collect::<String>();
                i += num.len();

                let f = num.parse::<u64>().unwrap();
                let scale = (10 * num.len()) as u64;

                (num.len() != 0, f, scale)
            } else {
                (false, 0, 0)
            };

            if !pre && !post {
                return Err(DurationParseError::InvalidDuration);
            }

            // Consume unit
            let u = raw
                .chars()
                .skip(i)
                .take_while(|c| *c != '.' && *c <= '0' || '9' <= *c)
                .collect::<String>();
            i += u.len();

            if u.len() == 0 {
                return Err(DurationParseError::MissingUnit);
            }

            let unit: u64 = match u.as_str() {
                "ns" => 1,
                "us" | "µs" | "μs" => 1 * 1000, // Accepts u, µ (U+00B5), μ (U+03BC)
                "ms" => 1 * 1000 * 1000,
                "s" => 1 * 1000 * 1000 * 1000,
                "m" => 1 * 1000 * 1000 * 1000 * 60,
                "h" => 1 * 1000 * 1000 * 1000 * 60 * 60,
                _ => return Err(DurationParseError::UnknownUnit(u)),
            };

            // Check for overflow
            if v > (1 << 63) / unit {
                return Err(DurationParseError::InvalidDuration);
            }

            // Convert to unit
            let mut v = v * unit;
            if f > 0 {
                // Get nanosecond accuracy for fractions of hours using f64
                // v >= 0 && (f*unit/scale) <= 3.6e+12 (ns/h, h is the largest unit)
                v += (f as f64 * (unit as f64 / scale as f64)) as u64;

                // Check for overflow
                if v > 1 << 63 {
                    return Err(DurationParseError::InvalidDuration);
                }
            }

            nanos += v;
            if nanos > 1 << 63 {
                return Err(DurationParseError::InvalidDuration);
            }
        }

        if nanos > 1 << 63 - 1 {
            Err(DurationParseError::InvalidDuration)
        } else {
            Ok(Duration::from_nanos(nanos))
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub(crate) enum Number {
    Integer(i64),
    Float(f64),
}

impl Number {
    /// Attempt to perform a logical not
    pub(crate) fn try_not(self) -> Result<Number, TypeError> {
        match self {
            Number::Integer(i) => Ok(Number::Integer(!i)),
            Number::Float(_) => Err(TypeError::UnaryOperator {
                operator: "negate",
                kind: self.kind(),
            }),
        }
    }

    /// Attempt to perform a logical and
    pub(crate) fn try_bitand(self, other: Self) -> Result<Number, TypeError> {
        match (self, other) {
            (Number::Integer(a), Number::Integer(b)) => Ok(Number::Integer(a & b)),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "bitwise and",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform a logical or
    pub(crate) fn try_bitor(self, other: Self) -> Result<Number, TypeError> {
        match (self, other) {
            (Number::Integer(a), Number::Integer(b)) => Ok(Number::Integer(a | b)),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "bitwise or",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Attempt to perform a logical xor
    pub(crate) fn try_bitxor(self, other: Self) -> Result<Number, TypeError> {
        match (self, other) {
            (Number::Integer(a), Number::Integer(b)) => Ok(Number::Integer(a ^ b)),
            (a, b) => Err(TypeError::BinaryOperator {
                operator: "bitwise xor",
                a: a.kind(),
                b: b.kind(),
            }),
        }
    }

    /// Raise a number to the power of the other
    pub(crate) fn pow(self, other: Self) -> Number {
        match (self, other) {
            (Number::Integer(a), Number::Integer(b)) => Number::Integer(a.pow(b as u32)),
            (Number::Float(a), Number::Float(b)) => Number::Float(a.powf(b)),
            (Number::Integer(a), Number::Float(b)) => Number::Float((a as f64).powf(b)),
            (Number::Float(a), Number::Integer(b)) => Number::Float(a.powi(b as i32)),
        }
    }

    fn kind(&self) -> &'static str {
        match self {
            Number::Integer(_) => "integer",
            Number::Float(_) => "float",
        }
    }
}

impl PartialEq for Number {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Number::Integer(a), Number::Integer(b)) => a.eq(b),
            (Number::Float(a), Number::Float(b)) => a.eq(b),
            (Number::Integer(a), Number::Float(b)) => (*a as f64).eq(b),
            (Number::Float(a), Number::Integer(b)) => a.eq(&(*b as f64)),
        }
    }
}

impl PartialOrd for Number {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        match (self, other) {
            (Number::Integer(a), Number::Integer(b)) => a.partial_cmp(b),
            (Number::Float(a), Number::Float(b)) => a.partial_cmp(b),
            (Number::Integer(a), Number::Float(b)) => (*a as f64).partial_cmp(b),
            (Number::Float(a), Number::Integer(b)) => a.partial_cmp(&(*b as f64)),
        }
    }
}

impl Neg for Number {
    type Output = Number;

    fn neg(self) -> Self::Output {
        match self {
            Number::Integer(i) => Number::Integer(-i),
            Number::Float(f) => Number::Float(-f),
        }
    }
}

impl Add for Number {
    type Output = Number;

    fn add(self, rhs: Self) -> Self::Output {
        match (self, rhs) {
            (Number::Integer(a), Number::Integer(b)) => Number::Integer(a + b),
            (Number::Float(a), Number::Float(b)) => Number::Float(a + b),
            (Number::Float(a), Number::Integer(b)) | (Number::Integer(b), Number::Float(a)) => {
                Number::Float(a + b as f64)
            }
        }
    }
}

impl Sub for Number {
    type Output = Number;

    fn sub(self, rhs: Self) -> Self::Output {
        match (self, rhs) {
            (Number::Integer(a), Number::Integer(b)) => Number::Integer(a - b),
            (Number::Float(a), Number::Float(b)) => Number::Float(a - b),
            (Number::Integer(a), Number::Float(b)) => Number::Float(a as f64 - b),
            (Number::Float(a), Number::Integer(b)) => Number::Float(a - b as f64),
        }
    }
}

impl Mul for Number {
    type Output = Number;

    fn mul(self, rhs: Self) -> Self::Output {
        match (self, rhs) {
            (Number::Integer(a), Number::Integer(b)) => Number::Integer(a * b),
            (Number::Float(a), Number::Float(b)) => Number::Float(a * b),
            (Number::Float(a), Number::Integer(b)) | (Number::Integer(b), Number::Float(a)) => {
                Number::Float(a * b as f64)
            }
        }
    }
}

impl Div for Number {
    type Output = Number;

    fn div(self, rhs: Self) -> Self::Output {
        match (self, rhs) {
            (Number::Integer(a), Number::Integer(b)) => Number::Integer(a / b),
            (Number::Float(a), Number::Float(b)) => Number::Float(a / b),
            (Number::Integer(a), Number::Float(b)) => Number::Float(a as f64 / b),
            (Number::Float(a), Number::Integer(b)) => Number::Float(a / b as f64),
        }
    }
}

impl Rem for Number {
    type Output = Number;

    fn rem(self, rhs: Self) -> Self::Output {
        match (self, rhs) {
            (Number::Integer(a), Number::Integer(b)) => Number::Integer(a % b),
            (Number::Float(a), Number::Float(b)) => Number::Float(a % b),
            (Number::Integer(a), Number::Float(b)) => Number::Float(a as f64 % b),
            (Number::Float(a), Number::Integer(b)) => Number::Float(a % b as f64),
        }
    }
}

impl From<bool> for Number {
    fn from(b: bool) -> Self {
        if b {
            Self::Integer(1)
        } else {
            Self::Integer(0)
        }
    }
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
