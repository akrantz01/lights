use std::time::Duration;

mod ffi {
    extern "C" {
        pub(super) fn set(index: i32, r: i32, g: i32, b: i32);
        pub(super) fn mode_instant();
        pub(super) fn mode_queue();
        pub(super) fn show();
        pub(super) fn sleep(secs: f64);
    }
}

pub fn set(index: u16, r: u8, g: u8, b: u8) {
    unsafe {
        ffi::set(index as i32, r as i32, g as i32, b as i32);
    }
}

#[allow(dead_code)]
pub enum Mode {
    Instant,
    Queue,
}

pub fn mode(m: Mode) {
    match m {
        Mode::Instant => unsafe { ffi::mode_instant() },
        Mode::Queue => unsafe { ffi::mode_queue() },
    }
}

pub fn show() {
    unsafe { ffi::show() }
}

pub fn sleep(duration: Duration) {
    let secs = duration.as_secs_f64();
    unsafe { ffi::sleep(secs) }
}
