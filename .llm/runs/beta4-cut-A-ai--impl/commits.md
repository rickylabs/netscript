# Commits — beta4-cut-A-ai--impl

The current harness docs treat the draft PR commit list and per-slice PR comments as canonical.
This file is maintained because the owner prompt explicitly requires it for this run.

| Slice | Commit | Evidence |
| --- | --- | --- |
| 1 | `8bb0cd85` | PLAN-EVAL cycle 2 `PASS`; harness artifacts created. |
| 2 | `bbd60980` | `createAiRouter` binder, AI contract soundness test, generated stream route imports `aiContractV1`; targeted contract/resource tests and scoped check passed. |
| 3 | `4bfa47a5` | Added `verify-plugin.ts`, doctor coverage for `ANTHROPIC_API_KEY`, six-emitter golden coverage, and parity review. |
| 4 | `1aaff3a5` | Added AI to scaffold runtime/plugin E2E suite wiring and registered `behavior.ai-chat-route` smoke gate. |
| 5 | `41e6f02e` | Flipped `plugins/ai` to an explicit JSR publish map, preserved package publish dry-runs, and recorded install-variant drift. |
