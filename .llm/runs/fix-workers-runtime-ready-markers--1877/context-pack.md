# Context Pack

- Goal: fix #1877 by accepting scheduler startup plus either supported worker runner-mode marker.
- Baseline: `38f2ce7358f80e4075c481b450b52e1a01c5984c`.
- Branch: `fix/workers-runtime-ready-markers`; push only with the supplied explicit refspec.
- Scope: one CLI E2E gate module, one focused gate test, and this run directory.
- State: bootstrap and design recorded; RED test is next.
- PLAN-EVAL: N/A (mechanical, fully specified).
- Runtime suite: prohibited locally; hosted CI owns it.
- Lock hygiene: `deno.lock` must remain byte-identical.

