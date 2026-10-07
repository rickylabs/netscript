# Worklog

## Design

Public: ServeOptions/DefineServiceOptions optional hostname. Builder chain remains createService(...).serve(options); preset forwards to that seam. Domain and ports: existing listener types and Deno.serve. Constants: native platform defaults, no new vocabulary. Slices: evidence bootstrap, independent review. Contributor path: service types, listener, preset, corresponding real-listener tests. No new implementation or test planned.

## Phases

1 Bootstrap: fetched clean existing clone and selected published branch.
2 Research: re-baselined against main; MCP and focused source inspected.
3 Plan & Design: carried-in contract verified.
4 Plan-Gate: N/A, mechanical validation with existing issue requirements and gates.
5 Implement: evidence-only bootstrap.
6 Gate: scoped refresh pending.
7 Evaluate: mandatory separate-family evaluation pending.
8 Release: N/A.
9 Close: pending; do not mark ready while mandatory review/CI are blocked.

Owner directive from HARNESS.md: opencode run -m opencode-go/glm-5.3-flash --variant max --auto; fallback agy --model gemini-3.8-flash-high. This explicit route overrides matrix defaults without waiving vendor/session independence.

## Refreshed evidence

Service test wrapper exit 0: 165 passed, no failures or ignored results. Scoped service check/lint/fmt wrappers exit 0; doc-lint exit 0; quality:gate exit 0. No new test added. Original PR mutation proofs are preserved by reference in the PR body. Critical audit receipt c-2075-audit records actual exit 1 at bootstrap head; shared main dependency is unchanged.

CI-pinned Deno 2.9.5 check:mcp-export-corpus: exit 0 at b05bf4c5a88ae7925e571960f63aa6f18ecfb00f. The local Deno 2.9.7 compressed representation differs while decoded content is identical; no generated source repair is needed. The pinned binary and transcript remain inside the authorized workspace.

## IMPL-EVAL and disposition

Independent opencode-go/glm-5.3-flash reviewer returned FAIL_FIX at b05bf4c5a88ae7925e571960f63aa6f18ecfb00f. Product acceptance passes; shared critical audit blocks readiness. New warning-level types file cap crossing requires follow-up split or explicit debt decision. The reviewer observed an older PR body; its harness note was already replaced during this run. Pinned CI-toolchain corpus receipt resolves the local encoder concern without editing the independent verdict.

Phases 8 Close evaluation: FAIL_FIX retained. Phase 9 Close: owner-blocked disposition, leave draft; no merge and no dependency repair bundled.
