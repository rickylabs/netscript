<!--
Observed evaluator provenance (recorded by the supervisor; report body below is verbatim):
- Transport: Claude Code + OpenRouter (`claude-openrouter` profile -> `claude-print`)
- Model: `qwen/qwen3.8-max`
- Session: `039835cf-151b-4152-98b8-1037f8c6330c`
- Permission mode: `bypassPermissions`
- Raw transcript: `impl-eval-raw.txt`
- Prompt: `impl-eval-prompt.md`
-->
# Evaluation: phase-specific formal evaluator defaults (issue #1331 / PR #1336)

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `chore-qwen-3-8-evaluator--1331` |
| Target         | Formal evaluator phase defaults: agentic routing/presets/guards/canaries, harness docs, canonical skills, generated mirrors |
| Archetype      | N/A — maintainer harness/tooling/configuration; no `packages/**` or `plugins/**` surface |
| Scope overlays | docs |
| Evaluator      | Separate local IMPL-EVAL session `039835cf-151b-4152-98b8-1037f8c6330c` · OpenRouter `qwen/qwen3.8-max` · `claude-openrouter` profile → `claude-print` · 2026-08-06 |

Distinct from the Codex GPT-5.6 Sol generator (thread `019fd71b-df96-78b0-80a1-bc2e518a161b`) and from the Minimax M3 PLAN-EVAL session (`815534c7-6c02-4aa5-ab86-a905a0bade6f`). Observed session identity matches the requested canonical IMPL-EVAL route.

## Process Verification

| Check                                  | Result | Evidence                    |
| -------------------------------------- | ------ | --------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `PASS` from separate `minimax/minimax-m3` session `815534c7-…`; committed in `40b531770` before S1 (`52f1e3480`). Raw transcript init event confirms model `minimax/minimax-m3` and session id. |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` (public surface, vocabulary, ports, constants, slices, contributor path). |
| Commit slices match design plan        | PASS   | 3 implementation slices in plan order: S1 `52f1e3480`, S2 `94d793e2f`, S3 `96d2a9e3c` (+ bootstrap/reconcile/PLAN-EVAL artifact commits `708e3d55b`, `06114ca10`, `0e1bd6cf9`, `40b531770`). Branch tip `96d2a9e3c` == `origin/chore/qwen-3-8-evaluator`. |
| Each slice has a passing gate          | PASS   | S1: focused 52/52 after fixes, Grok 4.5 re-review PASS. S2: focused 98/98, full suite 416/416, static + both bounded live canaries, re-review PASS. S3: sync/surface/docs gates, 417/417, residue audit, re-review PASS. Per-slice PR comments form the commit trail. |
| No speculative seams (unused files)    | PASS   | All 51 files in `origin/main...HEAD` map to S1–S3 file lists in `plan.md`; spot-reads (`contract.ts`, `provider-profiles.ts`, `routing-policy.ts`, `claude-print.ts`) show every new surface consumed by tests/guards. |
| Constants used for finite vocabularies | PASS   | `no-hardcoded-volatile_test.ts` 4/4 green in evaluator re-run; model ids live only in `config/models.ts`; presets are `Object.freeze`d records keyed by typed ids. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | Evaluator re-run: 149 files, 2 batches, 0 failed, 0 occurrences. | Mandatory wrapper verdict source. |
| Slice typecheck  | Same wrapper + `deno test` compilation of the suite | PASS | Evaluator re-run of full suite compiles all test modules. | |
| Format           | `run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | Evaluator re-run: 149 files, 0 failed batches, 0 findings. | |
| Lint             | `run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | Evaluator re-run: exit 0, 149 files, 0 findings. | |
| Doc lint         | `deno task docs:links` + `deno task docs:accuracy` | PASS | Evaluator re-run: 102 docs, 0 broken links/anchors/orphans; accuracy PASS. | Completes `docs:maintenance` with the sync/check legs re-run below. |
| Publish dry-run  | — | N/A | No publishable surface in diff. | |
| Link/path check  | `docs:links` | PASS | As above. | |

## Fitness Gates

Archetype is N/A (maintainer tooling under `.llm/**`, `.agents/**`, repo docs); the Archetype 1–6 fitness matrix does not bind. The plan's own fitness gates were exercised instead:

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1 … F-19 | Package/plugin fitness matrix | N/A | No `packages/**`/`plugins/**` file in `git diff --name-only origin/main...HEAD` (evaluator-verified). | none |
| Plan-V1 | Volatile/hardcoded-model guard | PASS | Evaluator re-run: 4/4 green; residue audit below. | none |
| Plan-V2 | Generated-surface parity | PASS | `agentic:sync-claude:check` 18 skills / 22 mirrors OK (evaluator re-run); `agentic:check-claude` OK incl. 3 lock-hook probes (evaluator re-run); mirror files sha256-identical to canonical `.agents/skills` sources (evaluator-verified). | none |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| Focused contract set | `deno test --no-lock -A` over no-hardcoded-volatile, provider-profiles, routing-policy, runner-provider-profiles, routing-state | PASS | Evaluator re-run: **52 passed, 0 failed**. Includes phase-route resolution, runner guard attachment, stale-3.7 and cross-phase negative tests. |
| Full agentic suite | `deno test --no-lock -A .llm/tools/agentic/` | PASS | Evaluator re-run: **417 passed, 0 failed** (9s). |
| Static provider canary | `deno task agentic:provider-canary` | PASS | Evaluator re-run: `status:passed`; all 6 presets observed and launch-valid; `claude-evaluator-minimax-m3` and `claude-evaluator-qwen-3-8-max` both `liveEligible:true`, `agenticTurn:supported`. |
| Live PLAN-EVAL canary | Bounded `--live` turn, exact identity | PASS | `s2-evidence.md`: `claude-openrouter` / `claude-evaluator-minimax-m3` / `minimax/minimax-m3` / high, exit 0, tools 6 / reasoning 13 / streaming 18, no diagnostics. Corroborated by the actual Minimax M3 PLAN-EVAL session's recorded tool use and reasoning. |
| Live IMPL-EVAL canary | Bounded `--live` turn, exact identity | PASS | `s2-evidence.md`: `claude-openrouter` / `claude-evaluator-qwen-3-8-max` / `qwen/qwen3.8-max` / high, exit 0, tools 6 / reasoning 148 / streaming 153, no diagnostics. Corroborated by this IMPL-EVAL session itself running agentic turns on the exact model/transport. |
| Stale/cross-phase rejection | Negative tests in `routing-policy_test.ts:440-495` | PASS | Evaluator re-run green: stale `qwen/qwen3.7-max` IMPL route throws `formal impl evaluator requires its canonical phase route`; both cross-phase directions throw; closed model (Opus) and reused generator session throw; Gemini authoring lane throw. |
| Requested-vs-observed identity | Typed `presetId` on `RouteIdentity`; fail-closed `matchOpenRouterPreset`; pre-spawn mismatch rejection; open-model child guard | PASS | `contract.ts` carries `presetId`; ambiguous unqualified Minimax resolves to `null`; mismatched preset/model/effort blocks before spawn (S2 focused tests, in the 417 green); `--enforce-open-evaluator-models` attached only to formal evaluator routes and kills the child on a non-allowlisted model (`claude-print.ts:176-…`); denied-launch evidence preserved in `s1-review-denied-raw.txt` (0 tokens, aborted before inference). |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| `.claude/skills` mirrors | `agentic:sync-claude:check` + `agentic:check-claude` + byte comparison | PASS | Evaluator re-run: 18 skills / 22 mirrored files OK; Claude surface valid; `netscript-harness` and `openhands-handoff` mirrors sha256-identical to canonical `.agents/skills` sources. Canonical sources were edited in the S3 commit and mirrors regenerated via `agentic:sync-claude` (D5). |
| Dogfood consumer bundle | `agentic:dogfood-skills` + audit | PASS | `s3-evidence.md`: generator completed; tracked consumer surface contains no Qwen or formal-evaluator binding; unrelated environment/version churn excluded and recorded in `drift.md`. Not re-run by the evaluator (mutating); recorded evidence plus zero-binding audit is credible. |
| Ordinary slice reviews | Grok 4.5 (owner-authorized) review trail | PASS | S1 FAIL → fixes → re-review PASS; S2 PASS with in-slice hardening → re-review PASS; S3 FAIL (one medium residue finding) → fix → re-review PASS with complete ledger. Observed reviewer identity recorded per review. |

## Anti-Pattern Check

Archetype is N/A; the package/plugin AP matrix does not bind this run. All 25 AP rows are `N/A` on that basis. The plan-level anti-patterns this run owned:

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1 … AP-25 | N/A | Archetype N/A — no package/plugin surface touched | Package/plugin anti-pattern matrix not applicable. |
| Plan-AP volatile-id duplication | CLEAR | Model ids centralized in `config/models.ts`; volatile guard 4/4 green (evaluator re-run). | |
| Plan-AP prose/executable routing drift | CLEAR | `lane-policy.md` rendered rows carry exact lane/preset/model ids matching `CANONICAL_ROUTE_POLICY`; parity test green. | |
| Plan-AP hand-edited generated mirrors | CLEAR | Sync check + sha256 identity prove regeneration from canonical sources. | |
| Plan-AP evaluator self-certification | CLEAR | Generator, PLAN-EVAL, IMPL-EVAL, and ordinary reviews are four distinct sessions with recorded identities. | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0 | No `arch-debt.md` change in the branch diff (evaluator-verified). |
| Resolved entries      | 0 | — |
| Deepened violations   | 0 | The two pre-existing 3.7 run attributions (lines 1148, 1168) are immutable historical evidence naming the actual runs that accepted them; not active bindings, not deepened. |
| Unrecorded violations | 0 | — |

## Findings

| Severity | Finding     | Evidence     | Required action      |
| -------- | ----------- | ------------ | -------------------- |
| low | The six ordinary slice-review briefs (`s1/s2/s3-review-prompt.md`, `s1/s2/s3-rereview-prompt.md`) omit the `## SKILL` chapter required by evaluator protocol rule 13 for evaluation briefs. The implementation, PLAN-EVAL, and IMPL-EVAL briefs all carry it. Impact is nil: the reviews were genuine, identity-recorded, and substantive, and their results were fixed and re-reviewed under the owner-authorized route. | `grep -c '## SKILL'` over the run dir: 1/1/1 for implement/plan-eval/impl-eval prompts, 0 for all six review prompts. | Lesson: include a `## SKILL` chapter in ordinary-review briefs going forward. No rework of this run. |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence |
| --------- | ----------- | -------------- | ---------- |
| Phase-bound evaluator identity belongs in data with negative tests | Two phase-specific lanes + phase-keyed presets + a throwing resolver, proven by explicit stale-id and cross-phase negative tests, made the migration auditable end to end | All harness runs; future evaluator/model migrations | high |
| Ordinary-review briefs need the same SKILL hygiene as implementation/evaluation briefs | A missing `## SKILL` chapter went unnoticed across six briefs because the reviews still succeeded | Harness brief templates | medium |

## Residue Audit (evaluator-reproduced)

Exact case-insensitive audit at HEAD excluding `.llm/runs/**` and `.llm/tmp/**` finds **7 Qwen 3.7 occurrences across 5 paths**, matching the S3 exception ledger one-for-one, and zero occurrences of the retired `formal_evaluation` lane:

| Path | Occurrences | Classification |
| ---- | ----------- | -------------- |
| `.llm/tools/agentic/runtime/routing-policy_test.ts` | 2 | Explicit stale-route rejection fixture (negative test). |
| `.llm/tools/harness/extract-verdict.ts` | 1 | Historical JSDoc attribution of the observed empty-result behavior; executable logic is model-agnostic. |
| `.llm/harness/lessons/validation.md` | 1 | Historical lesson attribution. |
| `.llm/harness/debt/arch-debt.md` | 2 | Immutable evaluator-run attributions. |
| `.llm/tools/agentic/lib/__fixtures__/codex-launch-s1.head.log` | 1 | Captured historical launcher log. |

Every retained occurrence is explicit rejection or immutable historical evidence; no active binding remains.

## Scope and Lock Hygiene (evaluator-verified)

- `git diff --name-only origin/main...HEAD`: 51 files — zero under `packages/**` or `plugins/**`, zero `deno.lock`.
- Working tree: only the pre-existing unrelated dirty `deno.lock` (unstaged) plus this run's untracked eval prompt/transcript; nothing else.
- Branch pushed; local HEAD `96d2a9e3c` equals `origin/chore/qwen-3-8-evaluator`.
- PR #1336: draft, `Closes #1331` in body, milestone `0.0.5`, exactly one `status:` label (`status:impl-eval`) plus taxonomy labels; phase comments (RESEARCH → PLAN → PLAN-EVAL APPROVED → S1/S2/S3) form the commit trail; CI checks resolve skipping/0, consistent with a non-package diff.

## Verdict

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete and independently verified: PLAN-EVAL canonically resolves to `minimax/minimax-m3` (`formal_plan_evaluation` / `claude-evaluator-minimax-m3`) and IMPL-EVAL to `qwen/qwen3.8-max` (`formal_impl_evaluation` / `claude-evaluator-qwen-3-8-max`), enforced in code by a throwing resolver plus a launch-time open-model child guard; stale Qwen 3.7 and cross-phase preset/route use are rejected and proven by negative tests that the evaluator re-ran green. Focused (52/52) and full (417/417) agentic suites, scoped check/lint/fmt (149 files, zero findings), static canary (6/6), both exact-model bounded live canaries, sync/surface checks, and docs gates were re-run and reproduced by this separate `qwen/qwen3.8-max` IMPL-EVAL session. Canonical skills were edited before their generated Claude mirrors, which are byte-identical and sync-clean. Documentation consistently states the phase-specific defaults. The residue audit reproduces exactly: seven Qwen 3.7 occurrences in five paths, all explicit rejection fixtures or immutable historical evidence. No package/plugin surface and no `deno.lock` change entered the branch. One low process finding (missing `## SKILL` chapter in the ordinary-review briefs) requires no rework. Remaining post-verdict obligations belong to the supervisor/milestone orchestrator, not this run: check issue #1331's nine acceptance boxes with linked evidence per the #387 close-gate, flip the PR/issue status labels, undraft, and merge only with orchestrator authority. |
