# S1 Tier-A Adversarial Review — #1331

**Verdict: FAIL** (not PASS)

**Observed identity:** OpenRouter `x-ai/grok-4.5` via opencode; read-only ordinary review (not
IMPL-EVAL). Worktree `/home/codex/repos/ns1331-qwen-evaluator`. Focused S1 gate run: **49 passed, 2
failed**.

## Findings (by severity)

### 1. High — PLAN Minimax evaluator preset is shadowed; open-only child guard does not attach

`claude-evaluator-minimax-m3` and `claude-fanout-minimax-m3` share the same
`(profileId, model, effort)`. `matchOpenRouterPreset` matches only those fields and returns the first
hit. The launch guard therefore classified Minimax as workflow fanout and did not attach the
open-model guard.

Required fix: disambiguate by explicit preset identity or purpose and prove PLAN launch attaches the
guard.

### 2. High — S1 proving gates fail

- `runner-provider-profiles_test.ts` still pinned active `qwen/qwen3.7-max`.
- `routing-state_test.ts` still expected the phase-agnostic `formal_evaluation` lane.

Required fix: migrate both current-output tests and rerun the complete focused S1 set.

### 3. Medium — stale-3.7 rejection not proven by a negative test

Cross-phase rejection existed, but no explicit `assertThrows` supplied `qwen/qwen3.7-max` to the
formal IMPL resolver.

Required fix: add the explicit stale-id rejection fixture.

### 4. Low — ambiguous Minimax fallback and error assertions

Required fix: cover an explicit evaluator preset and ensure an unqualified ambiguous Minimax route
cannot be mistaken for formal evaluation.

## Disposition

All findings were accepted. The supervisor added typed `presetId` to route identity, made ambiguous
implicit preset matches fail closed, migrated the two missed tests, and added explicit stale-3.7 and
ambiguous-Minimax negative coverage. The corrected focused set passed 52/52 before re-review.

The initial attempted Claude-over-OpenRouter Grok launch was denied before inference by the formal
evaluator allowlist and is preserved in `s1-review-denied-raw.txt`; the successful owner-authorized
ordinary review used the repo-native OpenCode/OpenRouter surface.

---

# S1 Tier-A Re-Review — #1331

**Verdict: PASS**

**Observed identity:** OpenRouter `x-ai/grok-4.5` via opencode; read-only ordinary re-review (not
IMPL-EVAL). Worktree `/home/codex/repos/ns1331-qwen-evaluator`. Focused S1 gate: **52 passed, 0
failed** (`--no-lock -A` on provider-profiles, routing-policy, runner-provider-profiles,
routing-state, no-hardcoded-volatile).

## Prior findings — verified resolved

| # | Finding | Evidence |
|---|---------|----------|
| 1 | Minimax evaluator vs fanout fails closed unless `presetId` explicit | `matchOpenRouterPreset` returns unique match only, or explicit `presetId` hit; unqualified Minimax → `null` (`provider-profiles.ts:287-295`, test asserts null) |
| 2 | Canonical PLAN launch attaches open-model guard | Runner test launches `claude-evaluator-minimax-m3` and asserts `--enforce-open-evaluator-models` |
| 3 | Routing-state + runner reflect phase routes | `formal_plan_evaluation` (Minimax) + `formal_impl_evaluation` (Qwen 3.8); policy test covers both phases |
| 4 | Cross-phase + stale `qwen/qwen3.7-max` rejected | Both negative tests present and green |
| 5 | 52/52 without touching lock | 52/52 green; S1 code does not require lock edits (dirty `deno.lock` is pre-existing/unrelated per plan D9) |

## Findings

None remaining.

## Residual risks

- Callers must pass `presetId` for Minimax evaluator routes; omit → fail-closed (no guard), by design.
- `local-state-adapter` / `preset-canary` do not yet round-trip `presetId` — S2 canary/persistence surface.
- Active 3.7 docs/fixtures residue remains S3; not an S1 executable defect.
- Keep `deno.lock` unstaged.
