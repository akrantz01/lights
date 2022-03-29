/// Sets up the necessary scope and functions for evaluating an expression
#[macro_export]
macro_rules! evaluate {
    ($evaluable:expr => $expected:pat_param $( if $guard:expr )?) => {
        {
            let mut globals = ::std::collections::HashMap::new();
            evaluate!(
                @inner $evaluable, $expected, $( $guard )?,
                globals, ::std::collections::HashMap::new(), $crate::pixels::Pixels::faux()
            )
        }
    };
    (
        $evaluable:expr => $expected:pat_param $( if $guard:expr )?,
        with globals
            $( $variable_name:expr => $variable_value:expr, )+
    ) => {
        {
            let mut globals = ::std::collections::HashMap::new();
            $( globals.insert($variable_name.into(), $variable_value.into()); )+

            evaluate!(
                @inner $evaluable, $expected, $( $guard )?,
                globals, ::std::collections::HashMap::new(), $crate::pixels::Pixels::faux()
            )
        }
    };
    (
        $evaluable:expr => $expected:pat_param $( if $guard:expr )?,
        with functions
            $( $function_name:expr => $function_value:expr, )+
    ) => {
        {
            let mut globals = ::std::collections::HashMap::new();

            let mut functions = ::std::collections::HashMap::new();
            $( functions.insert($function_name.into(), $function_value); )+

            evaluate!(
                @inner $evaluable, $expected, $( $guard )?,
                globals, functions, $crate::pixels::Pixels::faux()
            )
        }
    };
    (
        $evaluable:expr => $expected:pat_param $( if $guard:expr )?,
        with pixels = $pixels:expr
    ) => {
        {
            let mut globals = ::std::collections::HashMap::new();

            evaluate!(
                @inner $evaluable, $expected, $( $guard )?,
                globals, ::std::collections::HashMap::new(), $pixels
            )
        }
    };
    (
        $evaluable:expr => $expected:pat_param $( if $guard:expr )?,
        with globals
            $( $variable_name:expr => $variable_value:expr ),+ ;
        with functions
            $( $function_name:expr => $function_value:expr, )+
    ) => {
        {
            let mut globals = ::std::collections::HashMap::new();
            $( globals.insert($variable_name.into(), $variable_value.into()); )+

            let mut functions = ::std::collections::HashMap::new();
            $( functions.insert($function_name.into(), $function_value); )+

            evaluate!(
                @inner $evaluable, $expected, $( $guard )?,
                globals, functions, $crate::pixels::Pixels::faux()
            )
        }
    };
    (
        @inner $evaluable:expr, $expected:pat_param, $( $guard:expr )?,
        $globals:expr, $functions:expr, $pixels:expr
    ) => {
        {
            let mut scope = $crate::animations::flow::scope::Scope::new(&mut $globals);
            let pixels = $pixels;

            let actual = $evaluable.evaluate(&mut scope, &$functions, &pixels);
            assert!(matches!(actual, $expected $( if $guard )?));

            scope.to_map()
        }
    };
}

/// Sets up the necessary variables and functions for validating an expression
#[macro_export]
macro_rules! validate {
    ($validatable:expr => $expected:pat_param $( if $guard:expr )?) => {
        {
            let mut variables = ::std::collections::HashSet::new();
            validate!(
                @inner $validatable, $expected, $( $guard )?,
                ::std::collections::HashMap::new(), variables
            )
        }
    };
    (
        $validatable:expr => $expected:pat_param $( if $guard:expr )?,
        with variables = [ $( $variable:expr ),+ ]
    ) => {
        {
            let mut variables = ::std::collections::HashSet::new();
            $( variables.insert($variable.into()); )+

            validate!(
                @inner $validatable, $expected, $( $guard )?,
                ::std::collections::HashMap::new(), variables
            )
        }
    };
    (
        $validatable:expr => $expected:pat_param $( if $guard:expr )?,
        with functions = { $( $function_name:expr => $function_arity:expr ),+ }
    ) => {
        {
            let mut functions = ::std::collections::HashMap::new();
            $( functions.insert($function_name.into(), $function_arity); )+

            let mut variables = ::std::collections::HashSet::new();
            validate!(
                @inner $validatable, $expected, $( $guard )?,
                functions, variables
            )
        }
    };
    (
        $validatable:expr => $expected:pat_param $( if $guard:expr )?,
        with variables = [ $( $variable:expr ),+ ];
        with functions = { $( $function_name:expr => $function_arity:expr ),+ }
    ) => {
        {
            let mut variables = ::std::collections::HashSet::new();
            $( variables.insert($variable.into()); )+

            let mut functions = ::std::collections::HashMap::new();
            $( functions.insert($function_name.into(), $function_arity); )+

            validate!(
                @inner $validatable, $expected, $( $guard )?,
                functions, variables
            )
        }
    };
    (
        @inner $validatable:expr, $expected:pat_param, $( $guard:expr )?,
        $functions:expr, $variables:expr
    ) => {
        {
            let actual = $validatable.validate(&$functions, &mut $variables);
            assert!(matches!(dbg!(actual), $expected $( if $guard )?));

            $variables.clone()
        }
    };
}
