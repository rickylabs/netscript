# Plan

Ship the complete S9 consumer capability as one bounded implementation slice, then native carrier integration and final evaluation.

- Add a deterministic generator for a short netscript-design/SKILL.md and an exact local references/GUIDELINES.md snapshot. The entrypoint routes theme selection, compatibility, quality method and self-audit to canonical sections, rather than duplicating their policy. Its published DESIGN.md/SKILL.md table is generated from all complete canonical theme directories, excluding _template; links match the S8b raw-source contract. User theme choices and future installed theme pairs remain authoritative; registry installation stays in S2.
- Export buildDesignSkill(root: URL) as an internal tooling seam returning the owned output map and provenance. A read-only --check fails on any differing/missing generated file, unknown arguments and incomplete theme pairs. Fixture tests use a temporary source tree; actual drift negative control changes the source guideline and proves the normal check fails without repairing it.
- Add the new skill/files to the canonical skill manifest and consumer router, and route design tasks in the installed AGENTS template. The existing installer remains unchanged. Test real filesystem installation through initAgent, discovery, nested reference equality, all theme links and idempotence, preserving all old host/security tests.
- gen:assets-barrel first regenerates the design skill; check:assets-barrel first checks it read-only, before any mutating regeneration. Native prose → corpus → assets barrel → publish-assets commands retain their order. All four carrier freshness gates must pass.

Before source edits: MCP budget measured283387/294912bytes. This change adds no MCP-selected pages: the canonical design pages already exist in the CLI prose corpus. Measure afterward and retain the budget guard. New skill/reference bytes flow through the existing skill/CLI publish carriers, not an added MCP corpus entry.

Gates: focused structured check/lint/fmt/tests for generator and agent init; negative drift control; real installed-skill discovery/link checks; native carrier gates; quality+architecture; required CLI readiness and independent PLAN/IMPL reviews. No new dependency or lock change. Do not claim actual registry theme-pair installation or unmerged token-v2 behavior. PR targets main, includes a closing reference to2431 only when acceptance is proven; do not close the epic.

## Refresh plan — 2026-11-01 (LOCKED)

Resume the approved implementation and merge current main normally. Archetype 6,
docs/CLI assets overlay; no new public API or architectural debt. PLAN-EVAL: N/A
for this refresh: the owner specifies the existing contract and reconciliation;
there is no new architecture or unresolved trade-off. Prior PLAN-EVAL remains
historical. Mandatory independent IMPL-EVAL covers this refreshed source.

Keep all main registry/token freshness checks. Generate current preset/source/local
theme links from authored `packages/fresh-ui/registry.json` so the registry owns
the mapping, including token-only preset docs. Keep all eleven canonical language
pairs and the exact GUIDELINES snapshot. Clearly route current app operations to
`web-layer/how-to/theme-your-app`; explain that historical provisional/planned
statements in the canonical guidelines do not define current CLI availability.
Studio Utility is the new-app default; ui:apply --preset changes the app and
installs the registry-owned theme pair. No per-theme document bodies are copied
into netscript-design.

One refreshed implementation slice: conflicts, generator, behavioral tests,
regeneration, review/sign-off. One final evidence slice if final-head checks need
a durable checkpoint. Gates: all root check:* tasks under Deno 2.9.7, CLI agent
and skill suites, generator negative controls, scoped check/lint/fmt, quality:gate,
release:preflight, docs:accuracy, CLI JSR audit; canonical scaffold.runtime or an
explicit UNPROVEN result. Runtime/tool/network failures remain honest limitations.

Risk: generated drift after main integration; mitigate with ordered generation and
final-head freshness checks. Risk: prior ready claims treated as current; draft PR
and replace body with refreshed evidence before ready. Refs #2431 by explicit
operator override; stop at READY, never merge.
