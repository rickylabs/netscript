# Evaluator Protocol

This protocol governs **IMPL-EVAL**, the **final** evaluator pass. The Plan-Gate's **PLAN-EVAL** is
a separate, earlier pass governed by `plan-protocol.md`. Both passes are separate sessions.

The evaluator is a separate session from the generator. Its job is to verify the approved plan
against the changed state, not to continue implementation.

**Evaluator surface (local vs cloud).** The invariant never changes: the generator session is never
the evaluator session, and no lane self-certifies. The transport is how that invariant is realized.

- **Local run (the default for harness work).** PLAN-EVAL and IMPL-EVAL run in fresh native
  opposite-family sessions: Claude/Fable evaluates Codex-authored work and Codex/Sol evaluates
  Claude-authored work. The **supervisor** triggers the evaluator; a sub-agent never
  auto-dispatches one. PLAN-EVAL is conditional for complex/decision-heavy work, while IMPL-EVAL
  remains mandatory unless the owner explicitly waives it.
- **OpenRouter escalation.** Use the bound Minimax M3 high PLAN preset or DeepSeek V4 Flash 0731
  max IMPL preset only for a genuine third opinion or when the native opposite-family route is
  quota-blocked. Approved open models only; never send Claude/GPT/Gemini through OpenRouter.
- **Cloud run.** OpenHands is phase-driven and open-model-only. `openhands` plus `status:plan-eval`
  dispatches PLAN-EVAL; draft→ready dispatches IMPL-EVAL unless `impl-eval:skip` is present. Select
  at most one `eval:model:*` override before the transition. Orchestrators never also post a manual
  trigger for that head. Dispatching a closed model (Claude/GPT/Gemini) through OpenHands is
  prohibited — it burns paid OpenRouter credit.
- **Ordinary (non-formal) review** — the slice review gate, code/PR review — remains
  **opposite-family Claude ⇄ Codex**: a Codex session reviews Claude-authored work, a Claude session
  reviews Codex-authored work, mixed authorship per slice or by both.

Select the route from `workflow/lane-policy.md` and record it in `supervisor.md`/`drift.md`. See
`.agents/skills/openhands-handoff/SKILL.md` "Routing policy" for the model rules, which are shared
by both transports.

If the OpenRouter escalation is blocked by an OpenRouter limit, use only the explicit
owner-authorized fallback: a fresh separate Antigravity (`agy`) session on Google subscription,
model `gemini-3.6-flash-high`, effort `high`. Record the block and requested/observed identity. This
is not Gemini over OpenRouter and does not weaken evaluator independence.

**Capability (verified, drift D-4 amended).** The evaluator lane is fully capable on this transport:
both approved open models return a **real reasoning trace** and have a **verified agentic turn**
(they make real tool calls through Claude Code), so both phase-bound evaluators **can run gates**
and their `effort` is genuine — not nominal.

| Model on Claude Code + OpenRouter | Reasoning trace | Agentic turn |
| --------------------------------- | --------------- | ------------ |
| `minimax/minimax-m3`              | yes             | supported    |
| `deepseek/deepseek-v4-flash-0731` | yes             | supported    |
| `z-ai/glm-5.2` (design lane only) | **none**        | —            |

The missing-reasoning problem is **GLM-specific, not a client-wide gap**: only GLM 5.2 over
OpenRouter returns zero thinking blocks. Never cite "GLM 5.2 · xhigh reasoning" as gate evidence.
That caveat is scoped to the design-verification lane and does **not** apply to the evaluator lane.

## Required Inputs

| Input                                        | Required                    | Purpose                                                |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------ |
| `workflow/run-loop.md`                       | yes                         | run-loop phases and design checkpoint rules            |
| `verdict-definitions.md`                     | yes                         | verdict rules                                          |
| selected archetype profile                   | yes for package/plugin work | doctrine gates, concept of done, and false-done states |
| selected scope overlays                      | when applicable             | frontend/service/docs gates                            |
| run `plan.md`                                | yes                         | approved scope                                         |
| run `plan-eval.md`                           | when PLAN-EVAL selected     | conditional planning verdict                           |
| run `worklog.md`                             | yes                         | design checkpoint and generator evidence               |
| run `context-pack.md`                        | yes when present            | resumable state                                        |
| run `drift.md`                               | yes when present            | plan/doctrine drift                                    |
| draft-PR commit list + per-slice PR comments | yes when commits exist      | implementation history (the commit trail)              |
| `debt/arch-debt.md`                          | yes                         | debt delta                                             |

## Operating Rules

1. Evaluate against the approved plan and archetype gates.
2. Verify either the selected Plan-Gate passed before implementation (`plan-eval.md` = `PASS`) or
   the run recorded a justified `PLAN-EVAL: N/A` before implementation. Missing both is a process
   failure.
3. Verify the Design checkpoint exists in `worklog.md` and commit slices follow it. Missing design
   evidence is a finding.
4. Verify each commit slice has its named gate passing.
5. Check the Concept of Done (run-loop § 5 + archetype profile) for each slice.
6. Run or manually verify the applicable gates independently.
7. Treat missing evidence as a finding.
8. Name doctrine violations by AP code when possible.
9. Use `FAIL_DEBT` when the only blocking issue is unrecorded or malformed architecture debt.
10. Use `FAIL_RESCOPE` when the plan is materially wrong, not merely incomplete.
11. Do not fix implementation except for minimal read-only validation commands.
12. Verify the **close-gate** (`netscript-pr` → "Merge close-gate (#387)") is honored before any
    `status:ready-merge` / `Closes #N` merge: for every referenced issue, its acceptance criteria
    and every `gate:` checkbox are checked with linked evidence, and the PR's Definition-of-Done
    checklist is complete. An unchecked `gate:` box on a referenced issue (the #260 failure) blocks
    the pass.
13. Verify every agent brief/prompt (implementation, evaluation, side-fix) carries a `## SKILL`
    chapter naming the relevant skills (harness rule; a missing SKILL chapter in a brief is a
    finding). PR bodies are governed by the `netscript-pr` templates and do NOT require a `## SKILL`
    chapter — never raise its absence from a PR body as a finding.
14. For a **cut or release-gating run**, verify the **release-gate class** (`gates/release-gates.md`
    — `scaffold.runtime`, `e2e-cli-prod`, and the composite release gate) is green with
    raw-exit-code evidence before any `status:ready-merge` / release. A red or unrun release gate on
    a release cut blocks the pass. The gate definitions are owned by #309 release engineering (the
    `netscript-release` skill); the evaluator confirms they ran, it does not redefine them.
    Non-release runs treat this rule as `n/a`.

## Output

Write `.llm/runs/<run-id>/evaluate.md` using `templates/evaluate.md`.

## Evidence Standard

Every `PASS` row must have evidence: command, file, trace, route, consumer path, or debt entry. A
blank `PASS` is not a pass.
