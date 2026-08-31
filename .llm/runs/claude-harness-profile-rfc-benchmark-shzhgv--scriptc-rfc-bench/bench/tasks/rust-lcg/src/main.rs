//! Subject D — hand-written Rust release binary through the `executable` TaskType.
//! Same argv/env/last-JSON-line contract as the other variants.

use lcg::lcg_run;

fn read_vm_hwm_kb() -> Option<u64> {
    let status = std::fs::read_to_string("/proc/self/status").ok()?;
    let line = status.lines().find(|l| l.starts_with("VmHWM:"))?;
    let digits: String = line.chars().filter(|c| c.is_ascii_digit()).collect();
    digits.parse().ok()
}

fn main() {
    let mut args = std::env::args().skip(1);
    let n: u64 = args.next().and_then(|a| a.parse().ok()).unwrap_or(100_000);
    let seed: u64 = args.next().and_then(|a| a.parse().ok()).unwrap_or(42);
    let acc = lcg_run(n, seed);
    let correlation_id = std::env::var("CORRELATION_ID").ok();
    // Assemble JSON by hand to avoid a dependency; field order matches the TS variants.
    let cid = match correlation_id {
        Some(c) => format!("\"{}\"", c.replace('\\', "\\\\").replace('"', "\\\"")),
        None => "null".to_string(),
    };
    let hwm = match read_vm_hwm_kb() {
        Some(kb) => kb.to_string(),
        None => "null".to_string(),
    };
    println!(
        "{{\"acc\":{},\"n\":{},\"seed\":{},\"correlationId\":{},\"vmHwmKb\":{}}}",
        acc, n, seed, cid, hwm
    );
}
