# Drift — #1591

## D-1 — `run-gate.ts`'s `check`/`lint`/`fmt-check` catalog gates can silently return a non-probative cache hit

**Severity:** significant, tooling-wide (not scoped to `#1591`) · **Class:** evidence integrity

**Observed.** Cutting `run-gate.ts --gate check -- --include '^packages/ai/'` at this leaf's exact
content head returned `outcome: PASS`, `exitCode: 0`, `durationMs: 90`, with **zero-byte stdout**. The
stderr tail read `... (cached, inputs unchanged)` — Deno's own **task-runner-level** cache (distinct
from the TS-compiler warm-cache this lane already knew about) skipped invoking
`run-deno-check.ts` entirely. The same happened for `lint` (88 ms) and `fmt-check` (86 ms).

**Why this is worse than the previously-documented duration heuristic.** This lane's established rule
— "a short duration is not proof of a replay; read the receipt's own stdout for evidence of the
work" — assumes the underlying wrapper script still ran and produced real (if fast, warm-cached)
output. Here the wrapper script **never started**. The receipt's `stdout` field is empty, which is
itself detectable (and was caught here), but a less careful check of "outcome: PASS, exitCode: 0"
alone would have certified nothing.

**Suspected mechanism.** `deno.json`'s `check`/`lint`/`fmt-check` task definitions declare a `files`
input set, which Deno's task runner appears to cache **by task name and matched-file content**, not
by the full argv (including a forwarded `--include` pattern). A prior invocation of the same task at
the same file-content state — regardless of `--include` scope — can produce a cache hit for a
differently-scoped later invocation. This was not observed in `#1387`'s leaf, plausibly because
its receipts were cut across many distinct commits in quick succession, each changing tracked file
content and busting the cache naturally; a single-commit leaf like this one, checked shortly after
its own content commit, is exactly the shape that triggers it.

**Resolution for this slice.** Re-ran all three via direct `deno run` invocation of the underlying
wrapper scripts (`run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts`), which bypasses `deno
task`'s cache layer entirely (it only wraps `deno task`, not direct `deno run`). All three produced
real, current output: `check` 100 files / 0 diagnostics, `lint` 100 files / 0 findings, `fmt-check`
100 files / 0 findings — genuinely confirming the PR body's claims. These direct results are cited in
`tier-a.md`; the cached, non-probative `run-gate.ts` receipts were discarded rather than committed as
if they were evidence.

**Not fixed here.** `.llm/tools/gates/catalog.ts`/`run-gate.ts` are shared, cross-lane harness tooling
outside this leaf's ceiling. Recording precisely so another lane's supervisor (or a future #1591-shape
review) doesn't certify a cached, empty-stdout receipt as real evidence. A proper fix likely needs
`run-gate.ts` to either detect and reject the `(cached, inputs unchanged)` stderr marker, or invoke
the wrapper scripts directly instead of through `deno task`.
