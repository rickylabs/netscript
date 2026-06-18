# NetScript Skills

Agent skills for the NetScript repo. A small set of `SKILL.md` files that teach an LLM agent how to
operate this codebase end-to-end without re-deriving the API from documentation each time.

> **Install the version that matches your NetScript version.** Skills ship in lockstep with the
> codebase. Keep the git ref aligned with the branch you are working on.

---

## What's in the box

| Skill                | Scope                                                                                                             | Status |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| `netscript-doctrine` | **CORE** — Navigate the architecture doctrine for `packages/` and `plugins/`.                                     | active |
| `netscript-harness`  | **CORE** — Orchestrate harness-mode runs (8-phase model, Plan-Gate, dual evaluators).                             | active |
| `jsr-audit`          | **CORE** — Audit packages for JSR readiness. Required Plan-Gate input for package/plugin waves.                   | active |
| `deno-fresh`         | Frontend development with Fresh 2.x, Preact, and Tailwind CSS in Deno.                                            | active |
| `aspire`             | Aspire/.NET integration, AppHost shape, and Deno hosting package expectations.                                    | active |
| `rtk`                | Token-saving CLI proxy. Prefix read-heavy git/gh/grep/ls/docker commands with `rtk`; `rtk proxy` for `deno task`. | active |
| `claude-manager`     | Operate Claude Code and WSL Codex sessions: discover, steer, monitor, MCP-bridge, and poll daemon status.         | active |

Claude Code consumes a generated mirror at `.claude/skills/`. Keep `.agents/skills/` as the source
of truth and run `deno task agentic:sync-claude` after skill changes.

---

## Router

If a prompt is vague, route it to the narrowest skill that fits:

- `packages/` or `plugins/` work → `netscript-doctrine`
- `use harness` or run orchestration → `netscript-harness`
- JSR readiness or publish audit → `jsr-audit`
- Fresh/Deno frontend → `deno-fresh`
- Aspire/.NET scaffold or AppHost work → `aspire`
- Read-heavy git/gh/grep/ls/docker output, or tracking `deno task` runs → `rtk`
- Claude Code, Zed ACP, or WSL Codex session steering/status → `claude-manager`
- Anything else → ask for clarification rather than guess

---

## Skill shape

Every skill follows the same shape:

1. **Preamble** — YAML frontmatter with `name`, `description`, and optional metadata.
2. **Canonical mental-model headline** — One sentence that captures the skill's core idea.
3. **When to Use** — Specific triggers that activate this skill.
4. **When Not to Use** — Boundaries; what this skill does not cover.
5. **Key Concepts** — The vocabulary an agent needs to reason about this domain.
6. **Workflow** — The typical sequence of actions when this skill is active.
7. **Common Pitfalls** — Mistakes LLMs commonly make in this domain.
8. **Reference Files** — Canonical files this skill points to.
9. **Checklist** — Quick verification steps before handing off.

See [`DEVELOPING.md`](DEVELOPING.md) for the full authoring guide.

---

## Versioning

Skills are versioned in lockstep with the NetScript codebase. The skill surface (commands it
references, exit codes it expects, capability claims it makes) tracks the repo's current branch. Pin
per-branch to keep skills, harness, and doctrine coherent.

---

## Contributing

Read [`DEVELOPING.md`](DEVELOPING.md) before adding or rewriting a `SKILL.md`.
