use harness

# Validation brief — #449 (per-track tutorial verdicts) + #450 (per-pillar positioning verdicts)

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md` (evaluator role), `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- You are the OPPOSITE-FAMILY validation session (GPT lane) for the #401 docs cut — the Claude lane
  authored; you validate. You do NOT edit docs (verdicts only). Per epic #401: V-C = per-track
  verdict for #449, V-D = per-pillar verdict for #450.
- Worktree: `/home/codex/repos/ns-wt-docsval` on merged main (post all #401 authoring merges).
- Design sources: `.llm/runs/plan-roadmap-expansion--seed/design/CD-docs/{proposal.md,epic-and-issues.md}`.
- Positioning law (the bar you enforce): build-efficiency for AI agents, not throughput; no
  honesty/candor framing; ≤1 factual competitor comparison per major feature; NO
  unshipped-capability claims — every present-tense API statement must trace to
  `deno doc` of published `0.0.1-beta.7` (use a scratch config with `minimumDependencyAge: "0"`)
  or workspace source.

## Task

For **#449** — tracks: storefront, workspace, erp-sync, live-dashboard, chat, eis-chat (on-ramp).
For **#450** — pillars: services-sdk, durable-workflows, background-processing, data-persistence,
identity-access, observability, orchestration-runtime, web-layer, ai.

Per track/pillar emit a verdict line: `PASS` or `FAIL: <specific defect + file:line>` judged on:
1. exercise-first / observable checkpoints (tracks) or story-template shape (pillars);
2. positioning-law compliance (grep + spot-read);
3. API-claim accuracy: sample ≥3 load-bearing claims per track/pillar and trace each to
   `deno doc`/source — flag any that don't trace;
4. link/caveat integrity: run `deno task verify` in `docs/site` once on merged main;
5. no stale version claims (`beta.2`, `publish:false`, "arrives from").

Write the full verdict tables to `.llm/runs/docs-449-450-validation--gpt/verdicts.md` in the
worktree, commit, and push: `git push origin HEAD:refs/heads/docs/449-450-validation-verdicts`.
Do NOT open a PR. Final reply: the two verdict tables verbatim + overall PASS/FAIL per issue.
