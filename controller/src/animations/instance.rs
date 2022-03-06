use crate::pixels::SharedPixels;
use std::thread;
use std::time::Duration;
use tracing::instrument;
use wasmer::{
    imports, Function, FunctionType, Instance, InstantiationError, Module, RuntimeError, Store,
    Type,
};

/// Build a new instance with its attached methods
#[instrument(skip_all)]
pub(crate) fn build(
    module: Module,
    store: Store,
    pixels: SharedPixels,
) -> Result<Instance, InstantiationError> {
    // Create a bunch of references to pixels to be used by the closures
    let brightness_pixels = pixels.clone();
    let fill_pixels = pixels.clone();
    let set_pixels = pixels.clone();
    let show_pixels = pixels.clone();

    // Build all the methods to be exposed
    let imports = imports! {
        "env" => {
            "brightness" => Function::new(&store, &FunctionType::new(vec![Type::I32], Vec::new()), move |args| {
                let value = u8_from_value(&args[0])?;

                let mut p = brightness_pixels.lock().map_err(|_| RuntimeError::new("lock poisoned"))?;
                p.brightness(value);

                Ok(Vec::new())
            }),
            "fill" => Function::new(&store, &FunctionType::new(vec![Type::I32, Type::I32, Type::I32], Vec::new()), move |args| {
                let r = u8_from_value(&args[0])?;
                let g = u8_from_value(&args[1])?;
                let b = u8_from_value(&args[2])?;

                let mut p = fill_pixels.lock().map_err(|_| RuntimeError::new("lock poisoned"))?;
                p.fill(r, g, b);

                Ok(Vec::new())
            }),
            "set" => Function::new(&store, &FunctionType::new(vec![Type::I32, Type::I32, Type::I32, Type::I32], Vec::new()), move |args| {
                let index = u16_from_value(&args[0])?;
                let r = u8_from_value(&args[1])?;
                let g = u8_from_value(&args[2])?;
                let b = u8_from_value(&args[3])?;

                let mut p = set_pixels.lock().map_err(|_| RuntimeError::new("lock poisoned"))?;
                p.set(index, r, g, b);

                Ok(Vec::new())
            }),
            "show" => Function::new(&store, &FunctionType::new(Vec::new(), Vec::new()), move |_| {
                let mut p = show_pixels.lock().map_err(|_| RuntimeError::new("lock poisoned"))?;
                p.show();
                Ok(Vec::new())
            }),
            "sleep" => Function::new_native(&store, sleep),
        }
    };

    Instance::new(&module, &imports)
}

/// A wrapper to sleep from within WASM
fn sleep(seconds: f64) {
    let duration = Duration::from_secs_f64(seconds);
    thread::sleep(duration);
}

macro_rules! int_from_value {
    ($name:ident, $result:ty) => {
        fn $name(v: &wasmer::Val) -> Result<$result, wasmer::RuntimeError> {
            if let Some(i) = v.i32() {
                Ok(if i > <$result>::MAX as i32 {
                    <$result>::MAX
                } else if i < <$result>::MIN as i32 {
                    <$result>::MIN
                } else {
                    i as $result
                })
            } else {
                Err(wasmer::RuntimeError::new("expected i32"))
            }
        }
    };
}

int_from_value!(u8_from_value, u8);
int_from_value!(u16_from_value, u16);
