# NetScript Claude Code Bootstrap

@AGENTS.md

## Claude Supervisor Rules

- Treat this file as Claude-specific startup context only. Cross-agent doctrine remains in
  `AGENTS.md`, `.agents/skills/`, and `.llm/harness/`.
- For harnessed NetScript work, Claude coordinates. OpenHands evaluates. WSL Codex implements slice
  work when a mobile-visible implementation agent is required.
- Before invoking a repo skill by name, check whether it exists in `.claude/skills/`. If it does
  not, read the matching `.agents/skills/<name>/SKILL.md` directly.
- Use `.llm/tools/agentic/validate-claude-surface.ts` when Claude configuration, skills, hooks, or
  agent orchestration docs change.
- Keep `.claude/skills/` generated from `.agents/skills/`; do not hand-edit mirrored files.

## Reasoning Policy

- Select model/provider/effort from `.llm/harness/workflow/lane-policy.md` and pass the resulting
  identity explicitly to the launcher. Do not maintain a second routing table here.

## Claude Workflow Policy

- Treat Claude dynamic workflows / Ultracode as an expensive supervisor accelerator for hard
  planning, research synthesis, and orchestration design.
- Do not use Claude workflows as the default implementation lane for NetScript harness slices.
- Prefer WSL Codex subagents for implementation so the work remains mobile-visible, daemon-attached,
  and token-efficient.
- When a workflow is justified, cap its role to producing a compact plan, agent briefs, or evaluator
  prompts that are then handed to OpenHands or WSL Codex.

### Documentation-authoring exception (recorded 2026-06-18)

- **Documentation authoring** (Markdown/Lume content, per-package README + reference prose,
  internal-doc consolidation) MAY use a Claude dynamic workflow as the implementation lane.
  Rationale: doc quality is language-dominated and the canonical documentation route is optimized
  for that work; authoring touches **no `packages/`/`plugins/` source code** — so the
  supervisor-does-not-write-framework-code boundary is not crossed.
- Conditions on this exception:
  - Authoring agents run **under the harness SKILL** (`netscript-harness` + the relevant domain
    skills: `jsr-audit`, `netscript-doctrine`, `deno-fresh` as applicable) so output respects
    doctrine, the publish surface, and gates.
  - Route model/provider/effort per slice from `.llm/harness/workflow/lane-policy.md`.
  - **Validation stays in a separate opposite-family session** with a per-package/per-domain
    verdict — the Claude workflow is the generator only; it does not self-certify.
  - Any change to **framework source** (e.g. the `@netscript/fresh-ui` `*Namespace` type exports)
    remains a **WSL Codex** daemon-attached slice, never the Claude workflow.
- This exception is scoped to documentation. Framework/plugin implementation slices stay on WSL
  Codex per the rules above.
