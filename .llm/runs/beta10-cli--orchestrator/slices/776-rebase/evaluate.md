# IMPL-EVAL — PR #776 (evaluator route binding, reconciled with advanced base)

- **Phase:** IMPL-EVAL (opposite-family, supervisor-dispatched)
- **Route:** `review_codex_light` → Claude · Opus 4.8 · high
- **Subject:** worktree `/home/codex/repos/b10-evalroute`, branch `feat/evaluator-route-binding` @ `a33a0e0a`
- **Base:** `git diff origin/feat/beta10-integration...HEAD` (12 files, +343/−18)
- **Skills:** netscript-harness, netscript-tools, rtk

## VERDICT: PASS

Approved scope is complete, the cost-protection rule is enforced as data with passing guard tests,
the reconciliation is additive and non-conflicting with #794, and the one deliberately-superseded
binding is disclosed in the reconcile comment + `drift.md` + `worklog.md`. Findings below are
non-blocking (2 nits + 1 recorded process drift). Evidence is command/file/line, not status.

## Scope probes

### 1. Evaluator lane bound as data; closed models rejected in code — CONFIRMED
`resolveCanonicalFormalEvaluatorRoute()` (`routing-policy.ts:347`) throws unless the route is
`purpose:'evaluation'` + `agent:'claude'` + `provider:'openrouter'` + `profileId:'claude-openrouter'`
+ `evaluatorModelPolicy:'open_only'` + `route.model ∈ OPEN_EVALUATOR_MODEL_IDS` (`minimax`, `qwen` —
`config/models.ts:56`) + preset `agenticTurn:'supported'` + `reasoningTrace:'present'`. A closed model
fails the `OPEN_EVALUATOR_MODEL_IDS.some(...)` membership check and throws. This is a checkable code
property, not prose.

### 2. Rejection blocks closed-model dispatch — CONFIRMED at the policy layer (test proven)
`routing-policy_test.ts` → *"formal evaluator rejects closed models and reused generator sessions"*
passes `route: { ...route, model: MODEL_IDS.opus }` and asserts a throw. Re-ran: **2 passed, 0
failed**. The check is model-id-membership and therefore family-agnostic — any GPT/Gemini id equally
fails (see F2). The generator≠evaluator and opposite-family invariants are separately asserted and
throw (self-cert test green).

### 3. Conflict / duplication with #794 review-ladder — NONE (clean, additive)
Only one net-new lane binding is introduced: `formal_evaluation` (grep of added `lane:` lines yields
exactly `+ lane: 'formal_evaluation'`). The two `review_codex` entries in the diff are **unchanged
#794 lines** (Fable 5 low `included` + Opus 4.8 low `token_limit_fallback`) that received only an
added `evaluatesFamily:'openai'` metadata field — no route value changed. Lane-occurrence count shows
`formal_evaluation`×1, no duplicates. #776's former fixed `review_codex → Opus 4.8 high` binding is
gone. No contradiction, no shadowing.

### 4. Hardcoded-model-id guard still green — CONFIRMED
`no-hardcoded-volatile_test.ts` Layer A: **4 passed, 0 failed**. The diff correctly removes the
`STRUCTURAL_ALLOWLIST` entry for the qwen literal (allowlist now empty), moves the qwen id into
`README_ILLUSTRATIVE_ALLOWLIST`, and replaces the `dispatch-openhands.ts` help-text literal with
`OPENROUTER_MODEL_IDS.qwen`. All new model ids originate from `config/models.ts`.

### 5. Reconcile dropped nothing silently — CONFIRMED
All stated #776 deliverables present: `qwen` id (`models.ts`), `claude-evaluator-qwen-3-7-max` preset
(`provider-profiles.ts:164`), `'evaluation'` added to `OpenRouterPreset.purpose`, `minimax-m3`
`agenticTurn` flipped `unverified→supported`, guard literal→constant, and the formal-evaluator throw.
The single deliberate drop (fixed `review_codex` Opus-high binding) is disclosed in the PR reconcile
comment, `drift.md` (2026-07-17 entry), and `worklog.md`. Disclosure obligation met.

### 6. New suppressions — NONE
Delta scan for `deno-lint-ignore` / `@ts-ignore` / `@ts-nocheck` / `eslint-disable` / `NOSONAR` on
added lines: zero.

## Independent validation (re-run, cheap)

| Gate | Result |
| --- | --- |
| `deno test -A` targeted (policy+profiles+routing-state+guard+lib) | **92 passed, 0 failed** |
| formal-evaluator rejection + resolution tests (filtered) | **2 passed, 0 failed** |
| `no-hardcoded-volatile_test.ts` (volatile-value guard) | **4 passed, 0 failed** |
| `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | **105 files, 0 findings** |
| Added-line suppression scan | **0** |

Matches the reconcile comment's claims (permission-correct suite 250/0, check 105/0). The bare
`deno test .llm/tools/agentic/` permission failures are pre-existing `NotCapable` cases unrelated to
this diff, correctly documented.

## Findings

1. **[nit, non-blocking] Enforcement is policy-layer, not dispatch-ingress; "unbypassable" is
   slightly overclaimed.** `resolveCanonicalFormalEvaluatorRoute()` has **no production caller** —
   grep of `.llm/tools/agentic` (excluding tests + its own definition) returns none, and
   `dispatch-openhands.ts` neither imports the guard nor validates its literal `--model` argument
   against `OPEN_EVALUATOR_MODEL_IDS`. So a closed model is rejected during *canonical route
   resolution*, but a hand-invoked `dispatch-openhands.ts --model openrouter/anthropic/...` is not
   blocked by this diff. This is consistent with the repo's "routing is data, not prose" pattern and
   the PR explicitly scopes OpenHands tooling as untouched, so it is not a regression — but the PR
   body's "unbypassable" should read "enforced at the canonical-route layer." Recommend wiring the
   guard into the dispatch `--model` path in a follow-up if true ingress enforcement is the goal.

2. **[nit, non-blocking] Closed-model rejection test exercises one closed family only.** The
   rejection test asserts against `MODEL_IDS.opus` (anthropic). The mechanism is family-agnostic
   id-membership so GPT/Gemini ids fail identically, but no test pins that explicitly. Coverage is
   adequate; an added GPT/Gemini case would make the "blocks Claude/GPT/Gemini" claim self-evident.

3. **[process, recorded] No slice-specific Plan-Gate artifacts.** Per protocol rule 2, `plan-eval.md
   = PASS` could not be verified — the shared `beta10--orchestrator` run dir has no slice
   `plan.md`/`plan-eval.md`/`context-pack.md`. This is transparently recorded in `drift.md`
   (2026-07-13, severity: process) as running from the owner's locked slice brief + OD-7. Noted as a
   process finding, not a code defect; does not block a data-binding slice the owner briefed directly.

## Rationale for PASS not FAIL_FIX
No required gate fails, no evidence is missing, no path/link is wrong, no consumer import was left
unupdated, and no false-done state is present. The reconciliation preserves every #794 binding,
introduces exactly one additive lane, discloses its single supersession in three places, and keeps
the volatile-value guard green. Findings 1–2 are quality nits about enforcement reach and test
breadth; finding 3 is an already-recorded process drift. None rise to a blocking defect.
