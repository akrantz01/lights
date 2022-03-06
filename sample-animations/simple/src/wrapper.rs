use std::time::Duration;

mod ffi {
    extern "C" {
        pub(super) fn fill(r: i32, g: i32, b: i32);
        pub(super) fn set(index: i32, r: i32, g: i32, b: i32);
        pub(super) fn show();
        pub(super) fn sleep(secs: f64);
    }
}

pub fn fill(r: u8, g: u8, b: u8) {
    unsafe {
        ffi::fill(r as i32, g as i32, b as i32);
    }
}

pub fn set(index: u16, r: u8, g: u8, b: u8) {
    unsafe {
        ffi::set(index as i32, r as i32, g as i32, b as i32);
    }
}

pub fn show() {
    unsafe { ffi::show() }
}

pub fn sleep(duration: Duration) {
    let secs = duration.as_secs_f64();
    unsafe { ffi::sleep(secs) }
}
