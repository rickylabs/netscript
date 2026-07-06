use harness

Run PLAN-EVAL for this PR (run `feat-dashboard-design-prototype--design`). You are the Plan-Gate evaluator — a separate session from the generator. Judge the PLAN, not code; no implementation slices exist yet by design.

## SKILL

Read these before evaluating (repo-relative):

- `.agents/skills/netscript-harness/SKILL.md` — harness protocol; you are the PLAN-EVAL lane.
- `.llm/harness/evaluator/plan-protocol.md` — your procedure. Follow it exactly.
- `.llm/harness/gates/plan-gate.md` — the checklist you enforce, box by box.
- `.llm/harness/evaluator/verdict-definitions.md` — PASS / FAIL_PLAN meanings.
- `.agents/skills/netscript-pr/SKILL.md` — comment conventions.

## Inputs (run dir: `.llm/runs/feat-dashboard-design-prototype--design/`)

1. `research.md` — 14 findings F1–F14; verify the re-baseline against `317e4b50` (origin/main, beta.5 cut) and spot-check at least one load-bearing finding against the tree (e.g. F-claims about `packages/fresh-ui/registry.generated.ts` / `registry.manifest.ts` and the DTCG token pipeline under `packages/fresh-ui/tokens/`).
2. `plan.md` — locked decisions LD-1..LD-7, scope/non-scope, fitness gates, validation plan.
3. `worklog.md` `## Design` section — domain vocabulary, ports (RegistrySource, ClosureBuilder), constants (TRAP_IDS, UNIT_KINDS, PARITY_EXCLUSIONS), 8 commit slices (0–7).
4. `supervisor.md` + `drift.md` — recorded lane overrides (Tier-A implements `tools/design-sync/`; canvas lane = Tier-A via Claude Design MCP with owner-relay fallback; owner directive 2026-07-06: Fable 5 = design lane, WSL Codex = chores only) and the DDX-0↔DDX-15 dependency inversion (owner-ratified).
5. `.llm/harness/debt/arch-debt.md` for relevant open debt.

## Run-specific context

- Deliverables: `tools/design-sync/` (repo tooling — NOT `packages/`/`plugins/` source), a new Claude Design project at 100% fresh-ui parity, a full E2E dashboard prototype (7 panels + 4 capability sections, light/dark), and a sync-back spec. Archetype gates for packages/plugins are N/A; the plan's fitness gates (sync idempotence, parity checklist, trap checks a–f, canvas MCP smoke) replace them — verify the plan states this explicitly.
- Board linkage: PR carries `Closes #425`; new tracking issue #507; epic #400. Verify plan/PR consistency on this.
- Slice 0 is a canvas MCP pre-flight hard gate with a recorded fallback; verify the plan treats MCP flakiness as a first-class risk with an owner-authorized fallback lane, not an unstated assumption.

## Procedure and output

Follow `plan-protocol.md`: walk `plan-gate.md` box by box citing plan locations; run the open-decision sweep yourself (any unflagged rework-forcing open decision = unchecked box); confirm the 8 slices are ordered, sized, and each names its proving gate and files.

Write your full verdict as a PR comment. Also write `plan-eval.md` in the run dir from `templates/plan-eval.md` and commit it to this PR branch ONLY (no other file changes; preserve lock hygiene — do not commit `deno.lock`). Emit exactly one verdict: PASS or FAIL_PLAN (with each unchecked box and the specific fix).
