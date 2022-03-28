/// Sets up the necessary scope and functions for evaluating a value
#[macro_export]
macro_rules! evaluate {
    ($value:expr => $expected:pat_param $( if $guard:expr )?) => {
        {
            let mut globals = ::std::collections::HashMap::new();
            evaluate!(@inner $value, $expected, $( $guard )?, globals, ::std::collections::HashMap::new())
        }
    };
    (
        $value:expr => $expected:pat_param $( if $guard:expr )?,
        with globals
            $( $variable_name:expr => $variable_value:expr, )+
    ) => {
        {
            let mut globals = ::std::collections::HashMap::new();
            $( globals.insert($variable_name.into(), $variable_value.into()); )+

            evaluate!(@inner $value, $expected, $( $guard )?, globals, ::std::collections::HashMap::new())
        }
    };
    (
        $value:expr => $expected:pat_param $( if $guard:expr )?,
        with functions
            $( $function_name:expr => $function_value:expr, )+
    ) => {
        {
            let mut globals = ::std::collections::HashMap::new();

            let mut functions = ::std::collections::HashMap::new();
            $( functions.insert($function_name.into(), $function_value); )+

            evaluate!(@inner $value, $expected, $( $guard )?, globals, functions)
        }
    };
    (
        $value:expr => $expected:pat_param $( if $guard:expr )?,
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

            evaluate!(@inner $value, $expected, $( $guard )?, globals, functions)
        }
    };
    (@inner $value:expr, $expected:pat_param, $( $guard:expr )?, $globals:expr, $functions:expr) => {
        {
            let mut scope = $crate::animations::flow::scope::Scope::new(&mut $globals);
            let pixels = $crate::pixels::Pixels::new_mocked();

            let actual = $value.evaluate(&mut scope, &$functions, &pixels);
            assert!(matches!(actual, $expected $( if $guard )?));

            scope.to_map()
        }
    };
}
