# Extract — sandbox/isolation technology survey (fetched 2026-08-11)

For RFC rfc-0001-runtime-versioned-automation. Sources fetched via firecrawl search; primary-source
facts preferred; comparison-table numbers are vendor/practitioner-reported, treat as order-of-magnitude.

## Deno (primary: docs.deno.com/runtime/fundamentals/security/, /runtime/reference/permissions/)

- Deno is deny-by-default: no fs/net/env/subprocess/FFI without explicit `--allow-*`; `--deny-*`
  takes precedence; permission model enforced by the runtime.
- **`--allow-run` bypasses the sandbox**: subprocesses run with their own OS-level privileges, not
  the parent's permission set; `--allow-run=deno` (or a shell) = full escape. Official guidance:
  scope to specific executables.
- FFI likewise escapes the sandbox.
- Official untrusted-code guidance: limited permissions + `--frozen` + `--cached-only`; Web Workers
  with reduced per-worker permission sets; OS mechanisms (chroot/cgroups/seccomp); or gVisor /
  Firecracker / VM for real isolation. I.e. **Deno itself recommends layering an OS/VM boundary
  for genuinely untrusted code.**
- Research precedent: Cage4Deno (ACM AsiaCCS 2023) — fine-grained sandbox for Deno *subprocesses*,
  confirming the subprocess hole is the known weak point.

## Isolation primitives (practitioner consensus, Feb–Apr 2026 posts: zylos.ai, cosmonic.com, northflank.com, manveerc.substack.com, beam.cloud)

| Primitive | Boot | Overhead | Boundary | Notes |
| --- | --- | --- | --- | --- |
| Containers (runc/rootless) | ~1s+ | 50–200MB | shared kernel — weakest | consensus: NOT sufficient for hostile/AI-generated code |
| gVisor (Sentry user-space kernel) | ~100ms | ~20MB | syscalls intercepted (Systrap/KVM modes) | 10–30% I/O overhead; Modal/Google production |
| Firecracker microVM | ~125ms | ~5MB | KVM hardware, own kernel; jailer seccomp (24 syscalls) | AWS Lambda/Fargate, E2B, Fly.io; gold standard for untrusted code |
| Kata Containers | ~200ms | ~30MB | KVM, K8s-native | per-workload selectable on some platforms |
| V8 isolates | <1ms | ~1–10MB | V8 heap isolation | JS/TS(+wasm) only; Cloudflare Workers/Deno Deploy; process-isolation debate (Fly vs Cloudflare) |
| WASM/WASI component model | <1ms | <1–5MB | capability deny-by-default, no ambient authority | polyglot-if-compiled (Rust/Go/Py/JS/C); no GPU; wasmtime/wasmCloud; Microsoft Wassette (2025) = wasmtime + MCP for agent tools |

- Managed sandbox products (E2B Firecracker SDK, Modal gVisor, Northflank Kata/FC/gVisor,
  Fly Sprites, Beam) demonstrate a mature buy-option market **for isolation/sandbox execution specifically** (this file's scope is isolation technology only — the broader runtime/workflow product comparison lives in `competitive-architecture-study.md`); all are cloud-hosted — self-host fit
  varies (Northflank BYOC, Beam self-host).
- Recurring architecture: separate "execution adapter" from "security boundary"; layer primitives
  (defense in depth); pick per-workload isolation level by trust tier.
