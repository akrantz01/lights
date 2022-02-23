use crate::{
    errors::PixelsError,
    interface::{ChannelBuilder, Controller, ControllerBuilder, StripType},
};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::error;

// From https://github.com/adafruit/Adafruit_Blinka/blob/7.0.1/src/adafruit_blinka/microcontroller/bcm283x/neopixel.py#L9-L13
const LED_CHANNEL: usize = 0;
const LED_FREQUENCY: u32 = 800_000;
const LED_DMA_CHANNEL: i32 = 10;
const LED_BRIGHTNESS: u8 = 255;
const LED_INVERT: bool = false;

// Currently we don't support changing the pin. This corresponds to GPIO 18 (pin 12) on the Raspberry Pi
const LED_PIN: i32 = 18;

pub type SharedPixels = Arc<Mutex<Pixels>>;

/// A user-friendly interface around the low-level controller.
#[derive(Clone, Debug)]
pub struct Pixels {
    controller: Controller,
}

impl Pixels {
    /// Create a new connection to the light strip with the given number of pixels. The connection is
    /// wrapped in an [std::sync::Arc] and [tokio::sync::Mutex] to ensure thread-safe access.
    pub fn new(count: u16) -> Result<SharedPixels, PixelsError> {
        let controller = ControllerBuilder::new()
            .freq(LED_FREQUENCY)
            .dma(LED_DMA_CHANNEL)
            .channel(
                LED_CHANNEL,
                ChannelBuilder::new()
                    .pin(LED_PIN)
                    .count(count as i32)
                    .strip_type(StripType::Ws2812)
                    .brightness(LED_BRIGHTNESS)
                    .invert(LED_INVERT)
                    .build(),
            )
            .build()
            .map_err::<PixelsError, _>(Into::into)?;

        Ok(Arc::new(Mutex::new(Pixels { controller })))
    }

    /// Set the color of an individual pixel
    pub fn set(&mut self, index: u16, r: u8, g: u8, b: u8) {
        let pixels = self.controller.leds_mut(LED_CHANNEL);
        pixels[index as usize] = [b, g, r, 0];
    }

    /// Fill the entire strip with the same color
    pub fn fill(&mut self, r: u8, g: u8, b: u8) {
        let pixels = self.controller.leds_mut(LED_CHANNEL);
        for pixel in pixels {
            *pixel = [b, g, r, 0];
        }
    }

    /// Set the brightness of the strip
    pub fn brightness(&mut self, value: u8) {
        self.controller.set_brightness(LED_CHANNEL, value);
    }

    /// Write any queued changes to the strip
    pub fn show(&mut self) {
        if let Err(e) = self.controller.render() {
            error!(error = %e, "failed to commit changes");
        }
    }
}
