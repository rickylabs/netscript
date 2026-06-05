# Context Pack: Wave 0b·B — .agents/docs + skills cluster

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0b-docs--agents-docs-and-skills` |
| Branch | `feat/package-quality-wave0b-docs` |
| Current phase | `implement` |
| Archetype | N/A |
| Scope overlays | docs |

## Current State

All slices B1–B7 implemented. Review fixes applied:
- `.agents/docs/README.md` rewritten from thin index to substantive agent docs
- `jsr-audit` restored to full 427-line original content
- `netscript-doctrine` restored Archetypes, Axioms, Layering, Folder Vocab
- `netscript-harness` restored Run Artifacts, Evaluator Separation, Decision Tree
- `deno-fresh` preserved all 886 lines

Ready for IMPL-EVAL and draft PR.

## Completed

- Branch `feat/package-quality-wave0b-docs` created off updated `feat/package-quality`.
- Run dir scaffolded.
- PLAN-EVAL PASS (first true dogfood of Plan-Gate).
- B1–B7 implemented.
- Review fixes committed.
- Validation passed.
- Draft PR #5 opened.

## In Progress

- IMPL-EVAL (separate session).

## Next Steps

1. IMPL-EVAL (separate session).
2. On PASS, reviewer merges PR #5.

## Key Decisions

| Decision | Source | Notes |
|----------|--------|-------|
| Index points INTO docs | Prisma bar | Never duplicate |
| D4 drafted, not mandatory | D4 (locked) | User approval required |
| Missing skills listed as "not yet created" | Prisma capability-gap | Do not fabricate |

## Files Changed

| Path | Status | Notes |
|------|--------|-------|
| `.agents/docs/README.md` | new | Substantive agent docs |
| `.agents/skills/README.md` | new | Skills cluster router |
| `.agents/skills/DEVELOPING.md` | new | Skill authoring guide |
| `.agents/skills/netscript-doctrine/SKILL.md` | changed | Shape + D4, tables restored |
| `.agents/skills/netscript-harness/SKILL.md` | changed | Shape + D4, tables restored |
| `.agents/skills/jsr-audit/SKILL.md` | changed | Shape + D4, full content restored |
| `.agents/skills/deno-fresh/SKILL.md` | changed | Shape + D4, original preserved |
| `.agents/skills/netscript-standards/SKILL.md` | changed | Marked legacy |

## Gates

| Gate family | Current status | Evidence |
|-------------|----------------|----------|
| Static | PASS | 22/22 links resolve, 9 files fmt clean |
| Fitness | N/A | No package/plugin work |
| Runtime | N/A | No runtime changes |
| Consumer | N/A | No export changes |

## Open Questions

- D4 content approval pending (presented in PR #5).

## Drift and Debt

- Drift: none
- Debt: none

## Commits

- b656a85: plan(wave0b): Group B Plan & Design artifacts for docs and skills
- 62214f8: eval(wave0b): Group B PLAN-EVAL PASS (first true dogfood of Plan-Gate)
- db4701a: feat(docs): add curated agent-facing docs index (.agents/docs/README.md)
- 6ac14da: feat(skills): add skills cluster README and DEVELOPING.md authoring guide
- b43c281: fix(docs): restore jsr-audit content, enhance agent docs to Prisma bar
- 1fdc4b0: fix(skills): restore critical tables to doctrine and harness skills
- 944c097: feat(skills): standardize all skills with shape + D4 draft
