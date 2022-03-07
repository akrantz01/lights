use rs_ws281x::WS2811Error;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PixelsError {
    #[error("unsupported hardware, must be running on a Raspberry Pi")]
    NotSupported,
    #[error("failed to connect to LEDs")]
    Setup,
    #[error("invalid permissions, are you running as root?")]
    Permissions,
    #[error("out of memory")]
    OutOfMemory,
    #[error("an unknown error occurred")]
    Other,
}

impl From<WS2811Error> for PixelsError {
    fn from(e: WS2811Error) -> Self {
        match e {
            WS2811Error::OutOfMemory => PixelsError::OutOfMemory,
            WS2811Error::HwNotSupported => PixelsError::NotSupported,
            WS2811Error::MemLock | WS2811Error::Mmap | WS2811Error::Dma => PixelsError::Permissions,
            WS2811Error::PcmSetup
            | WS2811Error::PwmSetup
            | WS2811Error::SpiSetup
            | WS2811Error::SpiTransfer
            | WS2811Error::IllegalGpio
            | WS2811Error::GpioInit => PixelsError::Setup,
            _ => PixelsError::Other,
        }
    }
}
