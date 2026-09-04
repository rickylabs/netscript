# Evaluation: agent model routing and subscription expense policy revamp

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Verdict history (preserved)

| Cycle | Head        | Verdict    | Status                                                                                                                                                                                                                                                     |
| ----- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `9f8ee61a6` | `FAIL_FIX` | Historical. Five bounded findings: Claude dispatch ids, dated Ollama DeepSeek ids, spawn-denial proof, README resolver wording, S4/S5 PR comments.                                                                                                         |
| 2     | `8740b16de` | `PASS`     | Historical and **superseded for merge readiness**. Owner dashboard plus the authenticated Go usage API later disproved the flat-limit and privileged-tier assumptions (`drift.md`, 2026-09-04). Valid only for its evaluated head and then-approved scope. |
| 3     | `4aa178868` | `FAIL_FIX` | **Current** — this evaluation.                                                                                                                                                                                                                             |

Cycle-1 and cycle-2 full texts remain in this file's git history. They are not rewritten.

## Metadata

| Field          | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix`                                              |
| Target         | harness and agentic tooling; draft PR #1989                                                   |
| Archetype      | `6 - CLI / Tooling` (internal tooling, not a published Arch-6 package)                        |
| Scope overlays | docs                                                                                          |
| Evaluator      | Claude Opus 5 xhigh, native Claude transport (Anthropic family); 2026-09-04; separate session |

Exact head evaluated: `4aa178868dec3c0fe54fda4c7e23b3c7e1d63d0f`. Baseline
`a2d7f5f6f686115b5c31bab085692df6e1582aa7`. Generator is OpenAI-family; this session is
Anthropic-family and separate — different vendor family confirmed. Route is the matrix's
`feature/implementation_evaluation` row, resolved to its declared `opus_5@xhigh` candidate on the
`claude` transport (first in `MODEL_TRANSPORT_PRIORITY`, and `opus_5`'s only capability). The launch
prompt explicitly overrode the stale Muse Spark 1.3 / OpenRouter line in `impl-eval-brief.md`; both
candidates in that cell are legal against an OpenAI-family generator, so the substitution preserves
the different-family invariant. No paid OpenCode route was selected, so no expense decision applies
to this evaluation. `complex` and `architecture` are **not** authorized for this run and were not
used.

**Feature-tier loop position:** this is IMPL-EVAL cycle **3 of max 5**. The feature row's
`notifyOwnerAfter: 3` threshold is now reached — notify the owner alongside this verdict.

Working-tree note: local `HEAD` is `8b5fc09c9`
(`chore(harness): rebrief model routing feature
eval`). `git diff 4aa178868..8b5fc09c9` touches only
`impl-eval-brief.md`, so every implementation file inspected is byte-identical to the named exact
head.

## Process Verification

| Check                                  | Result  | Evidence                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS    | `plan-eval.md` cycle 2 `PASS` at `372409ab6`; `git log` order confirms `372409ab6` → `5b3e0184a` → `c11d139f6` all precede the first production slice `605ae0e02`                                                                                                                                                      |
| Design section exists in worklog       | PASS    | `worklog.md:12` `## Design` with Surface, Data flow, Error contract, Contributor path                                                                                                                                                                                                                                  |
| Commit slices match design plan        | PASS    | S1 `605ae0e02` → S2 `da80e6eec` → S3 `b2d3106f0` → S4 `e4bf9dd8c` → S5 `1f02dde27`; repairs `8740b16de`, `fab66b3dc`; gate ledger `4aa178868`                                                                                                                                                                          |
| Each slice has a passing gate          | NOT_RUN | Generator-reported in `worklog.md` "Gate Results" (S1–S5 plus repair rows). Not independently re-executed: Deno and `gh` invocation are unavailable in this evaluator session (see Static Gates note)                                                                                                                  |
| No speculative seams (unused files)    | PASS    | Every new export has a production consumer: `assertPrivilegedTierAuthorization`/`assertWorkloadModelAllowed` → `opencode-run.ts:136-137`; `fetchOpenCodeGoUsageSnapshot` → `opencode-run.ts:148`, `cli/expense-watch.ts:90`; `spawn` seam → `opencode-run.ts:222`; `CANONICAL_ROUTE_POLICY` → `cli/routing-state.ts:5` |
| Constants used for finite vocabularies | PASS    | `LOGICAL_MODEL_IDS`, `MODEL_VENDOR_FAMILIES`, `MODEL_TRANSPORTS`, `WORKLOAD_TIERS`, `PRIVILEGED_WORKLOAD_TIERS`, `DELEGATION_ROLES`, `COORDINATOR_TIERS`, `LEGACY_ROUTING_LANES`, `EXPENSE_PROVIDERS`, `OPENCODE_CREDENTIAL_PROVIDERS` are all `as const` arrays                                                       |

### Resolver-consumer note (not a finding)

`resolveWorkloadRoute`, `resolveCoordinatorRoute`, `selectEvaluator`, `validateDelegationMatrix`,
and `assertEvaluatorIndependence` have test-only consumers. This is **not** a regression: at
baseline `a2d7f5f6f`, `routing-policy.ts` likewise had exactly one production importer
(`runtime/cli/routing-state.ts`), verified with `git grep "routing-policy.ts'"` at both commits. The
approved plan's S2 scoped the resolver to canonical-policy derivation and routing-state output,
which is what shipped; AGENTS.md still requires the supervisor to pass the resolved identity
explicitly to the launcher.

## Static Gates

**Independent execution was not possible in this session.** Every `deno`, `gh`, and structured
wrapper invocation was refused by the session's command policy (`deno --version` → "This command
requires approval"; non-interactive session cannot obtain approval). Per protocol §Operating Rules
6, the gates below were **manually verified** by reading source and tests; generator-reported
figures are attributed, not adopted as independent evidence.

| Gate             | Command or check                                       | Result  | Evidence                                                                                                                                           | Notes                                                        |
| ---------------- | ------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts` | NOT_RUN | Generator-reported: 187 files, 2 batches, 0 diagnostics (`worklog.md` repair row)                                                                  | Deno unavailable to this evaluator                           |
| Slice typecheck  | focused wrapper on matrix/resolver/expense/credential  | NOT_RUN | Generator-reported: 52 focused tests, 0 failed; 583 agentic tests, 0 failed                                                                        | Deno unavailable to this evaluator                           |
| Format           | `run-deno-fmt.ts` on changed TS                        | NOT_RUN | Generator-reported clean                                                                                                                           | Deno unavailable to this evaluator                           |
| Lint             | structured wrapper on `.llm/**`                        | N/A     | `deno.json` `lint.exclude` includes `.llm/`                                                                                                        |                                                              |
| Doc lint         | package `deno doc --lint`                              | N/A     | No `packages/**` or `plugins/**` in the diff                                                                                                       |                                                              |
| Publish dry-run  | `deno publish --dry-run`                               | N/A     | Internal tooling only                                                                                                                              |                                                              |
| Link/path check  | lane-policy generated blocks + README                  | PASS    | Manually recomputed every generated row against `DELEGATION_MATRIX`/`COORDINATOR_MATRIX`: all 5 workload rows and 4 coordinator rows match exactly | Verified by hand, independent of the parity test's execution |

## Fitness Gates

Package F-CLI / JSR / public-surface gates are `N/A` per the approved plan's Archetype-gate
applicability section (no `packages/**`, `plugins/**`, scaffold output, or published CLI surface).

| Gate | Function                          | Result | Evidence                                                                                                                                                | Violations |
| ---- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | `delegation-matrix.ts` 499 LOC; `routing-policy.ts` 233 LOC; `subscription-expense.ts` 266 LOC                                                          | none       |
| F-2  | Helper-reinvention scan           | N/A    | internal tooling                                                                                                                                        |            |
| F-3  | Layering check                    | N/A    | no `packages/**`                                                                                                                                        |            |
| F-4  | Inheritance audit                 | N/A    |                                                                                                                                                         |            |
| F-5  | Public surface audit              | N/A    |                                                                                                                                                         |            |
| F-6  | JSR publishability gate           | N/A    |                                                                                                                                                         |            |
| F-7  | Doc-score gate                    | N/A    |                                                                                                                                                         |            |
| F-8  | Workspace `lib` override check    | N/A    |                                                                                                                                                         |            |
| F-9  | Permission declaration check      | PASS   | `agentic:expense-watch` is `--allow-read --allow-env --allow-net=opencode.ai`; `agentic:opencode` net allowlist widened only to `127.0.0.1,opencode.ai` | none       |
| F-10 | Test-shape audit                  | PASS   | `opencode-run_test.ts:161-305` observes the real process boundary via the injected `spawn` seam and asserts `spawnCalls === 0`/`fetchCalls === 0`       | none       |
| F-11 | Forbidden-folder lint             | N/A    | pre-existing agentic `lib/`                                                                                                                             |            |
| F-12 | Naming-convention lint            | PASS   | finite vocabularies are `as const` arrays; no invented slugs                                                                                            |            |
| F-13 | Saga and runtime invariants       | N/A    |                                                                                                                                                         |            |
| F-14 | Console-log lint                  | N/A    | CLI edges only (`expense-watch.ts`, `opencode-run.ts` `import.meta.main`)                                                                               |            |
| F-15 | Re-export-of-upstream lint        | N/A    |                                                                                                                                                         |            |
| F-16 | Folder-cardinality lint           | N/A    |                                                                                                                                                         |            |
| F-17 | Abstract-derived co-location lint | N/A    |                                                                                                                                                         |            |
| F-18 | Sub-barrel lint                   | N/A    |                                                                                                                                                         |            |
| F-19 | Scoped source gate runners        | PASS   | worklog records structured wrapper use throughout; no raw root `deno fmt` verdict claimed                                                               |            |

## Runtime Gates

| Gate                         | Validation                                                             | Result  | Evidence                                                                                                                                                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Matrix encoding              | five workload tiers, four coordinator tiers, exact owner cells         | FAIL    | 4 of 15 unstated-effort cells deviate from the run's own recorded source — see Finding 1. The remaining cells match `research.md:15-19` exactly                                                                                                              |
| Different-family composition | coverage proof + skip-same-family at selection                         | PASS    | `validateDelegationMatrix()` recomputed by hand for all 5 tiers × implementation/plan/documentation generators: no generator lacks a different-family evaluator. `resolveRouteChain` skips `definition.family === generatorFamily` (`routing-policy.ts:147`) |
| Provider order               | Claude → Codex → Google → Go → Ollama → OpenRouter                     | PASS    | `MODEL_TRANSPORT_PRIORITY` (`delegation-matrix.ts:197-204`) applied via `capabilities.toSorted(...)` (`routing-policy.ts:148-151`); asserted in `delegation-matrix_test.ts:48-57` and `routing-policy_test.ts:95-117,164-174`                                |
| Privileged-row authority     | complex/architecture fail closed without owner/milestone authorization | PASS    | `assertPrivilegedTierAuthorization` (`delegation-matrix.ts:223-233`) called from `selectEvaluator`, `resolveWorkloadRoute:179`, and `preflightOpenCodeExpense:136`; `opencode-run_test.ts:239-271` proves denial before **both** usage fetch and spawn       |
| Matrix-cell model membership | concrete model must belong to the selected cell                        | PASS    | `assertWorkloadModelAllowed` (`delegation-matrix.ts:379-391`) at `opencode-run.ts:137`; `opencode-run_test.ts:273-305` proves Grok Go relabelled as `feature` is rejected with `fetchCalls === 0`, `spawnCalls === 0` — the exact `Vs5ukzqK` incident shape  |
| Authenticated Go usage       | live fetch, caller snapshots rejected                                  | PASS    | `fetchOpenCodeGoUsageSnapshot` (`provider-usage.ts:74-112`) bound to `OPENCODE_GO_USAGE_URL`; `opencode-run.ts:145-147` throws on `--usage-snapshot` for Go; `provider-usage_test.ts:30-43` asserts `Bearer <key>` sent and key absent from the snapshot     |
| Model-adjusted Go windows    | published inclusion scales all three windows                           | PASS    | `openCodeGoEffectiveLimits` (`subscriptions.ts:42-51`): Grok 15/60 → 3 / 7.5 / 15; `subscription-expense_test.ts:45-57` asserts exactly `[3, 7.5, 15]`, matching the live receipt in `drift.md`                                                              |
| Expense fail-closed states   | stale/unproven/mismatch/exhausted/rate-limited/tier-unresolved         | PASS    | `subscription-expense.ts:142-254` + `subscription-expense_test.ts:59-152`; 104.5 % and non-`ok` status both yield `provider_rate_limited` (`:73-77`), unknown model weight yields `usage_unproven` (`:79-81`)                                                |
| No spawn on denial           | injected command-spawn spy                                             | PASS    | `runOpenCode` calls `preflightOpenCodeExpense` at `opencode-run.ts:186`, before env prep, MCP preflight, and spawn (`:222`); three spy tests assert `spawnCalls === 0` across rate-limit, transport-failure, HTTP-503, and malformed-payload paths           |
| Secure credential boundary   | prefix loader, rival-key clear, mode-600, value-free errors            | PASS    | `provider-credential.ts:69-119`; `provider-credential_test.ts:22-83` proves rival keys deleted, `0o100644` rejected without echoing the value, and unknown providers untouched                                                                               |
| Documentation parity         | generated blocks equal the typed matrix                                | PASS    | `routing-policy-doc-parity_test.ts` covers both generated blocks; I recomputed every row by hand and they match. See the Observations note on the ungenerated evaluation-policy table                                                                        |
| Legacy boundary              | new selection with an old lane fails closed                            | PASS    | `rejectLegacyLaneForNewSelection` (`delegation-matrix.ts:494-498`); repo-wide grep confirms the 23 legacy lane names appear **only** in `LEGACY_ROUTING_LANES` and its two tests — no active surface selects them                                            |
| Credential leakage           | no secret in tracked artifacts                                         | PASS    | `grep -rn "OPENCODE_API_KEY="` across `.llm/tools/agentic`, `.llm/harness`, `.agents`, and the run dir returns only the opaque fixture `provider-credential_test.ts:17`. Session ids (`ses_…Vs5ukzqK`) are identity, allowed by AGENTS.md operating rule 7   |
| Live blocked receipt honesty | `drift.md` claim vs code                                               | PASS    | `expense-watch.ts:105` returns `4` when `!decision.allowed`; the recorded `provider_rate_limited` + `$3/$7.50/$15` + no-spawn outcome is exactly what the code produces for Grok Go at ≥100 %                                                                |
| Repo check / test            | `deno task check` / `test`                                             | NOT_RUN | Generator-reported: 3,140 files / 0 diagnostics; 5,278 passed / 0 failed / 19 ignored under executable `TMPDIR=/tmp`                                                                                                                                         |
| Release gates                | cut / `scaffold.runtime`                                               | N/A     | Not a release cut (protocol §Operating Rules 14)                                                                                                                                                                                                             |

## Consumer Gates

| Consumer                 | Validation              | Result | Evidence                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| published package/plugin | none                    | N/A    | No `packages/**` or `plugins/**` export changes in the diff                                                                                                                                                                                                                                                 |
| harness docs overlay     | source alignment        | PASS   | `lane-policy.md`, `evaluator/protocol.md`, `evaluator/plan-protocol.md`, `doc-audit.md`, `netscript-harness`, `claude-manager`, `openhands-handoff`, `codex-wsl-remote`, and `tooling.md` all state the matrix contract; no residual Tier A–E or "opposite-family" vocabulary remains in the rewritten docs |
| operator CLI surface     | `agentic:expense-watch` | PASS   | Registered in `deno.json` and asserted by `task-separator_test.ts` (strict task count 26 → 27) with a matching entry in `tooling.md`                                                                                                                                                                        |

## Anti-Pattern Check

| AP    | Status | Evidence                                                           | Notes                                        |
| ----- | ------ | ------------------------------------------------------------------ | -------------------------------------------- |
| AP-1  | CLEAR  | routing-policy 233 LOC after rewriting a 945-line file             |                                              |
| AP-2  | N/A    |                                                                    |                                              |
| AP-3  | N/A    |                                                                    |                                              |
| AP-4  | N/A    |                                                                    |                                              |
| AP-5  | N/A    |                                                                    |                                              |
| AP-6  | N/A    |                                                                    |                                              |
| AP-7  | N/A    |                                                                    |                                              |
| AP-8  | N/A    |                                                                    |                                              |
| AP-9  | N/A    |                                                                    |                                              |
| AP-10 | N/A    |                                                                    |                                              |
| AP-11 | CLEAR  | `fetch`, `spawn`, `readTextFile`, `stat`, `now` are injected seams |                                              |
| AP-12 | N/A    |                                                                    |                                              |
| AP-13 | N/A    | CLI edges only                                                     |                                              |
| AP-14 | N/A    |                                                                    |                                              |
| AP-15 | CLEAR  | no `IFoo` / `FooT`                                                 |                                              |
| AP-16 | N/A    | pre-existing agentic `lib/`                                        |                                              |
| AP-17 | N/A    |                                                                    |                                              |
| AP-18 | CLEAR  | assertions are semantic, not snapshot-shaped                       | see Observation 2 on `routing-state_test.ts` |
| AP-19 | N/A    |                                                                    |                                              |
| AP-20 | N/A    |                                                                    |                                              |
| AP-21 | N/A    |                                                                    |                                              |
| AP-22 | N/A    |                                                                    |                                              |
| AP-23 | N/A    |                                                                    |                                              |
| AP-24 | CLEAR  | typed capability catalog, not a vendor switch                      |                                              |
| AP-25 | CLEAR  | `Deno.Command` / file IO confined to CLI edges                     |                                              |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                                              |
| --------------------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| New entries           | 0     | `debt/arch-debt.md` is not in the diff                                                                                |
| Resolved entries      | 0     |                                                                                                                       |
| Deepened violations   | 0     |                                                                                                                       |
| Unrecorded violations | 0     | Finding 1 is a source-fidelity defect, not a doctrine violation; Finding 2 is bounded and repairable in documentation |

## Findings

| Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Required action                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| high     | **Four matrix cells raise effort above the run's recorded owner source.** The transcribed owner matrix leaves effort unstated for 15 cells; 11 of them were encoded as `provider_default`, but the four DeepSeek cells were given concrete efforts — three of them `max`, the most expensive setting, on paid Go/Ollama/OpenRouter transports. `lane-policy.md:31-33` states `provider_default` "is not permission to silently raise effort"; inventing `max` where the source states nothing is the same class of unauthorized escalation that caused this run's cost incident. No run artifact ratifies these four values.                                                                                                                                                                                                                                                | `delegation-matrix.ts:285` `deepseek_v4_flash@max`, `:289` `deepseek_v4_flash_vision@high`, `:305` `deepseek_v4_pro@max`, `:308` `deepseek_v4_flash_vision@max` vs `research.md:15` ("MiniMax M3 → DeepSeek V4 Flash", "MiniMax M3 → DeepSeek V4 Flash Vision") and `research.md:16` ("GLM 5.3 Flash → DeepSeek V4 Pro", "DeepSeek V4 Flash Vision → Kimi K3 low"). `grep -rni deepseek` across the run dir returns no rationale in `plan.md`, `worklog.md`, or `drift.md`. The parity gate cannot catch this: it proves code ↔ `lane-policy.md` agreement, not code ↔ owner-source agreement. | fix                                                |
| low      | **The Claude/OpenRouter evaluator transport keeps a two-model allowlist with no matrix carve-out.** `agentic:claude-openrouter` unconditionally enforces `OPEN_EVALUATOR_MODEL_IDS` = {`qwen/qwen3.8-flash`, `z-ai/glm-5.3-flash`} — a hand-maintained set that contains **no** matrix-declared evaluator model (not `meta/muse-spark-1.3-contributor`, `z-ai/glm-5.3`, `deepseek/deepseek-v4-pro-0813`, or `x-ai/grok-4.6`). Nothing is functionally blocked, because `TRANSPORT_AGENT.openrouter === 'opencode'` so the resolver never selects this transport. But `openhands-handoff/SKILL.md` was given an explicit "not selected by the active local matrix" carve-out in this same PR and this transport was not, while the README still calls it "the first-class Claude-over-OpenRouter transport — the OpenCode alternative for local evaluator and review turns." | `openrouter-run.ts:87-95` (`enforceOpenEvaluatorModels: true`, "the guard is never optional here"); `evaluator-model-guard.ts:68`; `config/models.ts:126-134`; `README.md:433`; contrast `openhands-handoff/SKILL.md` "OpenHands is not selected by the active local matrix". `routing-policy.ts:105-112` confirms no matrix route reaches this guard.                                                                                                                                                                                                                                         | fix (one documentation sentence) or record as debt |

### Observations (non-blocking, no action required)

1. **Evaluation-policy prose is outside the parity guard.** `lane-policy.md:81-87` renders per-tier
   round/repair/notify values as hand-written prose, not inside a `generated-*` marker block. I
   verified all ten values against `EvaluationPolicy` by hand and they match exactly today, and
   `delegation-matrix_test.ts:141-166` pins the typed side — but plan S4's "machine markers so human
   policy cannot drift" is only partly realised for this table.
2. **`routing-state_test.ts` weakened from exact-output equality to three `assertStringIncludes`
   probes.** Acceptable for a human-output edge that the parity test now covers structurally, but it
   is strictly less strict than the assertion it replaced.
3. **`complex/implementation_evaluation` has no distinct fallback**
   (`muse_spark_1_3@max →
   muse_spark_1_3@max`), so an unavailable Muse throws rather than falling
   back. This faithfully mirrors `research.md:18` and locked decision 3, so it is the owner's
   declaration, not a defect — noted only so the owner can confirm it is intended.
4. `MODEL_IDS`' doc comment still says "used by the canonical route policy" (`config/models.ts:17`)
   although routing now reads `ROUTING_MODEL_IDS` through the matrix. Cosmetic.
5. `routing-policy_test.ts:107` names a variable `ollama` for a route that correctly resolves to the
   `claude` transport. The assertions are right; the name is stale.

## Lessons for Promotion

| Lesson                                                                 | Pattern                                                                                              | Applies to                        | Confidence |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- | ---------- |
| A doc-parity gate proves code ↔ doc, never code ↔ external source      | Finding 1 passed parity because the invented efforts were rendered into the generated table verbatim | any generated-policy surface      | high       |
| Encode "unstated by owner" as an explicit value, not a per-cell choice | `unspecified_by_owner` exists for round limits; efforts had no equivalent, so four cells drifted     | Arch 6 tooling / routing catalogs | high       |
| Denial proofs should assert the fetch boundary as well as spawn        | `fetchCalls === 0` caught the tier-authority ordering that a spawn-only spy would have missed        | paid-route launchers              | high       |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `FAIL_FIX`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Rationale | The plan remains valid and the post-evaluation corrections are genuinely and well implemented: authenticated live Go usage replaces caller snapshots, model-weighted effective windows produce exactly the recorded $3/$7.50/$15 for Grok, and privileged-tier authority plus matrix-cell membership are both enforced _before_ the usage fetch and the process spawn — proven by named spy tests that reproduce the `Vs5ukzqK` incident shape. The credential boundary, legacy boundary, provider order, family composition, and documentation parity all verify. One bounded defect blocks the pass: four DeepSeek cells encode efforts — three at `max` on paid transports — that the run's own recorded owner matrix does not state, while the other eleven unstated cells use `provider_default`, and no artifact ratifies the difference. For a change whose entire premise is that effort and tier must never be escalated beyond what the owner authorized, that gap is material. Finding 2 is a one-sentence documentation fix. Note also that independent gate execution was impossible in this session (Deno and `gh` refused), so all gate results are manual verification plus attributed generator evidence, not re-execution. |
