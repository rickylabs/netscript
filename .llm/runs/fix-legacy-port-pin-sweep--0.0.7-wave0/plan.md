# Plan — legacy-port-pin-sweep

## Status

Plan implemented. `PLAN-EVAL: N/A` remains justified below. The narrow source and authorized focused
test are complete; the run is awaiting Tier-A review and separate opposite-family IMPL-EVAL.

## Frozen boundary

Own only #1243, the four file surfaces declared by the milestone `leaf-contracts.json`, and the sole
coordinator-authorized addition
`packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts`. Report drift before
crossing that boundary.

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
4. Preserve `servicePort` and `backgroundPort` in the streams manifest and its official-copy
   fixture; current schema/copy consumers require these compatibility fields.
5. Preserve the generated Aspire skill's historical 4437 diagnostic because it documents a
   reproduced foreign-process failure and does not pin a runtime endpoint.

## Open-decision sweep

- Safe to defer: a future cross-package CLI integration may inject the existing
  `ServiceEndpointDirectoryPort` and restore an inferred convenience path.
- Must resolve now: none. The immutable surface and issue fallback fully determine this leaf.

## Commit slices

1. **Harness bootstrap proves scope and remedy** — files: run artifacts only; gate: plan checklist
   and raw Git baseline verification. Opens the required draft PR.
2. **Explicit URL contract and focused tests** — files: auth command, the sole authorized test file,
   `worklog.md`/`context-pack.md`; gates: focused auth command test plus structured check/lint/fmt/test
   receipts, `quality:gate`, and `arch:check`.
3. **Publishability and handoff evidence** — files: run artifacts/receipts only; gates: applicable
   JSR audit and canonical publish dry-run. Completed without requesting or running
   `scaffold.runtime`, as directed by the coordinator.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Existing callers rely on the silent default | Fail at option parsing with an actionable discovery command; do not contact an arbitrary process. |
| Manifest consumers require numeric legacy fields | Preserve both compatibility fields exactly; do not redesign schema/copy behavior. |
| Existing parser tests call `session list` without the option | Update only the coordinator-authorized focused test file and add a no-adapter-call rejection assertion. |
| Generated skill looks like an unswept pin | Record why its historical example is not a runtime/config pin and preserve it. |

## Gate set

- Structured scoped check, test, lint, and fmt reporters with durable receipts.
- Focused auth CLI tests, including explicit URL forwarding and omitted-URL fail-loud behavior.
- `quality:gate` and `arch:check`.
- Applicable CLI/plugin JSR audit, doc lint, and canonical publish dry-run.
- `scaffold.runtime` is explicitly withheld for this implementation turn; do not request a lease.
- Mandatory topic-orchestrator Tier-A review and separate opposite-family IMPL-EVAL.

## Deferred scope

- Plumbing the MCP endpoint directory into CLI composition roots.
- Changing the required manifest/copy `4437` compatibility values or any undeclared occurrence.
- Aspire, Docker, publication, merge, issue milestone/state mutation, or central cluster mutation.

## PLAN-EVAL

`PLAN-EVAL: N/A`. The issue defines the fallback, reproduction confirms the pins, existing discovery
research rules out a truthful config-only shortcut, and the immutable surface prevents the only
material alternative (cross-package endpoint-directory injection). The remaining edits are locked
and mechanical; a ceremonial plan evaluator would not decide anything.

## Post-plan correction

The first focused contract test invalidated locked decision 4: current shared schema and official
copy compatibility still require/consume the manifest port fields. See `drift.md`. Implementation is
paused. A narrow authorization to add only the auth command test can retain `PLAN-EVAL: N/A`; any
schema/copy redesign requires a revised locked plan and separate PLAN-EVAL before further source
work.

On 2026-08-13, coordinator comments on issue #1243 and PR #1643 authorized only the focused auth
command test beyond the original boundary and classified the manifest/copy `4437` values as required
compatibility metadata. This removes the pause without authorizing schema/copy changes. Narrow source
work and non-expensive receipts may resume; the draft advances to `status:impl` only after the
implementation is committed and pushed. Tier-A review and a separate opposite-family IMPL-EVAL
remain mandatory handoffs.
