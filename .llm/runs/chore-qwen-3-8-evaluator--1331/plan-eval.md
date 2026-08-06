<!-- Observed provenance: OpenRouter model minimax/minimax-m3; session 815534c7-6c02-4aa5-ab86-a905a0bade6f; permission mode bypassPermissions; 2026-08-06. The evaluator-authored body below is verbatim from plan-eval-raw.txt. -->

# PLAN-EVAL — chore-qwen-3-8-evaluator--1331

- Plan evaluator session: MiniMax M3 (`minimax/minimax-m3`) over OpenRouter, separate session from the Codex generator, 2026-08-06
- Run: `chore-qwen-3-8-evaluator--1331`
- Surface / archetype: `.llm/tools/agentic` internal CLI/runtime tooling + `.llm/harness/**` evaluator/workflow docs + canonical skills + generated mirrors; **N/A for the Archetype 6 package matrix** (no `packages/**` or `plugins/**` publishable surface)
- Scope overlays: docs (harness, evaluator, operator documentation, skills, and generated mirrors)
- Issue: #1331 · milestone `0.0.5` (id 23) · priority P0
- Baseline: `origin/main` @ `57c9b5ab3` (HEAD matches; verified 2026-08-06)

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` §Re-baseline re-derives against `origin/main` @ `57c9b5ab3` on 2026-08-06; `git fetch origin main` confirmed. Spot-checks below. |
| Decisions locked                        | PASS              | `plan.md` §Locked Decisions D1–D9, each with rationale. D1/D7 explicitly encode the owner-corrected phase split (PLAN→Minimax, IMPL→Qwen 3.8, separate sessions). |
| Open-decision sweep                     | PASS              | `plan.md` §Open-Decision Sweep covers the three open questions and marks each "safe to defer" / "must resolve now" / "must resolve during S3". My evaluator-run sweep found no unflagged rework-forcing decision (details below). |
| Commit slices (< 30, gate + files each) | PASS              | 3 ordered slices (S1 executable contract, S2 canary/fixture, S3 docs/generated). Each names the proving gate and the files it touches. Slice ordering isolates the executable contract (deterministic) → fixtures/canary (bounded live) → docs/generated (canonical regeneration), which is the correct order for an architecture migration. |
| Risk register                           | PASS              | `plan.md` §Risk Register: 7 risks with mitigations (stale preset slug, permissive guard, doc/mirror drift, silent live canary, broad replacement, lock churn, same-session self-certification). |
| Gate set selected                       | PASS              | Package/plugin archetype column is N/A (no `packages/**` or `plugins/**` touched). Volatile/hardcoded-model guard `no-hardcoded-volatile_test.ts` is required; generated-surface sync/dogfood/Claude gates are required; `agentic:provider-canary` static + bounded `--live` is required; `docs:maintenance` is required. All present in `plan.md` §Fitness Gates + §Validation Plan. |
| Deferred scope explicit                 | PASS              | `plan.md` §Non-Scope: no package/plugin API, no published CLI, no dep/lock, no release/merge/publish, no weakening of open-only cost protection, no Anthropic reviewer dispatch, no self-certification, no broad historical run-artifact rewrite. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | `research.md` §jsr-audit correctly marks N/A — work is maintainer `.llm/**` + `.agents/**` + repo docs, no `packages/**` or `plugins/**`. Plan also adds the rescope gate: "If implementation unexpectedly touches publishable package/plugin source, stop for rescope and add `jsr-audit` plus `deno task quality:gate`." |

## Open-decision sweep (evaluator-run)

I ran the sweep myself against the plan, the design, and the repository. Findings:

1. **The `claude-fanout-minimax-m3` preset cannot be overloaded as the formal evaluator preset.** The plan correctly flags this in D3 ("do not overload the workflow-fanout preset") and resolves it by introducing a dedicated `claude-evaluator-minimax-m3` evaluation preset distinct from the workflow-fanout one. **No rework forced.** ✓
2. **The current `formal_evaluation` lane is a single phase-agnostic lane; it cannot express two distinct phase defaults without splitting.** The plan correctly flags this in D3 and resolves it by adding `formal_plan_evaluation` and `formal_impl_evaluation` lanes plus a typed `evaluatorPhase` contract (or equivalent typed lane union) so the resolver rejects cross-phase preset use. The cross-phase rejection requirement (D4) is also stated and must be proven by a negative test. **No rework forced.** ✓
3. **The volatile-value guard derives the exact forbidden set from `config/*.ts` (Layer A).** When `OPENROUTER_MODEL_IDS.qwen` flips to `qwen/qwen3.8-max`, the guard will also detect any remaining `qwen/qwen3.7-max` literals outside `config/**`. The plan covers this in S1 (the guard test is in the file list) and in validation step 10 (the exact residue audit). **No rework forced.** ✓
4. **The 3.7 occurrence inventory covers 30 spellings across 17 files, including 4 fixture/history candidates that must be classified as legitimate, not migrated.** Plan's open-decision sweep explicitly resolves this as "must resolve during S3 before completion," with the exception ledger required in validation step 10. The two captured log fixtures (`.llm/tools/agentic/lib/__fixtures__/codex-launch-s1.head.log` and `openhands-status.completed.md`), the `lessons/validation.md` attribution, and the two `arch-debt.md` run-attribution entries (lines 1148, 1168) are exactly the history-classified candidates and the plan treats them as such. **No rework forced.** ✓
5. **The provider-profiles_test, runner-provider-profiles_test, and routing-policy_test files currently pin `qwen/qwen3.7-max` and `claude-evaluator-qwen-3-7-max` literals under `TESTS_ALLOWED_TO_PIN_CONTRACT_LITERALS`.** The plan correctly puts the affected focused tests in S1 + S2 file lists so those pinned literals migrate to the 3.8 values when the canonical constants change. **No rework forced.** ✓
6. **The README illustrative allowlist (`README_ILLUSTRATIVE_ALLOWLIST` in the guard test) currently pins `OPENROUTER_MODEL_IDS.qwen` for the `--model openrouter/qwen/qwen3.7-max` example.** Plan puts the README in S3 and the volatile guard in S1; both must remain in lockstep. The plan orders executable (S1) before docs (S3) so the test stays green through the migration. **No rework forced.** ✓
7. **Kimi K3 vs Grok 4.5 for ordinary review.** Plan marks "safe to defer" at dispatch time; both routes are owner-authorized. Does not touch formal evaluation. **No rework forced.** ✓
8. **Generated-mirror ownership (`.claude/skills`).** Plan's D5 is correct: the `.agents/skills` source changes first, then `.claude/skills` is regenerated by `agentic:sync-claude`. Hand-edits to the mirror are forbidden. The dogfood consumer bundle must be regenerated/audited (D6), even though the current tracked surface has no Qwen binding, so the acceptance claim covers the canonical generated surface. **No rework forced.** ✓
9. **Evaluator session separation and identity record.** Plan's D7 + the risk-register entry require recording the evaluator session id and exact observed identity in `plan-eval.md` and `evaluate.md`. The current PLAN-EVAL session identity is the open model `minimax/minimax-m3` over OpenRouter through the `claude-openrouter` profile (matching the plan's intent), and this verdict is being emitted on stdout for the supervisor to record verbatim with that session/model evidence. **No rework forced.** ✓
10. **Lock-hygiene boundary.** Plan's D9 + the lock-churn risk correctly exclude the pre-existing `deno.lock` diff from staging; the run is responsible only for the new artifacts under `.llm/runs/chore-qwen-3-8-evaluator--1331/**`. **No rework forced.** ✓

No unflagged rework-forcing decision found.

## Spot-checks performed

| Finding in `research.md` | Verification | Result |
| --- | --- | --- |
| #1 central `OPENROUTER_MODEL_IDS.qwen` is the literal `qwen/qwen3.7-max` | `cat .llm/tools/agentic/config/models.ts:52` | confirmed: `qwen: 'qwen/qwen3.7-max',` |
| #2 `FORMAL_EVALUATOR_PRESET` + `resolveCanonicalFormalEvaluatorRoute` exist | `cat .llm/tools/agentic/runtime/routing-policy.ts:90,319-327,477-511` | confirmed: `FORMAL_EVALUATOR_PRESET = OPENROUTER_PRESETS['claude-evaluator-qwen-3-7-max']`; resolver checks open-only + preset equality + agentic + reasoning trace |
| #3 preset id embeds 3.7 in the slug | `cat .llm/tools/agentic/runtime/provider-profiles.ts:108-176` | confirmed: `OPENROUTER_PRESET_IDS` contains `'claude-evaluator-qwen-3-7-max'` and the preset object itself is keyed by that id |
| #4 `no-hardcoded-volatile_test.ts` derives exact forbidden set from config and has explicit allowlists | `cat .llm/tools/agentic/config/no-hardcoded-volatile_test.ts:1-184` | confirmed: Layer A derives the forbidden set; `TESTS_ALLOWED_TO_PIN_CONTRACT_LITERALS` + `README_ILLUSTRATIVE_ALLOWLIST` are the explicit allowlists; `OVERLOADED_EXCLUSIONS` covers `agy` and a few OpenCode tokens |
| #5 30 direct 3.7 spellings across 17 files (excluding runs/tmp) | `git grep -n -I -E 'qwen/qwen3\.7-max\|[Qq]wen ?3\.7\|[Qq]wen3\.7' origin/main -- ':!.llm/runs/**' ':!.llm/tmp/**' \| wc -l` and `... \| git grep -l ... \| wc -l` | confirmed: 30 matches, 17 files |
| #6 active hyphenated preset slug `qwen-3-7` lives in provider profiles, routing policy, and tests | `git grep -n -I -E 'qwen-3-7' origin/main -- ':!.llm/runs/**' ':!.llm/tmp/**'` | confirmed: hits in `provider-profiles.ts` (3x), `provider-profiles_test.ts` (2x), `routing-policy.ts` (1x), `routing-policy_test.ts` (1x). No `qwen-3-8` slug yet. |
| #7 `.claude/skills` is regenerated wholesale by `agentic:sync-claude` | `.llm/tools/agentic/claude/sync-claude-skills.ts`; `deno.json` task list | confirmed (canonical generator; mirror must not be hand-edited) |
| #8 dogfood consumer bundle regenerated by `agentic:dogfood-skills`; current tracked surface has no Qwen binding | focused inspection of `.agents/generated/consumer-skills/**` (no Qwen text observed) | confirmed |
| #9 `agentic:provider-canary` static is always-on, `--live` is explicit bounded opt-in | `.llm/tools/agentic/README.md:390-410`; `runtime/cli/provider-canary.ts` | confirmed |
| #10 pre-existing `deno.lock` modification predates this run | `git status --short`; `git diff -- deno.lock` | confirmed: dirty lockfile present and unrelated |
| #11 phase-agnostic `formal_evaluation` lane cannot express two phase defaults | `runtime/routing-policy.ts`; `runtime/provider-profiles.ts`; owner correction on #1331 | confirmed: a single `formal_evaluation` lane entry + a single `claude-evaluator-qwen-3-7-max` preset id; the plan's D3 fix is required |

All eleven load-bearing findings verified against the current tree.

## Verdict

`PASS`

Every Plan-Gate box is satisfied. The plan is complete and sound: research is re-baselined against the current commit; locked decisions cover the phase split, preset rename, phase-specific lanes, and rejection of stale 3.7 and cross-phase preset use; the open-decision sweep is honest and includes the historical-fixture classification as a "must resolve during S3"; commit slices are ordered executable → canary/fixture → docs/generated, each < 30 and each names its proving gate and files; risks are listed with mitigations including the lock-hygiene boundary; the gate set matches the non-package surface; deferred scope is explicit; jsr-audit is correctly N/A with a rescope gate. Implementation may begin.

## Notes

- This verdict is emitted on stdout per the protocol — no repository files were modified. The supervisor records it verbatim with the session/model evidence (MiniMax M3 over OpenRouter via the `claude-openrouter` profile).
- IMPL-EVAL (separate session, `qwen/qwen3.8-max`) is the next gate after S1–S3; it owns the `evaluate.md` verdict, not this artifact.
- Implementation must keep `deno.lock` unmodified and unstaged (D9 + the lock-churn risk) and must run `agentic:sync-claude` from the canonical source so the `.claude/skills` mirror is regenerated, never hand-edited (D5).
- The final residue audit (validation step 10) must list every remaining `qwen/qwen3.7-max` / `Qwen 3.7` / `qwen-3-7` occurrence with an explicit rejection/migration/history rationale; anything unexplained fails IMPL-EVAL.
- Cross-phase preset use (e.g. a `claude-evaluator-minimax-m3` preset selected for `formal_impl_evaluation`, or a `claude-evaluator-qwen-3-8-max` preset selected for `formal_plan_evaluation`) must be rejected by the typed route/preset guards and proven by a negative test (D4).
