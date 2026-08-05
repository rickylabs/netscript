use harness

## SKILL

- `netscript-harness` — conduct the separate cycle-two IMPL-EVAL and update the verdict artifact.
- `netscript-doctrine` — assess the Archetype-6 dependency conclusion.
- `netscript-deno-toolchain` — assess package/version evidence.
- internal `aspire` — assess Aspire restore/runtime claims.
- `netscript-tools`, `netscript-pr`, and `rtk` — verify gates, scope, and PR truthfulness.

# IMPL-EVAL cycle 2 — Aspire Deno runtime / NuGet research

Re-evaluate draft PR #1307 after the bounded corrections requested in cycle one. Inspect current
head `c3a454da60f03b275eb2ed21b73d71dabbc983e7` and especially commits `9c4f29a5c` and `e20940838`.

Confirm that `research.md` now:

1. describes #1308's one green fixed-daily restore as corroboration/compatibility evidence, while
   retaining repeated published-canary runs as the reliability gate;
2. labels the first-party 84-library result as the current `Aspire.Hosting.JavaScript@13.4.6`
   package-identity proxy and reserves the exact 13.5 transitive count for a released cold fixture;
3. correctly distinguishes merged #18958 as the #1227 lifecycle fix from open Deno PRs
   #18627/#18628; and
4. otherwise preserves the validated Deno export/runtime evidence, scope, lock hygiene, citations,
   and non-closing PR semantics.

Perform only bounded read-only checks. Do not edit product/scaffold source, mutate `deno.lock`,
commit, push, or update the PR. Replace
`.llm/runs/research-aspire-deno-runtime-path--1227-adjacent/evaluate.md` with the cycle-two verdict
of record. Include the formal phase/verdict marker, route/model/session, inspected head, disposition
of both cycle-one blockers, residual risks, and PR recommendation. PASS only if no further
correction to `research.md` is required. End the response with exactly `DONE`.
