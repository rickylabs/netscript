# Evaluation: PR #1391 — chore(agentic): refresh native model routing

## Metadata

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Run ID         | `chore-update-agent-model-routing--policy`                                 |
| Target         | branch `chore/update-agent-model-routing` (commit `ebc7ac0d5`) vs `origin/main` (`fac9e3390`) |
| Archetype      | N/A — harness policy/tooling change, no `packages/`/`plugins/` source      |
| Scope overlays | docs (policy prose) + agentic tooling; fixture-label-only test edits       |
| Evaluator      | Native opposite-family IMPL-EVAL: Claude · Anthropic · Fable 5 · medium, fresh session, 2026-08-08. Generator: Codex GPT-5.6 Sol (separate session). |

## Process Verification

| Check                                  | Result | Evidence                                                                 |
| -------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | Justified `PLAN-EVAL: N/A` recorded in `worklog.md` and `supervisor.md` before implementation (bounded owner-specified migration with machine assertions) |
| Design section exists in worklog       | PASS   | `worklog.md § Design` — surface, vocabulary, ports, constants, slices, deferred scope |
| Commit slices match design plan        | PASS   | One bounded slice planned, one commit `ebc7ac0d5` delivered              |
| Each slice has a passing gate          | PASS   | Worklog gate evidence independently re-verified below (40/40, 15/15, lint clean, surface valid) |
| No speculative seams (unused files)    | PASS   | Diff adds only exercised policy entries + tests; new `formal_*` native entries covered by `routing-policy_test.ts` |
| Constants used for finite vocabularies | PASS   | Model ids sourced from `MODEL_IDS`/`OPENCODE_MODEL_IDS`; `no-hardcoded-volatile_test.ts` Layer A/B green |
| Per-slice draft-PR comment             | FAIL   | `gh pr view 1391 --json comments` → empty; commit trail exists via commit list but the per-slice PR comment required by the harness commit-trail rule is missing |

## Verification of the eight owner questions

| # | Claim                                                            | Result | Evidence |
| - | ---------------------------------------------------------------- | ------ | -------- |
| 1 | Opus 5 high is the default orchestrator                          | PASS   | `routing-policy.ts` `planning_decisions` → `MODEL_IDS.opus`/`high`, `condition: 'default_orchestrator'`; test "orchestrator defaults to Opus 5 high…" green |
| 2 | Fable 5 medium is the deep-analysis default                      | PASS   | `deep_analysis` → `MODEL_IDS.fable`/`medium`; same test; Sol·high token-limit fallbacks verified (`fallback_on_opus_token_limit` / `fallback_on_fable_token_limit`) |
| 3 | Native opposite-family Claude ⇄ Codex is primary PLAN/IMPL eval   | PASS (code) / stale prose remains (F-1, F-2) | New unconditioned `evaluatesFamily` entries: Fable 5·medium evaluates `openai` (both phases); Sol·high (plan) / Sol·xhigh (impl) evaluate `anthropic`. `resolveCanonicalFormalEvaluatorRoute()` selects them by author family and throws on same-family or reused-session; test "formal evaluator defaults to a native opposite-family session" green |
| 4 | Minimax/DeepSeek only third-opinion or native-quota escalation    | PASS   | OpenRouter entries now carry `condition: 'third_opinion_or_native_limit'`; resolver reaches them only with `fallbackReason: 'third_opinion' \| 'native_quota_limit'`; open-only policy retained; test green |
| 5 | AGY Gemini 3.6 Flash high only on OpenRouter limit                | PASS   | `fallback_on_openrouter_limit` antigravity entries retained for both phases; resolver requires `fallbackReason: 'openrouter_limit'`; test "falls back to AGY … only on explicit …" green |
| 6 | Kimi K3 and Gemini 3.6 Flash identities current in executable policy | PASS | `config/models.ts`: `OPENCODE_MODEL_IDS.visionEval = 'openrouter/moonshotai/kimi-k3'`, `antigravityDocs = 'gemini-3.6-flash-high'`; `documentation_authoring`/`research_extraction` rebind to `antigravityDocs`; `opencode-eval.ts` + README example updated |
| 7 | Historical evidence and benchmark pins not misleadingly rewritten | PASS   | Repo-wide stale-id scan: all remaining `opus-4.8`/`kimi-k2.6` hits are in archived `.llm/runs/**` evidence and `packages/bench/bench.config.ts` pricing pins — none touched by the diff; preservation recorded in `drift.md`. Minor note N-1 below |
| 8 | Tests enforce new behavior; no active stale routing               | FAIL   | Tests do enforce (40/40, incl. rejection of wrong-family native route, cross-phase presets, stale Qwen ids). But two **active** surfaces still state the retired OpenRouter-first evaluator route: findings F-1, F-2 |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Routing + volatile guards | `deno test .llm/tools/agentic/runtime/routing-policy_test.ts .llm/tools/agentic/config/no-hardcoded-volatile_test.ts` | PASS | `ok \| 40 passed \| 0 failed` (run by evaluator) | matches worklog claim |
| Fresh UI fixtures | `deno test packages/fresh-ui/tests/registry/components/ui/{message,model-selector,prompt-input}.test.tsx` | PASS | `ok \| 15 passed \| 0 failed` (run by evaluator) | label-only fixture edits |
| Lint             | `.llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts` | PASS | 161 files, 0 occurrences (run by evaluator) | |
| Claude surface   | `.llm/tools/agentic/claude/validate-claude-surface.ts` | PASS | `{"gate":"agentic:check-claude","ok":true, … "agentic:sync-claude OK: 18 skill(s), 22 mirrored file(s)"}` (run by evaluator) | confirms `.claude/skills/netscript-release` change is legitimate mirror catch-up of `.agents` content already on `main` (#1341), not a hand-edit |
| Whitespace       | `git diff --check origin/main...HEAD` | PASS | exit 0 | |
| Format / Doc lint / Publish dry-run | — | N/A | no package source or publish surface changed | |

## Fitness Gates

N/A — no `packages/`/`plugins/` framework source changed (fixture test labels only; `quality:scan`/`arch:check` class gates out of scope for this diff).

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| e2e  | skipped    | N/A    | `ci:skip-e2e` + `ci:skip-scaffold` applied and recorded; diff is policy/docs/tooling + fixture labels — cheap lane is intentional |

## Anti-Pattern Check

N/A — no framework-layer code in scope. Volatile-value single-home rule (repo law) independently verified green via `no-hardcoded-volatile_test.ts`.

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | none required; historical-pin preservation recorded in run `drift.md` |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | — |
| Unrecorded violations | 0     | — |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| high (F-1) | Active stale evaluator routing in the harness skill: `netscript-harness/SKILL.md` "Common Pitfalls → Wrong evaluator surface" still asserts local PLAN/IMPL-EVAL **are** separate Claude Code + OpenRouter sessions on the Minimax/DeepSeek presets and that "both evaluator transports are open-models-only" — contradicting the updated "Evaluator Separation" section of the same file and the new native-first policy. Loaded on every harness activation, including this one. | `.agents/skills/netscript-harness/SKILL.md:137-152` + generated mirror `.claude/skills/netscript-harness/SKILL.md:137-152` | fix: rewrite the pitfall bullet to native-first (OpenRouter = third-opinion/native-quota escalation, AGY = OpenRouter-limit fallback), regenerate the mirror |
| high (F-2) | `CLAUDE.md` "Claude Supervisor Rules" restates the retired route: "Evaluation runs on the evaluator lane … locally Claude Code + OpenRouter with an **open model**, and OpenHands for automated cloud runs. Both evaluator transports are open-models-only." This is supervisor startup context for every Claude session and is now active stale routing. | `CLAUDE.md:9-12` | fix: align the paragraph with the native-first evaluator route (or reduce it to a pointer at `lane-policy.md`, which CLAUDE.md's own Reasoning Policy already mandates) |
| low (F-3) | Draft PR #1391 has zero per-slice comments; the harness commit-trail rule requires each slice to commit, push, **and comment** on the draft PR. | `gh pr view 1391 --json comments` → empty | fix: coordinator posts the slice/phase comment with commit hash + gate evidence before ready-merge |
| note (N-1) | `packages/bench/bench.config.ts:6-7` prose still says Opus 4.8 is "the model the framework's own agents run on". The pricing pin itself is correctly preserved measured data, but that clause is now an inaccurate present-tense claim. Non-blocking; fix opportunistically or when opus-5 pricing is verified. | `packages/bench/bench.config.ts:6-7,22` | optional follow-up |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Routing migrations need a wrapped-line stale scan | Single-line greps for `Claude Code + OpenRouter` miss prose wrapped across Markdown lines; scan for anchor tokens (`claude-print`, preset ids) too | harness policy migrations | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **FAIL_FIX** |
| Rationale | The executable policy, tests, and nearly all prose surfaces correctly implement all eight owner decisions, and every scoped gate re-ran green under this evaluator. But the migration's own scope ("align protocols/skills/docs and generated Claude mirrors") leaves two high-visibility **active** surfaces asserting the retired OpenRouter-first evaluator route: the `netscript-harness` skill's "Wrong evaluator surface" pitfall bullet (F-1, self-contradictory within the file) and the `CLAUDE.md` supervisor rules (F-2). Both are loaded at session/run start and would steer future supervisors to the wrong formal-evaluator transport. Fixes are small and bounded; no rescope or debt entry is needed. F-3 (missing per-slice PR comment) rides along with the fix commit. |
