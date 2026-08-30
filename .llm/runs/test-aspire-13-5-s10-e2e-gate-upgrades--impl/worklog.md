# Worklog — S10 #1722

## Design

- Public surface: no published API change. Internal E2E gate IDs add `runtime.resource-command`;
  `preflight.aspire`, `runtime.aspire-start`, wait gates, and `cleanup.aspire-stop` change behavior.
- Domain vocabulary: `AspireDoctorReceipt`, `DoctorFinding`, `DescribeSnapshot`,
  `ResourceObservation`, `ConvergenceExpectation`, `PostStopProbeReceipt`, and
  `ResourceCommandReceipt`.
- Ports: existing command gate boundary; runtime modules invoke Aspire/Docker/process commands only
  at their executable edge. Pure parsers accept strings/unknown values in tests.
- Constants: doctor/describe/cleanup/resource receipt names, skip exit code,
  `ASPIRE_DCP_APPHOST_PATH`, `ASPIRE_MOUNTS`, resource gate ID, expected healthy/running states.
- Archetype-6 spine: existing `CommandGate<Input=RunContext, Result=GateResult>` and suite builder
  remain unchanged; no new abstract or extension axis. Existing process and filesystem adapters
  remain the ports. No layer-2 abstract is introduced.
- Vertical feature catalog: this work stays inside the existing scaffold runtime-gate feature.
  Composition remains in `scaffold-capability-gates.ts` / `capability-suites.ts`.
- Commit slices: five ordered slices in `plan.md`, each with named gates and files.
- Deferred scope: all live AppHost/container evidence and #1372 compensation/streams residuals.
- Contributor path: add a gate ID in `cli-surface.ts`, implement one runtime-edge module, register
  it in `scaffold-capability-gates.ts`, order it in `capability-suites.ts`, and add a fixture-driven
  semantic test.

## Progress

- 2026-08-30: activated at exact S8 head `9dd06647`; clean branch with no upstream.
- 2026-08-30: read the S10 issue contract, epic plan, D-39/D-42/D-43/D-45, S8 handoff, S9 Tier-A
  review, Harness/Doctrine/CLI/Tools/Aspire/PR/RTK skills, and Archetype-6 authorities.
- 2026-08-30: `rtk` was not installed on this host; focused raw reads and structured wrappers are
  used instead. This affects presentation only, not verdict sources.
- 2026-08-30: authorized doctor capture held pre/post invariants (`aspire ps = []`, Docker empty)
  and reported 5 pass / 3 warning / 0 fail.
- 2026-08-30: began slice 1 with fixture-driven RED contracts.
- 2026-08-30: RED wrapper result is 0 passed / 6 failed, one semantic failure per contract shape;
  receipt `receipts/01-red-structured-gates.json`. Scoped check passed 186 files; scoped fmt passed
  186 files; the broad E2E lint wrapper refused the pre-existing nested desktop fixture because its
  isolated config cannot resolve the root `zod` catalog. Raw lint/fmt over all seven changed TS
  files passed. `quality:scan` and `arch:check` exited 0 with baseline warnings only.

## Reconcile notes

- Slice 1 pre-commit: #1722 is the only closing issue; #1712 and #1372 remain reference-only. Draft
  PR metadata and milestone are locked by the dispatch. No new reviewer comments exist yet.
