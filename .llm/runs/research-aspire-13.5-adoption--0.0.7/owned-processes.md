# Owned processes — Aspire 13.5 topic supervisor session

Declared so a leak-check or teardown sweep does not read these as foreign/unknown-owner.
**No Aspire, Docker, container, network or volume resource is held by this lane.**

| What | PID | Parent | Kind | Lifetime | Cleanup |
| ---- | --- | ------ | ---- | -------- | ------- |
| Merge-gate watcher for #1865 / #1858 | `4158673` | `ppid=1` (setsid-detached, own session) | `bash` loop calling `gh pr view` every 120 s | self-exits after 8 h, or immediately on writing `MERGED.sentinel` | `kill 4158673`; it holds no runtime resource |

Log: `<scratchpad>/watch-detached.log` · sentinel: `<scratchpad>/MERGED.sentinel`

It is detached on purpose — background harness tasks are killed unpredictably here (D-267/D-268), so
a detached process is the only shape that keeps polling across turns. The same shape is what §4a of
the Phase-B manifest mandates for the AppHost during the lease, which is exactly why it must be
**stopped explicitly**: nothing reaps a detached process for you, and a forgotten one is the leak
class this run has been fighting.
