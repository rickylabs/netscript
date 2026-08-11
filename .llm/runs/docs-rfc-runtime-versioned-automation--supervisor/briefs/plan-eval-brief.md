use harness

# PLAN-EVAL brief — RFC-0001 runtime-versioned automation (adversarial, Sol · xhigh)

## SKILL

Load: `netscript-harness` (evaluator separation), `.llm/harness/evaluator/plan-protocol.md`,
`.llm/harness/gates/plan-gate.md`, `netscript-doctrine` (archetype/thinness laws),
`netscript-pr`. You are the **formal PLAN-EVAL** for a Claude-authored RFC; owner override sets
your route to **Codex GPT-5.6 Sol · xhigh** (run drift D-2). You are a fresh evaluator session:
you did NOT write this RFC; attack it.

## Session shape

You run in the dedicated evaluator worktree `/home/codex/repos/ns-rfc-plan-eval` (branch
`eval/rfc-runtime-versioned-automation`, same commit as the RFC branch). You are NOT the research
thread and NOT the authoring session. Never write in `/home/codex/repos/ns-rfc-runtime-versioned-automation`
except the single verdict file named below; never commit or push in either worktree.

## Inputs (read all — paths relative to your worktree unless absolute)

Run dir `.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/`:
`supervisor.md`, `drift.md` (owner directives D-1…D-6), `research.md`, `plan.md`,
`evidence/legacy-capability-map.md`, `evidence/current-state-matrix.md`, `1444-impact.md`.
Deliverable under evaluation: `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
plus draft PR #1446 body/comments.

## Constraints the RFC must satisfy (evaluate against these, not your own preferences)

1. Owner D-10: runtime-versioned tasks/triggers are a differentiating capability; no
   static-config collapse.
2. D-4: complete redesign allowed; legacy bounded to outcomes/journeys.
3. D-5: NO backward-compat/migration layer; transition = replacement/cleanup inventory.
4. D-3: cockpit downstream of RFC #890/epic #922 with an explicit minimum dependency cut; no
   parallel Fresh seam.
5. `1444-impact.md` C1–C8 constraints must be honored, not contradicted.
6. Doctrine: contract-first, wrap-don't-reinvent, plugin thinness, no hardcoded plugin names.

## Adversarial focus (attack hardest here)

- **Evidence integrity**: does any RFC claim contradict or overreach the two evidence reports?
  Spot-check citations yourself (`rtk grep`, `deno doc`); the evidence lists its own weakest
  claims — check whether the RFC leaned on any of them.
- **§9 ownership decision (O2+O4)**: is the connector plugin justified vs the recorded fallback?
- **§5.2/5.3 consistency model**: find the race/failure the snapshot+CAS design misses
  (partial activation sets, feed outage + poll fallback, replica schema mismatch, dev-KV vs
  prod-Postgres divergence).
- **§5.4 security honesty**: is any claim stronger than the cited technology supports? Is T1
  described anywhere as a tenancy boundary (it must not be)?
- **§10 cleanup inventory completeness**: anything in the current repo that would survive as a
  competing surface but isn't listed?
- **§12 roadmap**: dependency edges correct (incl. #922 cut)? wave sizing landable? anything
  that should be a prerequisite RFC but is presented as decided (or vice versa)?
- **Plan-gate checklist**: run it item by item.

## Output contract

- Write your verdict to the ABSOLUTE path `/home/codex/repos/ns-rfc-runtime-versioned-automation/.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/plan-eval.md` using the template `.llm/harness/templates/plan-eval.md`, verdict
  `PASS` or `FAIL_PLAN` with numbered, actionable findings (severity-tagged; cite file:line).
- Do not edit the RFC or any other file. Do not commit or push.
- Final line exactly: `PLAN-EVAL: PASS` or `PLAN-EVAL: FAIL_PLAN`.
