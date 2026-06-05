# Research — feat-package-quality-wave0b-docs--agents-docs-and-skills

## Re-baseline

- Carried-in source: Wave 0b prompt spec (handover)
- Re-derived against `feat/package-quality` @ post-Group-A merge
- What changed vs the carried-in version:
  - Group A merged: 8-phase model, Plan-Gate, dual evaluator passes now in
    `feat/package-quality`.
  - Existing `.agents/skills/` has 5 skills: `deno-fresh`, `jsr-audit`,
    `netscript-doctrine`, `netscript-harness`, `netscript-standards` (legacy).
  - Prompt references additional skills not yet present: `deno-expert`,
    `frontend-design`, `ux-patterns`, `tailwind`, `web-design`, `aspire`, `rtk`.
  - No `.agents/docs/` exists yet.
  - Existing `docs/architecture/` has: `DOCS-STRUCTURE.md`, `doctrine/` (10 files),
    `PUBLIC-SURFACE-PATTERNS.md`, `STANDARDS.md`.
  - Existing `.agents/rules/` has 6 `.mdc` rule files.

## Findings

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | No `.agents/docs/` exists | `ls .agents/` |
| 2 | 5 skills exist; 7 referenced in prompt do not | `ls .agents/skills/` |
| 3 | Skills lack standardized shape (only jsr-audit has version; deno-fresh has metadata) | `head -n 20 .agents/skills/*/SKILL.md` |
| 4 | No skills cluster README exists | `ls .agents/skills/README.md` → missing |
| 5 | No `DEVELOPING.md` authoring guide exists | `find .agents/skills -name DEVELOPING.md` |
| 6 | No "What NetScript doesn't do yet" section in any skill | `grep -r "doesn't do yet" .agents/skills/` |
| 7 | `docs/architecture/` exists with canonical doctrine files | `ls docs/architecture/doctrine/` |
| 8 | `.agents/rules/` has 6 rule files | `ls .agents/rules/` |

## jsr-audit surface scan (package/plugin waves)

- N/A for Wave 0b·B — this wave is docs/skills only. No package/plugin source is
  touched. Recorded as N/A with reason.

## Open questions

- Should the missing skills (`deno-expert`, `frontend-design`, `ux-patterns`,
  `tailwind`, `web-design`, `aspire`, `rtk`) be created as stubs or just listed
  in the index? (Decision: list in index with "not yet created" status; do not
  fabricate skill content.)
- Should `.agents/docs/README.md` duplicate any `docs/architecture/` content?
  (Decision: no — curate and LINK; the index points INTO canonical sources.)
