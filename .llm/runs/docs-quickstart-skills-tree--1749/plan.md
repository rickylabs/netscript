# Plan: quickstart canonical skills tree

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-quickstart-skills-tree--1749` |
| Branch | `docs/quickstart-skills-tree` |
| Phase | `plan` |
| Target | `docs/site/quickstart.vto` |
| Archetype | N/A — docs-only illustrative tree |
| Scope overlays | `SCOPE-docs.md` |

## Goal and source truth

Show the canonical skill bundle installed by `netscript agent init` in the quickstart scaffold tree.
At baseline `13878a80a50c55b9662099fed64555f2310ae4a3`, `initAgent()` derives `skillFiles` from the
embedded bundle and writes every entry beneath `.agents/skills/` before the first host-specific
branch. The later `hosts.includes("claude")` branch reads those canonical files back and writes the
derived `.claude/skills/` mirror.

## Scope

- Add one `.agents/skills/` row to the illustrative tree.
- Classify it as `[generated]`, matching the legend's replacement-by-generator convention.
- Regenerate only the assets reached by the checked-in docs generators.

## Non-Scope

- Do not list `.claude/skills/`: it is host-conditional while the tree is host-neutral.
- Do not restructure host/editor framing or edit another prose page.
- Do not hand-edit package/plugin source; generated package outputs may change only through their generators.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `[generated]` for `.agents/skills/`. | `initAgent()` writes it from the embedded generated bundle; guidance content does not change file ownership. |
| D2 | Omit `.claude/skills/`. | It is a Claude-only derived mirror inside a host branch, unlike the unconditional canonical tree. |
| D3 | Keep the prose change to one tree row. | The issue describes incompleteness, not an inaccurate surrounding page. |

## Open-Decision Sweep

All decisions that could force rework are resolved above. No decision is deferred.

## Derived chain

Reading `.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-cli-assets-barrel.ts`,
and `.llm/tools/generate-publish-assets.ts` establishes this chain:

`docs/site/**` → rendered `docs/site/_site` Markdown →
`.llm/assets/agent-docs/{prose.json.gz,provenance.json}` →
`packages/cli/src/kernel/assets/agent-docs.generated.ts` and
`packages/mcp/src/publish-assets.generated.ts`. The MCP output embeds the release corpus
`sourceCommit`; both freshness checks are unconditional.

## Commit slices

1. S1: quickstart row plus the four required run artifacts.
2. S2: generator-produced docs corpus and package assets only.

S2 must remain last so corpus provenance records the immediately preceding S1 commit and can be
regenerated after the serial docs queue advances.

## Plan-Gate

`PLAN-EVAL: N/A` — this is a mechanical, one-row docs correction with source, scope, decisions,
acceptance, sequencing, and exact gates fixed by the issue and verified against the baseline.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Vento syntax or alignment error | Run `check:source-format` and the site build. |
| Incomplete generated-file list | Use the checked-in generators and run all three freshness gates. |
| Conflict with #1746/#1748 | Keep S2 isolated; rebase and regenerate instead of hand-merging generated assets. |
| Lock churn | Verify `deno.lock` against the baseline; never delete or regenerate it. |

## Drift watch

- Generator reachability differs from the chain above.
- Current branch/base differs from the requested identity.
- Any non-generated package/plugin source becomes modified.
