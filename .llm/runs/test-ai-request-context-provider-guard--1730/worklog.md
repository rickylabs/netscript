# Worklog: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Design

### Public Surface

- No public surface changes. Existing `RequestContext`, `ChatClientRequest`, `createAgentLoop`, and
  `withRetryingChatClient` contracts are exercised as published.

### Domain Vocabulary

- `RequestContext` — existing opaque application-state bag that must stay provider-invisible.
- `ChatClientRequest` — existing owned five-field turn request; four fields are provider-bound.
- `provider-bound payload` — test-only JSON projection of `messages`, `system`, `tools`, `options`.
- `attempt` — one inner provider stream call; a retry creates another attempt for the same turn.
- `continuation` — the loop turn after a tool result is appended to history.

### Ports

- `ChatModelProviderPort` — injected loop seam; the test supplies a local recording provider.
- `ChatClientPort` — inner seam wrapped by `withRetryingChatClient` so every attempt is observable.
- No new product port or shared test-support port.

### Constants

- `MODEL` — existing deterministic provider/model identifier.
- `SENTINEL` — replace with a high-entropy `ns1730` value used nowhere outside `CONTEXT`.
- `CONTEXT` — existing sentinel-bearing application bag.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S1 | Lock research, plan, product ceiling, and base gate classification; open draft PR. | Baseline census + diff/PR review | Run directory |
| S2 | Add retry/continuation loop guard and demonstrate mutation B red then restored green. | Focused structured test wrapper | Test file + run artifacts |
| S3 | Rename/document Anthropic adapter-wire coverage. | Focused structured test wrapper | Test file + run artifacts |
| S4 | Land evidence-only artifact state, then create/audit exact-head receipts. | Receipt and Git hygiene audit | Run artifacts; ignored receipts |

### Deferred Scope

- Product behavior, public surface, adapter internals, existing doc-lint/JSR debt, docs, and release
  coordination are intentionally excluded.

### Contributor Path

Future provider-invisibility fields are added to `ChatClientRequest`; a contributor updates the
loop request projection in `request_context_test.ts` and proves its negative assertion red with a
temporary serialization mutation before merging.

## PLAN-EVAL

`PLAN-EVAL: N/A` — #1730 is a small mechanical regression-net leaf whose issue supplies the exact
mutation, field boundary, acceptance criteria, product ceiling, and gate constraints. All choices
that could force rework (field list, retry fixture, Anthropic treatment) are locked in `plan.md`.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30T12:49Z | S1 | bootstrap | Confirmed clean non-shallow branch at `origin/main` `f8b4f804`; fetched issue #1730. |
| 2026-08-30T12:50Z | S1 | doctrine | Selected authoritative Archetype 4 / Keep verdict; locked test-only product ceiling. |
| 2026-08-30T12:54Z | S1 | baseline gates | Ran every candidate at base; doc-lint alone is pre-existing red and is contracted as a delta. |
| 2026-08-30T12:55Z | S1 | plan | Recorded design, locked decisions, four slices, risks, and exact provider-bound fields. |
| 2026-08-30T12:59Z | S1 | reconcile | Live `main` advanced to `952cc106`; verified no owned-surface overlap, rebased, and reran every base candidate in a detached clean worktree. |
| 2026-08-30T13:45Z | S2 | implementation | Added an inner recording client under `withRetryingChatClient`; attempt 1 fails before output, attempt 2 emits the tool call, and attempt 3 is the post-tool continuation. |
| 2026-08-30T13:46Z | S2 | mutation proof | Mutation B made the named guard fail 0/1; restored `loop.ts` byte-for-byte and reran the focused suite green 9/9. |
| 2026-08-30T13:47Z | S2 | hygiene | Focused format PASS (1 file), test file 492 LOC, `deno.lock` working/tree blob both `a1522e6e`, and raw status showed no generated carrier movement. |
| 2026-08-30T13:58Z | S3 | coverage boundary | Chose the locked rename/document path: the Anthropic test now states that it covers direct adapter serialization, while its comment delegates bridge/`modelOptions` leakage to the TanStack seam. This is truthful because the adapter drops unsupported model options and therefore cannot detect mutation A. |
| 2026-08-30T13:58Z | S3 | proving gate | Focused structured test wrapper PASS, 9/9, `durationMs=1211`; focused format PASS; test file remains below F-10 at 495 LOC. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Exhaustive loop projection is `messages/system/tools/options`. | Those are all request fields except `context`. | `ChatClientRequest` docs/source |
| Record retry attempts below `withRetryingChatClient`. | Recording only provider creation or loop turns misses retries. | Provider retry implementation |
| Rename/document Anthropic test. | Adapter drops unknown model options; seam test owns mutation-A detection. | Issue #1730 + bridge/adapter code |
| No PLAN-EVAL. | Complete mechanical contract with no open decision. | Harness run-loop §4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | — | `drift.md` records no divergence |

## Gate Results

### Base candidate gates (before implementation)

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused tests | `run-deno-test.ts -- --allow-all packages/ai/tests/request_context_test.ts` | PASS | 9/9; exit 0; 1690 ms at `952cc106` |
| Full AI tests | `run-deno-test.ts -- --allow-all packages/ai/tests/` | PASS | 147/147; exit 0; 3615 ms at `952cc106` |
| Check | `run-deno-check.ts --root packages/ai --ext ts,tsx` | PASS | 100 selected; 0 diagnostics |
| Lint | `run-deno-lint.ts --root packages/ai --ext ts,tsx` | PASS | 100 selected; 0 findings |
| Format | `run-deno-fmt.ts --root packages/ai --ext ts,tsx` | PASS | 100 selected; 0 findings |
| Quality | `deno task quality:gate` | PASS | exit 0; existing repository warnings only |
| Doc lint | `deno task doc:lint --root packages/ai --pretty` | BASE RED | exit 1; 128 private refs; 0 missing JSDoc |
| JSR audit | `audit-jsr-package.ts --root packages/ai --text` | PASS | exit 0; 2 existing warnings |
| Publish | `deno publish --dry-run --allow-dirty` in `packages/ai` | PASS | exit 0; 3 existing dynamic-import warnings |

### Static Gates

| Gate | Result | Notes |
| --- | --- | --- |
| Final exact-head static gates | NOT_RUN | S4 |

### S3 Anthropic adapter-serialization boundary

| Gate | Result | Notes |
| --- | --- | --- |
| Focused tests | PASS | Structured wrapper: 9/9, exit 0, `durationMs=1211`. |
| Focused format | PASS | Structured wrapper selected/processed 1 file with 0 findings. |
| Test-shape review | PASS | 495 LOC; renamed test claims direct Anthropic adapter serialization only, and the adjacent comment explicitly assigns mutation-A bridge/`modelOptions` coverage to the TanStack seam test. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1–F-19 applicable no-regression set | NOT_RUN | S4 | Base classification above; no public surface planned. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Mutation B guard | PASS | Named mutation-red output below | Temporary loop mutation failed 0/1, then `git diff --exit-code -- packages/ai/src/agent/loop.ts` passed after restoration. |
| Retry + continuation | PASS | Focused wrapper 9/9, 214 ms after restoration | Three inner attempts recorded: initial failure, retry success, and post-tool continuation. Every request projects `messages/system/tools/options`, rejects the sentinel, and retains the identical `CONTEXT` reference. |

### S2 mutation-B red/green demonstration

Temporary mutation (never staged):

```ts
system: `${input.system ?? ''}${JSON.stringify(input.context)}`,
```

Exact expected-red invocation and wrapper output:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --filter 'agent loop: keeps context out of every provider-bound retry and continuation request' packages/ai/tests/request_context_test.ts
exit_code=1
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all","--filter","agent loop: keeps context out of every provider-bound retry and continuation request","packages/ai/tests/request_context_test.ts"],"cwd":"/home/agent/projects/netscript/worktrees/007-leaf-1730","exitCode":1,"durationMs":1208,"summary":{"passed":0,"failed":1,"ignored":0,"totalResults":1,"uniqueFailures":1},"failures":[{"message":"AssertionError: context leaked into a provider-bound loop request: {\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"system\":\"be brief{/\"documentIds/\":[/\"doc-ns1730-provider-invisibility-7f3b9d2e-context-must-not-leak/\"],/\"tenantId/\":/\"tenant-ns1730-provider-invisibility-7f3b9d2e-context-must-not-leak/\"}\",\"tools\":[{\"name\":\"echo\",\"description\":\"echo\",\"parameters\":{\"type\":\"object\"}}],\"options\":{\"reasoningEffort\":\"low\"}}\n    at assert (https://jsr.io/@std/assert/1.0.19/assert.ts:<line>:<column>)\n    at file://<cwd>/packages/ai/tests/request_context_test.ts:<line>:<column>","count":1,"tests":[{"name":"agent loop: keeps context out of every provider-bound retry and continuation request","file":"./packages/ai/tests/request_context_test.ts","line":352}]}]}
```

Restoration evidence:

```text
git diff --exit-code -- packages/ai/src/agent/loop.ts
exit_code=0

focused wrapper after restoration: exit 0; 9 passed, 0 failed; durationMs 214
```

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Public import consumers | N/A | No surface change | No builder/definition/export/subpath touched. |

## Reconcile Notes

- **S1:** Issue #1730 remains open with `type:test`, `area:ai-core`, `priority:p1`, one
  `status:research`, and milestone number 27. No new issue/PR comments existed at intake. The draft
  PR carries `Closes #1730`; no issue box is edited. Live `main` advanced once during PR creation;
  the branch was rebased and the base census repeated with unchanged classification.
- **S2:** PR #1763 still had only the S1 PLAN comment and issue #1730 had no comments; no evaluator
  or reviewer finding changed the locked slice. Per the owner instruction for partial work, the
  post-push PR update will replace the premature `Closes #1730` with `Refs #1730 — partial`, mark
  only the S2 slice complete, and leave every Definition-of-Done/acceptance box untouched.
- **S3:** The owner supplied independent Tier-A acceptance of S2 at intake. PR #1763 remains draft
  with `Refs #1730 — partial`; issue #1730 remains open and unchanged. No new PR or issue comment
  altered the locked S3 choice. The test was renamed/documented rather than extended because the
  Anthropic adapter intentionally drops unsupported model options, so the TanStack seam is the
  correct mutation-A detector.

## Handoff Notes

- S2 was independently accepted before this fresh thread began; its mutation demonstration was not
  repeated.
- Tier-A should inspect the S3 test name/comment boundary and the final S4 receipt field audit.
