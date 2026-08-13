# Plan — legacy-port-pin-sweep

## Status

Plan locked. `PLAN-EVAL: N/A` is justified below; implementation may begin after this artifact slice
is committed, pushed, and opened as a draft PR.

## Frozen boundary

Own only #1243 and the four file surfaces declared by the milestone `leaf-contracts.json`. Report
drift before crossing the boundary.

## Archetype and doctrine verdict

- Binding cluster profile: Archetype 5 (plugin package) with `SCOPE-service`.
- Consumer check: the auth command is part of `@netscript/cli`, whose current doctrine verdict is
  Archetype 6 / Keep; `plugins/streams` is Archetype 5 / Keep.
- In-scope checks: A1, A2, A6, A7, A9, A14; AP-9, AP-11, AP-19, AP-25.

## Locked decisions

1. Do not duplicate or partially port #1206's Aspire CLI endpoint parser.
2. Do not infer an endpoint from `appsettings.json`; it does not contain the assigned runtime URL.
3. Within the frozen surface, use the issue-authorized truthful fallback: `session list` has no
   default URL, requires an explicit `--stream-url`, and explains how to discover it through Aspire.
4. Delete `servicePort` and `backgroundPort` from the streams manifest and its official-copy fixture;
   `provider.portRangeKey` remains the allocation contract.
5. Preserve the generated Aspire skill's historical 4437 diagnostic because it documents a
   reproduced foreign-process failure and does not pin a runtime endpoint.

## Open-decision sweep

- Safe to defer: a future cross-package CLI integration may inject the existing
  `ServiceEndpointDirectoryPort` and restore an inferred convenience path.
- Must resolve now: none. The immutable surface and issue fallback fully determine this leaf.

## Commit slices

1. **Harness bootstrap proves scope and remedy** — files: run artifacts only; gate: plan checklist
   and raw Git baseline verification. Opens the required draft PR.
2. **Explicit URL contract and dead-pin removal** — files: the three live-pin declared surfaces plus
   `worklog.md`/`context-pack.md`; gates: focused auth command test, manifest-shape test, structured
   check/lint/fmt/test receipts, `quality:gate`, `arch:check`.
3. **Publishability and handoff evidence** — files: run artifacts/receipts only; gates: applicable
   JSR audit and canonical publish dry-run. `scaffold.runtime` runs only if the orchestrator grants
   the singleton lease.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Existing callers rely on the silent default | Fail at option parsing with an actionable discovery command; do not contact an arbitrary process. |
| Manifest consumers require numeric legacy fields | Existing allocator uses `portRangeKey`; run manifest and scaffold tests, then the lease-gated runtime smoke. |
| Existing parser tests call `session list` without the option | Treat the focused failure as evidence; the test file is outside the frozen surface, so escalate rather than editing it without coordinator rescope. |
| Generated skill looks like an unswept pin | Record why its historical example is not a runtime/config pin and preserve it. |

## Gate set

- Structured scoped check, test, lint, and fmt reporters with durable receipts.
- Focused auth CLI and official manifest/copy tests.
- `quality:gate` and `arch:check`.
- Applicable CLI/plugin JSR audit, doc lint, and canonical publish dry-run.
- `scaffold.runtime` one-pass smoke plus leak report only after an explicit global lease.
- Mandatory topic-orchestrator Tier-A review and separate opposite-family IMPL-EVAL.

## Deferred scope

- Plumbing the MCP endpoint directory into CLI composition roots.
- Changing any 4437 occurrence outside the four declared files.
- Aspire, Docker, publication, merge, issue milestone/state mutation, or central cluster mutation.

## PLAN-EVAL

`PLAN-EVAL: N/A`. The issue defines the fallback, reproduction confirms the pins, existing discovery
research rules out a truthful config-only shortcut, and the immutable surface prevents the only
material alternative (cross-package endpoint-directory injection). The remaining edits are locked
and mechanical; a ceremonial plan evaluator would not decide anything.
