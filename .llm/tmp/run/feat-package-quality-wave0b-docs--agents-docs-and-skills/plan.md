# Plan: Wave 0b·B — .agents/docs + skills cluster

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0b-docs--agents-docs-and-skills` |
| Branch | `feat/package-quality-wave0b-docs` |
| Phase | `plan` |
| Target | docs/skills (agent-facing docs and skill cluster) |
| Archetype | N/A (docs/infra) |
| Scope overlays | `SCOPE-docs.md` |

## Current Doctrine Verdict

N/A — no package/plugin source touched.

## Goal

Raise `.agents/docs` and the skills cluster to the Prisma bar (Prisma Next
`docs/` and `skills/` quality), dogfooding the new Plan-Gate.

## Scope

### B-DOCS
- Create `.agents/docs/README.md` as a curated, agent-facing index.
- Model on Prisma's `docs/README.md`: lanes with "why you'd read this" one-liners.
- Define relationship to existing `docs/architecture/*` and `doctrine/*`:
  the index points INTO them, never duplicates.
- Lanes: Start here, Architecture deep dives, Reference, Working with AI agents,
  OSS posture.

### B-SKILLS
- Add `.agents/skills/README.md` with router note + scope table.
- Scope table covers existing skills (mark `netscript-standards` legacy).
- Flag CORE TRIO: `netscript-doctrine`, `netscript-harness`, `jsr-audit`.
- Note `jsr-audit` is required Plan-Gate input for package/plugin waves.
- Standardize every existing skill to one shape: preamble + canonical mental-model
  headline; When to Use / When Not to Use; Key Concepts; Workflow; Common
  Pitfalls; **What NetScript doesn't do yet** (drafted, pending approval);
  Reference Files; Checklist.
- Add `DEVELOPING.md` authoring guide for the cluster (shape, router convention,
  versioning-in-lockstep).

### D4 — "What NetScript doesn't do yet"
- Draft this section for EVERY existing skill.
- Present to user for approval in the draft PR (clearly flagged).
- Do NOT make the section mandatory cluster-wide until sign-off.

## Non-Scope

- No package/plugin source changes.
- No version bumps, publish, JSR, OIDC.
- Do NOT create stub skills for the 7 missing ones; list them as "not yet
  created" in the index.
- Do NOT duplicate doctrine content into skills.

## Hidden Scope

- Cross-reference integrity: every link in `.agents/docs/README.md` must resolve.
- Skill index consistency: skills table matches filesystem.
- `deno fmt` on all changed markdown.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | Two-gate / dual-evaluator model | Group A implemented; Group B dogfoods it. |
| D2 | Group B dogfoods Plan-Gate | This is the first true separate-session PLAN-EVAL. |
| D3 | `jsr-audit` shifts left to Plan-Gate | Already in harness; applies to future package/plugin waves. |
| D4 | "What NetScript doesn't do yet" mandatory after user approval | Prevents confabulation; content must be approved. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| D4 content approval | must resolve now | Drafted in PR; user sign-off required before making mandatory. |
| Missing skills listing | safe to defer | Listed as "not yet created" in index. |
| `.agents/docs` ↔ `docs/architecture` relationship | must resolve now | Index points INTO canonical sources; no duplication. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| D4 content rejected | Flag as draft; section is optional until sign-off. |
| Skill shape too rigid | Base on Prisma bar; adapt to NetScript domain. |
| Link rot in `.agents/docs` | Verify every path resolves before commit. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|------------------|-----------------|
| 1 | Cross-reference integrity | Manual path resolution | All links in `.agents/docs/README.md` resolve |
| 2 | Skill index consistency | Table vs filesystem | Every skill in table exists and vice-versa |
| 3 | Format | `deno fmt` | Clean |
| 4 | jsr-audit | N/A with reason | Wave 0b·B is docs/skills |

## Dependencies

- Group A merged into `feat/package-quality`.
