# Worklog: Garnet readiness timeout S1 diagnosis

## Run Metadata

| Field            | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Run ID           | `fix-garnet-readiness-timeout--0.0.7`                      |
| Branch           | `fix/garnet-readiness-timeout`                             |
| Base             | `8f1fcb2bc3b9b3ef57c222825f50ee2db43a2f1d`                 |
| Parent archetype | `6 — CLI / Tooling`                                        |
| Scope overlay    | `docs` for S1 artifacts                                    |
| Constraint       | Artifact-only while #1773 owns E2E; no local runtime lease |

## Design

### Public Surface

- S1 changes no product, test, generated, command, or published surface.
- The future diagnostic is internal to the unpublished CLI E2E harness and preserves the existing
  command/gate vocabulary.

### Domain Vocabulary

- `ListenerHealthReport` — existing E2E representation of one named Aspire health report.
- `healthReports` failure snapshot — complete per-check state on the matched Garnet resource.
- `garnet_resp` — real generated Garnet readiness check.
- `test_only_garnet_resp` — synthetic fixture check attached to the same resource.
- `split` — the observed classification: real-only, test-only-only, or both unhealthy.

### Ports

- Existing `node:net` seam for one canonical framed RESP2 PING.
- Existing `aspire describe --format Json` subprocess seam for per-check detail.
- No new application port, network service, file protocol, or dependency.

### Constants

- `garnet_resp` and `test_only_garnet_resp` — named evidence keys, locked unchanged.
- `*1\r\n$4\r\nPING\r\n` — exact request.
- 2000 ms — one attempt's connect-plus-read deadline; no internal retry.
- 256 bytes — maximum reply accumulation before `EPROTO`.
- 64 bytes — bounded received-byte diagnostic capture.
- 30 seconds / one-second polling — Garnet gate deadline, at most 30 observations.

### Locked Path Ceiling

- S1: only this run's `plan.md`, `research.md`, and `worklog.md`.
- Zero code paths while #1773 owns `packages/cli/e2e/**` and PLAN-EVAL is pending.
- After both gates clear, exactly the six paths listed in `plan.md`: the compatibility template,
  mechanical embedded asset, focused probe test, readiness constants/verifier/test.
- No new `runtime/` child. A seventh code/test path requires rescope.

### Commit Slices

| # | Slice                                                                        | Gate                                                     | Files                   |
| - | ---------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------- |
| 1 | S1 no-diagnosis artifact set with measured base evidence and collision stop. | Artifact review, static base gates, lock comparison.     | the three run artifacts |
| 2 | Minimal framed RESP PING and required in-process listener cases.             | Focused structured tests/check/lint/fmt; lock unchanged. | locked paths 1-3        |
| 3 | Named-health classifier and distinct gate diagnostics.                       | Focused classifier tests plus static gates.              | locked paths 4-6        |
| 4 | Supervisor-dispatched hosted proof and historical split capture.             | Postgres fix-head pass plus green #1747/#1754 reruns.    | evidence only           |

### Deferred Scope

- Additional causal repair selected by the historical split.
- Runtime execution — this leaf has no lease.
- Timeout increases — forbidden, not deferred.
- PLAN-EVAL and PR disposition — supervisor-owned.

### Widened reliability checkpoint

The reliable verifier design keeps the first measurement as its hard prerequisite and then names
four observable states instead of collapsing them into one aggregate timeout:

1. resource never published;
2. resource published but required health key never published;
3. required key published but never Healthy; or
4. required key Healthy while a sibling named check blocks aggregate health.

Every blocking report must retain status, description, data, exception, and health key. Transient
absence/refusal/timeout is observed for no more than 30 seconds; terminal `NOAUTH` or malformed RESP
may fail immediately. The probe fix is mandatory regardless of the historical split: canonical RESP2
array PING, bounded CRLF accumulation, exact `+PONG`, all other replies `Unhealthy`, and
host/port/elapsed/class/received-byte diagnostics. No Redis client is adopted. This design is
recorded, not implemented: #1773 remains open and PLAN-EVAL remains supervisor-owned.

### Contributor Path

After sequencing, start with the compatibility helper and its in-process tests, then make
`verify-listener-readiness.ts` poll and classify the matching resource's named `healthReports`.
Capture both named statuses in hosted evidence. If the result requires a seventh path, stop and
revise the plan.

## Progress Log

| Time (UTC)        | Slice | Step                     | Notes                                                                                                                                                                                                              |
| ----------------- | ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-31T19:00Z | S1    | Harness/bootstrap        | Read harness activation/run-loop, plan gate, lane policy, Archetype 6, docs overlay, doctrine, Aspire, CLI, tools, PR, and RTK instructions. `rtk` was unavailable on host; focused `rg` and raw Git were used.    |
| 2026-08-31T19:01Z | S1    | Re-baseline              | `HEAD`, `origin/main`, and merge base all `8f1fcb2bc`; clean worktree; target remote branch absent.                                                                                                                |
| 2026-08-31T19:02Z | S1    | First measurement        | Found the failure-path evidence gap: aggregate wait throws before `describe`; no per-check split is present in checked-in artifacts. Diagnosis deliberately withheld.                                              |
| 2026-08-31T19:03Z | S1    | Collision                | PR #1773 remains live and owns `packages/cli/e2e/**`; future diagnostic code stops pending supervisor sequencing.                                                                                                  |
| 2026-08-31T19:04Z | S1    | Aspire coordination      | Sent read-only request for both exact run/job pairs plus DCP/per-check logs; did not dispatch runtime.                                                                                                             |
| 2026-08-31T19:05Z | S1    | Base gates               | Measured structured package/focused static gates and tests; recorded broad lint refusal honestly; lock remained unchanged.                                                                                         |
| 2026-08-31T19:05Z | S1    | Design checkpoint        | Locked zero product paths, two future E2E paths, no new file, no timeout increase, and hosted proof standard.                                                                                                      |
| 2026-08-31T19:06Z | S1    | Aspire evidence returned | Recorded exact run/job/head identities. Both uploaded artifacts contain aggregate timeout only; referenced Aspire logs were runner-local and not uploaded.                                                         |
| 2026-08-31T19:15Z | S1    | #1740 lead tested        | Both tier paths provision Garnet `Mode: Auto` without `Port`; unpinned generated endpoint is unchanged across #1740. Lead retained only as a contingent real-check runtime question.                               |
| 2026-08-31T20:32Z | S1R   | Re-baseline/collision    | `origin/main` advanced only by unrelated docs to `9fbc231729`; GitHub reports #1773 open, clean, and still owning `packages/cli/e2e/**` at `bd239f916`. No E2E edit started.                                       |
| 2026-08-31T20:35Z | S1R   | Version verification     | Official dotnet package/tool searches confirm Aspire 13.5.3 current, Garnet upstream 2.1.5, image pin 1.1.1, tool pin 1.1.10; Aspire v13.5.3 source defaults to image tag 1.0.                                     |
| 2026-08-31T20:38Z | S1R   | Hosted arm comparison    | Downloaded existing report artifacts only: both failed Postgres runs removed three containers; #1773 hosted SQLite removed one and Postgres three. Both tiers select the 1.1.1 container arm.                      |
| 2026-08-31T20:40Z | S1R   | Reliability rescope      | Version skew excluded as tier-asymmetry cause and retained as cross-environment risk. Recorded four-state, full-report, 30-second-stability design; no timeout/code/version change.                                |
| 2026-08-31T21:07Z | S1R2  | Client/runtime research  | Verified the D-7 Node boundary, compared current Node Redis client graphs, selected `ioredis` 6.0.0 conditionally, and excluded `@db/redis` from the AppHost/server roles. No code path was unlocked.              |
| 2026-08-31T21:08Z | S1R2  | Auth reachability        | Managed cache schema/commands emit no auth; external mode has no RESP check; Garnet defaults to `NoAuth`. `NOAUTH` is non-causal here but its `Degraded` mapping is a permanent-wait defect.                       |
| 2026-08-31T21:09Z | S1R2  | Lock recovery            | Native dependency inspection added transient resolution entries to `deno.lock`; restored only that known-clean file to HEAD and re-verified the original SHA-256 before artifact edits.                            |
| 2026-08-31T21:35Z | S1R3  | Probe contract reversal  | Supervisor client experiment rejected the application-client design. Locked one framed RESP2 PING, split-read accumulation, exact binary verdict, 2-second attempt, 64-byte diagnostics, and six in-process cases. |
| 2026-08-31T21:36Z | S1R3  | Collision recheck        | #1773 remains open at `bd239f916`; mandatory gate work overlaps its `packages/cli/e2e/**` ownership. Locked six post-sequencing paths and made no code/test edit.                                                  |
| 2026-08-31T21:38Z | S1R3  | Probe base baseline      | Verified the probe template/test are byte-identical to base and ran the lease-free focused module: 8 passed, 0 failed. Current baseline still expects `NOAUTH` Degraded and has no split-reply case.               |

## Decisions

| Decision                              | Reason                                                                                                | Source                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| No diagnosis in S1                    | Timeout alone cannot select the real versus synthetic check.                                          | Leaf brief plus static verifier control flow.                 |
| Split before causal diagnosis         | The two outcomes imply opposite owners for any additional causal repair.                              | Leaf acceptance contract.                                     |
| Fix probe regardless of split         | TCP-segmentation sensitivity and opaque failures are independent defects.                             | Superseding supervisor contract.                              |
| Edit existing verifier only           | Runtime directory is already at 12 immediate children.                                                | Debt `scaffold-runtime-a8-f16-1333`; measured tree.           |
| Use a 30-second named-health deadline | A larger budget hides an unsatisfied condition; normal hosted readiness is 1.0-1.8s.                  | Leaf constraint and hosted baselines.                         |
| Hosted proof remains authoritative    | Local/unit evidence cannot reproduce the Postgres-tier aggregate.                                     | Leaf proof standard.                                          |
| #1740 is not a diagnosis              | Its required `entry.Port` tier difference is absent at both failing heads.                            | Static tier/config and parent-to-commit generator comparison. |
| Version skew is not the #1844 fix     | Failed Postgres and passing SQLite/Postgres observations all use image 1.1.1.                         | Hosted artifact container receipts plus Auto-arm source.      |
| Preserve version skew as risk         | Docker-less runs use tool 1.1.10 under the same readiness factory.                                    | Repo pins plus official upstream version searches.            |
| One attempt, 2000 ms                  | Aspire repeats health evaluations; internal retry would add latency and races.                        | Existing probe bound and superseding contract.                |
| Reject Redis clients                  | `@redis/client` adds HELLO/CLIENT handshake surface and failed the minimal-responder experiment.      | Supervisor experiment plus dependency research.               |
| Use minimal RESP2 PING                | One canonical command plus bounded CRLF accumulation exactly answers liveness.                        | Superseding probe contract.                                   |
| Make `NOAUTH` terminal                | `Degraded` can never satisfy aggregate Healthy; current managed paths cannot emit auth configuration. | Cache schema/generator and Garnet security docs.              |

## Drift

| Drift                                                                                                      | Severity                      | Disposition                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `rtk` named by repo guidance is not installed on this host.                                                | minor                         | Used focused `rg` and raw Git; no evidence claim depends on filtered output.                                                 |
| Broad E2E-root lint cannot produce a verdict because detached fixture catalog resolution fails.            | minor baseline                | Recorded as REFUSAL, not PASS/FAIL; focused two-file lint is clean. No source or lock workaround.                            |
| Exact run/job IDs were recovered, but DCP/AppHost logs were runner-local and not uploaded.                 | significant evidence gap      | Record exact missing paths and require pre-cleanup `describe` plus log upload; still no diagnosis.                           |
| The widened reliability mandate is larger than the S1 diagnostic-only plan.                                | significant rescope           | Updated the same run's Design/plan before code; PLAN-EVAL and a post-split causal ceiling remain mandatory.                  |
| PR #1773 remains open although its current hosted runtime checks are green.                                | scheduling blocker            | Treat check success as comparison evidence only; do not overlap its declared E2E ownership.                                  |
| Read-only dependency inspection mutated `deno.lock` resolution entries.                                    | recovered tooling side effect | Restored the previously clean lock from HEAD only; final hash is unchanged and no dependency was adopted.                    |
| The supervisor reversed the maintained-client recommendation after direct client behavior contradicted it. | significant design rescope    | Rejected every client dependency, locked the minimal probe contract, and retained the prior graph work as negative evidence. |

## Gate Results

### Static Gates

| Gate                          | Command or check                                              | Result           | Notes                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| E2E workspace check           | structured check wrapper, root `packages/cli/e2e`, `--ext ts` | PASS             | 185 files, 2 batches, 0 diagnostics.                                                                                     |
| E2E workspace format          | structured format wrapper, same root                          | PASS             | 185 selected/processed, 0 findings/refusals.                                                                             |
| E2E workspace lint            | structured lint wrapper, same root                            | REFUSAL (exit 2) | Detached `desktop-native` fixture lacks catalog `zod`; 0 lint findings; no false PASS claim.                             |
| Diagnostic-path check         | structured check wrapper on two locked files                  | PASS             | 2 files, 0 diagnostics.                                                                                                  |
| Diagnostic-path lint          | structured lint wrapper on two locked files                   | PASS             | 2/2 processed, 0 findings/refusals.                                                                                      |
| Diagnostic-path format        | structured format wrapper on two locked files                 | PASS             | 2/2 processed, 0 findings/refusals.                                                                                      |
| Rescope artifact format       | structured format wrapper on the three run Markdown files     | PASS             | 3/3 processed, 0 findings/refusals.                                                                                      |
| Lock hygiene                  | base diff plus SHA-256                                        | PASS             | `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`; byte-identical.                                      |
| Redis client graph inspection | `deps:latest`, `deps:why`, `deno info`                        | PASS (research)  | `ioredis` 6.0.0: 7/1.44 MB; `redis` 6.2.1: 7/7.65 MB; `@redis/client`: 2/5.94 MB; no lock delta retained.                |
| Focused probe base tests      | structured test wrapper on compatibility health checks        | PASS             | 8/8; both paths byte-identical to recorded base; existing `NOAUTH` expectation is Degraded and no split reply is tested. |

### Version/hosted comparison evidence

| Check                               | Result                              | Evidence                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aspire integration/CLI/SDK currency | PASS                                | Official `dotnet package search --exact-match --format json` ends at 13.5.3 for Garnet, Redis, CLI, and AppHost SDK.                                                                   |
| Garnet upstream currency            | PASS                                | Official `dotnet tool search garnet-server --detail` and Microsoft container registry both report 2.1.5 latest.                                                                        |
| Aspire compatibility default        | PASS                                | Aspire v13.5.3 `GarnetContainerImageTags.Tag` is `1.0`; no 2.x compatibility inference made.                                                                                           |
| Tier arm comparison                 | PASS                                | Failure artifacts `9763351747`/`9770814732`: three removed containers each. Hosted comparison run `33425281612`: SQLite one, Postgres three; both Garnet waits passed at 1758/1007 ms. |
| Incident classification             | EXCLUDED causal / CONTRIBUTORY risk | Same 1.1.1 arm across tiers excludes skew as the tier-asymmetry cause; 1.1.1 versus 1.1.10 remains a Docker/Docker-less reliability risk.                                              |

### Focused Tests

| Gate                                     | Result | Evidence                                                             |
| ---------------------------------------- | ------ | -------------------------------------------------------------------- |
| readiness expectation and fixture splice | PASS   | Structured test wrapper: 8 passed, 0 failed across two test modules. |

### Fitness Gates

| Gate                 | Result      | Evidence                                                                        | Notes                                                  |
| -------------------- | ----------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Source alignment     | PASS        | Every S1 claim maps to checked-in code/doctrine or is labeled supplied/pending. | Docs overlay.                                          |
| Scope separation     | PASS        | S1 evidence, future diagnostic, and later repair are explicitly separate.       | No target-state diagnosis represented as current fact. |
| F-16 / existing debt | PASS for S1 | Runtime directory measured at 12 children; S1 adds none.                        | Future diagnostic may not add a file.                  |
| JSR/public surface   | N/A         | No published surface.                                                           | Re-evaluate only after a product rescope.              |

### Runtime Gates

| Gate                                  | Result  | Evidence                                                | Notes                                                              |
| ------------------------------------- | ------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| per-check Postgres-tier split         | NOT RUN | Existing runs/artifacts inspected; named detail absent. | Exact future command and pre-cleanup capture are recorded in plan. |
| `runtime.wait.garnet` hosted fix head | NOT RUN | No repair exists.                                       | Required later; unit test insufficient.                            |
| #1747/#1754 reruns                    | NOT RUN | No repair exists.                                       | Both must be green at repair head.                                 |

## PLAN-EVAL Disposition

`N/A`, ruled by the supervisor on 2026-09-01. The design is closed against measured evidence: a full
Redis client was tested and rejected because its `HELLO`/connect-time command surface creates
additional liveness-probe failure modes; the deterministic minimal RESP contract, nine existing-path
ceiling, and behavioral acceptance are fully specified. This is an owner ruling, not generator
self-certification. Separate-session IMPL-EVAL remains mandatory and supervisor-dispatched.

## Implementation Resume

- Fetched `origin/main` at `28c4db2b07ba72c16e82503f4df9bc03ff2cbc58`; supervisor baseline
  `60ae56af0` is an ancestor.
- Merged cleanly at branch head `abd97ddad159f8b4f039bbba21df393da8865ff3`; no handwritten or
  generated-carrier conflict occurred.
- PR #1773 ownership block is lifted by supervisor directive.
- Expanded code ceiling: the original six probe/gate paths plus the three existing Garnet
  generator/test paths; no new files and no tenth code/test path.

## Handoff Notes

1. Read `research.md` **First measurement** first: the split is unresolved because current code
   discards it, not because either check has been exonerated.
2. Sequence PR #1773 before allowing any `packages/cli/e2e/**` edit.
3. Use the recorded run/job identities; do not search the uploaded suite artifacts again. They lack
   per-check detail, and the referenced Aspire logs were not uploaded.
4. Treat #1740 as tested but unsupported: no tier-specific Garnet `Port` exists. Reactivate it only
   if the real check fails and hosted endpoint evidence contradicts the static path.
5. Dispatch the canonical hosted Postgres-tier observation after the named-health instrumentation
   exists; record both named statuses. The minimal probe/gate repair proceeds independently, while
   any additional causal scope waits for this split.
6. After #1773 sequencing and supervisor PLAN-EVAL, use only the six locked code paths. Implement
   one correct RESP2 PING and the distinct named-health gate; add no Redis client or lock change.
7. The split remains required before attributing historical cause or adding any seventh-path causal
   repair. The reliability fix itself does not wait for that split.
