use super::literal::Literal;
use std::collections::HashMap;

/// Denotes the current variable scope with globals and locals. Globals have a higher precedence than locals.
#[derive(Debug)]
pub(crate) struct Scope<'s> {
    globals: &'s mut HashMap<String, Literal>,
    locals: HashMap<String, Literal>,
}

impl<'s> Scope<'s> {
    /// Create a new variable scope
    pub(crate) fn new(globals: &'s mut HashMap<String, Literal>) -> Self {
        Scope {
            globals,
            locals: HashMap::new(),
        }
    }

    /// Creates a new scope with a reset local scope for nested function calls.
    pub(crate) fn nested(&mut self) -> Scope {
        Scope {
            globals: self.globals,
            locals: HashMap::new(),
        }
    }

    /// Get the value of a variable
    pub(crate) fn get(&self, key: &str) -> Option<&Literal> {
        self.globals.get(key).or_else(|| self.locals.get(key))
    }

    /// Set the value of a variable
    pub(crate) fn set(&mut self, key: String, value: Literal) {
        if self.globals.contains_key(&key) {
            self.globals.insert(key, value);
        } else {
            self.locals.insert(key, value);
        }
    }

    /// Convert the scope to a map for inspection
    #[cfg(test)]
    pub(crate) fn to_map(&self) -> HashMap<String, Literal> {
        let mut owned = HashMap::new();

        owned.extend(
            self.globals
                .iter()
                .map(|(k, v)| (k.to_owned(), v.to_owned())),
        );
        owned.extend(
            self.locals
                .iter()
                .map(|(k, v)| (k.to_owned(), v.to_owned())),
        );

        owned
    }
}
