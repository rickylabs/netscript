# Bounded durable-streams storage — 2026-10-07

NetScript #2080 / harness #636 / PR #2081 replaces full-segment native recovery and reads at the streams service seam. Preserve frame-inclusive offsets, arbitrary interior positions and fork caps; proving a tail offset is a native frame boundary requires a checkpoint, not a blind seek into arbitrary payload bytes. A fixed-capacity recent-boundary cache gives fast tails without memory that grows with log length.

Measure native allocations in independent processes with Linux VmHWM. The regression generates a real 1 GiB log and demonstrates both unchanged full-buffer paths exceeding the same 512 MiB RSS ceiling that bounded recovery/tail passes. Upstream issue durable-streams/durable-streams#420 requests bounded I/O and a supported injection seam; the local private-hook bridge is tracked as dependency-upgrade debt.

Use structured wrappers and persist separate successful RSS measurements: the test wrapper retains failure diagnostics, not every successful console line. This worker has Deno 2.9.7, frozen durable-streams/server 0.3.7, no .NET SDK or Docker daemon; full scaffold.runtime is unproven despite passing native HTTP/restart and RSS integration tests. Baseline whole-plugin doc-lint findings are outside the changed service export.
