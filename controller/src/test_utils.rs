/// Sets up the necessary scope and functions for evaluating a value
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
