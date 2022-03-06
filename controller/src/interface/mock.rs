use rs_ws281x::WS2811Error;
use std::iter;
use tracing::debug;

type RawColor = [u8; 4];

#[derive(Clone, Copy, Debug)]
pub enum StripType {
    Ws2812,
}

#[derive(Clone, Debug)]
pub struct Controller {
    leds: Vec<RawColor>,
    brightness: u8,
}

impl Controller {
    pub fn render(&mut self) -> Result<(), WS2811Error> {
        debug!(brightness = %self.brightness, leds = ?self.leds, "current strip state");
        Ok(())
    }

    pub fn set_brightness(&mut self, _: usize, value: u8) {
        self.brightness = value;
    }

    pub fn leds_mut(&mut self, _: usize) -> &mut [RawColor] {
        self.leds.as_mut_slice()
    }
}

#[derive(Debug, Default)]
pub struct ControllerBuilder {
    length: usize,
    brightness: u8,
}

impl ControllerBuilder {
    pub fn new() -> Self {
        ControllerBuilder::default()
    }

    pub fn freq(&mut self, _: u32) -> &mut Self {
        self
    }

    pub fn channel(&mut self, _: usize, channel: Channel) -> &mut Self {
        self.length = channel.0;
        self.brightness = channel.1;
        self
    }

    pub fn dma(&mut self, _: i32) -> &mut Self {
        self
    }

    pub fn build(&mut self) -> Result<Controller, WS2811Error> {
        Ok(Controller {
            brightness: self.brightness,
            leds: iter::repeat::<RawColor>([0, 0, 0, 0])
                .take(self.length)
                .collect(),
        })
    }
}

// Since we only have 1 channel, we can just store its desired length and brightness to use later
// in the controller
type Channel = (usize, u8);

#[derive(Debug, Default)]
pub struct ChannelBuilder {
    length: i32,
    brightness: u8,
}

impl ChannelBuilder {
    pub fn new() -> Self {
        ChannelBuilder::default()
    }

    pub fn pin(&mut self, _: i32) -> &mut Self {
        self
    }

    pub fn count(&mut self, value: i32) -> &mut Self {
        self.length = value;
        self
    }

    pub fn strip_type(&mut self, _: StripType) -> &mut Self {
        self
    }

    pub fn invert(&mut self, _: bool) -> &mut Self {
        self
    }

    pub fn brightness(&mut self, value: u8) -> &mut Self {
        self.brightness = value;
        self
    }

    pub fn build(&mut self) -> Channel {
        (self.length as usize, self.brightness)
    }
}
