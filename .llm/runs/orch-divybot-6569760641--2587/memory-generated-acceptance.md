# Generated integration checks — 2026-11-02

Database-backed entity timestamps are Dates; memory service timestamps are strings.
An activity port accepting both must normalize to ISO at the stream boundary.
Seed scripts live at `database/<engine>/scripts/seed.ts`, so the root marker needs
`../../../.netscript/sample-seed.json`. Test actual emitted paths, not just a data-URL module.
The generated worker registry intentionally discards ordinary tags; sample opt-in must
survive on the handler itself, not rely on registry tags. A user replacement without
that marker must never be automatically dispatched.

Root lint/fmt exclude CLI. For explicit scoped wrappers, use a dedicated config carrying
the same rules/format settings without the root selection exclusions, and inspect
selected/processed coverage. The first run correctly refused partial exclusion.
