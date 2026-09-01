# Owned processes — Aspire 13.5 topic supervisor session

Declared so a leak-check or teardown sweep does not read these as foreign/unknown-owner.
**No Aspire, Docker, container, network or volume resource is held by this lane.**

| What | PID | Parent | Kind | Lifetime | Cleanup |
| ---- | --- | ------ | ---- | -------- | ------- |
| Phase-B trigger monitor (#1865 merge + S9 hosted CI) | `477213` | `ppid=1` (setsid-detached, own session) | `bash` loop calling `gh pr view` every 180 s | self-exits after 24 h, or immediately on writing `PHASEB-READY.sentinel` | `kill 477213`; it holds no runtime resource |

Log: `<scratchpad>/phaseb-monitor.log` · sentinel: `<scratchpad>/PHASEB-READY.sentinel`

The earlier merge-gate watcher was stopped explicitly when the owner directed the lane off dependency polling; it is not running.

It is detached on purpose — background harness tasks are killed unpredictably here (D-267/D-268), so
a detached process is the only shape that keeps polling across turns. The same shape is what §4a of
the Phase-B manifest mandates for the AppHost during the lease, which is exactly why it must be
**stopped explicitly**: nothing reaps a detached process for you, and a forgotten one is the leak
class this run has been fighting.
