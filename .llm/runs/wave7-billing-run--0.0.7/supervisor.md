# Wave 7 — Billing Run on NetScript 0.0.7 stable

## Identity
- Run id: `wave7-billing-run--0.0.7`
- Arm: **D (post-0.0.7-stable, MCP gate mechanically enforced)** — new arm, not A/B/C
- Project: `billing-run` (comparable: Stripe)
- Version under test: **0.0.7 stable**, published 2026-09-03, publish run 33774815712,
  artifact-pinned production E2E 33778959041 (both green). JSR `@netscript/cli` latest = 0.0.7.
- Builder: **GLM 5.3 Flash** (`z-ai/glm-5.3-flash`, 1.31M ctx) hosted in **OpenCode**, variant `max`,
  OpenRouter billing.
- Supervisor **and evaluator**: this Claude session (owner-assigned both roles for this run).
- Workspace: `/home/agent/projects/netscript/wave7-billing` (native ext4, fresh).

## What is different from every prior wave
1. **The MCP gate is mechanical, not asked-for.** `agentic:opencode --require-mcp netscript
   --require-mcp aspire --receipt <path>` fails closed unless both servers are declared, attached,
   and a real documentation lookup succeeds. Waves 4-7 measured zero MCP usage because the brief
   only *requested* it. Here no product turn can start without a passing preflight receipt.
2. **0.0.7 stable is the payload** — generated slice verbs, the agent-init surface and the
   regenerated docs corpus are all present and published, not canary.
3. **Turn-by-turn supervision with a real steer channel.** OpenCode is resumed by `--session`, so
   the historic "OpenCode has no response channel" defect does not apply.
4. **Caps lifted by the owner**: may run overnight, may fan out sub-agents.

## Owner requirements binding this run
- GitHub product repo created **early**, private, under `rickylabs`; commit and push **regularly**.
- Production-ready surface: professional README, proper file structure.
- Visual identity: heavy Fresh-UI customization, rewritten design tokens, unique design.
- Quality bar: `rickylabs/eis-chat`.
- Article: draft PR to `rickylabs/devocracy-website`, positive but honest, bilingual.
- Supervisor delivers a **complete evaluation** of the result.

## Roles (unchanged doctrine)
The builder is the sole author of product and article. The supervisor writes **no product code and
no article prose** — process, gates, defect lists and the evaluation only. Authorship contamination
is a recorded failure mode.
