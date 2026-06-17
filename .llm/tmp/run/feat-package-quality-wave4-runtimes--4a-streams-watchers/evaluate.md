# IMPL-EVAL — feat-package-quality-wave4-runtimes--4a-streams-watchers

Separate-session evaluator pass (IMPL-EVAL) over the implemented 4a sub-wave. Protocol:
`.llm/harness/evaluator/protocol.md`; verdicts: `.llm/harness/evaluator/verdict-definitions.md`.

## Verdict: **PASS**

Approved scope (23 slices, 3 units) is complete; all required static, fitness, runtime, and
consumer gates for the three 4a units pass with independently re-run evidence; PLAN-EVAL carry
items are satisfied; AP-13 debt is well-formed. One pre-existing, out-of-scope base defect in
`packages/cli` is recorded as a non-blocking finding (not introduced or deepened by 4a).

## Independently re-run gate evidence

| Gate | `@netscript/plugin-streams-core` | `@netscript/plugin-streams` | `@netscript/watchers` |
|---|---|---|---|
| Full-export `deno doc --lint` | PASS, 3 files | PASS, 5 files | PASS, 1 file |
| `deno task check` (`--unstable-kv`) | PASS | PASS | PASS |
| `deno lint` | PASS, 19 files | n/a | PASS, 16 files |
| `deno test` | PASS, 4/0 | PASS, 5/0 | PASS, **18/0** (after test-task fix) |
| `deno publish --dry-run` | Success, 0 slow types | Success, 0 slow types | Success, 0 slow types |

## PLAN-EVAL carry items (all confirmed)

1. **A5 Runtime/Aspire validation** — `verify-plugin.ts` runs green (`ok: true`, 4 contribution
   groups, 0 findings). `tests/aspire/streams-contribution_test.ts` asserts the contribution
   actually *registers*: a `deno-service` resource `streams` (port 4437), `declareEnv`, and a
   `/health` check at `http://localhost:4437/health` — registration, not merely type-check.
2. **AP-13 `console.warn` debt** — two well-formed entries in `.llm/harness/debt/arch-debt.md`
   (streams-core + watchers), each with reason, owner, target, linked plan, created date,
   `DEBT_ACCEPTED` status, and a close-gate (F-14/AP-13).
3. **Watchers deep-import retarget** — only one external consumer imports `@netscript/watchers`
   (`plugins/triggers/src/runtime/watchers-file-watcher-adapter.ts`) and it uses the stable
   barrel specifier; the `@netscript/watchers` specifier is unchanged, so no other consumer
   moved. `plugins/triggers` `deno task check` PASS.

## Consumer gates

`plugins/sagas` PASS, `plugins/workers` PASS, `plugins/triggers` PASS.

## Findings

- **F1 (fixed during this pass — augment medium):** `packages/watchers/deno.json` `test` task
  ran only `filters`, so the slices-20/21 tests under `tests/` (FileWatcher lifecycle + README
  doctest) were not executed by `deno task test`. Retargeted to `filters tests`; the package
  test task now runs 18/0 instead of 13/0. Worklog/PR S18 "13 tests" evidence is superseded.
- **F2 (fixed — augment low):** `packages/plugin-streams-core/README.md` §1 still described the
  package as "Archetype 1 small-contract"; corrected to "Archetype 3 runtime/behavior" to match
  `docs/architecture.md` (slice 1) and the locked archetype decision.
- **F3 (fixed — augment low):** `plugins/streams/docs/getting-started.md` config snippet
  `plugins: ['./plugins/streams/mod.ts'];` was an invalid bare object-property with a trailing
  semicolon; replaced with a valid `export default { plugins: [...] };` form matching
  `plugins/workers/docs/getting-started.md`.
- **F4 (non-blocking, out of 4a scope):** `packages/cli` `deno task check` fails with
  TS9016/TS9027 (`isolatedDeclarations` shorthand) in
  `src/maintainer/features/sync/plugin/copy-official-plugin.ts`. This file is **byte-identical
  to umbrella base `ee9f26b`** and is unchanged by any 4a commit; it does not reference streams
  or watchers. The S22 worklog "`packages/cli` check PASS" row is therefore stale evidence
  (likely masked by `rtk proxy` filtered output or a since-advanced umbrella base). Pre-existing
  base debt; should be addressed at the umbrella level, not in 4a.

## Debt delta

No new debt introduced beyond the two accepted AP-13 entries (both well-formed). No 4a change
deepens an existing entry.
