# Research — fix-skills-canonical-tree-refs--1737

## Re-baseline

- Carried-in source: issue #1737 and `.llm/tmp/brief.md`.
- Re-derived against `main` @ `eaea940bea4c19593b97b9895b09f512039f4e13` on 2026-08-31.
- The two reported occurrences remain live at the reported lines.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | `skills/netscript/SKILL.md:43` references `.claude/skills/help.md`. | `nl -ba skills/netscript/SKILL.md` |
| 2 | `skills/netscript-operate/SKILL.md:50` has the same defect. | `nl -ba skills/netscript-operate/SKILL.md` |
| 3 | No other shipped skill body under `skills/` references `.claude/skills/`. | `rg -n '\.claude/skills/' skills/ --glob 'SKILL.md'` returned exactly 2 matches. |
| 4 | `skills/manifest.json` enumerates the shipped bundle; the CLI asset generator embeds these files verbatim and `agent init` installs canonical `.agents/skills/` files before optional Claude mirrors. | `skills/manifest.json`; `.llm/tools/generate-cli-assets-barrel.ts`; `packages/cli/src/public/features/agent/init/init-agent.ts` |
| 5 | The existing repository sync task derives `.claude/skills/` from `.agents/skills/`; it is the mirror authority and must be run rather than editing mirrors. | `deno.json` tasks `agentic:sync-claude` and `agentic:sync-claude:check` |

## jsr-audit surface scan

- N/A: this slice changes shipped documentation bodies and a repository-level test, not a package
  export, JSDoc/API surface, or dependency graph.

## Open questions

- None. The canonical path and regression invariant are fixed by #1675 and issue #1737.
