# Plan: canonical shipped skill references

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-skills-canonical-tree-refs--1737` |
| Branch | `fix/skills-canonical-tree-refs` |
| Phase | `plan` |
| Target | Shipped CLI agent skill bundle |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Archetype

Archetype 6 applies because the root `skills/` bundle is embedded and installed by the user-run CLI.
This slice changes only shipped guidance and its focused repository test; it does not alter the
package's command graph, exported API, scaffold structure, or runtime behavior.

## Current Doctrine Verdict

`packages/cli` is **Keep**: preserve the Archetype-6 kernel/surface split. This slice does not change
that structure.

## Goal

Ensure every shipped skill body points at the canonical `.agents/skills/` tree and prevent future
references to the derived `.claude/skills/` mirror.

## Scope

- Add a manifest-driven regression test under `skills/`.
- Replace both live mirror-tree references with `.agents/skills/help.md`.
- Run the canonical mirror sync/check and focused static gates.

## Non-Scope

- CLI E2E sources, agentic tooling, harness tooling, package command behavior, and generated mirror
  hand edits.
- The three concurrently owned leaf paths named in `.llm/tmp/brief.md`.

## Hidden Scope

- Regenerated embedded skill assets may change when the repository's existing generation gate runs;
  if that falls outside the supervisor boundary, report rather than edit it manually.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Test every manifest-listed `*/SKILL.md`, not only the two named files. | Prevents the same defect in any shipped body. |
| L2 | Use `.agents/skills/help.md` in prose while retaining valid relative Markdown links. | The canonical installed tree exists for every host; the Claude tree does not. |
| L3 | Never edit `.claude/skills/**` directly. | It is generated from the canonical tree. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Canonical target path | safe to defer | Already fixed by #1675; no decision remains. |
| Test location | safe to defer | `skills/` is both within the collision boundary and adjacent to the manifest it validates. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Test misses an unlisted shipped body. | Drive it from the authoritative `skills/manifest.json`. |
| Generated or mirror artifacts drift. | Run repo generation/sync checks and verify byte identity. |
| Concurrent leaf collision. | Enforce the supervisor's path boundary and inspect the final diff. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-5 public-surface ambiguity | risk | Keep canonical vs derived skill-tree ownership explicit. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Focused regression | yes | RED before body edits, GREEN after edits. |
| Skill mirror sync/check | yes | Exit 0 and byte-identical source/mirror report. |
| Scoped check/lint/fmt | yes | Structured wrapper or focused Deno command exits 0. |
| Runtime/consumer E2E | no | No runtime, scaffold structure, command, or exported surface changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | The defect is fully corrected in-scope. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | `deno test --allow-read skills/canonical-tree-references_test.ts` | Non-zero with both offending paths. |
| 2 | GREEN | Same focused test after source edits | Exit 0. |
| 3 | mirror | `deno task agentic:sync-claude` then `agentic:sync-claude:check` | Exit 0; byte identity. |
| 4 | static | Scoped check/lint/fmt for owned TypeScript | Exit 0. |
| 5 | lock | Compare `deno.lock` to baseline | Byte-unchanged. |

## Deferred Scope

- None.

## PLAN-EVAL Assessment

`PLAN-EVAL: N/A`. This is a two-line mechanical documentation correction with an issue-defined
contract, a manifest-driven regression test, fixed ownership semantics from #1675, no unresolved
architecture decisions, and no multi-slice sequencing risk beyond the mandated RED/GREEN commits.
