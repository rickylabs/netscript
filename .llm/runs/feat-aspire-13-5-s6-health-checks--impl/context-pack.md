# Context Pack: Aspire 13.5 listener-readiness health checks

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-aspire-13-5-s6-health-checks--impl` |
| Branch | `feat/aspire-13-5-s6-health-checks` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Slices 1–5 are committed/pushed on draft PR #1743. IMPL-EVAL cycle 1 at `78d0ded28` returned
`FAIL_FIX` because the generated AppHost did not type-check against the real restored Aspire 13.5.3
modules. Slice 6 now repairs the endpoint value projection and string-valued health data, and adds
the real restored-module consumer type-check as a mandatory generator gate. The Fable supervisor
retains Phase-B runtime execution, slice review, and the next IMPL-EVAL.

## Completed

- Read all requested skills/workflow/doctrine/API/S2 evidence and target code.
- Confirmed branch/worktree/base and no pre-existing edits.
- Selected Archetype 6 and the required gate set.
- Added generated-template TCP/RESP helper tests RED→green (8 passed).
- Added one-socket helper implementation with 2000 ms timeout and exact result data.
- Committed/pushed slice 1 as `54fdf19fe735fea793e3548825bd3f3015044461` and opened the correctly
  stacked draft PR with its implementation trail.
- Added per-kind TCP/RESP registration, live endpoint projection, attachment, non-emission, and
  credential-isolation tests; the combined focused suite passes 53 results.
- Committed/pushed slice 2 as `feb1e7aadcf4f875cbcd2b878161c3ba9a5d705a` with its PR trail.
- Regenerated the embedded asset barrel and proved deterministic reproduction plus scoped type
  checking.
- Committed/pushed slice 3 as `c3376671877d50b17a16e237336f58edda34e5bf` with its PR trail.
- Split the 812-line runtime registry into lifecycle/behavior/script concerns and grouped runtime
  probes, reducing `runtime-gates.ts` to 305 lines and direct scaffold files from 48 to 43.
- Added describe-derived checks for `<resource>_listener`/`<resource>_resp` object-valued reports.
- Registered (without running) the recovery fixture and JSON receipt path; D-101 later replaced its
  lifecycle mechanism, and D-102 corrected the running/unhealthy wait-timeout contract to exit 17.
- Passed 46 focused E2E tests and the 17-gate `scaffold.plugins` suite.
- Committed/pushed slice 4 as `92de34d9bc440a7ede229daed7bd2b449e6b1a83` with its PR trail.
- Drafted the S6b 0.0.8 issue and the #1366/#863 comments for supervisor posting.
- Passed the final matrix: configured lint, 29-file scoped check, raw config-excluded lint/fmt,
  99 focused tests, deterministic assets, quality/architecture fitness, and `scaffold.plugins`.
- Committed/pushed slice 5 as `78d0ded2849eb28eddb60c409bfd68284d7e419b`.
- Read the full cycle-1 evaluator record and restored SDK 13.5.3 declaration surface.
- Replaced expression-handle endpoint projection with live `.host()` / `.port()` value calls and
  made `HealthCheckResult.data` string-valued; focused RED→green is 42/53 then 53/53.
- Passed a local-head generated Postgres AppHost type-check against S2's restored 13.5.3 modules.

## In Progress

- Slice 6 is statically green and is being committed/pushed as the durable NAS migration
  checkpoint. Phase-B runtime receipts and separate-session IMPL-EVAL remain pending; the draft PR
  must stay draft.

## Next Steps

1. On the NAS, recreate this worktree from the pushed branch and verify the exact checkpoint head.
2. Supervisor supplies the Phase-B lease and executes the registered live fixture/runtime receipts.
3. Separate Fable session performs slice review and IMPL-EVAL; implementation lane never marks ready.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Endpoint values resolve per callback | #1718 intent / restored 13.5.3 `host()` + `port()` API | `property()` returns an expression handle; drift recorded. |
| Credentials never enter probes | #1718 | Only kind/host/port cross the helper boundary. |
| Deno KV unchanged | owner boundary | Missing current HTTP check is recorded drift, not expanded scope. |
| E2E debt split precedes fixture | debt stop condition | No direct-child or monolith deepening. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/feat-aspire-13-5-s6-health-checks--impl/*` | new | Harness bootstrap/research/plan/design/drift. |
| `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template` | changed | TCP/RESP readiness helper runtime edge. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/aspire-compat-health-checks_test.ts` | new | Generated-template real-socket tests. |
| `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` | changed | Per-kind custom check registration and resource attachment. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts` | changed | Exact emission and credential-boundary tests. |
| `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-config-infra_test.ts` | changed | Updated import composition expectation. |
| `packages/cli/src/kernel/assets/embedded.generated.ts` | changed | Regenerated helper asset literal. |
| `packages/cli/e2e/src/application/gates/scaffold/runtime*` | changed/new | Split registry, describe verifier, and Phase-B fixture. |
| `packages/cli/e2e/tests/**` | changed/new | Exact wait/report/ordering and moved-probe coverage. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | Phase A green | configured lint; 29-file check; raw fallback; 99/99 tests; assets current |
| Fitness | Phase A green | final `quality:scan` findings `[]`; `arch:check` `FAIL=0` |
| Runtime | NOT_RUN | no Phase-A lease |
| Consumer | green | `scaffold.plugins` 17/17; generated AppHost compiles against restored 13.5.3 modules; runtime deliberately not run |

Migration freeze recheck: focused structured test 53/53, structured check 5/5 with zero diagnostics,
four-file lint/fmt PASS, generated asset reproduced, and `quality:gate` PASS. No Aspire AppHost or
Docker resource was started.

## Open Questions

- None blocking Phase A.

## Drift and Debt

- Drift: current Deno KV arm lacks the assumed existing HTTP health check.
- Drift: #1718 line 44 / D3 used expression projection where 13.5.3 requires endpoint value APIs.
- Debt response: S6 satisfied the next-gate split condition; residual direct-child debt remains
  visible at 45 immediate scaffold children (43 files plus two role directories).

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).

## Reconstruction v2 checkpoint (2026-08-30)

The corrected architecture was reconstructed onto exactly-shipped main `2a1248d33d55` in
`/home/agent/projects/netscript/worktrees/007-aspire-s6-v2`. Coordinator ruling D-91 overrules the
abandoned D-92 narrow-exclusion attempt: the branch carries the semantic health-check hunks and
the entire `b4ca8a1d3` runtime-module split.

- Semantic carry: `a5a445c1a`.
- Complete module split and current-main reconciliation: `719b298ee`.
- Static gate formatting and fresh 13.5.3 consumer receipt: `fb67d3077`.
- Exact current measurements: `runtime-gates.ts` 305 lines; `runtime/` 11 immediate children.
- S1 wording/assertion retained exactly; S5 dynamic endpoint discovery and opt-in port semantics
  retained; `verify-live-db-endpoint.ts` untouched.
- Static evidence is green: 99/99 combined focused tests, 28-file structured check, configured and
  raw lint/fmt, both asset-barrel pairs, host-port policy, quality scan, architecture check, and a
  real restored-module Aspire 13.5.3 generated-consumer type-check.
- No runtime, AppHost, container, evaluator, or CI-dispatch command was run.

The original S6 history above is intentionally preserved as audit context. The reconstruction-v2
worklog section and receipt are authoritative for this corrected branch.

## D-101 scratch-only synthetic listener fixture

Starting from fetched PR tip `60985a98f`, the E2E harness replaces resource stop/Docker pause with
an Aspire-managed controller task that owns fixed localhost TCP/RESP listeners. A revisioned atomic
state file plus acknowledgement controls close/reopen; no product generator is edited. The
pre-start fixture calls the real app/infrastructure generators as libraries and splices test-only
health registrations at generator-derived markers.

Database dispatch has one source: `listenerFaultExpectations(database)` beside
`createListenerReadinessGates(database)`. Postgres exercises synthetic Postgres+Garnet checks;
SQLite and MySQL/MSSQL overrides exercise Garnet only. Focused static evidence is 52/52 tests plus
zero-diagnostic nine-file check/lint/fmt, clean quality scan, and exit-0 architecture check. The
supervisor still owns all lease-backed runtime verification.

Implementation commit `3a20d00be1a65cb20d8ecae1658c27cad672e98d` is explicitly pushed to the
PR branch. Its exact-head rerun also passed raw lint/format on all nine touched TypeScript files;
the gate run left `deno.lock` and the worktree unchanged. Post-D-101 measurements are 306 lines for
`runtime-gates.ts` and 12 immediate `runtime/` children (the reconstructed pre-D-101 baseline was
305/11). The remaining actions are this evidence-only commit/push and the required PR #1743 phase
comment; runtime and evaluation remain supervisor-owned.

## D-102 healthy-wait timeout correction

The coordinator's Aspire 13.5.3 ruling corrects the synthetic listener fixture from the stale
terminal-state exit 18 assumption to the running/unhealthy timeout contract: exit 17 plus
`Timed out waiting for resource '<resource>' to be healthy after <timeoutSeconds>s.`. The receipt
now records `healthyWaitTimeoutExitCode` and `healthyWaitTimeoutDiagnostic`. No listener,
controller, port, transition, or resource-lifecycle behavior changed. Static evidence is green:
55/55 focused tests, two-file structured check/lint/format, clean quality scan, and exit-0
architecture check. Runtime and evaluator work remain coordinator-owned.

## D-102b ANSI-decorated diagnostic correction

Tier-A found that the real Aspire 13.5.3 timeout line contains CSI style/color sequences before the
`❌`, around the diagnostic text, and at line end. The matcher now calls `stripAnsiCode` from
`@std/fmt/colors` before the existing trim/glyph removal and exact equality check. The plain and
ANSI-decorated exit-17 cases both pass; altered diagnostics and exit 18 still fail. Static evidence
is green: 56/56 focused tests, two-file structured check/lint/format, clean quality scan, and
exit-0 architecture check. Runtime and evaluator work remain coordinator-owned.

## D-110 hidden E2E artifact carrier correction

The branch was re-baselined at reconstructed D-109 head
`300eac3ba94a1670b51e01982aa1658dc402ef3d`. Code inspection confirms the default generated-project
root is `<repo>/.llm/tmp/cli-e2e/<projectName>`, so both runtime upload steps now carry the exact
listener receipt glob beneath that root, their job-specific top-level report family, and
`include-hidden-files: true`. The D-107 broad patterns were removed. Static evidence is green:
exact two-job contract assertion, 13/13 focused workflow-policy tests, YAML parse, and diff
integrity. No product code, runtime behavior, receipt shape/location, workflow dispatch, or
evaluator changed; the coordinator owns the one fresh exact-head workflow run and artifact
inspection.

## D-111 classifier artifact-path contract correction

D-110's exact-path narrowing broke the checked-in classifier workflow contract, which requires
`.llm/tmp/**/report*.ndjson` in the SQLite runtime job. Both runtime upload blocks now again carry
the original four JSON/NDJSON/report/receipt globs while retaining D-110's real hidden-directory
fix, `include-hidden-files: true`. The classifier script/test, fixture, receipt, and product logic
are unchanged. Evidence is RED 59/60 at D-110, then GREEN 60/60 under both the owner-required raw
command and the structured harness wrapper; exact artifact-block assertion, YAML parse, and diff
integrity also pass. The coordinator owns the single fresh exact-head workflow dispatch and archive
inspection.

## D-112 non-recursive runtime artifact carrier correction

Run 33342459451 proved the Postgres product suite green but exposed that D-111's recursive globs,
combined with hidden-file inclusion, traversed permission-restricted `.data/postgres` files and
failed artifact upload with `EACCES`. Both runtime upload blocks now use only job-specific top-level
JSON/NDJSON report patterns and the single-project-level
`.llm/tmp/cli-e2e/*/.netscript/e2e/listener-unreachable-receipt.json`, while retaining
`include-hidden-files: true`. The classifier self-test now owns those safe paths for both jobs and
rejects `.llm/tmp/**` recursion. RED was 59/60 before the workflow change; GREEN is 60/60 under the
required raw command and structured wrapper, with structured check/lint/fmt, exact artifact
assertion, YAML parse, and diff integrity also green. Product/runtime behavior is unchanged; the
coordinator owns the one exact-head workflow run and archive inspection.
