# Worklog

## Intake — 2026-11-01

Read complete assignment, AGENTS, harness/PR/tooling skills and prior phase/sample-model memory. No phase 2 PR found; phase 1 #2572 merged. Baseline includes #2582 plugin wiring and #2583 rich data. Deno 2.9.7 available; RTK absent, direct-command fallback.

Owner routing override (verbatim):
> IMPL-EVAL: a fresh read-only Codex reviewer session (Claude is paused until its weekly reset). Cockpit does the cross-family review at READY.
> model: gpt-6-astra
> effort: xhigh

Design checkpoint pending focused inspection; no product edits yet.

## Design

1. Public surface: generated Overview, Records/detail, examples/service, Health, Settings, sign-in and command palette. Existing CLI and route references remain canonical.
2. Vocabulary: ScaffoldOverview/Metric/Record/Records/Capability, page query (search/status/sort/page), localized presentation and actual job/event projections.
3. Ports: typed service client and plugin contracts, existing service discovery, Request locale/AbortSignal, registry asset installer. No new abstract port.
4. Constants: scaffoldStatuses, scaffoldSortFields, SCAFFOLD_PERIOD_DAYS, page size, bounded probes and semantic tones; derive types from existing contracts.
5. Commit slices: S1 page templates/adapters/registry/writer/tests; S2 examples/health/plugins/templates/tests; S3 generated carriers and evidence. Each includes this worklog/context-pack and its scoped gates plus independent review.
6. Deferred: showcase provisioning, invented history, new authentication modes, unrelated component programs. Existing CLI spine/registries are reused unchanged.
7. Contributor path: `packages/cli/src/kernel/assets/app/lib/scaffold-projections.ts.template` defines the overview data; template registry/writer maps each new asset to generated output.

PLAN-EVAL N/A per plan's risk selection. No product edits before this checkpoint.
