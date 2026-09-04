# Evaluation: agent model routing and subscription expense policy revamp

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Verdict history (preserved)

| Cycle | Head        | Verdict    | Status                                                                                                                                                                                                                                                     |
| ----- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `9f8ee61a6` | `FAIL_FIX` | Historical. Five bounded findings: Claude dispatch ids, dated Ollama DeepSeek ids, spawn-denial proof, README resolver wording, S4/S5 PR comments.                                                                                                         |
| 2     | `8740b16de` | `PASS`     | Historical and **superseded for merge readiness**. Owner dashboard plus the authenticated Go usage API later disproved the flat-limit and privileged-tier assumptions (`drift.md`, 2026-09-04). Valid only for its evaluated head and then-approved scope. |
| 3     | `4aa178868` | `FAIL_FIX` | Historical. One high finding (four owner-unstated DeepSeek efforts encoded as `high`/`max`) and one low finding (Claude/OpenRouter compatibility transport lacked a matrix carve-out). Both closed at cycle 4 — see the closeout table.                    |
| 4     | `74c6299b0` | `PASS`     | **Current** — this evaluation.                                                                                                                                                                                                                             |

Full texts of cycles 1–3 remain in this file's git history. They are not rewritten.

## Metadata

| Field          | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix`                                              |
| Target         | harness and agentic tooling; draft PR #1989                                                   |
| Archetype      | `6 - CLI / Tooling` (internal tooling, not a published Arch-6 package)                        |
| Scope overlays | docs                                                                                          |
| Evaluator      | Claude Opus 5 xhigh, native Claude transport (Anthropic family); 2026-09-04; separate session |

Exact head evaluated: `74c6299b006c8662514e9f1f2a77e970681b0ade`. Baseline
`a2d7f5f6f686115b5c31bab085692df6e1582aa7`. Generator is OpenAI-family; this session is
Anthropic-family and separate — different vendor family confirmed. Route is the matrix's
`feature/implementation_evaluation` row on its declared `opus_5@xhigh` fallback candidate (`claude`
transport, first in `MODEL_TRANSPORT_PRIORITY` and `opus_5`'s only capability); the primary Meta
candidate was rejected before inference by endpoint policy and OpenCode Go remains
live-rate-limited. No paid OpenCode route was selected, so no expense decision applies to this
evaluation. `complex` and `architecture` are **not** authorized for this run and were not used.

**Feature-tier loop position:** IMPL-EVAL cycle **4 of max 5**. The `notifyOwnerAfter: 3` threshold
was passed at cycle 3 and the owner was notified with that verdict.

**Head-identifier correction (evidence hygiene).** The brief names exact head
`74c6299b0bd287ff4773e9564bc6301645777156`; that object does not exist (`git cat-file -t` →
`could not get object info`). The real commit is `74c6299b006c8662514e9f1f2a77e970681b0ade` — only
the 9-character prefix `74c6299b0` matches. The intended head is nonetheless unambiguous: the prefix
resolves uniquely, the subject is `fix(agentic): preserve unstated model effort`, and
`git diff 74c6299b0 HEAD` touches only `impl-eval-brief.md`, exactly as the brief states. This
evaluation is against the real SHA. See Finding 3.

## Cycle-3 finding closeout

| # | Cycle-3 finding                                                           | Result | Independently executed evidence                                                                                                                                                                                                                                                                                                                                      |
| - | ------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Four owner-unstated DeepSeek efforts encoded as `high`/`max` (high)       | PASS   | All four now `provider_default`: `delegation-matrix.ts:285,289,305,308` (`grep` returns no other DeepSeek route). Directly pinned by four new `assertEquals` cases in `delegation-matrix_test.ts:28-43` plus the corrected `selectEvaluator` expectation at `:105-109`. Rendered end-to-end: `routing-state.ts` prints `effort=provider_default` for all four cells. |
| 2 | Claude/OpenRouter compatibility transport lacked a matrix carve-out (low) | PASS   | `README.md:438-440`: "This compatibility transport is not selected by the active workload matrix. Matrix-driven OpenRouter turns use the OpenCode transport; invoke this command only for an explicitly selected legacy/local compatibility turn using one of its guarded evaluator models."                                                                         |

**Completeness re-check (not just the four cells).** I re-compared **every** workload cell against
the run's recorded owner source `research.md:15-19` and every coordinator row against
`research.md:51-56`. All 30 workload entries and all 9 coordinator entries now match, under one
uniform convention: owner-stated effort is encoded verbatim, owner-unstated effort is
`provider_default` (15 cells). No cell deviates. The four repaired cells all route through OpenCode
transports, so `concreteEffort('provider_default')` → `OPENCODE_TOOL.defaultVariant` = `high`
(`config/versions.ts:69`) — a genuine de-escalation from `max` on paid fallbacks, in the correct
direction.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 `PASS` at `372409ab6`; `git log` confirms `372409ab6` → `5b3e0184a` → `c11d139f6` all precede the first production slice `605ae0e02`                                                                                                                                                            |
| Design section exists in worklog       | PASS   | `worklog.md:12` `## Design` with Surface, Data flow, Error contract, Contributor path                                                                                                                                                                                                                                  |
| Commit slices match design plan        | PASS   | S1 `605ae0e02` → S2 `da80e6eec` → S3 `b2d3106f0` → S4 `e4bf9dd8c` → S5 `1f02dde27`; repairs `8740b16de`, `fab66b3dc`, `74c6299b0`; ledger `4aa178868`                                                                                                                                                                  |
| Each slice has a passing gate          | PASS   | `worklog.md` Gate Results per slice; the current head's gates re-executed independently in this session (Static/Runtime tables below)                                                                                                                                                                                  |
| No speculative seams (unused files)    | PASS   | Every new export has a production consumer: `assertPrivilegedTierAuthorization`/`assertWorkloadModelAllowed` → `opencode-run.ts:136-137`; `fetchOpenCodeGoUsageSnapshot` → `opencode-run.ts:148`, `cli/expense-watch.ts:90`; `spawn` seam → `opencode-run.ts:222`; `CANONICAL_ROUTE_POLICY` → `cli/routing-state.ts:5` |
| Constants used for finite vocabularies | PASS   | `LOGICAL_MODEL_IDS`, `MODEL_VENDOR_FAMILIES`, `MODEL_TRANSPORTS`, `WORKLOAD_TIERS`, `PRIVILEGED_WORKLOAD_TIERS`, `DELEGATION_ROLES`, `COORDINATOR_TIERS`, `LEGACY_ROUTING_LANES`, `EXPENSE_PROVIDERS`, `OPENCODE_CREDENTIAL_PROVIDERS` are `as const` arrays                                                           |

The cycle-3 resolver-consumer note still stands and is still not a finding: `resolveWorkloadRoute`
and friends have test-only consumers, exactly as `routing-policy.ts` did at baseline `a2d7f5f6f`
(verified with `git grep "routing-policy.ts'"` at both commits). No regression.

## Static Gates

Command permissions were enabled for this cycle, so every row below was **executed in this evaluator
session** unless marked otherwise.

| Gate             | Command or check                                                                                                       | Result  | Evidence                                                                                                             | Notes                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts`                                                                 | PASS    | `filesSelected:187, batches:2, failedBatches:0, totalOccurrences:0`                                                  | Matches the brief's 187/0 claim exactly                                                                                                                                                                                                     |
| Slice typecheck  | `run-deno-test.ts -- --allow-all` on matrix + resolver + doc-parity                                                    | PASS    | `passed:23, failed:0, ignored:0, exitCode:0, 565 ms`                                                                 | Matches the brief's 23-test subset                                                                                                                                                                                                          |
| Focused suite    | `run-deno-test.ts -- --allow-all` on expense, usage, credential, runner, profiles, routing-state, SSOT, task-separator | PASS    | `passed:49, failed:0, exitCode:0, 22,287 ms`                                                                         | Superset of the repaired surface                                                                                                                                                                                                            |
| Full agentic     | `run-deno-test.ts -- --allow-all .llm/tools/agentic/`                                                                  | PASS    | `passed:583, failed:0, ignored:0, exitCode:0, 31,195 ms`                                                             | Matches the brief's 583 claim exactly                                                                                                                                                                                                       |
| Format (TS)      | `run-deno-fmt.ts --file` on both changed TypeScript files                                                              | PASS    | `filesSelected:2, filesProcessed:2, findings:0, failedBatches:0`                                                     |                                                                                                                                                                                                                                             |
| Format (MD)      | `deno fmt --check` on `lane-policy.md` and `README.md`                                                                 | PASS    | `Checked 2 files`, no findings                                                                                       | Only the two changed Markdown files                                                                                                                                                                                                         |
| Lint             | structured wrapper on `.llm/**`                                                                                        | N/A     | `deno.json` `lint.exclude` includes `.llm/`                                                                          |                                                                                                                                                                                                                                             |
| Doc lint         | package `deno doc --lint`                                                                                              | N/A     | No `packages/**` or `plugins/**` in the diff                                                                         |                                                                                                                                                                                                                                             |
| Publish dry-run  | `deno publish --dry-run`                                                                                               | N/A     | Internal tooling only                                                                                                |                                                                                                                                                                                                                                             |
| Link/path check  | lane-policy generated blocks vs typed matrix                                                                           | PASS    | `routing-policy-doc-parity_test.ts` executed green inside the 23; regenerated table matches both generated blocks    | Machine-proven this cycle, not by hand                                                                                                                                                                                                      |
| Repo check/test  | `deno task check` / `deno task test`                                                                                   | NOT_RUN | Generator-reported: 3,140 files / 0 diagnostics; 5,278 passed / 0 failed / 19 ignored under executable `TMPDIR=/tmp` | Justified: `grep` proves no file outside `.llm/tools/agentic/**` imports `delegation-matrix.ts` or `routing-policy.ts`, and the entire agentic tree was independently checked and tested green, so the repair cannot reach the wider suites |

## Fitness Gates

Package F-CLI / JSR / public-surface gates are `N/A` per the approved plan's Archetype-gate
applicability section (no `packages/**`, `plugins/**`, scaffold output, or published CLI surface).

| Gate | Function                          | Result | Evidence                                                                                                                                             | Violations |
| ---- | --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | `delegation-matrix.ts` 499 LOC; `routing-policy.ts` 233 LOC; `subscription-expense.ts` 266 LOC                                                       | none       |
| F-2  | Helper-reinvention scan           | N/A    | internal tooling                                                                                                                                     |            |
| F-3  | Layering check                    | N/A    | no `packages/**`                                                                                                                                     |            |
| F-4  | Inheritance audit                 | N/A    |                                                                                                                                                      |            |
| F-5  | Public surface audit              | N/A    |                                                                                                                                                      |            |
| F-6  | JSR publishability gate           | N/A    |                                                                                                                                                      |            |
| F-7  | Doc-score gate                    | N/A    |                                                                                                                                                      |            |
| F-8  | Workspace `lib` override check    | N/A    |                                                                                                                                                      |            |
| F-9  | Permission declaration check      | PASS   | `agentic:expense-watch` is `--allow-read --allow-env --allow-net=opencode.ai`; `agentic:opencode` net allowlist is `127.0.0.1,opencode.ai`           | none       |
| F-10 | Test-shape audit                  | PASS   | `opencode-run_test.ts:161-305` observes the real process boundary via the injected `spawn` seam, asserting `spawnCalls === 0` and `fetchCalls === 0` | none       |
| F-11 | Forbidden-folder lint             | N/A    | pre-existing agentic `lib/`                                                                                                                          |            |
| F-12 | Naming-convention lint            | PASS   | finite vocabularies are `as const` arrays; no synthesized slugs                                                                                      |            |
| F-13 | Saga and runtime invariants       | N/A    |                                                                                                                                                      |            |
| F-14 | Console-log lint                  | N/A    | CLI edges only                                                                                                                                       |            |
| F-15 | Re-export-of-upstream lint        | N/A    |                                                                                                                                                      |            |
| F-16 | Folder-cardinality lint           | N/A    |                                                                                                                                                      |            |
| F-17 | Abstract-derived co-location lint | N/A    |                                                                                                                                                      |            |
| F-18 | Sub-barrel lint                   | N/A    |                                                                                                                                                      |            |
| F-19 | Scoped source gate runners        | PASS   | Structured wrappers used for every gate above; no raw root `deno fmt` verdict claimed                                                                |            |

## Runtime Gates

| Gate                         | Validation                                                               | Result | Evidence                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matrix encoding fidelity     | every cell matches the recorded owner source                             | PASS   | All 30 workload + 9 coordinator entries re-compared against `research.md:15-19,51-56`; one uniform unstated→`provider_default` convention across all 15 unstated cells. Cycle-3's high finding is closed                                                                          |
| Different-family composition | coverage proof + skip-same-family at selection                           | PASS   | `validateDelegationMatrix()` asserted `[]` in the executed suite; `resolveRouteChain` skips `definition.family === generatorFamily` (`routing-policy.ts:147`); `selectEvaluator` skip cases green                                                                                 |
| Provider order               | Claude → Codex → Google → Go → Ollama → OpenRouter                       | PASS   | `MODEL_TRANSPORT_PRIORITY` (`delegation-matrix.ts:197-204`) applied via `capabilities.toSorted(...)` (`routing-policy.ts:148-151`); asserted green in `delegation-matrix_test.ts` and `routing-policy_test.ts`                                                                    |
| Privileged-row authority     | complex/architecture fail closed without owner/milestone authorization   | PASS   | `assertPrivilegedTierAuthorization` (`delegation-matrix.ts:223-233`) called from `selectEvaluator`, `resolveWorkloadRoute:179`, `preflightOpenCodeExpense:136`; `opencode-run_test.ts:239-271` proves denial before **both** usage fetch and spawn — executed green               |
| Matrix-cell model membership | concrete model must belong to the selected cell                          | PASS   | `assertWorkloadModelAllowed` at `opencode-run.ts:137`; `opencode-run_test.ts:273-305` proves Grok Go relabelled as `feature` is rejected with `fetchCalls === 0`, `spawnCalls === 0` — the exact `Vs5ukzqK` incident shape — executed green                                       |
| Authenticated Go usage       | live fetch; caller snapshots rejected                                    | PASS   | `opencode-run.ts:145-147` throws on `--usage-snapshot` for Go; **live probe**: `expense-watch --provider opencode_go --model opencode-go/grok-4.6` with no credential and `HOME=/nonexistent-home` → exit 4, `usage_unproven`, error names only `OPENCODE_API_KEY`, never a value |
| Model-adjusted Go windows    | published inclusion scales all three windows                             | PASS   | `openCodeGoEffectiveLimits` (`subscriptions.ts:42-51`): Grok 15/60 → 3 / 7.5 / 15; `subscription-expense_test.ts:45-57` asserts exactly `[3, 7.5, 15]` — executed green; matches the live receipt in `drift.md`                                                                   |
| Expense fail-closed states   | stale / unproven / mismatch / exhausted / rate-limited / tier-unresolved | PASS   | Executed green in the 49-test run. **Live probes**: exhausted OpenRouter balance → exit 4 `allowance_exhausted` with structured window; a 2-hour-old snapshot → exit 4 `usage_stale`. No credential printed, no model spawned                                                     |
| No spawn on denial           | injected command-spawn spy                                               | PASS   | `runOpenCode` calls `preflightOpenCodeExpense` at `opencode-run.ts:186`, before env prep, MCP preflight, and spawn (`:222`); three spy tests assert `spawnCalls === 0` across rate-limit, transport-failure, HTTP-503, and malformed-payload paths — executed green               |
| Secure credential boundary   | prefix loader, rival-key clear, mode-600, value-free errors              | PASS   | `provider-credential_test.ts` executed green; `provider-usage_test.ts:30-43` asserts the key is sent as `Bearer` yet absent from the snapshot; live probe above confirms value-free diagnostics                                                                                   |
| Documentation parity         | generated blocks equal the typed matrix                                  | PASS   | `routing-policy-doc-parity_test.ts` executed green against the regenerated table                                                                                                                                                                                                  |
| Legacy boundary              | new selection with an old lane fails closed                              | PASS   | `rejectLegacyLaneForNewSelection` (`delegation-matrix.ts:494-498`); repo grep confirms the 23 legacy lane names appear only in `LEGACY_ROUTING_LANES` and its two tests                                                                                                           |
| Credential leakage           | no secret in tracked artifacts                                           | PASS   | `grep -rn "OPENCODE_API_KEY="` across `.llm/tools/agentic`, `.llm/harness`, `.agents`, and the run dir returns only the opaque fixture at `provider-credential_test.ts:17`. Session ids (`ses_…Vs5ukzqK`) are identity, allowed by AGENTS.md operating rule 7                     |
| Live receipt honesty         | `drift.md` claims vs executed behaviour                                  | PASS   | `expense-watch.ts:105` returns 4 when `!decision.allowed`, confirmed by three live probes. The recorded `provider_rate_limited` + `$3/$7.50/$15` + no-spawn outcome is exactly what this code produces for Grok Go at ≥100 %                                                      |
| Operator surface             | `agentic:routing-state` renders the typed matrix                         | PASS   | Executed: all four repaired cells render `effort=provider_default` with correct `family=` values                                                                                                                                                                                  |
| Release gates                | cut / `scaffold.runtime`                                                 | N/A    | Not a release cut (protocol §Operating Rules 14)                                                                                                                                                                                                                                  |

## Consumer Gates

| Consumer                 | Validation              | Result  | Evidence                                                                                                                                                                                                          |
| ------------------------ | ----------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| published package/plugin | none                    | N/A     | No `packages/**` or `plugins/**` export changes in the diff                                                                                                                                                       |
| harness docs overlay     | source alignment        | PASS    | Parity test green; the Claude/OpenRouter compatibility carve-out now matches the `openhands-handoff` treatment; no residual Tier A–E or "opposite-family" vocabulary                                              |
| operator CLI surface     | `agentic:expense-watch` | PASS    | `task-separator_test.ts` green (strict task count 27); three live invocations returned structured fail-closed JSON with exit 4                                                                                    |
| PR lifecycle             | draft state and threads | PARTIAL | `agentic:review-threads` → `PASS threads=0 unanswered=0`; `mergeable:MERGEABLE`, `mergeStateStatus:CLEAN`, `headRefOid` matches local HEAD. **But** the body and `status:` label are stale — see Findings 1 and 2 |

## Anti-Pattern Check

| AP    | Status | Evidence                                                           | Notes             |
| ----- | ------ | ------------------------------------------------------------------ | ----------------- |
| AP-1  | CLEAR  | routing-policy 233 LOC after rewriting a 945-line file             |                   |
| AP-2  | N/A    |                                                                    |                   |
| AP-3  | N/A    |                                                                    |                   |
| AP-4  | N/A    |                                                                    |                   |
| AP-5  | N/A    |                                                                    |                   |
| AP-6  | N/A    |                                                                    |                   |
| AP-7  | N/A    |                                                                    |                   |
| AP-8  | N/A    |                                                                    |                   |
| AP-9  | N/A    |                                                                    |                   |
| AP-10 | N/A    |                                                                    |                   |
| AP-11 | CLEAR  | `fetch`, `spawn`, `readTextFile`, `stat`, `now` are injected seams |                   |
| AP-12 | N/A    |                                                                    |                   |
| AP-13 | N/A    | CLI edges only                                                     |                   |
| AP-14 | N/A    |                                                                    |                   |
| AP-15 | CLEAR  | no `IFoo` / `FooT`                                                 |                   |
| AP-16 | N/A    | pre-existing agentic `lib/`                                        |                   |
| AP-17 | N/A    |                                                                    |                   |
| AP-18 | CLEAR  | assertions are semantic; the repair added four exact-value pins    | see Observation 2 |
| AP-19 | N/A    |                                                                    |                   |
| AP-20 | N/A    |                                                                    |                   |
| AP-21 | N/A    |                                                                    |                   |
| AP-22 | N/A    |                                                                    |                   |
| AP-23 | N/A    |                                                                    |                   |
| AP-24 | CLEAR  | typed capability catalog, not a vendor switch                      |                   |
| AP-25 | CLEAR  | `Deno.Command` / file IO confined to CLI edges                     |                   |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                           |
| --------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| New entries           | 0     | `debt/arch-debt.md` is not in the diff                                                             |
| Resolved entries      | 0     |                                                                                                    |
| Deepened violations   | 0     |                                                                                                    |
| Unrecorded violations | 0     | Cycle-3 findings were repaired, not deferred; the remaining findings are PR metadata, not doctrine |

## Findings

None of the findings below concern the implementation at the evaluated head. All three are PR/brief
metadata and are recorded as **mandatory pre-promotion conditions**, not implementation defects.

| Severity | Finding                                                                                                                                                                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                 | Required action                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| medium   | **PR #1989's body is materially stale and contradicts the head.** It states "Current phase: Research and design", "Validation: Not run yet; implementation has not started", and leaves all six planned-slice boxes unchecked — while S1–S5 plus three repair cycles are complete with green gates. It also carries no issue reference and no closing keyword. | `gh pr view 1989 --json body` (27 lines); contrast `worklog.md` Gate Results and the commit trail `605ae0e02` … `74c6299b0`                                                                              | fix before promotion — protocol §Operating Rules 12 requires a complete Definition-of-Done checklist before any `status:ready-merge` |
| low      | **`status:` label is stale.** The PR carries `status:plan-eval` although both PLAN-EVAL cycles passed at `372409ab6` and four IMPL-EVAL cycles have since run. AGENTS.md requires exactly one accurate `status:` label.                                                                                                                                        | `gh pr view 1989 --json labels`: `ci:skip-e2e`, `type:chore`, `status:plan-eval`, `priority:p1`, `ci:skip-scaffold`, `area:agent-tooling`                                                                | fix before promotion. Sequence the label edit per the known `e2e-cli` cancel-on-`labeled` behaviour                                  |
| low      | **The brief's exact-head SHA does not exist.** `74c6299b0bd287ff4773e9564bc6301645777156` fails `git cat-file`; the real commit is `74c6299b006c8662514e9f1f2a77e970681b0ade`. The 9-char prefix is unique so the intended head was unambiguous, but a run whose whole premise is exact-head evidence should not circulate an unresolvable SHA.                | `git cat-file -t 74c6299b0bd…` → `fatal: could not get object info`; `git rev-parse 74c6299b0` → `74c6299b006c8662514e9f1f2a77e970681b0ade`; `git diff 74c6299b0 HEAD` touches only `impl-eval-brief.md` | cite the true SHA in the next brief and in the exact-head PR comment                                                                 |

### Observations (non-blocking, carried forward from cycle 3)

1. **Evaluation-policy prose is outside the parity guard.** `lane-policy.md:81-87` renders per-tier
   round/repair/notify values as hand-written prose rather than inside a `generated-*` block. All
   ten values still match `EvaluationPolicy` and `research.md:27-38`, and
   `delegation-matrix_test.ts:141-166` pins the typed side — but plan S4's "machine markers so human
   policy cannot drift" remains only partly realised for this one table. Cycle 3's high finding is a
   direct illustration of why generated blocks beat prose.
2. **`routing-state_test.ts` uses three `assertStringIncludes` probes** rather than the exact-output
   equality it replaced. Acceptable now that the parity test covers structure, but strictly weaker.
3. **`complex/implementation_evaluation` has no distinct fallback**
   (`muse_spark_1_3@max →
   muse_spark_1_3@max`), so an unavailable Muse throws rather than falling
   back. This faithfully mirrors `research.md:18`, so it is the owner's declaration — noted only for
   confirmation.
4. `MODEL_IDS`' doc comment still says "used by the canonical route policy" (`config/models.ts:17`)
   although routing now reads `ROUTING_MODEL_IDS` through the matrix. Cosmetic.
5. `routing-policy_test.ts:107` names a variable `ollama` for a route that correctly resolves to the
   `claude` transport. Assertions are right; the name is stale.

## Lessons for Promotion

| Lesson                                                                          | Pattern                                                                                                         | Applies to                        | Confidence |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------- |
| A doc-parity gate proves code ↔ doc, never code ↔ external source               | Cycle 3's invented efforts passed parity because they were rendered verbatim into the generated table           | any generated-policy surface      | high       |
| Encode "unstated by owner" as an explicit value, not a per-cell choice          | `unspecified_by_owner` existed for round limits; efforts had no equivalent, so four cells drifted until cycle 3 | Arch 6 tooling / routing catalogs | high       |
| Denial proofs should assert the fetch boundary as well as spawn                 | `fetchCalls === 0` caught the tier-authority ordering a spawn-only spy would have missed                        | paid-route launchers              | high       |
| Repair verification should re-check the whole class, not the reported instances | Cycle 4 re-compared all 39 matrix entries, not just the four cited cells, before closing the finding            | any source-fidelity finding       | high       |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Rationale | Both cycle-3 findings are closed with independently executed evidence, and the repair is confined to exactly the reported surface. All four owner-unstated DeepSeek efforts are now `provider_default`, each directly pinned by a new test, rendered correctly through `agentic:routing-state`, and reflected in the regenerated human table that the parity test proves equal to the typed matrix. I re-compared every workload and coordinator entry against the recorded owner source rather than only the four cited cells: all 39 match under one uniform convention. Every gate was executed in this session — 187 files checked with zero diagnostics, 583/583 agentic tests, 23/23 matrix+parity, 49/49 expense/credential/runner/SSOT, and format clean on both changed TypeScript files and both changed Markdown files. Three credential-free live probes confirm the expense watcher fails closed with exit 4 and value-free diagnostics on exhausted, missing-credential, and stale inputs. The post-evaluation corrections all hold: authenticated Go usage, model-weighted effective windows, and denial before both usage fetch and process spawn. Repository-wide check/test remain generator-reported, justified because no file outside `.llm/tools/agentic/**` imports the changed modules and that whole tree was independently verified green. No new debt. **Promotion is conditioned on Findings 1 and 2**: the PR body still says implementation has not started and the `status:plan-eval` label is stale; both must be corrected before `status:ready-merge`. This verdict covers the implementation at `74c6299b006c8662514e9f1f2a77e970681b0ade`, not merge readiness of the PR's metadata. |
