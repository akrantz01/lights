use crate::pixels::SharedPixels;
use std::{
    io::{self, ErrorKind},
    path::Path,
};
use tokio::fs;
use tracing::{debug, instrument};
use wasmer::{CompilerConfig, Dylib, ExportError, Instance, Module, NativeFunc, Store};

mod error;
mod instance;

pub use error::{BuildError, LoadError, SaveError};

type AnimateMethod = NativeFunc<(), ()>;

/// An animation to be run by the animator
struct Animation(Instance);

impl Animation {
    /// Load and compile an animation from bytes
    #[instrument(skip_all)]
    pub fn build<B: AsRef<[u8]>>(
        wasm: B,
        development: bool,
        pixels: SharedPixels,
    ) -> Result<Self, BuildError> {
        let engine = Dylib::new(get_compiler(development)).engine();
        let store = Store::new(&engine);
        let module = Module::new(&store, wasm)?;
        debug!("loaded module");

        let instance = instance::build(module, store, pixels)?;
        debug!("built instance");

        // Ensure the exported function exists and has the correct signature
        let animation = Self(instance);
        animation.animate()?;

        Ok(animation)
    }

    /// Load a pre-compiled animation from disk
    #[instrument(skip(base))]
    pub async fn load<P: AsRef<Path>>(
        id: &str,
        base: P,
        pixels: SharedPixels,
    ) -> Result<Self, LoadError> {
        // Read the animation
        let path = base.as_ref().join(id);
        let wasm = fs::read(path).await?;
        debug!("read animation");

        let engine = Dylib::headless().engine();
        let store = Store::new(&engine);

        // This is unsafe due to the possibility of a malicious actor being able to inject code
        let module = unsafe { Module::deserialize(&store, &wasm)? };
        debug!("loaded animation");

        let instance = instance::build(module, store, pixels)?;
        debug!("built instance");

        Ok(Self(instance))
    }

    /// Delete an animation from disk
    #[instrument(skip(base))]
    pub async fn remove<P: AsRef<Path>>(id: &str, base: P) -> Result<(), io::Error> {
        let path = base.as_ref().join(id);
        if let Err(e) = fs::remove_file(path).await {
            match e.kind() {
                ErrorKind::NotFound => Ok(()),
                _ => Err(e),
            }
        } else {
            Ok(())
        }
    }

    /// Save an animation to a file
    #[instrument(skip(self, base))]
    pub async fn save<P: AsRef<Path>>(&self, id: &str, base: P) -> Result<(), SaveError> {
        let serialized = self.0.module().serialize()?;

        let path = base.as_ref().join(id);
        fs::write(path, &serialized).await?;

        Ok(())
    }

    /// Get the animate method to call
    pub fn animate(&self) -> Result<AnimateMethod, ExportError> {
        self.0.exports.get_native_function("animate")
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
