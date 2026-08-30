# S7 — bounded bootstrap correction (coordinator ruling; same thread, static, then ONE new attempt)

Your terminal attempt receipt and exact-zero inventory are preserved and correct — this was **not**
DinD/bind/port evidence, and no unchanged retry is allowed. The defect is the scratch **bootstrap
order**: the canonical generated-project sequence ratified by the harness (the hosted
`scaffold.runtime` suite) generates the local DB/Zod artifacts with `deno task db:generate`
(standalone, no Aspire — the `database.codegen` gate) **before** any root install/type-check that
resolves `database/<engine>/schema/.generated/**`. The rerun brief's sequence omitted it.

## Authorized change (one bounded harness/fixture correction only)

1. In your run-dir Phase-B procedure (`phase-b-handoff.md` bootstrap steps or its rerun notes —
   harness artifacts only, **no `packages/` change, no product scope widening**): after scaffold +
   root `deno install`, insert `deno task db:generate` (run inside the generated project) before
   `aspire restore`/`aspire start` and before any root type-check. If the established S7 sequence
   is instead the canonical minimal S7 fixture, use that — state which and why in one line.
2. **RED/current-order proof (cheap, no AppHost, no lease):** scaffold a throwaway project under
   `.llm/tmp/`, run the old order, capture the exact resolver failure (the missing
   `.generated`/Zod artifact error) as `receipts/phase-b-21-bootstrap-red.txt`; then run the
   corrected order and capture the passing type-check as `receipts/phase-b-22-bootstrap-green.txt`.
   Remove the throwaway tree. No `aspire start`, no Docker.
3. Tier-A surface: if any **checked-in harness path** changed (e2e gate code, `.llm/tools/**`),
   run its scoped check/lint/tests and name them; if only run-dir procedure text changed, say so.
4. Commit receipts + procedure correction, push explicitly, report the **refrozen exact head SHA**
   and end your turn. Do NOT start the new Phase-B attempt yourself — the supervisor serializes it
   from host zero after refreeze, then IMPL-EVAL follows.
