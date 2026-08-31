use harness

## SKILL

Activate `.agents/skills/netscript-harness` for the run lifecycle and artifacts, plus
`.agents/skills/netscript-cli` (this is CLI/plugin-command work), `.agents/skills/netscript-doctrine`
for any `packages/` surface decision, `.agents/skills/netscript-tools` for validation wrappers and
gate evidence, `.agents/skills/netscript-deno-toolchain` for `deno doc` inspection, and
`.agents/skills/netscript-pr` for branch/PR/issue process. If a skill is absent from `.claude/skills/`,
read `.agents/skills/<name>/SKILL.md` directly. Follow `AGENTS.md` read order; prefer `rtk` for
read-heavy git/grep inspection.

# Slice brief — #1673 `plugin doctor` must validate the registry against the source tree

Issue **#1673** (p1, `type:fix`, `area:cli`) · milestone `0.0.7` · fixes topic · branch
`fix/plugin-doctor-registry-drift` · run dir
`.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/`.

You are the canonical implementation author. **RESEARCH → PLAN → IMPLEMENT**, producing
`research.md`, `plan.md`, `context-pack.md`, `worklog.md`, `drift.md`. Do not self-certify — a
supervisor Tier-A and an independent opposite-family IMPL-EVAL follow.

## The defect

`netscript plugin doctor` validates the generated plugin registry **against itself**. It enumerates
what the registry declares and confirms the registry declares it. Nothing compares the registry
against the source tree that was supposed to produce it, so a registry stale relative to source
passes green.

Measured in Wave 7 run 2 (Gemini 3.7 Flash, NetScript 0.0.6, `rickylabs/w7-workflow-builder-gemini`
@ `00a0add`), independently reproduced by that run's evaluator:

- `netscript generate plugins` ran once at **05:30:46**.
- The saga definition and worker job were written at **05:33** and **05:34** — after it.
- `generate plugins` was never re-run; both definitions are absent from the generated registries.
- At runtime `saga_instances`, `saga_runtime_state`, `saga_execution_history`, `job_definitions`,
  `trigger_definitions`, `trigger_events` were **all 0 rows across 18 runs**.
- `plugin doctor` reported **healthy** throughout, including an "every declared saga is registered"
  style assurance.

Registry drift silently removed the product's entire durable layer while every green signal agreed
the system was fine. `doctor` is the command you run *to find out whether the durable layer is
wired*; here it actively confirms the broken state.

## Target contract

- `plugin doctor` compares the generated registry against the **source tree**, not against itself:
  every saga/job/trigger/stream definition discoverable in the workspace must appear in the registry.
- A definition present in source and absent from the registry is a **failure**, naming the file and
  the command that fixes it (`netscript generate plugins`).
- The reverse — a registry entry with no backing source — is also reported.
- The check states what it actually verified, so "healthy" cannot be read as a stronger claim than
  the evidence supports.

## The regression test is the deliverable, not an afterthought

Author a saga **after** `generate plugins`, do not regenerate, and assert `doctor` goes red.

**This test must fail against today's implementation.** Write it first, run it against unmodified
`main`, and record the observed failure output in `worklog.md` before you change any product code. A
test that passes before your fix proves nothing about this defect — and this issue exists precisely
because a green signal was trusted over reality. Red-before/green-after is the evidence, not the
formality.

## Scope

- Establish the exact product path set in RESEARCH and **state it as a ceiling in `plan.md`**; treat
  any path beyond it as a rescope needing supervisor approval.
- Distinct from #1366 (`declareHealthChecks` returning only the API resource) and from closed #1574
  (package-backed plugin version truthfulness). Related in *consequence* to #1365 — both let a
  never-executing durable layer report success — but the mechanism differs and neither fix addresses
  the other. Do not absorb either.

## Generated cascade — name the gates up front

CLI asset or template edits require the generated barrel regenerated:
`packages/cli/src/kernel/assets/*.generated.ts` is what actually ships, and a template-only fix
leaves the scaffold stale with `check:assets-barrel` red. If your change reaches the docs corpus or a
public export surface, the cascade extends to `check:agent-docs-prose`, `check:mcp-export-corpus`,
and `check:publish-assets`. Put every applicable gate in the plan's gate list **before**
implementing — a sibling leaf lost two review cycles to that omission.

Also select the structured wrappers (`run-deno-check.ts`, `run-deno-test.ts`, `run-deno-lint.ts`,
`run-deno-fmt.ts`) scoped to the touched roots, and justify each gate.

## Boundaries

- `e2e:cli`, Aspire, Docker, and browser gates are **not authorized** without an explicit request to
  the supervisor. A focused unit/integration seam that needs no live backend is the target.
- No `deno.lock` modification.
- No merge, readiness flip, label change, or issue closure.
- Do not touch other lanes' branches or worktrees.
- Push only this branch, with an explicit full refspec.
- No self-certification.

## Finish

Open a **draft** PR with `Closes #1673` in the body — this leaf fully resolves it — plus a checkable
Definition of Done and an `acceptance-evidence` block mapping issue #1673's acceptance boxes. Report
the exact head SHA and your gate receipts, including the red-before output for the regression test.
Then stop for supervisor Tier-A.
