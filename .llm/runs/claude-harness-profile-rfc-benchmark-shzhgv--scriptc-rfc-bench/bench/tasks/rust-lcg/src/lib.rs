//! MINSTD LCG core shared by the Rust binary (subject D), the cdylib for `Deno.dlopen`
//! (boundary F), and the wasm32 build (boundary E). Arithmetic is u64 with all
//! intermediates < 2^53, so results are bit-identical to the JS f64 variants (plan.md L3).

pub const MINSTD_MULTIPLIER: u64 = 48271;
pub const MINSTD_MODULUS: u64 = 2147483647;
pub const ACC_MODULUS: u64 = 1000000007;

/// Run the MINSTD LCG workload and return the accumulator.
#[no_mangle]
pub extern "C" fn lcg_run(n: u64, seed: u64) -> u64 {
    let mut state = seed;
    let mut acc: u64 = 0;
    let mut i = 0u64;
    while i < n {
        state = (state * MINSTD_MULTIPLIER) % MINSTD_MODULUS;
        acc = (acc + state) % ACC_MODULUS;
        i += 1;
    }
    acc
}
