# Plan: canonical Qwen 3.8 formal evaluator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-qwen-3-8-evaluator--1331` |
| Branch | `chore/qwen-3-8-evaluator` |
| Phase | `plan` |
| Target | Harness / agentic tooling / configuration / generated skills / docs |
| Archetype | N/A — maintainer infrastructure, not a package/plugin public surface |
| Scope overlays | docs (for harness, operator documentation, and skills) |

## Archetype

N/A. The affected executable code lives in maintainer-only `.llm/tools/agentic`; no package,
plugin, product CLI command, or publishable export changes. The archetype gate matrix therefore
does not impose package fitness gates. The docs overlay applies to harness protocols, skills,
operator docs, and generated mirrors.

## Current Doctrine Verdict

N/A for non-package maintainer tooling. Package/plugin Architecture Doctrine is not changed. The
harness invariants in `workflow/lane-policy.md` remain binding: generator session differs from
formal evaluator sessions, open-only cost protection stays enforced, launch identity is data, and
no implementation lane self-certifies.

## Goal

Make `qwen/qwen3.8-max` the single canonical formal PLAN-EVAL and IMPL-EVAL model across executable
routing, allowlists, presets, guards, canaries, tests, harness/operator documentation, canonical
skills, and generated mirrors, while rejecting stale 3.7 configuration and retaining the old id
only in explicitly justified migration/history fixtures.

## Scope

- Central Qwen/OpenRouter model id and approved-open-evaluator allowlist.
- Formal evaluator preset identity and canonical route resolution.
- Provider profile/runner/runtime guards and focused contract tests.
- Static and bounded live provider-canary evidence for exact `qwen/qwen3.8-max`.
- Harness evaluator/workflow docs, operator docs, canonical skills, and generated mirrors.
- Current-output fixtures and explicit stale-3.7 rejection/migration coverage.
- Exact tracked and working-tree residue audit with an exception ledger.

## Non-Scope

- No package/plugin API, published CLI behavior, dependency, lockfile, release, merge, or publish.
- No weakening of open-model-only evaluator cost protection or session separation.
- No Anthropic reviewer dispatch while the owner reports subscription exhaustion.
- No self-certification; the milestone orchestrator retains merge authority.
- No broad historical run-artifact rewrite. Historical residue is evaluated for explicit necessity.

## Hidden Scope

- Rename the versioned preset id as well as changing its model value; update all typed preset-id
  unions and route assertions.
- Update tests that intentionally pin literals, README illustrative allowlists, and runtime runner
  request guards.
- Regenerate `.claude/skills` from `.agents/skills`; never edit the mirror directly.
- Regenerate/audit the dogfood consumer bundle even though its current tracked surface has no Qwen
  binding.
- Distinguish current-output fixtures from explicit legacy rejection/history fixtures.
- Update run artifacts and the draft PR comment after every implementation slice.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Canonical formal evaluator is exactly OpenRouter `qwen/qwen3.8-max`. | Owner decision and issue #1331 acceptance. |
| D2 | Rename the formal preset to `claude-evaluator-qwen-3-8-max`; do not leave an active 3.7-named alias. | A stale versioned preset id is an active binding even if its model field changes. |
| D3 | Keep Minimax M3 in the approved open-model set but bind formal evaluation only to Qwen 3.8. | Preserves current open-only policy while making Qwen 3.8 canonical. |
| D4 | Stale `qwen/qwen3.7-max` must be rejected by formal route/preset guards and proven by a negative test. | Acceptance explicitly requires rejection, not merely absence. |
| D5 | Canonical skill sources change first; `.claude/skills` changes only via `agentic:sync-claude`. | Generated-mirror ownership contract. |
| D6 | Dogfood consumer output is regenerated via `agentic:dogfood-skills` and audited, not hand-edited. | Generated-surface acceptance and repo tooling rules. |
| D7 | Formal PLAN-EVAL and IMPL-EVAL are different OpenRouter Qwen 3.8 sessions; neither is this generator session. | Owner decision and hard harness invariant. |
| D8 | Ordinary slice review uses owner-authorized OpenRouter Kimi K3 or Grok 4.5 while Anthropic is unavailable. | Temporary explicit routing override; formal evaluator route remains unchanged. |
| D9 | The pre-existing `deno.lock` diff remains unstaged and unmodified. | Unrelated user state and lock hygiene. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Kimi K3 versus Grok 4.5 per ordinary review | Safe to defer | Select at dispatch time based on available configured route; both are owner-authorized. |
| Retain each historical 3.7 occurrence | Must resolve during S3 before completion | Retention is allowed only with an explicit history/rejection-fixture rationale in the final audit; otherwise migrate/remove it. This does not affect S1/S2 architecture. |
| Touch package/plugin code if generator output drifts | Must resolve now: no | Stop and rescope rather than expanding into publishable code; add doctrine/jsr/quality gates if owner approves. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Changing only the central value leaves a stale preset slug or literal test contract. | Rename preset id and run full Qwen/preset searches plus focused tests. |
| Guard becomes permissive enough to accept stale 3.7. | Add an explicit stale route/preset rejection test and retain open-only checks. |
| Docs and generated mirrors drift from executable routing. | Update source skills/docs after executable contract, regenerate mirrors canonically, run sync/Claude-surface/docs gates. |
| Live canary silently probes another model. | Invoke `agentic:provider-canary --live` with explicit profile, exact model, effort, and worktree; record observed identity/output. |
| Broad replacement corrupts historical evidence. | Classify each remaining occurrence; keep only annotated history/rejection fixtures. |
| Generated commands or tests churn `deno.lock`. | Use `--no-lock` tasks where defined, inspect raw Git status after each slice, never stage the unrelated lockfile. |
| Formal eval is accidentally same-session or self-certified. | Record evaluator session ids/observed identities in `plan-eval.md` and `evaluate.md`; enforce separate sessions. |

## Anti-Patterns to Resolve or Avoid

| Anti-pattern | Status | Plan |
| ------------ | ------ | ---- |
| Volatile model id duplicated outside central config | Existing risk | Keep the canonical literal in `config/models.ts`; use constants in executable code; run the derived hardcoded-value guard. |
| Routing policy duplicated as prose without executable parity | Existing risk | Update machine binding and rendered docs in the same run; test route/preset parity. |
| Hand-edited generated mirrors | Avoid | Run canonical generators and synchronization checks. |
| Evaluator self-certification | Avoid | Separate generator, PLAN-EVAL, IMPL-EVAL, and ordinary review sessions. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Package/plugin archetype fitness | N/A | No `packages/**` or `plugins/**` source touched. |
| Volatile/hardcoded-model guard | Yes | `no-hardcoded-volatile_test.ts` passes and exact residue audit is explained. |
| Generated surface parity | Yes | Claude sync check, Claude surface validation, dogfood generation/status audit. |
| Harness plan gate | Yes | Separate Qwen 3.8 `plan-eval.md` verdict `PASS` before S1. |
| Slice review | Yes | Tier-A substantive owner-authorized Kimi/Grok review recorded before each sign-off commit. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `.llm/harness/debt/arch-debt.md` | none expected | Existing 3.7 run attributions are historical evidence; retain only if explicitly justified by final audit. |

## Commit Slices

| # | Slice and proof | Primary files | Proving gates |
| - | --------------- | ------------- | ------------- |
| S1 | Canonical model/preset/route contract: Qwen 3.8 is the only bound formal evaluator; stale 3.7 route/preset is rejected. | `.llm/tools/agentic/config/models.ts`; `runtime/provider-profiles.ts`; `runtime/routing-policy.ts`; `config/no-hardcoded-volatile_test.ts`; focused provider/routing tests; run artifacts | Focused Deno tests for config, provider profiles, routing policy, runner provider profiles; scoped check/lint/fmt wrappers for `.llm/tools/agentic`; raw Qwen/preset search; ordinary slice review |
| S2 | Runtime/canary/fixture proof: launch planners and provider canary accept exact 3.8 and current-output fixtures no longer assert active 3.7. | `runtime/cli/provider-canary*`; affected runner/canary/rollout tests; relevant `lib/__fixtures__`; run artifacts | Focused canary/runner tests; static provider canary; full agentic suite; bounded live exact-model canary; ordinary slice review |
| S3 | Harness/docs/generated convergence: every canonical description and relevant generated mirror names 3.8, with only explicit migration/history exceptions. | `AGENTS.md`; `.llm/harness/**` evaluator/workflow/lesson/debt files as classified; `.llm/tools/agentic/README.md`; `.llm/tools/harness/extract-verdict.ts`; `.agents/skills/{netscript-harness,openhands-handoff}`; generated `.claude/skills/**`; audited `.agents/generated/consumer-skills/**`; run artifacts | `agentic:sync-claude`; `agentic:sync-claude:check`; `agentic:check-claude`; `agentic:dogfood-skills`; docs maintenance/focused checks; scoped wrapper gates; exact residue audit + exception ledger; ordinary slice review |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Focused config/policy | `deno test --no-lock -A .llm/tools/agentic/config/no-hardcoded-volatile_test.ts .llm/tools/agentic/runtime/provider-profiles_test.ts .llm/tools/agentic/runtime/routing-policy_test.ts .llm/tools/agentic/runtime/runner-provider-profiles_test.ts` | Exit 0; 3.8 accepted; stale 3.7 rejected. |
| 2 | Focused canary | `deno test --no-lock -A .llm/tools/agentic/runtime/cli/provider-canary_test.ts` plus any affected rollout/provider tests | Exit 0 with exact preset/model identity. |
| 3 | Agentic static quality | Scoped `run-deno-check.ts`, `run-deno-lint.ts`, and `run-deno-fmt.ts` over `.llm/tools/agentic --ext ts,tsx` | Exit 0 from mandatory wrapper verdict sources. |
| 4 | Agentic suite | `deno test --no-lock -A .llm/tools/agentic/` | Exit 0. |
| 5 | Static provider canary | `deno task agentic:provider-canary` | Passed registry/preset/planner coherence. |
| 6 | Generated Claude surface | `deno task agentic:sync-claude`; `deno task agentic:sync-claude:check`; `deno task agentic:check-claude` | Generated mirrors byte-current and Claude surface valid. |
| 7 | Consumer generation | `deno task agentic:dogfood-skills`, then raw status/diff and Qwen audit of `.agents/generated/consumer-skills` | Canonical output regenerated; no unexplained Qwen 3.7. |
| 8 | Docs | `deno task docs:maintenance` or the smallest equivalent focused docs/sync gates if unrelated baseline failures exist | Owned documentation and links/surfaces pass; any unrelated failure attributed. |
| 9 | Exact live model | `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.8-max --effort high --worktree /home/codex/repos/ns1331-qwen-evaluator` | Bounded turn succeeds and reports the exact requested/observed model. |
| 10 | Residue audit | Exact `git grep`/`rg` for `qwen/qwen3.7-max`, Qwen 3.7 prose, and `qwen-3-7` preset slug across tracked/current surfaces | Only explicit rejection/migration/history exceptions remain, each listed. |
| 11 | Formal evaluation | Separate Qwen 3.8 PLAN-EVAL before S1; separate Qwen 3.8 IMPL-EVAL after all gates | `PASS` artifacts with distinct session ids and exact observed identity. |

`deno task quality:gate` is conditional and currently N/A; it becomes mandatory if any
`packages/**` or `plugins/**` publishable code is touched, which requires rescope first.

## Dependencies

- OpenRouter credential/provider availability for the bounded live canary and both formal evaluator
  sessions.
- GitHub draft PR as the commit trail and phase-comment surface.
- Canonical generation tasks in `deno.json`.

## Deferred Scope

- Merge, release, and publication remain with the milestone orchestrator.
- General model-catalog refactoring beyond the Qwen migration is deferred.
- Rewriting unrelated historical run artifacts is deferred unless the final audit shows they are
  active/generated inputs rather than immutable evidence.

## Drift Watch

- `origin/main` advances on any touched agentic/harness surface before implementation.
- Live OpenRouter reports an alias/different observed id or lacks Qwen 3.8.
- A generator touches package/plugin code, `deno.lock`, or unrelated generated assets.
- A 3.7 occurrence cannot be classified as active, explicit rejection, or necessary history.
- Any evaluator/reviewer launch cannot prove requested versus observed identity or session
  separation.
