use harness

# Slice brief — #246 (E7): SkillLoaderPort — SKILL.md parser + progressive disclosure + triggers

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/jsr-audit/SKILL.md` (gate:jsr).

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-246`, branch `feat/246-skill-loader-port`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-246`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-246 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-246 push origin HEAD:refs/heads/feat/246-skill-loader-port`.
- Worklog at `/home/codex/repos/ns-b8-246/.llm/runs/feat-246-skill-loader--codex/worklog.md`.

## Task (issue #246 — read it FULLY first; its Ships/Out-of-scope lists are the contract)

New `@netscript/ai/skills` subpath:
- `SkillLoaderPort` interface: load-by-id, list, match-by-tag, match-by-query.
- Blessed `SKILL.md` parser: frontmatter (id, name, tags, description) + body, validated.
- Progressive disclosure: cheap summary/metadata tier; full body on demand (two-phase read).
- Tag-trigger matching (exact/substring); optional semantic matching via injected
  `EmbeddingProviderPort` (no embedding call when disabled).
- Effect-free in-memory/injected `SkillContentSource` adapter (caller supplies sources; no
  fs/git/network I/O in core).
- Unit tests: parser edge cases (missing frontmatter, malformed tags, empty body), trigger
  matching (tag-only, semantic-only, combined).

NOTE: the issue references `packages/ai-core` paths from an older layout — the package now lives
at `packages/ai` (verify with `deno doc` and the workspace config; record the mapping in the
worklog). Follow the existing ports/adapters layering in `packages/ai/src/`. Out of scope: skill
management UI, persistence, authoring approval gates (#271), the plugins/ai scaffolder (#290).

## Validation (evidence in worklog)

- Scoped check/lint on `packages/ai`.
- Unit tests green; `deno task arch:check` if it covers packages/ai layering.
- gate:jsr: `deno doc --lint` clean on the new subpath; `deno task publish:dry-run` green
  WITHOUT --allow-slow-types.

## Done means

Subpath + parser + triggers + tests + gates committed and pushed, worklog committed. Report
"DONE" or "BLOCKED: <why>".
