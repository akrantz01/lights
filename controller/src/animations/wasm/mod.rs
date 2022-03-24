use super::{animation::Animation, BuildError, LoadError, SaveError};
use crate::pixels::Pixels;
use async_trait::async_trait;
use std::{error::Error, path::Path};
use tokio::fs;
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
    /// Load and compile an animation from bytes
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

    /// Load a pre-compiled animation from disk
    #[instrument(skip(base, pixels))]
    async fn load(id: &str, base: &Path, pixels: Pixels) -> Result<Box<dyn Animation>, LoadError> {
        // Read the animation
        let path = base.join(id);
        let wasm = fs::read(path).await?;
        debug!("read animation");

        let engine = Dylib::headless().engine();
        let store = Store::new(&engine);

        // This is unsafe due to the possibility of a malicious actor being able to inject code
        let module = unsafe { Module::deserialize(&store, &wasm)? };
        debug!("loaded animation");

        let instance = instance::build(module, store, pixels)?;
        debug!("built instance");

        Ok(Box::new(Self(instance)))
    }

    /// Save an animation to a file
    #[instrument(skip(self, base))]
    async fn save(&self, id: &str, base: &Path) -> Result<(), SaveError> {
        let serialized = self.0.module().serialize()?;

        let path = base.join(id);
        fs::write(path, &serialized).await?;

        Ok(())
    }

    /// Get the animate method to call
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
