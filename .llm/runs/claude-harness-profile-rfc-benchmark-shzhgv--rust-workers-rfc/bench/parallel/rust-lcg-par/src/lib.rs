//! Parallel MINSTD workload for the rust-workers RFC (run 2).
//!
//! `lcg_run_parallel(n, seed, threads)` splits n iterations across `threads` std::thread
//! workers, each running an independent MINSTD stream seeded `seed + t`, and folds the
//! per-thread accumulators with the same modulus. Deterministic for a given (n, seed, threads):
//! the verify step pins expected values per configuration. Thread safety is by construction —
//! each thread owns its state; the join is the only synchronization (no shared mutable data,
//! no locks) — exactly the ownership story the RFC describes.

const MULT: u64 = 48271;
const MODU: u64 = 2147483647;
const ACC_MODU: u64 = 1000000007;

fn lcg_chunk(n: u64, seed: u64) -> u64 {
    let mut state = seed;
    let mut acc: u64 = 0;
    let mut i = 0u64;
    while i < n {
        state = (state * MULT) % MODU;
        acc = (acc + state) % ACC_MODU;
        i += 1;
    }
    acc
}

/// Single-threaded reference (identical to run 1's lcg_run).
#[no_mangle]
pub extern "C" fn lcg_run(n: u64, seed: u64) -> u64 {
    lcg_chunk(n, seed)
}

/// Parallel run: n iterations split evenly over `threads` OS threads.
#[no_mangle]
pub extern "C" fn lcg_run_parallel(n: u64, seed: u64, threads: u64) -> u64 {
    let t = threads.max(1);
    let per = n / t;
    let rem = n % t;
    let handles: Vec<std::thread::JoinHandle<u64>> = (0..t)
        .map(|k| {
            let chunk = per + if k < rem { 1 } else { 0 };
            std::thread::spawn(move || lcg_chunk(chunk, seed + k))
        })
        .collect();
    let mut acc: u64 = 0;
    for h in handles {
        acc = (acc + h.join().expect("worker thread panicked")) % ACC_MODU;
    }
    acc
}
