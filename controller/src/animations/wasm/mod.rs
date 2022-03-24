use super::{animation::Animation, BuildError, LoadError, SaveError};
use crate::pixels::Pixels;
use async_trait::async_trait;
use std::error::Error;
use tracing::{debug, instrument};
use wasmer::{CompilerConfig, Dylib, ExportError, Instance, Module, NativeFunc, Store};

mod instance;

/// A high-performance animation compiled to WASM
pub(crate) struct Wasm(Instance);

impl Wasm {
    fn get_animate_fn(&self) -> Result<NativeFunc<(), ()>, ExportError> {
        self.0.exports.get_native_function::<(), ()>("animate")
    }
}

#[async_trait]
impl Animation for Wasm {
    #[instrument(skip_all)]
    fn build<B: AsRef<[u8]>>(
        wasm: B,
        development: bool,
        pixels: Pixels,
    ) -> Result<Box<dyn Animation>, BuildError> {
        let engine = Dylib::new(get_compiler(development)).engine();
        let store = Store::new(&engine);
        let module = Module::new(&store, wasm)?;
        debug!("loaded module");

        let instance = instance::build(module, store, pixels)?;
        debug!("built instance");

        // Ensure the exported function exists and has the correct signature
        let animation = Self(instance);
        animation.get_animate_fn()?;

        Ok(Box::new(animation))
    }

    #[instrument(skip_all)]
    fn serialize(&self) -> Result<Vec<u8>, SaveError> {
        Ok(self.0.module().serialize()?)
    }

    #[instrument(skip_all)]
    fn deserialize(content: Vec<u8>, pixels: Pixels) -> Result<Box<dyn Animation>, LoadError>
    where
        Self: Sized,
    {
        let engine = Dylib::headless().engine();
        let store = Store::new(&engine);

        // This is unsafe due to the possibility of a malicious actor being able to inject code
        let module = unsafe { Module::deserialize(&store, &content)? };
        debug!("loaded animation");

        let instance = instance::build(module, store, pixels)?;
        debug!("built instance");

        Ok(Box::new(Self(instance)))
    }

    fn animate(&self) -> Result<(), Box<dyn Error>> {
        Ok(self.get_animate_fn()?.call()?)
    }
}

/// Determine which compiler to use based on the enabled features and if we are in development mode.
#[allow(unused_variables)]
fn get_compiler(development: bool) -> Box<dyn CompilerConfig> {
    #[cfg(all(feature = "cranelift", feature = "llvm"))]
    {
        use wasmer::{Cranelift, LLVM};

        if development {
            Box::new(Cranelift::new())
        } else {
            Box::new(LLVM::new())
        }
    }
    #[cfg(all(feature = "cranelift", not(feature = "llvm")))]
    {
        use wasmer::Cranelift;
        Box::new(Cranelift::new())
    }
    #[cfg(all(feature = "llvm", not(feature = "cranelift")))]
    {
        use wasmer::LLVM;
        Box::new(LLVM::new())
    }
    #[cfg(not(any(feature = "cranelift", feature = "llvm")))]
    compile_error!("a compiler must be defined, enable one or more of the following features: any, cranelift, llvm")
}
