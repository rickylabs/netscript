//! wasmbuild pipeline attempt (T4): same MINSTD workload through the official
//! Rust->WASM->JSR toolchain (denoland/wasmbuild + wasm-bindgen).
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn lcg_run(n: u64, seed: u64) -> u64 {
    let mut state = seed;
    let mut acc: u64 = 0;
    let mut i = 0u64;
    while i < n {
        state = (state * 48271) % 2147483647;
        acc = (acc + state) % 1000000007;
        i += 1;
    }
    acc
}
