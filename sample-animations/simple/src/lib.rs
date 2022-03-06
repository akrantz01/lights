use std::time::Duration;

mod wrapper;
use wrapper::*;

const LEDS: u8 = 150;
static mut INDEX: u8 = 0;

#[no_mangle]
pub extern "C" fn animate() {
    fill(0, 0, 0);

    unsafe {
        if INDEX >= LEDS - 1 {
            INDEX = 0;
        } else {
            INDEX += 1;
        }

        set(INDEX as u16, 255, 0, 0);
    }

    show();
    sleep(Duration::from_millis(1));
}
