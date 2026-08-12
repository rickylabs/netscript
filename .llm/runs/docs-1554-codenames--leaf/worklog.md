# Worklog: published JSDoc internal-codename cleanup

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-1554-codenames--leaf` |
| Branch | `docs/1554-jsdoc-internal-codenames` |
| Archetype | `3 - Runtime / Behavior` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing exports only: published symbol descriptions in `plugin-triggers-core` and
  `plugin-sagas-core` remain attached to identical declarations and signatures.
- Existing reference symbol tables follow the corrected `deno doc` summaries.
- The regression surface is a repository test, not a shipped API.

### Domain Vocabulary

- `TriggerRuntimeKind` / `RuntimeTriggerDefinition` — the three trigger kinds/definitions accepted
  by the current processor.
- `TriggerKnownKind` / `TriggerDefinition` / `TriggerPayload` — implemented plus reserved public
  trigger variants.
- `SagaDurabilityTier` / `TriggerDurabilityTier` — the real lowercase public values
  `'t1' | 't2' | 't3'`.
- Saga outbox/history/agent ports — reserved extension contracts described by mechanism, not
  planning tier.

### Ports

- No ports are added or changed. Existing processor/store/outbox/history/agent port prose is made
  consumer-facing.

### Constants

- No runtime constants change. The test owns only its forbidden JSDoc regexes, publish roots, and
  exclusions for non-published test/fixture source plus JSDoc code contexts.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Bootstrap the harness run and open the draft PR | Run artifact completeness | Run dir only |
| 2 | Correct all published JSDoc and add the negative policy test | Focused test, census, scoped package gates | Two package trees, one fitness test, run artifacts |
| 3 | Align reference pages and record full gate evidence | `deno doc --json`, docs gates, repo tests | Two reference pages, run artifacts |

### Deferred Scope

- Executable Zod/template strings — prohibited by the comments-only boundary.
- A semantic classifier for arbitrary planning phrases outside the enumerated
  group/phase/wave/epic, tier/wave shorthand, and issue-number forms — that would inflate into its
  own tool; the issue-defined class is locked here.
- MCP agent-docs regeneration — issue #1531 owns it.

### Contributor Path

Write public descriptions beside exported declarations, verify them through every package
entrypoint with `deno doc`, then keep hand-maintained reference summaries byte-for-byte aligned.
The policy test walks published-source JSDoc and reports exact file/line findings.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-12 | 1 | Bootstrap | Created `supervisor.md` first; read live #1554, doctrine, harness, tooling, PR, RTK, and JSR guidance. |
| 2026-08-12 | 1 | Census | Found 26 JSDoc tokens in 14 files across two packages; classified two executable-string exclusions. |
| 2026-08-12 | 2 | Source truth | Replaced all 26 JSDoc tokens with mechanism/public-value descriptions; post-edit JSDoc census is zero. |
| 2026-08-12 | 2 | Regression | Added a focused JSDoc-block test; 2 tests passed, including the generic-identifier exclusion fixture. |
| 2026-08-12 | 2 | Package gates | Both package wrapper trios passed. Full-export doc-lint commands exited 0 while reporting existing private-type-ref diagnostics (trigger 2, saga 9), all in untouched contract/telemetry/store files. |
| 2026-08-12 | 2 | Reconcile | Pushed `05108d655`, posted the slice evidence to draft PR #1587, and rechecked live issue/PR state. |
| 2026-08-12 | 3 | Reference truth | Six trigger reference summaries match root `deno doc --json` byte-for-byte; saga root JSON has zero internal terms and its page needs no edit. CLI's page likewise contains no stale term. |
| 2026-08-12 | 3 | Full gates | Quality, snippets, links, accuracy, and repository tests all exited 0. Snippets scanned 578 blocks and did not inspect/fail on `_site`. |
| 2026-08-12 | 4 | FALLBACK IMPL-EVAL | Received `FAIL_FIX` at `944dbbe07`: the earlier `Group X`/`Tn` census did not prove the full issue-defined class. Tier wording judgement was upheld and left unchanged. |
| 2026-08-12 | 4 | Guard red proof | Widened the predicate before source fixes. The focused guard exited 1 with 52 findings: 48 issue-number references, three phase names, and one wave name across 24 files in seven publish roots. |
| 2026-08-12 | 4 | Source truth | Replaced all 52 findings by mechanism, restored `reserved` on the four saga agent-axis descriptions, and aligned the stale `SagaStorePort` reference row to `deno doc`. |
| 2026-08-12 | 4 | Guard green proof | Focused guard exited 0 with 2 passed / 0 failed after formatting; code-context fixtures cover `@template T1`, inline generics/links, and fenced examples. |
| 2026-08-12 | 4 | Full revalidation | Seven scoped check/lint/fmt wrapper trios, seven doc-lint roots, quality, all docs gates, and 3,255 repository tests exited 0. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| PLAN-EVAL: N/A | Small bounded prose/test slice with owner-locked plan and gates; no material design decision remains. | `run-loop.md` §4; live #1554; owner brief |
| Comments are parsed, not raw-replaced | Preserves generic identifiers and executable literals. | Owner caution and D2 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Census expands dispatch's examples to 26 JSDoc tokens | minor | yes |
| Two executable-string matches cannot change under comments-only authority | significant | yes |
| Fallback evaluation expands the measured class by 52 JSDoc tokens | blocking, fixed | yes |
| The source correction exposed one stale saga reference-table row | minor, fixed | yes |

## Gate Results

### Slice 2 evidence

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Focused negative test | PASS | 2 passed / 0 failed |
| Post-edit original-pattern census | PASS | 0 findings for `Group [A-Z]` / `Tn` (26/26 fixed) |
| Executable-diff boundary | PASS | `git diff --unified=0 -- packages plugins` contains comment lines only across all seven touched publish roots |
| Trigger check/lint/fmt wrappers | PASS | 80 files selected; 0 failed batches/findings |
| Saga check/lint/fmt wrappers | PASS | 111 files selected; 0 failed batches/findings |
| Trigger full-export doc-lint | PASS with baseline diagnostics | Exit 0; 0 missing JSDoc; 2 private-type-ref in untouched `triggers.contract.ts` |
| Saga full-export doc-lint | PASS with baseline diagnostics | Exit 0; 0 missing JSDoc; 9 private-type-ref in untouched telemetry/contract/store files |

### Final issue-defined census

| Measure | Count | Notes |
| ------- | ----- | ----- |
| Original narrow-pattern tokens found/fixed | 26 | 9 `Group X`, 17 `Tn`; 14 files; 2 packages |
| Fallback class-expansion tokens found/fixed | 52 | 48 issue refs, 3 phase names, 1 wave name; 24 files; 7 roots |
| Total published-JSDoc tokens found/fixed | 78 | Enumerated workstream-name, tier/wave shorthand, and issue-number class |
| Published-JSDoc tokens remaining | 0 | Proved by the widened focused scanner after formatting and in the repository suite |
| Raw executable-string exclusions | 3 | Saga Zod description (`T1`); CLI generated CONTRIBUTING template (`Group B`); CLI agent-docs error text (`#1068`) |
| Real generic-type-parameter matches | 0 | No publish-source generic matched; fixtures prove `@template T1`, inline `Pair<T1, T2>`, links, and fenced examples are excluded. |
| Non-JSDoc source-comment exclusions | 14 | Raw sweep finds ordinary `//` planning references; they do not render through `deno doc` and are outside the published-JSDoc acceptance surface. |

The widened pattern class is: title-cased `Group`/`Phase`/`Wave`/`Epic` planning labels,
exact `Tn` and `Wn` shorthand, and `#n`/`netscript#n` issue references. The scanner walks
non-generated `.ts`/`.tsx` JSDoc in package/plugin `src`, excluding publish-config-equivalent
test, E2E, and fixture paths. It ignores JSDoc tag lines, `@example` bodies/fences, inline code,
and inline JSDoc links so generic identifiers are not treated as planning prose.

### Fallback guard proof

Before the 52 source fixes, the widened guard returned exit 1 and named all findings. The decisive
tail was:

```text
packages/cli/src/kernel/application/registries/preset-registry.ts:11 Wave 6
packages/plugin-sagas-core/src/ports/saga-bus-port.ts:19 Phase 7d
packages/plugin-sagas-core/src/ports/saga-bus-port.ts:26 Phase 7d
packages/fresh/src/application/form/runtime/intent.ts:81 Phase A
... plus 48 #n/netscript#n JSDoc references across CLI, config, service,
    plugin-triggers-core, fresh, and plugins/streams
FAILED | 1 passed | 1 failed
error: Test failed
```

After the fixes and formatting, the same command returned exit 0:

```text
running 2 tests from ./.llm/tools/fitness/check-public-jsdoc-codenames_test.ts
published JSDoc excludes internal workstream codenames ... ok
published JSDoc codename scan flags prose and ignores JSDoc code contexts ... ok

ok | 2 passed | 0 failed
```

### Final gate table

| Gate | Result | Output / notes |
| ---- | ------ | -------------- |
| Trigger `doc:lint` | PASS (exit 0) | 12 entrypoints; 0 missing JSDoc; 2 pre-existing private-type-ref diagnostics in untouched contract source |
| Saga `doc:lint` | PASS (exit 0) | 19 entrypoints; 0 missing JSDoc; 9 pre-existing private-type-ref diagnostics in untouched sources |
| Trigger check/lint/fmt | PASS | 80 selected; 0 failed batches/findings for each wrapper |
| Saga check/lint/fmt | PASS | 111 selected; 0 failed batches/findings for each wrapper |
| Page matches source | PASS | 6/6 changed trigger rows exactly equal `deno doc --json`; saga root internal summaries 0 |
| `quality:gate` | PASS (exit 0) | Quality scan 0 findings; doctrine gate has warnings only, including pre-existing package size/cardinality items |
| `docs:snippets` | PASS | scanned=578, ts_like=295, checked=21, exempt=14, malformed=0; no `_site` regression |
| `docs:links` | PASS | docs=102, broken-links=0, broken-anchors=0, orphans=0 |
| `docs:accuracy` | PASS | 4 saga pages and 196 published-source pages checked |
| `deno task test` | PASS (exit 0) | Repository test run includes the new two-case JSDoc policy suite |
| Diff/lock hygiene | PASS | `git diff --check` clean; `deno.lock` unchanged; package diff is comments only |

### Fallback revalidation

| Gate | Result | Output / notes |
| ---- | ------ | -------------- |
| Widened JSDoc guard | PASS after proved red | Red: 1 passed / 1 failed with 52 findings; green: 2 passed / 0 failed |
| Seven check wrappers | PASS | CLI 861, config 34, Fresh 188, saga 111, trigger 80, service 45, streams 54 files; 0 failed batches/findings |
| Seven lint wrappers | PASS | Same roots; 0 failed batches/findings |
| Seven fmt wrappers | PASS | Same roots; 0 failed batches/findings |
| Seven doc-lint roots | PASS (exit 0) | CLI/config/service clean; existing Fresh 44, saga 9, trigger 2, streams 2 diagnostics remain in untouched declarations |
| `deno doc --json` / saga reference | PASS | Store, signal, and query descriptions match source; stale `SagaStorePort` table row corrected |
| `quality:gate` | PASS | Code-quality scan 0 findings; doctrine warnings only |
| `docs:snippets` | PASS | scanned=578, checked=21, malformed=0; no `_site` regression |
| `docs:links` | PASS | docs=102, broken links/anchors/orphans=0 |
| `docs:accuracy` | PASS | 4 saga pages and 196 published-source pages checked |
| `deno task test` | PASS | 3,255 passed (622 steps), 0 failed, 17 ignored in 5m23s |
| Diff/lock hygiene | PASS | Package/plugin diff contains comment lines only; `git diff --check` clean; `deno.lock` unchanged |

## Handoff Notes

- Evaluator should inspect the fallback red/green guard proof, expanded 78-token census,
  executable-diff proof, and `deno doc`/reference comparison first.
- No occurrence was left because its meaning was uncertain; every JSDoc replacement traces to the
  declaration/runtime mechanism. Only the three explicitly out-of-authority executable strings remain.
