#[cfg(not(target_arch = "aarch64"))]
mod mock;

#[cfg(target_arch = "aarch64")]
pub use rs_ws281x::{ChannelBuilder, Controller, ControllerBuilder, StripType};

#[cfg(not(target_arch = "aarch64"))]
pub use mock::*;
