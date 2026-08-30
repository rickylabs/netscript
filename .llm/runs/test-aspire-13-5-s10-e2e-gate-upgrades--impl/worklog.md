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
- Slice 2 (`690d70b6`): doctor and describe-follow parsers/capture committed and pushed; PR comment
  `5468795433` records fixture evidence and the Phase-B prohibition.
- Slice 3 (`d6daf416`): exact-AppHost cleanup ownership classifier committed and pushed; PR comment
  `5468796382` records S7-compatible owned/foreign/unproven evidence.
- Slice 4 (`df8b3f18`): durable receipt wiring, describe-backed wait assertions, resource-command
  gate, explicit skip policy, and both-tier ordering committed and pushed; PR comment `5468803146`
  records 65 focused passing tests.
- Final static matrix: structured check selected 187 files with 0 diagnostics; lint selected 179
  files with 0 findings; fmt selected 179 files with 0 findings; raw stdin lint/fmt covered the
  config-excluded gate catalog; README format passed; the complete `packages/cli/e2e/tests` root
  passed 186/186.
- `quality:scan`, `arch:check`, `check:assets-barrel`, `check:publish-assets`, and
  `check:emitted-samples` all exited 0. Emitted-sample validation checked 47 TypeScript samples from
  37 artifact paths. Architecture warnings are baseline except D-04's intentional skip edge and
  contain no failures.
- Phase B was not attempted: no AppHost start, no containers, and no `e2e:cli` runtime suite.

## IMPL-EVAL fix cycle 1

- 2026-08-30: read the independent Fable 5 `FAIL_FIX` report at the supervisor S10
  `slices/s10/evaluate.md` and reproduced the focused tests RED: cleanup helpers/signature were
  absent (three TypeScript diagnostics).
- F-1: cleanup now classifies absolute mount/env/argv evidence by S7's boundary-safe containment
  under the generated `projectRoot`. The fixture proves `.data/postgres` owned, a different root
  foreign, and creator-PID-only evidence unproven without S7's stable PID/start-time registry. The
  zero-survivor assertion is tested to fail on the owned fixture container.
- F-2: `runtime.resource-command` now routes through the catalog with the exact
  `ASPIRE_CLI_START_TIMEOUT` env grant and durable outer/child receipt paths. Command and
  post-command failures both write `verdict: failed` before rethrowing.
- F-3/F-4: malformed NDJSON, pending last-seen state, and Running/Unhealthy fixtures now fail. A raw
  topology parser remains available to listener failure/recovery evidence without weakening
  convergence.
- F-7: removed the unused `wait-for-workers-runtime.ts` edge.
- F-5/F-6/F-8: README and handoff record the single whole-convergence budget (300 seconds; MSSQL
  Phase B uses 600), Phase-A live `processes: []` limitation, and intentional unknown-doctor-status
  fail-closed policy.
- Static verification passed: changed-file wrappers, raw excluded-catalog lint/fmt, README/fixture
  format, 190/190 CLI-E2E tests, `quality:scan`, `arch:check`, assets/publish/emitted-samples, and
  Aspire host-port scan. No Phase-B runtime command was run.

## Phase-B describe-follow shape fix

- 2026-08-30: off-host GitHub Actions run `33326591443` supplied the first real Phase-B execution
  evidence. Both runtime tiers passed 36 gates, then deterministically failed
  `runtime.aspire-start` because Aspire CLI 13.5.3 emits one bare `ResourceJson` per NDJSON line for
  `describe --follow`, while the parser required a wrapped `resources[]` object.
- RED fixture: added captured-style bare lines, including
  `{"name":"postgres","displayName":"postgres","state":"Running","health":"Healthy"}`. The
  structured test wrapper exited 1 with 8 passed / 1 failed and the expected
  `describe line 1 omitted resources[]` error (`.llm/tmp/s10-phase-b-describe-red.json`).
- Implementation: `resources()` now accepts either wrapped `resources[]` input or a bare resource
  record carrying `displayName`, `name`, or `resourceName`. Unknown objects fail with a line-numbered
  dual-shape error. `resource()` name/state/health extraction is unchanged because the real DTO keys
  already match its accepted fields.
- Consumer audit: `resource-command.ts` captures and evaluates through the shared parser;
  `listener-readiness.ts` calls `parseDescribeFollow`. Neither contains a separate follow-stream
  wrapper assumption, so no consumer change was required.
- Wrapper validation: check exit 0; fmt exit 0 over 185 files; focused tests exit 0 with 16/16. The
  first broad lint wrapper run reported zero findings but exited 2 because the pre-existing nested
  `desktop-native` fixture cannot resolve the parent `zod` catalog; the wrapper rerun excluding
  only that unrelated fixture exited 0 with zero findings. No Aspire/Docker/runtime/CI command ran
  on this host.
