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

/// A user-friendly interface around the low-level controller. [Pixels] can be shared between
/// multiple threads safely by cloning.
#[derive(Clone, Debug)]
pub struct Pixels {
    shared: Arc<Mutex<Shared>>,
}

#[derive(Debug)]
struct Shared {
    controller: Controller,
    auto_commit: bool,
}

impl Pixels {
    /// Create a new connection to the light strip with the given number of pixels
    pub fn new(count: u16) -> Result<Pixels, PixelsError> {
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

        let shared = Shared {
            controller,
            auto_commit: true,
        };
        Ok(Pixels {
            shared: Arc::new(Mutex::new(shared)),
        })
    }

    /// Set the color of an individual pixel
    pub async fn set(&self, index: u16, r: u8, g: u8, b: u8) {
        let mut shared = self.shared.lock().await;

        // Set the pixel
        let pixels = shared.controller.leds_mut(LED_CHANNEL);
        pixels[index as usize] = [b, g, r, 0];

        if shared.auto_commit {
            if let Err(e) = shared.controller.render() {
                error!(error = %e, "failed to commit changes");
            }
        }
    }

    /// Fill the entire strip with the same color
    pub async fn fill(&self, r: u8, g: u8, b: u8) {
        let mut shared = self.shared.lock().await;

        // Fill all the pixels
        let pixels = shared.controller.leds_mut(LED_CHANNEL);
        for pixel in pixels {
            *pixel = [b, g, r, 0];
        }

        if shared.auto_commit {
            if let Err(e) = shared.controller.render() {
                error!(error = %e, "failed to commit changes");
            }
        }
    }

    /// Set the brightness of the strip
    pub async fn brightness(&self, value: u8) {
        let mut shared = self.shared.lock().await;

        shared.controller.set_brightness(LED_CHANNEL, value);

        if shared.auto_commit {
            if let Err(e) = shared.controller.render() {
                error!(error = %e, "failed to commit changes");
            }
        }
    }

    /// Set whether changes should be automatically written to the strip
    pub async fn auto_commit(&self, enabled: bool) {
        let mut shared = self.shared.lock().await;
        shared.auto_commit = enabled;
    }

    /// Write any queued changes to the strip. Does nothing when `Pixels.auto_write` is `true`
    pub async fn show(&self) {
        let mut shared = self.shared.lock().await;

        if !shared.auto_commit {
            if let Err(e) = shared.controller.render() {
                error!(error = %e, "failed to commit changes");
            }
        }
    }
}
