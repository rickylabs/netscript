# Drift

- 2026-06-19 — significant — The brief preferred real deferred dispatch if the existing contract supported it. Current contract evidence shows `DeferAction` carries only `until`, while existing runtime scheduling covers recurring trigger definitions and worker queue delay requires a concrete job message. Implementing action replay would require a new scheduler/replay port beyond this M-sized slice, so S2 chose explicit unsupported-operation rejection with debt.

