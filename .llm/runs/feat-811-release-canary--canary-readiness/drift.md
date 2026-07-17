# Drift Log: canary publish channel and publish readiness

## 2026-07-17 — invalid evaluator delegation attempt

- **Phase:** PLAN-EVAL
- **Severity:** moderate (routing/cost-protection violation; no product or plan verdict impact)
- **Observed:** the first OpenRouter/Qwen evaluator session invoked Claude Code's `Task` mechanism,
  which routed exploratory subagents to a closed Claude model.
- **Response:** the supervisor interrupted the session immediately and discarded the attempted
  evaluation. It produced no `plan-eval.md` and cannot satisfy the gate.
- **Correction:** retry in a fresh OpenRouter/Qwen session with delegation explicitly prohibited;
  the evaluator must inspect and write its verdict directly.
- **Scope impact:** none. Implementation remains blocked until the corrected PLAN-EVAL returns
  `PASS`.

## 2026-07-17 — Fable review route unavailable

- **Phase:** implementation slice 2 review
- **Severity:** minor (route health only)
- **Observed:** native Claude returned `model_not_found` for the prescribed Fable 5 medium route
  before it read the slice.
- **Response:** use the canonical `review_codex_complex` opposite-family fallback, Claude Opus 4.8
  at medium effort. No review result was accepted from the failed Fable launch.
- **Scope impact:** none.

## 2026-07-17 — formal evaluator profile omitted on first launches

- **Phase:** IMPL-EVAL
- **Severity:** minor (route invocation only; zero model turns and no verdict impact)
- **Observed:** two initial `claude-print` launches passed `qwen/qwen3.7-max`-shaped model ids while
  inheriting the native Claude environment. Both returned `model_not_found` before a model turn,
  tool call, or artifact write. A direct live provider canary without loading the machine-local
  OpenRouter credential first also correctly returned `auth_required`.
- **Response:** discard all three non-evaluations. Load the machine-local OpenRouter environment,
  bind the `claude-openrouter` profile (`ANTHROPIC_AUTH_TOKEN`, Anthropic-compatible OpenRouter base
  URL, isolated `CLAUDE_CONFIG_DIR`), and run the repository's bounded live provider canary.
- **Correction:** the canonical Qwen route passed with tools, reasoning, and streaming before the
  formal evaluator launched. Accepted evaluator session:
  `a06700df-b15b-43e4-a35b-e9d0a97c2f06`.
- **Scope impact:** none.

## 2026-07-17 — evaluator evidence transcription corrected

- **Phase:** IMPL-EVAL
- **Severity:** minor (artifact evidence accuracy; deliverable verdict unchanged)
- **Observed:** the first PASS artifact contained stale/invented metadata for the head SHA, commit
  count, PLAN-EVAL commit, closing keyword, workflow job count, dispatch response field, and removed
  suppression count.
- **Response:** do not hand-edit evaluator evidence. Resume the same direct Qwen evaluator session
  with the exact discrepancies and require narrow independent re-verification.
- **Correction:** the evaluator corrected `evaluate.md`, rechecked all downstream prose, and
  retained `IMPL_EVAL_VERDICT: PASS` because the errors were evidence transcription rather than
  implementation findings.
- **Scope impact:** none.

## 2026-07-17 — base drift omitted canonical #810 detector

- **Phase:** supervisor IMPL-EVAL repair
- **Severity:** significant (acceptance proof and mergeability)
- **Observed:** PR #812 remained based on `a5adb706` after #810 landed at `8a8a9537`. Its composed
  readiness correctly delegated to `release:preflight`, but that branch-local task did not yet
  contain the import-attribute detector. A mocked readiness test proved message composition rather
  than real detection. Current main also conflicted in `cut.ts` and both release-skill copies.
- **Authorizing verdict:** supervisor-triggered Fable IMPL-EVAL returned `FAIL_FIX`; the earlier
  generator-arranged Qwen PASS is retained but is non-authorizing for this repair cycle.
- **Correction:** merge `origin/main` at `aa14e452`, resolve all three conflicts by composing both
  sides, exercise the actual preflight CLI from the readiness test, and live-prove import-attribute,
  versionless-specifier, and README-standard seeds red before restoring a green tree.
- **Scope impact:** no rescope. The approved delegation design remains valid after the merge.
