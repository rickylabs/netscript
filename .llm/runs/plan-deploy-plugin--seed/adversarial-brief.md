use harness

# Brief — Constructive adversarial pass over the deploy-plugin seed corpus (Sol · xhigh)

You are the **stage-2 constructive/collaborative adversarial reviewer** of the harness run
`plan-deploy-plugin--seed` (branch `plan/deploy-plugin`, this worktree). The generator (Claude
Fable 5 · xhigh) produced a complete seed corpus for the NetScript **deploy plugin family**. Your
role is to **ENHANCE that output, not ruin it**: find real defects, weak spots, and missed
opportunities, and for each one propose a concrete, adoptable amendment. You are the
`review_claude` lane (Codex · GPT-5.6 Sol · xhigh) of `.llm/harness/workflow/lane-policy.md`.

## SKILL

Read and follow, in order:

1. `.agents/skills/netscript-harness/SKILL.md` — run mechanics, artifact map, evaluator separation.
2. `.agents/skills/netscript-doctrine/SKILL.md` — pointers into `docs/architecture/doctrine/`
   (you will judge archetype fit, thinness, anti-patterns, gates).
3. `.agents/skills/netscript-tools/SKILL.md` — only if you run validation tooling; prefix
   read-heavy git commands with `rtk`.

## Read order (the corpus under review)

All under `.llm/runs/plan-deploy-plugin--seed/`:

1. `kickoff.md` (the owner's ratified concept — the design must serve it)
2. `supervisor.md`, `drift.md`
3. `research.md`, then `research/*.md` (six cited corpus files)
4. `design/canonical/DP-0…DP-8` (the design under review)
5. `plan.md` (locked decisions LD-1…12, owner forks OF-1…8, board sketch, §10 attack list)

Spot-verify load-bearing repo claims first-hand (`deno doc`, direct file reads): the shipped
7-op port (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`), the deploy conventions
(`packages/cli/src/kernel/domain/deploy/`), the auth composition pattern (`plugins/auth`,
`packages/plugin-auth-core`), the plugin host contribution types
(`packages/plugin/src/config/domain/plugin-contributions.ts`, `src/domain/constants.ts`), and the
config deploy schema (`packages/config/src/domain/schemas/deploy-schema.ts`). A corpus claim you
verify false is a finding.

## Attack surface (start here, then go wherever the corpus is weakest)

From `plan.md` §10 plus supervisor additions:

- **Capability vocabulary granularity** (DP-2 §4): is the closed `DeployCapabilityId` set the
  right cut? What breaks first — too coarse (verdicts lie) or too fine (manifest rot)?
- **`cli-command` contribution axis** (DP-4 §5): design soundness, collision rules, registry
  emission, the shim interplay (DP-4 §6). Is the three-extension host change minimal and safe?
- **`plan` subsumes `emit`** (DP-2 §2): does that survive real artifact workflows (CI split
  build-vs-deploy, `--prebuilt` flows, image push timing)?
- **W1 slice ordering vs the actual CLI file graph** (DP-6, plan §5): is the extraction sequence
  real — check the desktop-subgroup entanglement (M-16/R-M4) against the actual
  `public/features/deploy/` tree.
- **Manifest honesty in DP-3**: attack every capability sketch row; any row the cited provider
  evidence does not support is a finding.
- **The dependency law R-GRAPH-1…5** (DP-1 §2): can you construct a cycle or a god-object path
  the rules fail to forbid? Is the `deploy-container` shared-port exception sound?
- **Migration compatibility contract** (DP-6 §3): find the user-visible break the map misses.
- **Board sketch** (plan §5): wrong dependencies, missing children, mis-sized slices (<30 total).
- **Owner forks OF-1…8**: any recommendation you would flip, with grounds.
- Anything else: naming, JSR surface, gate selection, scaffold stories realism (DP-8).

## Output contract (strict)

1. Write your findings to `.llm/runs/plan-deploy-plugin--seed/adversarial-sol.md`:
   - H1 + one-paragraph overall verdict (is this corpus sound to build on?).
   - Findings numbered `SF-1…SF-n`, each: `[BLOCKER|MAJOR|MINOR|ENHANCE]` severity, one-line
     claim, evidence (corpus refs `DP-N §x` and/or repo `path:line`), and a **concrete suggested
     amendment** (exact replacement wording or design change — adoptable as-is).
   - A final `## Quick wins` list: small improvements not worth a numbered finding.
2. Commit ONLY that file (message:
   `plan(deploy-plugin): Sol xhigh constructive adversarial findings`) and push with the explicit
   refspec `git push origin HEAD:plan/deploy-plugin`.
3. End your final response with exactly `DONE` on its own line (or `BLOCKED: <reason>`).

## Stop-lines (verbatim, in force — same as the run's kickoff)

- Findings only: do NOT edit the DP docs, plan.md, research files, or any other run artifact —
  the supervisor triages and amends.
- No GitHub issues, PRs, labels, or milestones may be created or changed.
- No product code changes: no `packages/` or `plugins/` source edits (reading is required).
- Do not dispatch any other agent or eval.
- Commit to this branch only; push only `HEAD:plan/deploy-plugin`.
