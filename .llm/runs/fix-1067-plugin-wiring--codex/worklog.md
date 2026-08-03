# Worklog: plugin wiring, producer failure, and doctor truth

## Run Metadata

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| Run ID         | `fix-1067-plugin-wiring--codex`               |
| Branch         | `fix/1067-plugin-wiring`                      |
| Archetype      | 6 CLI/Tooling + 5 Plugin + 3 Runtime/Behavior |
| Scope overlays | service                                       |

## Design

### Public Surface

- `netscript plugin install` — converges every installed resource’s references.
- `netscript service generate` / `netscript generate aspire` — reconciles before helper emission.
- `DurableStreamProducer` / `createDurableStream` — same type surface, stricter missing-discovery
  failure semantics.
- `netscript plugin doctor` — reports config and live AppHost resource truth.

### Domain Vocabulary

- `DeclaredPluginReferenceMap` — desired outgoing edges keyed by installed plugin/resource identity.
- `InstalledPluginResourceSet` — keys present across appsettings plugin/background sections.
- `AppHostInspection` — discriminated `not-running` or `running` snapshot with named resource
  states.
- `AppHostResourceState` — resource name plus health/state sufficient for doctor classification.

### Ports

- Existing filesystem/process ports remain the IO seams.
- A narrow doctor AppHost inspector dependency isolates Aspire process/JSON behavior from the use
  case.

### Constants

- Existing canonical manifest names and appsettings keys remain authoritative; no hardcoded
  host-side plugin-name table.
- Stable doctor check ids for AppHost absent, resource missing, and resource unhealthy outcomes.

### Commit Slices

| # | Slice                                                                                                          | Gate                                                                         | Files                                                                                                                        |
| - | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1 | Prove order-independent declared-edge reconciliation and fail-fast stream discovery                            | permutation/main-red proof; plugin-streams focused tests; `scaffold.plugins` | CLI reconcile/install/generate tests and adapter(s), `packages/plugin-streams-core`, sagas/triggers manifests, run artifacts |
| 2 | Prove doctor can fail on config, plugin contribution, absent AppHost, missing resource, and unhealthy resource | focused doctor tests plus scoped gates                                       | doctor use case/adapter/composition tests; allowed plugin doctor specs only if evidence demands; run artifacts               |
| 3 | Prove residual clean-public schema, published saga registry runtime, and all-four no-samples acceptance        | focused consumer/E2E tests and touched-unit gates                            | CLI E2E/integration tests and fixtures only; no saga engine/store/runtime edits; run artifacts                               |

### Deferred Scope

- Network connection timeout/retry redesign — 0.0.5 candidate.
- Saga engine/store fixes #1064/#1065/#1066 — concurrent owner.
- Broad doctor telemetry protocol — this slice uses the narrow live resource snapshot needed now.

### Contributor Path

Declare plugin edges in `scaffold.plugin.json`; the generic reconcile reads declarations and the
installed appsettings inventory. Add doctor runtime checks through the AppHost inspection contract,
then prove a negative state in the colocated doctor test. Add consumer acceptance at the existing
CLI E2E/dependency fixture rather than importing workspace source directly.

## Progress Log

| Time       | Slice     | Step               | Notes                                                                                                                                                                                                           |
| ---------- | --------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-03 | plan      | bootstrap/research | Skills loaded in required order; baseline hashes verified; producer warn/drop path read and reported before source change.                                                                                      |
| 2026-08-03 | plan-eval | evaluator canary   | `agentic:provider-canary` returned `blocked`, `credential: absent`, and `auth_required` for the canonical Qwen route; no evaluator launched.                                                                    |
| 2026-08-03 | plan-eval | supervisor verdict | Owner-authorized opposite-family supervisor independently reproduced the canary block, waived formal PLAN-EVAL, approved the plan with D3 corrected to consume manifest `dependencies`, and authorized Slice 1. |
| 2026-08-03 | slice 1   | contract/implementation | Added a full installed-entry reconcile at install and Aspire-helper regeneration boundaries. Dependency names resolve through persisted target manifests to their actual `serviceConfigKey`; explicit install references are persisted as declarations; dangling edges remain absent. No official manifest was duplicated or changed. |
| 2026-08-03 | slice 1   | producer semantics | Replaced asynchronous warn/queue/drop behavior for absent stream discovery with a synchronous constructor error naming the missing `streams` reference and the install/regenerate repair. The former drop-writes test now requires rejection. Network timeout/retry remains deferred to 0.0.5. |
| 2026-08-03 | slice 1   | main-red proof | Stashed all implementation changes, restored only the new real-plugin permutation test onto `origin/main`/`c1dee1697`, and ran the complete test file. It failed at the permutation equality step: expected included `"streams"`, actual contained only `"workers-api"`; summary `FAILED | 0 passed (21 steps) | 1 failed (1 step)`. Restored the full stash afterward. |
| 2026-08-03 | slice 1   | review/commit | Supervisor accepted the implementation with two fixes: removed stale `assertResolvable` documentation and declared the exported member removal as an intentional 0.0.4 breaking change. Committed and pushed `3e9abf10c`. |
| 2026-08-03 | slice 2   | live AppHost truth | Added an injected AppHost inspection port and Aspire CLI adapter. It checks `aspire ps` before `describe`, reports an absent AppHost distinctly, and compares configured services/apps/databases to named running resources with unhealthy state preserved. Existing workers plugin negative test explicitly proves a contributed check returns `ok: false`. |
| 2026-08-03 | slice 2   | commit | Committed and pushed live AppHost truth as `7168abd11`. A later scaffold E2E compatibility pass refined not-running to a distinct warning while keeping running-but-unhealthy an error, so static doctor checks remain usable before AppHost startup. |
| 2026-08-03 | slice 3   | #1014 evidence | `installs a published Prisma fragment from JSR metadata into the root schema tree` performs a clean public install and asserts the fetched plugin fragment exists under the root schema tree. It passed in the 21-test residual acceptance run; no further implementation change was needed. |
| 2026-08-03 | slice 3   | #1015 evidence | Existing Aspire/service tests prove absolute project-owned registry URLs. Added `published dependency starts a saga runtime with a project-owned non-empty registry`, which imports `jsr:@netscript/plugin-sagas@0.0.3/runtime`, starts it against the consumer project's generated registry, and asserts `definitionCount === 1`. No saga source/runtime/store file was changed. |
| 2026-08-03 | slice 3   | #1017 evidence | Added per-plugin assertions that worker, saga, trigger, and stream install commands each receive `--no-samples` and never `--samples`. The true-userland E2E artifact independently showed all four real commands with `--no-samples` and reduced created-file counts. Its final source-leak assertion found pre-existing local-path doctor URLs in persisted manifests; this is unrelated to sample threading and was not expanded into a redesign. |

## Decisions

| Decision                                                 | Reason                                                                                                                 | Source                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| One run with three commits, not supervisor sub-PR groups | Owner mandates one branch, push per slice, and no PR edits.                                                            | owner brief + harness supervisor definition |
| Reconcile all entries at install/generate boundaries     | Implements the supplied equation by construction.                                                                      | owner contract / plan D1–D2                 |
| Resolve dependencies through target manifests            | One declaration of truth covers workers/sagas/triggers and preserves the target's real `serviceConfigKey` (`streams`). | supervisor correction / plan D3             |

## Gate Results

Formal PLAN-EVAL is unavailable due to the evidenced credential block and is explicitly waived by
the owner-authorized supervisor.

### Slice 1

| Gate | Trusted artifact/output |
| ---- | ----------------------- |
| Main-red acceptance proof | Full `install-plugin_test.ts` on main with only the new test restored: `FAILED | 0 passed (21 steps) | 1 failed (1 step)`; diff showed missing `streams` in the earlier-install producer entry. |
| Focused reconciliation/install | `3 passed (22 steps) | 0 failed`; includes both real install permutations, dangling-edge activation, all three producers, and renamed installed instance mapping. |
| `packages/cli` check/test | Package `deno task check` passed. Full package `deno task test` exited 0 after running the suite; focused acceptance output above is the semantic artifact. |
| `plugin-streams-core` check/test | Package check passed; package tests `9 passed | 0 failed`, including synchronous missing-reference rejection and no drop-writes expectation. |
| Scoped check/lint/fmt | CLI full wrappers: check `763` files/`0` failed batches/`0` occurrences; lint `763`/`0`; fmt `763`/`0`. Streams-core: check `22`/`0`; lint `22`/`0`; fmt `22`/`0`. Final focused CLI rerun: check `8`/`0`, lint `8`/`0`, fmt `13`/`0`. |
| `deno task quality:scan` | `ok: true`, `findings: []` (existing allow count `7`). |
| `deno task arch:check` | Exit 0; every doctrine root reported `FAIL=0` (pre-existing warnings only). |
| Public doc lint | CLI: `0` errors. Streams-core: only `5` pre-existing private-type-ref findings in unchanged telemetry files; `missingJSDoc=0`. |
| Required CLI E2E | `scaffold.plugins` suite artifact `.llm/tmp/cli-e2e/plugin-smoke-20260803-090030.log`: `ok: true`, `passed=16`, `failed=0`, `skipped=0`. Generated appsettings contains `streams` for workers/sagas/triggers service and background entries, plus their declared/self references. |

### Slice 2

| Gate | Trusted artifact/output |
| ---- | ----------------------- |
| Focused doctor behavior | `15 passed | 0 failed`: absent AppHost, named missing resources, running-but-unhealthy resource, adapter `ps`/`describe` sequencing, and real workers-contributed `ok: false`. |
| `packages/cli` check/test | Check passed; full package suite `549 passed (474 steps) | 0 failed`. |
| Scoped check/lint/fmt | Six touched CLI files; check `0` failed batches/occurrences, lint `0` occurrences, fmt `0` findings. |
| `deno task quality:scan` | `ok: true`, `findings: []`; seven existing allowances only. |
| `deno task arch:check` | Exit 0; every doctrine root `FAIL=0` with pre-existing warnings only. |

### Slice 3

| Gate | Trusted artifact/output |
| ---- | ----------------------- |
| Residual acceptance set | `21 passed (22 steps) | 0 failed`: clean published schema fragment, generated saga registry, absolute Aspire/service registry URLs, and suite shape. |
| Published dependency runtime | Published `@netscript/plugin-sagas@0.0.3/runtime` process exited 0 with a project-owned generated registry and `definitionCount: 1`; full integration file passed `9/9`. |
| All-four negative flag | Focused suite registry test passed and individually asserts worker/saga/trigger/stream commands contain `--no-samples` and exclude `--samples`. True-userland E2E executed all four successfully; its later unrelated content-leak assertion failed on local-path doctor metadata (`plugin-smoke-20260803-092131.log`). |
| `packages/cli` check/test | Check passed; full package suite `550 passed (474 steps) | 0 failed`. |
| Required CLI E2E | `scaffold.plugins`: `passed=16`, `failed=0`, `skipped=0` after the no-AppHost warning compatibility refinement. |
| Scoped check/lint/fmt | Four touched CLI files; check/lint/fmt all reported zero failures/occurrences/findings. |
| `deno task quality:scan` | `ok: true`, `findings: []`; seven existing allowances only. |
| `deno task arch:check` | Exit 0; every doctrine root `FAIL=0` with pre-existing warnings only. |

## Handoff Notes

- Slice 1 is ready for the owner-authorized supervisor's substantive implementation review before
  commit/push. Review focus: installed identity mapping, persisted explicit references, the
  main-red proof method, and fail-fast producer semantics.
