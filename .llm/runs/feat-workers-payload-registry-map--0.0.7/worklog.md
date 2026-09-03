# Worklog: workers payload registry map remainder

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `feat-workers-payload-registry-map--0.0.7`                    |
| Branch         | `feat/workers-payload-registry-map`                           |
| Archetype      | 3 — Runtime/Behavior; 5 — Plugin; bounded Archetype-6 fixture |
| Scope overlays | service contract and generated application boundary           |

## Design

### Public Surface

- `JobPayloadSchema`, `JobHandlerDefinition`, `JobPayloadOf`, `JobPayloadMap` — package-owned
  Standard Schema carrier and registry algebra.
- `JobBuilder.payload(schema)` / `defineJobHandler(schema, handler)` — schema-backed declaration
  boundaries; both retain the accepted intentional source break.
- `JobTriggerInput<TPayloads>` / `WorkersContract<TPayloads>` / `createWorkersContract<TPayloads>()`
  — broad-default, literal-ID client binding over the unchanged v1 wire schema.
- Generated `jobHandlersById`, `jobDefinitionsById`, and `GeneratedJobPayloadMap` — precise
  application boundary before existing Map projections.

### Domain Vocabulary

- `JobHandlerDefinition` — callable job handler carrying its payload schema.
- `JobPayloadMap` — maps literal registry keys to the schema-inferred handler payload.
- `JobPayloadValidationError` — structured handler/enqueue boundary rejection.

### Ports

- No new port. Existing definition registry and dispatcher seams carry the schema.

### Constants

- No new constant group.

### Commit Slices

| # | Slice                                        | Gate                                                                                     | Files                                                     |
| - | -------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1 | Defect-specific RED                          | focused `deno test` / `deno check` must fail for missing validation and unused directive | focused tests + run artifacts                             |
| 2 | Core schema carrier and runtime boundaries   | workers-core focused check/tests                                                         | workers-core + first-party job declarations               |
| 3 | Literal generator and typed trigger contract | generator compile proof + plugin/CLI focused tests                                       | workers generator/plugin + CLI fixture                    |
| 4 | Gate and PR receipts                         | full brief gate set                                                                      | run artifacts only unless an in-scope regression is found |

### Deferred Scope

- #1451 operational metadata/handler-erasure redesign beyond this literal type carrier.
- Task/workflow payload parity and distinct Standard Schema input/output typing.

### Contributor Path

Define one schema next to a job, pass it to `defineJobHandler(schema, handler)` (or
`.payload(schema)` before `.handler(...)`), generate registries, and use the emitted
`GeneratedJobPayloadMap` with `createWorkersContract<...>()`.

## Progress Log

| Time       | Slice     | Step                   | Notes                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-03 | bootstrap | re-baseline            | Read brief, issue/comments, accepted plan, published `deno doc` surfaces, doctrine, and current generator/runtime seams.                                                                                                                                                                                                                      |
| 2026-09-03 | bootstrap | plan gate              | PLAN-EVAL N/A: owner locked this mechanical remainder and the parent plan has separate-session PASS_PLAN.                                                                                                                                                                                                                                     |
| 2026-09-03 | 1         | RED runtime            | `job-payload-contract_test.ts` compiled, ran, and failed only with `Expected function to reject`; malformed wire payload reached the application handler.                                                                                                                                                                                     |
| 2026-09-03 | 1         | RED trigger consumer   | `deno check --unstable-kv workers-contract-soundness_test.ts` failed only with TS2578 on the mismatched ID/payload directive. The call shape, imports, and other controls compile.                                                                                                                                                            |
| 2026-09-03 | 1         | RED generated consumer | Focused generator test emitted the current widened map; nested `deno check` failed only with TS2578 on the wrong-job payload directive. A self-contained type module excludes unrelated workspace/import failures.                                                                                                                            |
| 2026-09-03 | 2–3       | GREEN                  | `c194a4145` carries schema-backed handler/enqueue validation, the literal generated definition/payload maps, and the generic workers client contract. The RED runtime test now rejects before application code, and both consumer directives are consumed by the intended ID→payload mismatch.                                                |
| 2026-09-03 | 4         | bounded gates          | Scoped check/lint/fmt passed; workers-core/workers suites passed 108/108; generator and CLI integration suites passed 30/30; `quality:gate`, `publish:dry-run`, and `arch:check` exited 0.                                                                                                                                                    |
| 2026-09-03 | 4         | documentation lint     | New public symbols carry JSDoc and add no diagnostics. The bounded core command reports the accepted four pre-existing private-type references around the existing workers contract implementation; the workers package reports its pre-existing `workersPlugin`→`PluginManifest` private reference.                                          |
| 2026-09-03 | 4         | fenced CI blocker      | Extra `deno task check:mcp-export-corpus` fails because `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` is stale. The canonical fix is `deno task gen:mcp-export-corpus`, but `packages/mcp/**` is outside this brief's ceiling, so it was not run and no fenced file was touched.                       |
| 2026-09-03 | PR        | opened                 | Non-draft PR #1970 opened with the exact requested labels and milestone `0.0.7`; body uses `Refs #1455` and names the fenced generated-corpus remainder. Pushed receipt head before this final log update: `e18f2abe6`.                                                                                                                       |
| 2026-09-03 | repair    | supervisor steer       | Hosted audit found first-party source compatibility and JSDoc example regressions at `feb55c046`. The steer explicitly expands the implementation ceiling to the named `plugins/triggers/**` consumers and `plugins/sagas/tests/runtime/storefront-checkout-flow_test.ts`; no trigger-core contract or generated metadata change is included. |
| 2026-09-03 | repair    | GREEN implementation   | `4cf0795b8` migrates every named first-party consumer, fixes the standalone JSDoc example, and aligns workers doctor with the emitted literal definition registry. Explicit refspec push succeeded. |

### Repair RED — exact branch head `feb55c046fe396bb7d9283678ecceaaea7098606`

```text
$ deno task check
exit 1
{"selection":{"filesSelected":3094,"batches":26,"failedBatches":2},"summary":{"totalOccurrences":9,"uniqueOccurrences":9,"uniqueCodes":3,"uniquePaths":5}}
TS2554 Expected 2 arguments, but got 1. (4 occurrences: storefront flow, file-import, file-relay, staged-cleanup)
TS7006 Parameter implicitly has an 'any' type. (4 occurrences at the same one-argument handler calls)
TS2322 typed enqueue action is not assignable to TriggerActionResult because JobDefinition's handler payload is invariant (generic-webhook.ts:29:5)
```

```text
$ deno task docs:jsdoc-examples
exit 1
jsdoc examples: FAIL members=35 files=2058 examples=363 candidates=362 checked=362 exempt=0 non_ts=1 unfenced=0 malformed=0 failures=0
enforcedFailureCensus={"badSpecifier":0,"unfenced":0,"malformed":0}
deferredCensus={"unboundName":117,"typeError":14}
ratchet failure: deferred unboundName 117 > 116
```

The added deferred unbound-name count comes from `validateJobPayload`'s example referencing `schema`
and `input` without binding them. The unrelated deferred examples remain under the existing ratchet
and are not changed.

```text
$ deno task e2e:cli run scaffold.plugins --format pretty --report .llm/tmp/e2e-report-scaffold-plugins.json
exit 1
> generated.workers-registry: Compile workers registry through plugin CLI
  PASSED 148ms
> behavior.plugins-health: Check installed plugin health
  FAILED 1613ms
    Error: Plugin doctor failed: workers. Follow the remediation commands above.
workers error generated job registry is non-empty No generated jobs are registered.
workers error every declared job is registered Registry is incomplete for worker processors.
Summary: passed=15 failed=1 skipped=0
```

The generated registry itself contains the expected literal `jobDefinitionsById` entry. The doctor
still recognized only the legacy nested `jobDefinitionEntries = [[...]]` spelling, so the static
failure is branch-owned S2 parser drift rather than a failure caused by the downstream handler
migrations. The bounded repair teaches the doctor to recognize both legacy and literal registry
shapes and adds the current generator form to its focused test.

### Repair GREEN — working tree for the next repair commit

The trigger job handlers now pass their existing Zod schema into `defineJobHandler` and consume the
validated `ctx.payload`, preserving one runtime/type authority. The generic webhook is an id-only
cross-plugin reference with no schema authority; its explicit `HealthCheckPayload` generic falsely
claimed precision and made the action unassignable to the broad trigger result union, so that claim
was removed rather than duplicating the workers-owned schema.

```text
$ deno task check
exit 0
desktop fixture import map satisfies 15 reachable SDK modules; 0 unmapped specifiers.
{"selection":{"filesSelected":3094,"batches":26,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

```text
$ deno task docs:jsdoc-examples
exit 0
jsdoc examples: PASS members=35 files=2058 examples=363 candidates=362 checked=362 exempt=0 non_ts=1 unfenced=0 malformed=0 failures=0
enforcedFailureCensus={"badSpecifier":0,"unfenced":0,"malformed":0}
deferredCensus={"unboundName":116,"typeError":14}
```

```text
$ deno task e2e:cli run scaffold.service --format pretty --report .llm/tmp/e2e-report-scaffold-service.json
exit 0
Summary: passed=5 failed=0 skipped=0
$ deno task e2e:cli run scaffold.contracts --format pretty --report .llm/tmp/e2e-report-scaffold-contracts.json
exit 0
Summary: passed=5 failed=0 skipped=0
$ deno run --allow-all packages/cli/e2e/src/application/gates/scaffold/verify-clean-clone-readme.ts
exit 0
clean clone ran README command verbatim: deno task check
$ deno task e2e:cli run scaffold.plugins --format pretty --report .llm/tmp/e2e-report-scaffold-plugins.json
exit 0
> behavior.plugins-health: Check installed plugin health
  PASSED 1603ms
Summary: passed=17 failed=0 skipped=0
```

The four commands above are the exact `scaffold-static (deno-only)` CI step sequence; its composite
exit is 0. Reports remain ignored under `.llm/tmp/` and are not committed.

Focused receipts:

```text
$ deno test --allow-all --unstable-kv plugins/sagas/tests/runtime/storefront-checkout-flow_test.ts
exit 0
ok | 1 passed | 0 failed
$ deno test --allow-all --unstable-kv plugins/triggers/services/src/main_test.ts plugins/triggers/src/adapter/resources/resources.test.ts
exit 0
ok | 15 passed (9 steps) | 0 failed
$ deno test --allow-all --unstable-kv plugins/workers/tests/adapter/plugin-doctor_test.ts
exit 0
ok | 3 passed | 0 failed
```

Additional package-quality receipts:

```text
$ run-deno-lint.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --root plugins/sagas --ext ts,tsx
exit 0; filesSelected=381; failedBatches=0; totalOccurrences=0
$ run-deno-fmt.ts --root packages/plugin-workers-core --root plugins/workers --root plugins/triggers --root plugins/sagas --ext ts,tsx
exit 0; filesSelected=381; failedBatches=0; findings=0
$ deno task quality:gate
exit 0; quality scan findings=[]; architecture warnings match the repository baseline
```

## Decisions

| Decision                                 | Reason                                                                       | Source                        |
| ---------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------- |
| No v2 wire contract                      | Runtime Zod schema and route stay identical; only TypeScript opt-in narrows. | accepted plan §1/§3; brief S3 |
| Validate at enqueue and handler boundary | New brief explicitly requires both; same carried definition schema is used.  | implement brief S1            |
| Preserve generated runtime Map exports   | Avoid #1451/#1872 operational regression.                                    | accepted plan §4; brief S2    |

## Drift

| Drift                                                                                             | Severity    | Logged in drift.md |
| ------------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Brief strengthens prior plan's handler-only runtime validation to require enqueue validation too. | significant | yes                |

## Gate Results

### RED receipts

| Proof              | Result        | Defect-specific reason                                                                                      |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------------------- |
| handler boundary   | expected FAIL | Handler resolved; no carried schema existed to reject malformed payload.                                    |
| typed `triggerJob` | expected FAIL | TS2578 proves broad `JobTriggerInput` accepted the embed payload for `transcribe-image`.                    |
| generated registry | expected FAIL | TS2578 proves emitted `Map<string, JobHandler<any>>` accepted the embed payload for the transcribe handler. |

The directives are not compensating for arity, missing imports, malformed definitions, or unrelated
type errors: the positive call sites and surrounding fixtures compile, and each nested compiler
reported only the unused directive.

### GREEN and merge-readiness receipts

| Gate                                                                                        | Result                                                                           |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| GREEN implementation commit                                                                 | `c194a4145`                                                                      |
| `run-deno-check.ts --root packages/plugin-workers-core --root plugins/workers --ext ts,tsx` | PASS, 218 files, built-in `--unstable-kv`                                        |
| `run-deno-test.ts -- --allow-all packages/plugin-workers-core plugins/workers`              | PASS, 108/108                                                                    |
| runtime/golden + installed CLI registry-generator tests                                     | PASS, 30/30                                                                      |
| `run-deno-lint.ts` / `run-deno-fmt.ts`, both touched roots                                  | PASS, 218 files                                                                  |
| `deno task quality:gate`                                                                    | PASS                                                                             |
| `deno task publish:dry-run`                                                                 | PASS (`Success Dry run complete`)                                                |
| `deno task arch:check`                                                                      | PASS; warnings are the existing repository doctrine/dependency baseline          |
| `deno doc --lint` on touched package entrypoints                                            | Expected baseline diagnostics only; no new public-symbol JSDoc diagnostics       |
| `deno task check:mcp-export-corpus`                                                         | FAIL, introduced derived-corpus staleness at the fenced `packages/mcp/**` target |

## Handoff Notes

- Evaluator should inspect the RED failure receipts first, then schema identity at both runtime
  boundaries, then emitted literal type preservation before Map projection.
- PR: #1970 (`https://github.com/rickylabs/netscript/pull/1970`).
- Final implementation commit: `c194a4145`; the final branch head is the harness receipt commit that
  contains this line and is reported after its explicit-refspec push.
- Repair implementation commit: `4cf0795b8`; exact RED→GREEN and static-lane receipts are above.
- The final branch head is the log-only receipt commit containing this handoff; its exact SHA is
  reported in the PR repair comment and the implementation lane's final message.

## Repair 2 — trigger action variance and canonical saga sample

The supervisor pinned this repair to `c72f853bdf05a09d67759a6114611a7250160363`. The assigned
worktree contained a large unrelated supervisor-owned staged set, so the repair and its exact-head
gates ran in a clean local clone of that commit. The original index was not reset, unstaged, or
included.

### RED receipts

```text
$ deno task check:emitted-samples
exit 1
TS2322 at generated triggers/generic-inbound-webhook.ts:29:5
JobHandler<Readonly<{ verbose: boolean }>, unknown> is not assignable to
JobHandler<unknown, unknown> through TriggerActionResult.job.handler.
```

```text
$ deno test --allow-all .llm/tools/docs/official-saga-publisher-sample-sync_test.ts
exit 1; 0 passed / 1 failed
The only diff is the stale canonical two-line handler form: one-argument defineJobHandler plus
manual schema parsing versus the source generator's schema-first handler plus ctx.payload.
```

The new trigger-core compile-time control was also checked against the old `job:
JobDefinition<TJobId, TPayload>` carrier. It failed with exactly one `TS2322` at the concrete
schema-backed enqueue action assignment to `TriggerActionResult`; the diagnostic names the
contravariant `job.handler` payload parameter. This proves the control fails for this defect rather
than an arity, import, or unrelated mismatch.

### GREEN implementation and pre-commit receipts

- `EnqueueJobAction.job` now omits only `handler` from its public result shape. `enqueueJob` still
  accepts the full typed `JobDefinition` and returns the same object at runtime; job id, payload,
  payload schema, and dispatch metadata remain typed and runtime semantics are unchanged.
- The canonical saga sample is updated by
  `.llm/tools/docs/sync-official-saga-publisher-sample.ts`, factored from the existing derivation
  test. No generated Markdown or compressed/embedded carrier was hand-edited.
- `deno task check:emitted-samples`: exit 0, 48 emitted TypeScript samples checked.
- Focused trigger contract test: exit 0, 1 passed / 0 failed.
- Focused saga sample sync test: exit 0, 1 passed / 0 failed.
- Trigger-core structured check: exit 0, 81 files, 0 diagnostics.
- Trigger-core suite: exit 0, 42 passed / 0 failed.
- Trigger-core lint/fmt: exit 0, 81 files, 0 findings.
- `deno task gen:mcp-export-corpus --allow-dirty`: exit 0; canonical generator reports corpus
  `481c569e...2764`. It produced no file delta for this property-type-only change.
- `deno task check:mcp-export-corpus`: exit 0.
- `deno task check:agent-docs-prose` correctly reported the canonical saga page carriers stale;
  `gen:agent-docs-prose` and `gen:assets-barrel` then refreshed only their attributed outputs.

### Exact implementation commit receipts — `5843e8b32f2256962d3f5eb8350b897aa00333dd`

```text
$ deno task check:emitted-samples
exit 0
Checked 48 emitted TypeScript samples from 38 artifact paths.

$ deno test --allow-all packages/plugin-triggers-core/tests/contracts/triggers-contract-soundness_test.ts .llm/tools/docs/official-saga-publisher-sample-sync_test.ts
exit 0
ok | 2 passed | 0 failed

$ deno task check
exit 0
filesSelected=3109; batches=26; failedBatches=0; totalOccurrences=0

$ deno task gen:mcp-export-corpus
exit 0
sha256=481c569e29bbcd1fcbd3d6812fe3a4b595db51ce4500c9b0a718dda68caa2764;
packageCount=35; subpathCount=273; symbolCount=7864

$ deno task check:mcp-export-corpus
exit 0; same corpus hash and census

$ deno task check:agent-docs-prose
exit 0; fresh=true; stalePaths=[]

$ deno task check:assets-barrel
exit 0

$ deno task docs:snippets:test
exit 0
ok | 12 passed | 0 failed

$ deno task quality:gate
exit 0; quality findings=[]; doctrine FAIL=0 with existing warning baseline
```

Focused package receipts on the same commit:

```text
run-deno-check plugin-triggers-core: exit 0; 81 files; 0 diagnostics
run-deno-test plugin-triggers-core: exit 0; 42 passed; 0 failed
run-deno-lint plugin-triggers-core: exit 0; 81 files; 0 findings
run-deno-fmt plugin-triggers-core: exit 0; 81 files; 0 findings
```

`deno.lock` remains unchanged. No runtime lease was taken; hosted scaffold tiers remain responsible
for runtime execution after push, as directed.

## Repair 3 — generated workers health-check formatting and carrier freshness

The supervisor pinned this repair to exact branch head
`b4159bb6d3fda18bb85448fb14a8369074a82733`; the worktree and remote branch already matched that
commit with a clean index, so no merge, rebase, or destructive reset was performed.

The RED control writes the actual `workers/jobs/health-check.ts` install artifact to a temporary
directory and runs `deno fmt --check` on it. This exercises the canonical `jobStub` emission rather
than a copied expectation, so its failure is specific to the under-indented generated handler body
reported by `generated.deno-fmt-check`.

### RED receipt

```text
$ deno test --allow-all --unstable-kv plugins/workers/src/adapter/resources/resources.test.ts
exit 1; 6 passed / 1 failed
The repository-configured formatter's only diff is lines 18-21: the return statement, jobId,
payload, and closing call each need one additional indentation level. No quote-style or unrelated
diagnostic remains after supplying the root formatter configuration explicitly.
```

RED commit: `3d7e190a5e77751d366d75dd55fba6c44ed16ab8` (pushed by explicit refspec).

### GREEN focused receipt

The canonical `plugins/workers/src/adapter/resources/job/job.stub.ts` now emits the return statement
at handler-body depth and the object properties/call close one level beneath it. No runtime or
registry behavior changed.

```text
$ deno test --allow-all --unstable-kv plugins/workers/src/adapter/resources/resources.test.ts
exit 0; 7 passed / 0 failed
The installed health-check artifact passes its nested deno fmt --check assertion.
```

Scoped plugin receipts on the same implementation tree:

```text
$ run-deno-check.ts --root plugins/workers --ext ts,tsx
exit 0; filesSelected=103; failedBatches=0; totalOccurrences=0; --unstable-kv enabled
$ run-deno-lint.ts --root plugins/workers --ext ts,tsx
exit 0; filesSelected=103; failedBatches=0; totalOccurrences=0
$ run-deno-fmt.ts --root plugins/workers --ext ts,tsx
exit 0; filesSelected=103; failedBatches=0; findings=0
```

GREEN implementation commit: `57be230494a679f4e638c489428432dcf0c2d030` (pushed by explicit
refspec).

### Generated carrier chain — exact order

```text
$ deno task gen:mcp-export-corpus
exit 0; sha256=209fe9ff690a706286526833314ca1fac1d09436139c1a12ab94fd109abc7a1c;
packageCount=35; subpathCount=273; symbolCount=7869
$ deno task check:mcp-export-corpus
exit 0; same corpus hash and census
$ deno task check:agent-docs-prose
exit 0; fresh=true; stalePaths=[]
$ deno task check:assets-barrel
exit 0
$ deno task gen:publish-assets
exit 0
$ deno task check:publish-assets
exit 0
```

The canonical generators produced no tracked delta, including no
`packages/mcp/src/publish-assets.generated.ts` delta: the supervisor-provided carriers at the repair
base were already current. No generated carrier was hand-edited.

Additional installed-scaffold receipt:

```text
$ deno task e2e:cli run scaffold.plugins --format pretty --report \
    .llm/tmp/e2e-report-scaffold-plugins-health-check-fmt.json
exit 0; passed=17; failed=0; skipped=0
```

The focused resource test above is the direct formatter proof: it invokes repository-configured
`deno fmt --check` on the emitted health-check file. The broader scaffold receipt proves the same
workers install resource composes successfully with the official plugin set. The ignored report
remains under `.llm/tmp/` and is not committed.

`deno.lock` is unchanged. PR #1970 remains non-draft and its body retains `Refs #1455` for the
supervisor's packet-time close disposition. The final pushed head is the receipt-only commit
containing this section and is reported in the PR comment and implementation-lane handoff.

## Repair 4 — schema-first Flow-B runtime fixture compatibility

The owner resumed this lane at exact head `14bdf2f98a302eb698e51048affaf670c7920a9d` while the
opposite-family supervisor was quota-blocked. `origin/main` was fetched and verified at
`3903feea63f0f4c421dd90f221132c08dbb3650e`; it was not merged or rebased into this branch.

PLAN-EVAL remains N/A: this is a mechanical compatibility repair under the accepted #1455 contract,
with the two hosted failures and a direct generator probe fixing the shape and scope. It introduces
no public or runtime-contract decision.

### Hosted RED receipts

GitHub Actions run `33710942351` failed only its two runtime jobs after all generated check/lint/fmt
gates passed:

```text
scaffold-runtime (job 100510190939): runtime.aspire-start failed after 312842ms
  aspire describe --follow did not converge: timed out after 300s
scaffold-runtime-sqlite (job 100510191077): runtime.aspire-start failed after 312861ms
  aspire describe --follow did not converge: timed out after 300s
```

The PostgreSQL cleanup failure (`docker inspect ... No such object`) followed its start failure;
SQLite cleanup passed. It is secondary evidence, not a second product defect.

Both suites pass `runtime.flow-b-fixture` immediately before startup. That fixture still replaced
the legacy one-argument `defineJobHandler((context) => {` spelling, while #1455 now emits the
schema-first multiline form whose callback begins `  (context) => {`. A direct probe against
`jobScaffolder.emit({ id: 'flow-b-callback' })` produced:

```text
legacyAsyncReplacementApplied=false
completionMarkerFound=true
defineJobHandler(
  PayloadSchema,
  (context) => {
    await Promise.resolve();
```

The injected `await` therefore remained inside a synchronous handler. The generated static check
ran before fixture injection, so it could not catch the post-check invalid source; workers then
failed to start and Aspire could not converge.

### Narrow repair

`prepare-flow-b-fixture.ts` now targets the schema-first callback marker and fails immediately with
a named error if that generator seam drifts again. Payload schema, handler behavior, generated
registries, and #1455's public surface are unchanged.

Focused GREEN receipts:

```text
$ direct jobScaffolder schema-first rewrite probe
schemaFirstHandlerFound=true; asyncReplacementApplied=true; hasSchemaFirstAsyncHandler=true
$ run-deno-check.ts --file packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts --ext ts,tsx
exit 0; filesSelected=1; failedBatches=0; totalOccurrences=0; --unstable-kv enabled
$ run-deno-lint.ts --root packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts --ext ts,tsx
exit 0; filesSelected=1; failedBatches=0; totalOccurrences=0
$ run-deno-fmt.ts --root packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts --ext ts,tsx
exit 0; filesSelected=1; failedBatches=0; findings=0
```

Implementation repair commit: `c182fead36324830a2420464e4727ab17c0b9e53` (pushed by explicit
refspec).

### Runtime diagnostic and current-main integration

The exact local PostgreSQL `scaffold.runtime` suite reached the repaired Flow-B fixture and then
failed `runtime.aspire-start` after 309761ms because this host's DCP proxy listeners for PostgreSQL
and Garnet did not become reachable. Aspire's resource view showed the backing containers running;
cleanup passed. This is recorded separately from the branch-owned hosted RED and is not treated as
a GREEN product receipt. A SQLite rerun on the same host would exercise the same unhealthy proxy
layer, so the authoritative dual-provider verdict is the hosted synthetic-merge CI requested below.

While this repair ran, `origin/main` advanced from the owner-pinned `3903feea63` to
`632528888ad033f0e23dfd4f6718d089bfe3eeab`, leaving PR #1970 conflicting and unable to schedule
its normal PR checks. Main was integrated once without rebasing. The only conflicts were four
derived documentation/publish carriers; each was seeded from main and then regenerated with the
canonical tasks. No generated carrier was hand-edited and `deno.lock` remains unchanged.

Canonical carrier receipts on the integrated tree:

```text
$ deno task gen:agent-docs-prose
exit 0; sha256=8c219d169eb852c481aef9f0745748444b05d7e3fc5e869a9c914c7e81c40e1e
$ deno task gen:assets-barrel
exit 0
$ deno task gen:publish-assets
exit 0
$ deno task gen:mcp-export-corpus --allow-dirty
exit 0; sha256=209fe9ff690a706286526833314ca1fac1d09436139c1a12ab94fd109abc7a1c;
packageCount=35; subpathCount=273; symbolCount=7869
$ deno task check:agent-docs-prose
exit 0; fresh=true; stalePaths=[]
$ deno task check:assets-barrel
exit 0
$ deno task check:publish-assets
exit 0
$ deno task check:mcp-export-corpus
exit 0; same corpus hash and census
```

The final integrated head and exact Tier-A/hosted receipts follow in the receipt slice. PR #1970
must remain unmerged and its body must retain `Refs #1455` for the supervisor's packet-time close
disposition.

Integration commit: `6e654b1bd` (main parent
`632528888ad033f0e23dfd4f6718d089bfe3eeab`; pushed by explicit refspec).

### Integrated Tier-A receipts

```text
$ deno task check
exit 0; filesSelected=3135; batches=27; failedBatches=0; totalOccurrences=0
$ deno task check:emitted-samples
exit 0; checked 48 TypeScript samples from 38 artifact paths
$ deno task quality:gate
exit 0; doctrine output contains existing WARN/INFO census only, FAIL=0
$ deno task arch:check
exit 0; doctrine output contains existing WARN/INFO census only, FAIL=0
$ deno task docs:jsdoc-examples
exit 0; PASS; members=35; files=2062; checked=362; failures=0
$ deno test --allow-all --unstable-kv plugins/workers/src/adapter/resources/resources.test.ts
exit 0; 7 passed / 0 failed
```

These gates ran on the integrated tree after the canonical carrier checks. The receipt commit that
contains this section is the intended immutable PR head; GitHub's current `check-test`, `quality`,
`scaffold-static`, PostgreSQL runtime, and SQLite runtime jobs are the authoritative synthetic-merge
receipts for that exact pushed commit.

The receipt-only push `0e0a850da` matched the workflow's documentation-only path filter and
scheduled no product CI. A final scoped commit adds only an explanatory comment at the repaired
package fixture seam (no behavior or type change), ensuring the required synthetic-merge workflows
run against the immutable packet head. The successful integrated local receipts above remain valid
because the executable source is unchanged.

## Repair 5 — generated add-job module registration boundary

Exact-head Actions run `33714069941` reproduced the same `runtime.aspire-start` timeout in both
PostgreSQL (job `100519618399`) and SQLite (job `100519618312`) after every generated static gate
and `runtime.flow-b-fixture` passed. Both cleanup steps passed. Inspection of the actual Flow-B
artifact emitted by `jobScaffolder` found the remaining branch-owned mismatch:

```text
job module exports: flowBCallbackJob (named only)
generated registry resolver: module.default ?? module.handler
runtime result: resolver throws while workers-api loads the generated registry
```

This follows directly from #1455's deliberate application-boundary contract: generated job modules
must expose their schema-backed handler as `default` or `handler`. The generic add-job stub was not
updated when the registry began enforcing that contract. The RED assertion requires the existing
typed named handler to also be the module's default export; it does not fail on arity, imports, or an
unrelated type mismatch.

RED commit: `93125a3a8`. Focused RED receipt:

```text
$ deno test --allow-all --unstable-kv plugins/workers/src/adapter/resources/resources.test.ts
exit 1; 6 passed / 1 failed
failure: emitted welcome-email module did not contain `export default welcomeEmailJob;`
```

GREEN adds that default export to the canonical typed job stub while retaining the existing named
export. This changes neither handler construction nor enqueue/runtime semantics; it makes every
generic add-job artifact satisfy the registry boundary already specified by #1455.

```text
$ deno test --allow-all --unstable-kv plugins/workers/src/adapter/resources/resources.test.ts
exit 0; 7 passed / 0 failed
$ run-deno-check.ts --root plugins/workers --ext ts,tsx
exit 0; filesSelected=103; failedBatches=0; totalOccurrences=0; --unstable-kv enabled
$ run-deno-lint.ts --root plugins/workers --ext ts,tsx
exit 0; filesSelected=103; failedBatches=0; totalOccurrences=0
$ run-deno-fmt.ts --root plugins/workers --ext ts,tsx
exit 0; filesSelected=103; failedBatches=0; findings=0
```

The GREEN commit is pushed immediately after this receipt is recorded; its exact SHA is reported in
the PR implementation comment and handoff packet.
