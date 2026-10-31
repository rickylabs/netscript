# Worklog

## Bootstrap

2026-10-31: Read assignment fully, harness/tooling/PR/CLI/doctrine guidance and prior run
memories. No memory connector is exposed. RTK is absent; structured wrappers remain verdict
sources. Consulted NetScript MCP find_guidance then search_docs. #2497 explicitly leaves
empty registry semantics to #2162, so this is not duplicate work.

Owner route override (verbatim):
"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

Owner process instructions take precedence over generic templates: Refs-only PR body,
no labels/milestones, no local full scaffold runtime, stop at READY. Final report uses
Orchid's atomic file publication handoff.

## Design

1. Public surface: generate plugins; plugin doctor; existing plugin runtime exports. No new exports.
2. Vocabulary: installed, empty (zero selected definitions), missing output (error), idle runtime
   (ready with dependencies and zero definitions). Empty is distinct from missing/corrupt.
3. Ports: existing FileSystemPort, ProcessPort, ProjectFiles, plugin manifest renderer, existing
   startup dependency seams. No new ports.
4. Constants: reuse canonical plugin registry paths and existing status vocabulary; no hardcoded
   plugin dispatch in the host. Keep exported EmptyPluginRegistryError for compatibility.
5. Commit slices: S0 run bootstrap; S1 generation/doctor semantics and regression tests; S2 docs,
   consumer proof and final evidence. Files and gates are named in plan.md; each includes this run.
6. Deferred: full scaffold.runtime local run forbidden; CI is coordinator-owned; no release/merge.
7. Contributor path: packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts.
