# Worklog: readiness fixture cache discovery

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-readiness-fixture-cache-discovery--1870` |
| Branch | `fix/readiness-fixture-cache-discovery` |
| Archetype | N/A — E2E consumer tooling |
| Scope overlays | none |

## Design

### Public Surface

- `discoverRespHealthAttachment(source)` — returns the one generated RESP resource triple.
- `injectListenerFaultHealthChecks(source, database)` — injects fixture-owned checks beside real checks.
- `listenerFaultExpectations(database, respAttachment)` — builds closed fault targets from discovery.
- `assertOwnedListenerFaultExpectation(expectation, respAttachment)` — refuses targets outside the two owned pairs.

### Domain Vocabulary

- `RespHealthAttachment` — typed resource name, binding, real health key, and attachment statement.
- `ListenerFaultExpectation` — synthetic check paired with its real backing check.

### Ports

- Generated `register-infrastructure.mts` text — the sole discovery input; no new abstraction.

### Constants

- Existing `TEST_ONLY_GARNET_HEALTH_KEY` and `TEST_ONLY_POSTGRES_HEALTH_KEY` remain unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED proves default generated Redis output breaks the hardcoded fixture. | Focused structured test wrapper; exactly one failure. | `prepare-readiness-fixture_test.ts` only |
| 2 | GREEN discovers and threads the RESP triple, preserves fail-closed behavior, and records evidence. | Four required structured wrappers. | Ceiling-listed E2E source/tests and this run dir |

### Deferred Scope

- Full runtime E2E and hosted-tier proof — no coordinator-granted host lease; CI owns execution.
- `runtime.wait.garnet` — explicitly separate concern.

### Contributor Path

Start in `prepare-readiness-fixture.ts`. `healthAttachments()` returns **every** attachment for a
health key; `injectAtHealthAttachments()` splices the test-only block in after each one, iterating in
**descending offset order** so earlier offsets stay valid. No listener file and no backend literal is
touched — `GARNET_REAL_HEALTH_KEY = 'garnet_resp'` is correct and stays.

## Plan Gate

`PLAN-EVAL: N/A` — #1870 supplies a proven diagnosis and fully locked mechanical implementation
contract, exact file ceiling, required RED/GREEN commits, failure cases, and validation commands.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | bootstrap | activated | Read named skills, harness workflow, diagnosis, templates, and focused code. |

## Gate Results

Measured by the supervisor in an isolated detached worktree at exact `ce7dd440c` (independent of the
implementation session), using the structured wrappers.

| Gate | Wrapper | Result | Detail |
| --- | --- | --- | --- |
| Focused readiness suite | `run-deno-test.ts` on `prepare-readiness-fixture_test.ts` | **PASS** exit 0 | 5 passed / 0 failed |
| E2E gates suite | `run-deno-test.ts` on `packages/cli/e2e/tests/application/gates` | **PASS** exit 0 | 108 passed / 0 failed |
| E2E workspace check | `run-deno-check.ts --root packages/cli/e2e --ext ts` | **PASS** exit 0 | 187 files, 2 batches, 0 diagnostics |
| E2E workspace format | `run-deno-fmt.ts --root packages/cli/e2e --ext ts` | **PASS** exit 0 | 187 selected/processed, 0 findings, 0 refusals |
| Focused lint | `run-deno-lint.ts --root .../scaffold/runtime --ext ts` | **PASS** exit 0 | 13 files, 0 findings, 0 refusals |
| E2E workspace lint | `run-deno-lint.ts --root packages/cli/e2e --ext ts` | **REFUSAL** exit 2 | `Package 'zod' not found in catalog` from the detached `desktop-native` fixture. **Pre-existing**: the identical refusal reproduces on clean `main` `d2b33a09b`. Recorded as REFUSAL, not PASS. |
| Lock hygiene | `git diff origin/main...HEAD -- deno.lock` | **PASS** | empty; lock untouched |

### RED-before, verified by re-execution rather than by claim

| Head | Result |
| --- | --- |
| RED `e7e4e4dc5` (test-only, 1 file, +26 lines) | exit **1**, 4 passed / 1 failed, failing with the exact production error `generated register-infrastructure helper has no garnet health-check marker` |
| GREEN `ce7dd440c` | exit **0**, 5 passed / 0 failed |

The RED reproduces the **CI** condition, not a synthetic one: it builds the fixture input from
`generateRegisterInfrastructure` with the real two-cache config (`redis` Container + `garnet`
`Mode: 'Auto'`).

## Anomaly Evidence — RESOLVED, no scaffold capture needed

The question was why `runtime.readiness-fixture` passed in run `33425281612` (head `bd239f916`) and
fails now.

**Answer, proven by generation rather than by capture.** The E2E project carries two caches: `redis`
from `netscript init`, and `garnet` appended during plugin install by
`PluginWorkspaceMutator.ensureSharedCache(root, 'garnet')` as `{ Engine: 'Garnet', Mode: 'Auto' }`.
Because that cache is `Mode: 'Auto'`, the generator emits the RESP health attachment **twice** — once
per arm of `if (shouldUseContainerCache()) { … } else { … }`. Before #1837 the fixture tested
`source.includes(<whole marker line>)`, which is duplicate-tolerant and accepted that. #1837 replaced
it with `uniqueHealthAttachment`, which returns `undefined` unless there is exactly **one**
attachment. `bd239f916`'s base predates #1837; the first hosted runtime run after `1f50c98ce` fails.

The thrown message ("no … marker") misreports the real condition ("not exactly one"), which is why
two earlier readings of this defect were wrong. The message is corrected in this change.

## Placement, verified independently

Injecting into real two-cache generator output places exactly one test-only registration in **each**
arm — container arm at lines 86-87, executable arm at 104-105 — rather than two in the first arm and
none in the second. An earlier `String.replace`-based iteration did the latter, because both arms
emit a byte-identical statement and `String.replace` with a string needle replaces only the first
match. That defect would have passed CI (Docker present ⇒ container arm runs) while leaving D-101
inert on the Docker-less path. The regression test asserts **placement**, not a total count, so the
count-2 outcome of the buggy version fails it.

## Handoff Notes

- Runtime proof is owed by hosted CI; no host lease was held or requested by this slice.
- `runtime.wait.garnet` is a separate concern and was deliberately not touched. It targets a real
  resource: the `garnet` cache genuinely exists via `ensureSharedCache`.
- Evaluator: the load-bearing question is whether the injection lands in **both** `Auto` arms with the
  correct per-arm resource binding, and whether the placement test would actually fail the
  single-arm bug. A count-only assertion would not.
