# Worklog: Wave 0b·B — .agents/docs + skills cluster

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0b-docs--agents-docs-and-skills` |
| Branch | `feat/package-quality-wave0b-docs` |
| Archetype | N/A |
| Scope overlays | docs |

## Design

### Public Surface

- New files:
  - `.agents/docs/README.md` — curated agent-facing docs index
  - `.agents/skills/README.md` — skills cluster router + scope table
  - `.agents/skills/DEVELOPING.md` — authoring guide
- Changed files:
  - `.agents/skills/netscript-doctrine/SKILL.md` — standardize shape + draft D4
  - `.agents/skills/netscript-harness/SKILL.md` — standardize shape + draft D4
  - `.agents/skills/jsr-audit/SKILL.md` — standardize shape + draft D4
  - `.agents/skills/deno-fresh/SKILL.md` — standardize shape + draft D4
  - `.agents/skills/netscript-standards/SKILL.md` — mark legacy, minimal shape

### Domain Vocabulary

- **CORE TRIO** — `netscript-doctrine`, `netscript-harness`, `jsr-audit`
- **D4 section** — "What NetScript doesn't do yet" (drafted, pending approval)
- **Router skill** — the skill that catches vague prompts and routes to specifics

### Ports

- None — no external dependencies.

### Constants

- Lanes: Start here, Architecture deep dives, Reference, Working with AI agents,
  OSS posture.
- Skill shape sections: Preamble, When to Use, When Not to Use, Key Concepts,
  Workflow, Common Pitfalls, What NetScript doesn't do yet, Reference Files,
  Checklist.

### Commit Slices

| # | Slice | Gate | Files |
|---|-------|------|-------|
| B1 | Add `.agents/docs/README.md` | Link check | `.agents/docs/README.md` |
| B2 | Add `.agents/skills/README.md` + `DEVELOPING.md` | Link check, index consistency | `.agents/skills/README.md`, `.agents/skills/DEVELOPING.md` |
| B3 | Standardize `netscript-doctrine` SKILL + draft D4 | Link check | `.agents/skills/netscript-doctrine/SKILL.md` |
| B4 | Standardize `netscript-harness` SKILL + draft D4 | Link check | `.agents/skills/netscript-harness/SKILL.md` |
| B5 | Standardize `jsr-audit` SKILL + draft D4 | Link check | `.agents/skills/jsr-audit/SKILL.md` |
| B6 | Standardize `deno-fresh` SKILL + draft D4 | Link check | `.agents/skills/deno-fresh/SKILL.md` |
| B7 | Mark `netscript-standards` legacy | Link check | `.agents/skills/netscript-standards/SKILL.md` |

### Deferred Scope

- Missing skills (`deno-expert`, `frontend-design`, `ux-patterns`, `tailwind`,
  `web-design`, `aspire`, `rtk`) — listed as "not yet created" in index.
- D4 approval — presented in PR for user sign-off; not mandatory until approved.

### Contributor Path

To add a new skill: create a folder under `.agents/skills/<name>/`, write
`SKILL.md` following the shape in `DEVELOPING.md`, add it to the scope table in
`.agents/skills/README.md`, and run `deno fmt`.

## Progress Log

| Time | Slice | Step | Notes |
|------|-------|------|-------|
| 2026-06-05 | Setup | Branch + run dir created | `feat/package-quality-wave0b-docs` |
| 2026-06-05 | Plan | research.md + plan.md written | Re-baseline complete |

## Decisions

| Decision | Reason | Source |
|----------|--------|--------|
| Index points INTO docs, never duplicates | Wave 0 mistake was copy-migration | Prisma bar |
| D4 drafted, not mandatory | Needs user approval | D4 (locked) |
| Missing skills listed as "not yet created" | Do not fabricate content | Prisma capability-gap honesty |

## Drift

| Drift | Severity | Logged in drift.md |
|-------|----------|--------------------|
| None yet | — | — |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
|------|------------------|--------|-------|
| Cross-reference integrity | Manual path resolution | NOT_RUN | Will run post-implementation |
| Skill index consistency | Table vs filesystem | NOT_RUN | Will run post-implementation |
| Format | `deno fmt` | NOT_RUN | Will run post-implementation |

### Fitness Gates

N/A.

### Runtime Gates

N/A.

### Consumer Gates

N/A.

## Handoff Notes

- Evaluator should verify D4 content is clearly flagged as "draft — pending
  user approval" in the PR.
- Verify `.agents/docs/README.md` links all resolve.
- Verify skills table in `.agents/skills/README.md` matches filesystem.
