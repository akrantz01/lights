use serde::{Deserialize, Serialize};

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
