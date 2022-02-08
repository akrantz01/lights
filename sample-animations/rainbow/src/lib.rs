use std::time::Duration;

mod wrapper;
use wrapper::*;

const LEDS: u16 = 150;
static mut INDEX: u8 = 0;

#[no_mangle]
pub extern "C" fn animate() {
    mode(Mode::Queue);

    for i in 0..LEDS {
        let pixel_index = unsafe { (i * 256 / LEDS) + INDEX as u16 };
        let (r, g, b) = wheel((pixel_index & 255) as u8);
        set(i, r, g, b);
    }

    unsafe { INDEX += 1 }

    show();
    sleep(Duration::from_millis(1));
}

fn wheel(position: u8) -> (u8, u8, u8) {
    if position < 85 {
        (position * 3, 255 - position * 3, 0)
    } else if position < 170 {
        let position = position - 85;
        (255 - position * 3, 0, position * 3)
    } else {
        let position = position - 170;
        (0, position * 3, 255 - position * 3)
    }
}
