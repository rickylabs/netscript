# Research — docs-internal-overhaul--contributor

> May reuse `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis) for the contributor-doc IA
> decision. Internal docs describe the **post-cleanup/post-hygiene** harness + tooling surface.

## Re-baseline

- Carried-in source: handover §3.4.
- Re-derived against `main` @ `cc3b8731`.

## Findings

| # | Finding | Source / how to verify |
|---|---------|------------------------|
| 1 | Internal-doc surfaces: `.llm/harness/`, `docs/architecture/doctrine/`, `.llm/` tooling/agentic, `AGENTS.md`, `CLAUDE.md`, `.agents/skills/`, root ops docs. | repo tree. |
| 2 | `.claude/skills/` is a **generated mirror** of `.agents/skills/` — never hand-edit; `validate-claude-surface.ts` enforces coherence. | `CLAUDE.md` Supervisor Rules; `.llm/tools/agentic/validate-claude-surface.ts`. |
| 3 | `deno doc` is underdocumented in the harness/jsr-audit skills despite being the canonical internal-API surface tool; AGENTS.md leans on it ("deno doc is your friend"). | `AGENTS.md` Read Order; `.agents/skills/jsr-audit`. |
| 4 | Likely duplication across AGENTS.md ↔ skills ↔ harness workflow docs (same rules restated). | grep for repeated rule text. |
| 5 | Doctrine lives under `docs/architecture/doctrine/` and is authoritative — consolidate references TO it, do not restate it. | `.agents/skills/netscript-doctrine`. |

## Census to build (generator/Design)

- **Duplication map:** concept → all locations → chosen canonical home.
- **Cross-reference graph:** internal links between harness/doctrine/skills/AGENTS to protect during
  consolidation.
- **`deno doc` doc gaps:** what the harness + `jsr-audit` skills currently say (likely little) vs
  the needed section (npm rendering, JSX/TSX highlighting, npm-without-types, `--lint`).
- **Group 1 coordination list:** doc files Group 1 plans to delete vs files this run consolidates.
  - **RESOLVED 2026-06-18 (Group 1 MERGED, PR #54 `a4db5527`):** Group 1's entire run deleted exactly
    **one** `.md` file across the umbrella vs `main` — `AGENTS-handoff.md` (relocated into
    `.agents/skills/openhands-handoff/SKILL.md`). No other doc files were deleted. → Group 4 has a
    clean field: the only file-ownership coordination point is that the old root `AGENTS-handoff.md`
    is gone and its content now lives in the openhands-handoff skill; consolidation should reference
    the skill, not the deleted root file. No remaining delete-vs-consolidate conflict.

## jsr-audit surface scan

- N/A (internal docs). But this run **documents** the `deno doc`/`deno doc --lint` workflow that the
  `jsr-audit` skill and Group 3 reference generation depend on.

## Open questions

- Contributor-doc IA: full Diátaxis vs a lighter structure?
- Canonical home per duplicated concept.
- `deno doc` doc scope (harness only vs harness + jsr-audit + standalone).
- File ownership split with Group 1 (delete vs consolidate).
