use crate::{
    errors::PixelsError,
    interface::{ChannelBuilder, ControllerBuilder, StripType},
};
use tokio::{
    sync::{
        mpsc::{self, UnboundedReceiver, UnboundedSender},
        oneshot::{self, Sender},
    },
    task::{self, JoinHandle},
};
use tracing::{error, info, instrument};

// From https://github.com/adafruit/Adafruit_Blinka/blob/7.0.1/src/adafruit_blinka/microcontroller/bcm283x/neopixel.py#L9-L13
const LED_CHANNEL: usize = 0;
const LED_FREQUENCY: u32 = 800_000;
const LED_DMA_CHANNEL: i32 = 10;
const LED_BRIGHTNESS: u8 = 255;
const LED_INVERT: bool = false;

// Currently we don't support changing the pin. This corresponds to GPIO 18 (pin 12) on the Raspberry Pi
const LED_PIN: i32 = 18;

/// The possible actions can be applied to the lights
#[derive(Debug)]
enum Action {
    /// Set the color of an individual pixel
    Set { index: u16, r: u8, g: u8, b: u8 },
    /// Set the color of the entire strip
    Fill { r: u8, g: u8, b: u8 },
    /// Set the brightness
    Brightness(u8),
    /// Commit the changes to the strip
    Show,
    /// Shutdown the pixel manager
    Shutdown,
}

/// A user-friendly interface around the low-level controller.
#[derive(Clone, Debug)]
pub struct Pixels(UnboundedSender<Action>);

impl Pixels {
    /// Create a new connection to the light strip with the given number of pixels. The connection is
    /// wrapped in an [std::sync::Arc] and [tokio::sync::Mutex] to ensure thread-safe access.
    pub async fn new(count: u16) -> Result<(Pixels, JoinHandle<()>), PixelsError> {
        // Create the communication channels
        let (err_tx, err_rx) = oneshot::channel();
        let (tx, rx) = mpsc::unbounded_channel();

        // Spawn the manager
        let handle = task::spawn_blocking(move || pixel_manager(count, rx, err_tx));

        // Check if an error occurred while initializing the manager
        if let Some(err) = err_rx.await.unwrap() {
            Err(err)
        } else {
            Ok((Pixels(tx), handle))
        }
    }

    /// Send an action to the manager
    fn send(&self, action: Action) {
        if let Err(err) = self.0.send(action) {
            error!(action = ?err.0, %err, "failed to send action");
        }
    }

    /// Set the color of an individual pixel
    #[instrument(skip(self))]
    pub fn set(&self, index: u16, r: u8, g: u8, b: u8) {
        self.send(Action::Set { index, r, g, b })
    }

    /// Fill the entire strip with the same color
    #[instrument(skip(self))]
    pub fn fill(&self, r: u8, g: u8, b: u8) {
        self.send(Action::Fill { r, g, b })
    }

    /// Set the brightness of the strip
    #[instrument(skip(self))]
    pub fn brightness(&self, value: u8) {
        self.send(Action::Brightness(value))
    }

    /// Write any queued changes to the strip
    #[instrument(skip(self))]
    pub fn show(&self) {
        self.send(Action::Show)
    }

    /// Shutdown the manager
    pub fn shutdown(&self) {
        self.send(Action::Shutdown)
    }
}

/// Handle controlling the lights from a separate task
#[instrument(skip_all)]
fn pixel_manager(
    leds: u16,
    mut actions: UnboundedReceiver<Action>,
    err_tx: Sender<Option<PixelsError>>,
) {
    // Attempt to create a new controller
    let mut controller = match ControllerBuilder::new()
        .freq(LED_FREQUENCY)
        .dma(LED_DMA_CHANNEL)
        .channel(
            LED_CHANNEL,
            ChannelBuilder::new()
                .pin(LED_PIN)
                .count(leds as i32)
                .strip_type(StripType::Ws2812)
                .brightness(LED_BRIGHTNESS)
                .invert(LED_INVERT)
                .build(),
        )
        .build()
    {
        Ok(c) => {
            err_tx.send(None).unwrap();
            c
        }
        // Report the failure back to the main task and exit
        Err(e) => {
            err_tx.send(Some(e.into())).unwrap();
            return;
        }
    };

    info!("pixel manager started");

    // Handle incoming actions
    loop {
        // Attempt to receive an action, or exit if closed
        let action = match actions.blocking_recv() {
            Some(a) => a,
            None => break,
        };

        // Perform the specified action
        match action {
            Action::Shutdown => break,
            Action::Set { index, r, g, b } => {
                let pixels = controller.leds_mut(LED_CHANNEL);
                pixels[index as usize] = [b, g, r, 0];
            }
            Action::Fill { r, g, b } => {
                let pixels = controller.leds_mut(LED_CHANNEL);
                for pixel in pixels {
                    *pixel = [b, g, r, 0];
                }
            }
            Action::Brightness(level) => {
                controller.set_brightness(LED_CHANNEL, level);
            }
            Action::Show => {
                if let Err(err) = controller.render() {
                    error!(%err, "failed to commit changes");
                }
            }
        }
    }

    info!("shutdown successfully");
}
