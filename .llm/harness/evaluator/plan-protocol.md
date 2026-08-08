# PLAN-EVAL Protocol

PLAN-EVAL is the harness's conditional planning evaluator. It judges the **plan**, not the code,
and runs before implementation only for genuinely complex/decision-heavy work or when adversarial
planning advice is useful. Small/mechanical issues with complete contract, scope, acceptance, and
gate information record `PLAN-EVAL: N/A` instead. When PLAN-EVAL runs it is always a **separate
session** from the generator and from IMPL-EVAL.

On a local-machine run PLAN-EVAL normally uses a fresh **native opposite-family session**: native
Claude/Fable 5 medium evaluates Codex-authored plans, and native Codex GPT-5.6 Sol high evaluates
Claude-authored plans. It is triggered by the **supervisor**, never auto-dispatched by a sub-agent.

Use the OpenRouter Minimax M3 high preset only for a genuine third opinion or when the native
opposite-family route is quota-blocked. If that escalation is limited, use a fresh Antigravity
(`agy`) session on the Google subscription with Gemini 3.6 Flash high. OpenHands is not a normal
local evaluator and is reserved for explicitly cloud-driven work. Record every escalation reason
and requested/observed identity. See `evaluator/protocol.md`, `workflow/lane-policy.md`, and
`.agents/skills/openhands-handoff/SKILL.md`.

## Inputs

Read, in order:

1. `gates/plan-gate.md` — the checklist you enforce.
2. `evaluator/verdict-definitions.md` — verdict meanings, including `FAIL_PLAN`.
3. The run's `research.md`, `plan.md`, and the `## Design` section of `worklog.md`.
4. The selected archetype profile, any scope overlays, and `gates/archetype-gate-matrix.md`.
5. `debt/arch-debt.md` for relevant open debt.

## Procedure

1. Verify `research.md` exists and that any carried-in material was re-baselined against current
   `main`. Spot-check at least one load-bearing finding against the tree.
2. Walk the `gates/plan-gate.md` checklist box by box. For each, cite the plan location that
   satisfies it or mark it unchecked.
3. Run the open-decision sweep yourself: list any decision the plan leaves open that would force
   rework if deferred. If you find one the plan did not flag, that is an automatic unchecked box.
4. (Package/plugin waves) Confirm the jsr-audit surface scan is present and that each named risk has
   a slice that addresses it.
5. Confirm commit slices are ordered, sized (< 30), and each names its proving gate and files.

## Output

Write `plan-eval.md` from `templates/plan-eval.md`. Emit exactly one verdict:

- `PASS` — every checklist box satisfied; implementation may begin.
- `FAIL_PLAN` — list each unchecked box and the specific fix required.

Do not evaluate code, run the implementation gate set, or comment on slices that do not yet exist.
That is IMPL-EVAL's job (`evaluator/protocol.md`).

## Loop limit

Two `FAIL_PLAN` cycles are allowed. After the second, escalate to the user with the unresolved
items.
