# Drift Log: Deno 2.9.5 toolchain standardization (#1413)

## 2026-08-09 — Local Deno state differs from carried-in setup

- **What:** The implementation host no longer has the described root-owned Deno 2.9.3 binary.
- **Source:** Owner brief versus local `deno --version` and `stat`.
- **Expected:** `/home/codex/.deno/bin/deno` is root-owned Deno 2.9.3.
- **Actual:** It is `codex:codex`, mode 755, and Deno 2.9.5.
- **Severity:** minor
- **Action:** accept; use a scratch-only Deno 2.9.3 binary for RED evidence and do not mutate the
  installed 2.9.5 binary.
- **Evidence:** `deno 2.9.5 (stable, release, x86_64-unknown-linux-gnu)` and
  `codex:codex 755 /home/codex/.deno/bin/deno`.
