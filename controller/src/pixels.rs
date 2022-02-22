use crate::interface::{ChannelBuilder, Controller, ControllerBuilder, StripType};

// From https://github.com/adafruit/Adafruit_Blinka/blob/7.0.1/src/adafruit_blinka/microcontroller/bcm283x/neopixel.py#L9-L13
const LED_CHANNEL: usize = 0;
const LED_FREQUENCY: u32 = 800_000;
const LED_DMA_CHANNEL: i32 = 10;
const LED_BRIGHTNESS: u8 = 255;
const LED_INVERT: bool = false;

// Currently we don't support changing the pin. This corresponds to GPIO 18 (pin 12) on the Raspberry Pi
const LED_PIN: i32 = 18;

/// A user-friendly interface around the low-level controller
#[derive(Debug)]
pub struct Pixels {
    controller: Controller,
}

impl Pixels {
    /// Create a new connection to the light strip with the given number of pixels
    pub fn new(count: u16) -> Pixels {
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
            .unwrap();

        Pixels { controller }
    }
}
