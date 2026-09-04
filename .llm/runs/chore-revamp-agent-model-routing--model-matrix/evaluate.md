# Evaluation: agent model routing and subscription expense policy revamp

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Verdict history (preserved)

| Cycle | Head        | Verdict    | Status                                                                                                                                                                                                                                                     |
| ----- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `9f8ee61a6` | `FAIL_FIX` | Historical. Five bounded findings: Claude dispatch ids, dated Ollama DeepSeek ids, spawn-denial proof, README resolver wording, S4/S5 PR comments.                                                                                                         |
| 2     | `8740b16de` | `PASS`     | Historical and **superseded for merge readiness**. Owner dashboard plus the authenticated Go usage API later disproved the flat-limit and privileged-tier assumptions (`drift.md`, 2026-09-04). Valid only for its evaluated head and then-approved scope. |
| 3     | `4aa178868` | `FAIL_FIX` | Historical. One high finding (four owner-unstated DeepSeek efforts encoded as `high`/`max`) and one low finding (Claude/OpenRouter compatibility transport lacked a matrix carve-out). Both closed at cycle 4.                                             |
| 4     | `74c6299b0` | `PASS`     | Historical. Closed both cycle-3 findings with executed evidence. Raised three PR/brief metadata findings as pre-promotion conditions; see their closeout below.                                                                                            |
| 5     | `5f199642f` | `PASS`     | **Current** — this evaluation of the owner's bounded deep-research amendment.                                                                                                                                                                              |

Full texts of cycles 1–4 remain in this file's git history. They are not rewritten.

## Metadata

| Field          | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix`                                              |
| Target         | harness and agentic tooling; draft PR #1989                                                   |
| Archetype      | `6 - CLI / Tooling` (internal tooling, not a published Arch-6 package)                        |
| Scope overlays | docs                                                                                          |
| Evaluator      | Claude Opus 5 xhigh, native Claude transport (Anthropic family); 2026-09-04; separate session |

Exact head evaluated: `5f199642f43820ec59b8e1770940a3b61f8cdf43` — resolved and confirmed with
`git cat-file -t` (cycle-4 Finding 3 is fixed: this brief's SHA is valid). Baseline
`a2d7f5f6f686115b5c31bab085692df6e1582aa7`. Local `HEAD` is `8eb5fda80`
(`docs(harness): brief deep research amendment evaluation`) and `git diff 5f199642f HEAD` touches
only `impl-eval-brief.md`, so every inspected implementation file is byte-identical to the named
head.

Generator is OpenAI-family; this session is Anthropic-family and separate — different vendor family
confirmed. Route is the matrix's `feature/implementation_evaluation` row on its declared
`opus_5@xhigh` fallback (`claude` transport); the primary Meta candidate was rejected before
inference by endpoint policy and OpenCode Go remains live-rate-limited. No paid OpenCode route was
selected, so no expense decision applies to this evaluation. `complex` and `architecture` are
**not** authorized for this run and were not used.

**Feature-tier loop position:** IMPL-EVAL cycle **5 of max 5**. Cycles 3 and 4 were the bounded
repair loop; this cycle reviews a _new owner amendment_ landed after a `PASS`, not a repair of a
prior failure. The owner was notified at cycle 3 per `notifyOwnerAfter: 3`.

## Scope of this cycle

Per the brief, this cycle reviews only the owner's post-`PASS` deep-research amendment plus any
contradictory evidence it creates. `git diff --name-only 74c6299b0 5f199642f`, excluding run
artifacts, is exactly six files:

`lane-policy.md`, `delegation-matrix.ts`, `delegation-matrix_test.ts`, `routing-policy.ts`,
`routing-policy_test.ts`, `routing-policy-doc-parity_test.ts`.

No expense-watcher, credential-loader, provider-profile, OpenCode-runner, or `config/` file changed
since cycle 4, so cycle 4's verified findings on those surfaces stand unchanged; the full agentic
suite was nonetheless re-executed here in full.

## Cycle-4 finding closeout

| # | Cycle-4 finding                                           | Result  | Evidence                                                                                                                                                                                               |
| - | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | PR body materially stale, contradicting the head (medium) | PARTIAL | Body fully rewritten with accurate Summary, Why, Safety boundaries, Validation, and Evaluation sections. But its Validation block still cites cycle-4 numbers and omits this amendment — see Finding 1 |
| 2 | `status:` label stale (`status:plan-eval`) (low)          | PASS    | `gh pr view 1989` labels are now `status:impl`, `ci:skip-e2e`, `type:chore`, `priority:p1`, `ci:skip-scaffold`, `area:agent-tooling` — exactly one `status:` label, and it is accurate                 |
| 3 | Brief's exact-head SHA did not exist (low)                | PASS    | `git cat-file -t 5f199642f43820ec59b8e1770940a3b61f8cdf43` → `commit`; the full SHA in this brief resolves                                                                                             |

## Amendment verification — owner requirements

Every requirement the brief sets for the amendment was verified by reading source **and** by
executing a runtime probe against the built modules at this head.

| Requirement                                                                                               | Result | Executed evidence                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemini 3.8 Flash at `low` / `medium` / `high` for simple / straightforward / feature+complex+architecture | PASS   | Probe resolved all five tiers: `simple→low`, `straightforward→medium`, `feature/complex/architecture→high`, each as `gemini_3_8_flash / agy / gemini-3.8-flash`, `agent=antigravity`, `provider=google`. Matches `research.md` amendment table exactly                                                                             |
| Luna `max` is the sole fallback                                                                           | PASS   | With `unavailableModels: ['gemini_3_8_flash']`, all five tiers resolved to `luna / codex / gpt-5.6-luna` at `max` — the **native** Codex slug, not `opencode-go/gpt-5.6-luna`. Each cell declares exactly two routes                                                                                                               |
| Only native `agy` and native Codex transports may resolve                                                 | PASS   | `DEEP_RESEARCH_TRANSPORTS = ['agy','codex']` (`delegation-matrix.ts:246`), enforced in `resolveRouteChain`'s capability `.find(...)` (`routing-policy.ts:153-156`) via `isTransportAllowedForRole`                                                                                                                                 |
| Claude / Go / Ollama / OpenRouter rejected **by resolution**                                              | PASS   | Decisive probe: with Gemini unavailable **and** `codex` unavailable, resolution throws `no available route in the declared fallback chain` for every blocked-transport combination tested. Without the guard, Luna's `opencode_go` capability would have been selected — the metered fall-through is closed                        |
| Claude / Go / Ollama / OpenRouter rejected **by concrete-model validation**                               | PASS   | `assertWorkloadModelAllowed` now ANDs the transport guard into the capability match (`delegation-matrix.ts:404-407`). Probe rejected `lunaGo`, `opus5Native`, `glm53FlashOpenRouter`, `glm53Ollama`, `kimiK3Ollama`, and an unknown `ollama-cloud/*` slug across **all five tiers**, while accepting native Gemini and native Luna |
| Privileged authorization still gates `complex` / `architecture`                                           | PASS   | Probe: `resolveWorkloadRoute({tier:'complex'\|'architecture', role:'deep_research'})` without authorization throws `… workload tier requires explicit owner or milestone-coordinator authorization`. The gate is tier-scoped and role-independent (`routing-policy.ts:179`), so the new role cannot escape it                      |
| No regression for existing roles                                                                          | PASS   | `isTransportAllowedForRole` returns `true` for every non-`deep_research` role. Probe confirmed `feature/implementation_evaluation` still resolves `muse_spark_1_3 / opencode_go`, and the paid Go model is still accepted by `assertWorkloadModelAllowed`                                                                          |

**Source fidelity.** All ten new entries carry owner-stated efforts in `research.md`'s amendment
table, so the cycle-3 unstated-effort convention issue cannot recur here. I compared the generated
`Deep research` column cell-by-cell against that table: all five rows match.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                                                     |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 `PASS` at `372409ab6`, preceding the first production slice `605ae0e02`. The amendment is recorded as locked decision **10** in `plan.md`, so it is inside approved scope rather than unplanned drift |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design`; amendment rows added at `2026-09-04T17:15Z` and `17:22Z`                                                                                                                                           |
| Commit slices match design plan        | PASS   | S1 `605ae0e02` → S5 `1f02dde27`; repairs `8740b16de`, `fab66b3dc`, `74c6299b0`; amendment `5f199642f`                                                                                                                        |
| Each slice has a passing gate          | PASS   | `worklog.md` Gate Results; the amendment's gates re-executed independently below                                                                                                                                             |
| No speculative seams (unused files)    | PASS   | `isTransportAllowedForRole` has two production consumers — `delegation-matrix.ts:405` and `routing-policy.ts:155`; `DEEP_RESEARCH_TRANSPORTS` is consumed by the guard and pinned by test                                    |
| Constants used for finite vocabularies | PASS   | `DEEP_RESEARCH_TRANSPORTS` is an `as const` array with a derived type; `deep_research` was added to the existing `DELEGATION_ROLES` const rather than introduced as a loose literal                                          |
| Drift recorded                         | PASS   | `drift.md` "2026-09-04 — Post-PASS deep-research matrix amendment" records what, route, boundary, why, authorization, and the reopening of PR #1989 to draft                                                                 |

## Static Gates

Every row below was **executed in this evaluator session** unless marked otherwise.

| Gate             | Command or check                                                    | Result  | Evidence                                                                                                                          | Notes                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts`              | PASS    | `filesSelected:187, batches:2, failedBatches:0, totalOccurrences:0`                                                               | Matches the brief's 187/0 claim                                                                                                                                                                                 |
| Slice typecheck  | `run-deno-test.ts -- --allow-all` on matrix + resolver + doc-parity | PASS    | `passed:25, failed:0, ignored:0, exitCode:0, 156 ms`                                                                              | Matches the brief's 25/25 claim                                                                                                                                                                                 |
| Full agentic     | `run-deno-test.ts -- --allow-all .llm/tools/agentic/`               | PASS    | `passed:585, failed:0, ignored:0, exitCode:0, 28,600 ms`                                                                          | Matches the brief's 585 claim (was 583)                                                                                                                                                                         |
| Format (TS)      | `run-deno-fmt.ts --file` on all five changed TypeScript files       | PASS    | `filesSelected:5, filesProcessed:5, findings:0, failedBatches:0`                                                                  |                                                                                                                                                                                                                 |
| Format (MD)      | `deno fmt --check` on all seven changed Markdown files              | PASS    | `Checked 7 files`, no findings                                                                                                    |                                                                                                                                                                                                                 |
| Whitespace       | `git diff --check 74c6299b0 5f199642f`                              | PASS    | clean                                                                                                                             | Matches the brief's `diff --check` claim                                                                                                                                                                        |
| Lint             | structured wrapper on `.llm/**`                                     | N/A     | `deno.json` `lint.exclude` includes `.llm/`                                                                                       |                                                                                                                                                                                                                 |
| Doc lint         | package `deno doc --lint`                                           | N/A     | No `packages/**` or `plugins/**` in the diff                                                                                      |                                                                                                                                                                                                                 |
| Publish dry-run  | `deno publish --dry-run`                                            | N/A     | Internal tooling only                                                                                                             |                                                                                                                                                                                                                 |
| Link/path check  | lane-policy generated block vs typed matrix                         | PASS    | `routing-policy-doc-parity_test.ts` executed green inside the 25, now asserting the eight-column header including `Deep research` | Machine-proven                                                                                                                                                                                                  |
| Repo check/test  | `deno task check` / `deno task test`                                | NOT_RUN | Cycle-4 generator-reported figures stand: 3,140 files / 0 diagnostics; 5,278 passed / 0 failed / 19 ignored                       | Justified: the amendment touches only `.llm/tools/agentic/runtime/**` and `lane-policy.md`; no file outside `.llm/tools/agentic/**` imports the changed modules, and that whole tree was re-verified green here |

## Fitness Gates

Package F-CLI / JSR / public-surface gates are `N/A` per the approved plan's Archetype-gate
applicability section.

| Gate | Function                          | Result | Evidence                                                                                                                                 | Violations |
| ---- | --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | `delegation-matrix.ts` 520 LOC (+21); `routing-policy.ts` 238 LOC (+5)                                                                   | none       |
| F-2  | Helper-reinvention scan           | N/A    | internal tooling                                                                                                                         |            |
| F-3  | Layering check                    | N/A    | no `packages/**`                                                                                                                         |            |
| F-4  | Inheritance audit                 | N/A    |                                                                                                                                          |            |
| F-5  | Public surface audit              | N/A    |                                                                                                                                          |            |
| F-6  | JSR publishability gate           | N/A    |                                                                                                                                          |            |
| F-7  | Doc-score gate                    | N/A    |                                                                                                                                          |            |
| F-8  | Workspace `lib` override check    | N/A    |                                                                                                                                          |            |
| F-9  | Permission declaration check      | PASS   | No `deno.json` task or permission change in the amendment                                                                                | none       |
| F-10 | Test-shape audit                  | PASS   | New tests assert behaviour at the boundary that matters — the throw when both native transports are unavailable, not just the happy path | none       |
| F-11 | Forbidden-folder lint             | N/A    | pre-existing agentic `lib/`                                                                                                              |            |
| F-12 | Naming-convention lint            | PASS   | `deep_research` follows the existing snake_case role vocabulary; `DEEP_RESEARCH_TRANSPORTS` follows the const-array convention           |            |
| F-13 | Saga and runtime invariants       | N/A    |                                                                                                                                          |            |
| F-14 | Console-log lint                  | N/A    | no CLI edge changed                                                                                                                      |            |
| F-15 | Re-export-of-upstream lint        | N/A    |                                                                                                                                          |            |
| F-16 | Folder-cardinality lint           | N/A    |                                                                                                                                          |            |
| F-17 | Abstract-derived co-location lint | N/A    |                                                                                                                                          |            |
| F-18 | Sub-barrel lint                   | N/A    |                                                                                                                                          |            |
| F-19 | Scoped source gate runners        | PASS   | Structured wrappers used for every gate; no raw root `deno fmt` verdict claimed                                                          |            |

## Runtime Gates

| Gate                          | Validation                                                               | Result | Evidence                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep-research route encoding  | efforts and fallback match the owner amendment                           | PASS   | See the Amendment verification table; all five rows match `research.md` cell-by-cell                                                                                                              |
| Deep-research transport guard | resolution and concrete-model validation both fail closed                | PASS   | Executed probe across all five tiers; the metered fall-through to `opencode_go` is provably closed                                                                                                |
| Matrix encoding fidelity      | every other cell unchanged                                               | PASS   | `git diff` shows only additive `deep_research` entries; no existing route line modified                                                                                                           |
| Different-family composition  | coverage proof + skip-same-family at selection                           | PASS   | `validateDelegationMatrix()` asserted `[]` in the executed suite; `resolveRouteChain` still skips `definition.family === generatorFamily`                                                         |
| Provider order                | Claude → Codex → Google → Go → Ollama → OpenRouter                       | PASS   | `MODEL_TRANSPORT_PRIORITY` unchanged and asserted green; the deep-research guard filters _after_ priority sorting, so it narrows rather than reorders                                             |
| Privileged-row authority      | complex/architecture fail closed without authorization                   | PASS   | Executed probe for `deep_research`; existing launcher spy tests for other roles green in the 585                                                                                                  |
| Matrix-cell model membership  | concrete model must belong to the selected cell                          | PASS   | `opencode-run_test.ts` denial tests green in the 585; probe confirms the new transport dimension is enforced without weakening the existing cell check                                            |
| Authenticated Go usage        | live fetch; caller snapshots rejected                                    | PASS   | Unchanged since cycle 4 and green in the 585. **Live probe re-run**: Go with no credential and `HOME=/nonexistent` → exit 4, `usage_unproven`, error names only `OPENCODE_API_KEY`, never a value |
| Model-adjusted Go windows     | published inclusion scales all three windows                             | PASS   | `subscription-expense_test.ts` asserts `[3, 7.5, 15]` for Grok — green in the 585; matches the `drift.md` live receipt                                                                            |
| Expense fail-closed states    | stale / unproven / mismatch / exhausted / rate-limited / tier-unresolved | PASS   | Green in the 585; live Go probe above                                                                                                                                                             |
| No spawn on denial            | injected command-spawn spy                                               | PASS   | `opencode-run_test.ts` spy tests green in the 585; `preflightOpenCodeExpense` ordering unchanged                                                                                                  |
| Secure credential boundary    | prefix loader, rival-key clear, mode-600, value-free errors              | PASS   | Green in the 585; live probe confirms value-free diagnostics                                                                                                                                      |
| Documentation parity          | generated block equals the typed matrix                                  | PASS   | Parity test extended to the new column and executed green                                                                                                                                         |
| Legacy boundary               | new selection with an old lane fails closed                              | PASS   | `LEGACY_ROUTING_LANES` untouched; rejection test green in the 585                                                                                                                                 |
| Credential leakage            | no secret in tracked artifacts                                           | PASS   | No credential-shaped string in the amendment diff; `git diff --check` clean                                                                                                                       |
| Live receipt honesty          | `drift.md` claims vs executed behaviour                                  | PASS   | The `Vs5ukzqK` cost trace and the `provider_rate_limited` / `$3 / $7.50 / $15` receipt remain recorded without credentials, and remain exactly what the unchanged code produces                   |
| Operator surface              | evaluator rendering unaffected by the new role                           | PASS   | `routing-state.ts` output contains zero `deep_research` lines — `renderCanonicalEvaluatorRoutes` still filters to the three evaluation roles                                                      |
| Release gates                 | cut / `scaffold.runtime`                                                 | N/A    | Not a release cut                                                                                                                                                                                 |

## Consumer Gates

| Consumer                 | Validation              | Result  | Evidence                                                                                                                                                                                                 |
| ------------------------ | ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| published package/plugin | none                    | N/A     | No `packages/**` or `plugins/**` export changes                                                                                                                                                          |
| harness docs overlay     | source alignment        | PASS    | Generated table carries the new column; the `### Deep-research route` prose sits outside the generated markers and correctly states the native-only rule and that privileged authorization still applies |
| operator CLI surface     | task map                | PASS    | `task-separator_test.ts` green in the 585; no task added or changed                                                                                                                                      |
| PR lifecycle             | draft state and threads | PARTIAL | `isDraft:true`, `MERGEABLE`/`CLEAN`, `headRefOid` matches local HEAD, exactly one accurate `status:impl` label, `review-threads PASS threads=0 unanswered=0`. Body Validation block is stale — Finding 1 |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                        | Notes |
| ----- | ------ | ------------------------------------------------------------------------------- | ----- |
| AP-1  | CLEAR  | +21 / +5 LOC in the two production files                                        |       |
| AP-2  | N/A    |                                                                                 |       |
| AP-3  | N/A    |                                                                                 |       |
| AP-4  | N/A    |                                                                                 |       |
| AP-5  | N/A    |                                                                                 |       |
| AP-6  | N/A    |                                                                                 |       |
| AP-7  | N/A    |                                                                                 |       |
| AP-8  | N/A    |                                                                                 |       |
| AP-9  | N/A    |                                                                                 |       |
| AP-10 | N/A    |                                                                                 |       |
| AP-11 | CLEAR  | guard is a pure predicate threaded through the existing seams, not a new global |       |
| AP-12 | N/A    |                                                                                 |       |
| AP-13 | N/A    |                                                                                 |       |
| AP-14 | N/A    |                                                                                 |       |
| AP-15 | CLEAR  | no `IFoo` / `FooT`                                                              |       |
| AP-16 | N/A    |                                                                                 |       |
| AP-17 | N/A    |                                                                                 |       |
| AP-18 | CLEAR  | new tests assert the denial boundary, not just the happy path                   |       |
| AP-19 | N/A    |                                                                                 |       |
| AP-20 | N/A    |                                                                                 |       |
| AP-21 | N/A    |                                                                                 |       |
| AP-22 | N/A    |                                                                                 |       |
| AP-23 | N/A    |                                                                                 |       |
| AP-24 | CLEAR  | role/transport policy expressed as typed data, not a vendor switch              |       |
| AP-25 | CLEAR  | no new IO or process boundary                                                   |       |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                   |
| --------------------- | ----- | -------------------------------------------------------------------------- |
| New entries           | 0     | `debt/arch-debt.md` is not in the diff                                     |
| Resolved entries      | 0     |                                                                            |
| Deepened violations   | 0     | The amendment narrows an existing policy surface; it adds no new violation |
| Unrecorded violations | 0     | The one finding below is PR body currency, not doctrine                    |

## Findings

| Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                            | Evidence                                                                                                                                                                      | Required action                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| low      | **PR #1989's Validation block is one cycle stale and the body omits the deep-research amendment.** It cites "focused … 59 passed" and "full agentic suite: 583 passed" — the cycle-4 figures. At this head the focused matrix/parity subset is 25/25 and the agentic suite is **585**. Neither the Summary nor the Safety boundaries mention the native-only deep-research role, which is a user-visible routing rule and a spend-safety boundary. | `gh pr view 1989 --json body`; measured this session: 25/25 focused, 585/585 agentic. Cycle-4 Finding 1 was otherwise fixed — the body is now accurate in every other section | fix before promotion: refresh the Validation figures and add the deep-research bullet to Summary and Safety boundaries |

No implementation defect was found at this head.

### Observations (non-blocking)

1. **`validateDelegationMatrix()` was not extended for the new role.** It is hand-enumerated over
   `implementation`, `plan`, and `documentation` (`delegation-matrix.ts:483-508`). This is correct
   today — the owner's amendment declares no evaluator, no evaluator column, and no round policy for
   deep research, so there is nothing to prove coverage against. But the function will silently
   under-cover if a future role is given an evaluator requirement.
2. **Committed tests omit an Ollama case** from the deep-research concrete-model denial list
   (`delegation-matrix_test.ts:170-185` covers Go, Claude, and OpenRouter). I verified by probe that
   Ollama slugs are rejected across all five tiers, so this is test completeness, not a behaviour
   gap — no deep-research cell declares a model with an `ollama` capability, so the case is
   structurally unreachable anyway.
3. `resolveWorkloadRoute` passes `{ ...request, role: request.role }` (`routing-policy.ts:196`); the
   explicit `role` is redundant because `request` already carries it. Cosmetic.
4. Deep research has no `deepResearchPolicy` round policy alongside `planPolicy` /
   `implementationPolicy` / `documentationPolicy`. None was declared by the owner; noted only so the
   omission is a recorded choice rather than an oversight.
5. Carried forward from cycles 3–4 and still true: the per-tier evaluation-policy prose at
   `lane-policy.md:94-100` sits outside a `generated-*` block (values re-verified as matching);
   `routing-state_test.ts` uses `assertStringIncludes` probes; `complex/implementation_evaluation`
   has no distinct fallback (faithful to `research.md:18`); `MODEL_IDS`' doc comment is stale; and
   `routing-policy_test.ts:107` names a `claude`-transport route `ollama`.

## Lessons for Promotion

| Lesson                                                                                          | Pattern                                                                                                             | Applies to                     | Confidence |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| Role-scoped transport allowlists belong at both the resolver and the manual-validation boundary | A resolver-only guard would still let an operator hand-launch `opencode-go/gpt-5.6-luna` for deep research          | any capability-restricted role | high       |
| The decisive test for a fallback ban is the _exhaustion_ case, not the happy path               | `unavailableModels: ['gemini'] + unavailableTransports: ['codex']` → throw is what proves Go cannot absorb the cost | paid-fallback policy           | high       |
| A doc-parity gate keyed on the header row catches an added column automatically                 | Extending `DelegationCell` forced a visible parity failure until the generated table gained its column              | generated-policy surfaces      | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Rationale | The owner's deep-research amendment is correct, tightly bounded, and proven. Six non-artifact files changed, all required by the amendment; no existing route line was modified. Every owner requirement verified by source reading and by an executed runtime probe: Gemini 3.8 Flash resolves at `low`/`medium`/`high` by tier on `agy`, Luna `max` is the sole fallback and resolves to the **native** Codex slug, and the metered fall-through is provably closed — with Gemini and `codex` both unavailable, resolution throws instead of selecting Luna's `opencode_go` capability. The ban is enforced at both boundaries the brief demands: `resolveRouteChain` for resolution and `assertWorkloadModelAllowed` for concrete-model validation, the latter rejecting Go, Claude, OpenRouter, and Ollama slugs across all five tiers while accepting the two native ones. Privileged authorization still gates `complex`/`architecture` for the new role, and non-deep-research roles are provably unaffected. All efforts are owner-stated in `research.md`, so the cycle-3 unstated-effort class cannot recur. Gates executed here: 187 files / 0 diagnostics, 585/585 agentic, 25/25 focused matrix+resolver+parity, five TypeScript and seven Markdown files format clean, `git diff --check` clean, and a live credential-free Go probe still failing closed with exit 4 and value-free diagnostics. Cycle-4 Findings 2 and 3 are closed; Finding 1 is materially fixed. The single remaining finding is that the PR body's Validation block still quotes cycle-4 numbers and never mentions the new role — a pre-promotion documentation fix, not an implementation defect. **This verdict covers the implementation at `5f199642f43820ec59b8e1770940a3b61f8cdf43`; promotion additionally requires that body refresh plus exact-head CI.** |
