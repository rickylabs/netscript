# Plan: split and harden the Garnet readiness signal before causal repair

## Run Metadata

| Field            | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Run ID           | `fix-garnet-readiness-timeout--0.0.7`                                   |
| Branch           | `fix/garnet-readiness-timeout`                                          |
| Phase            | `plan-rescope` (widened mandate; artifact-only while collision is live) |
| Target           | Garnet per-check diagnosis plus reliable E2E readiness semantics        |
| Parent archetype | `6 — CLI / Tooling`                                                     |
| Scope overlay    | `docs` for S1 run artifacts; none for the later E2E diagnostic          |
| Base             | measured base `8f1fcb2bc`; current re-baseline `9fbc231729`             |

## Archetype

Archetype 6 applies because `@netscript/cli` owns the scaffold runtime harness. The nested
`packages/cli/e2e` workspace is not a separately published doctrine unit. S1 itself is a
run-artifact change under the docs overlay; the planned diagnostic changes no CLI command, generated
product, or public library surface.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split. Existing debt
`scaffold-runtime-a8-f16-1333` is relevant: the runtime gate directory has 12 immediate children, so
this plan adds no file or gate and edits the existing readiness verifier only.

## Axioms in Play

| Axiom | Why it matters                                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| A8    | Reuse the existing bounded runtime verifier; do not add a thirteenth runtime child.                                              |
| A11   | Keep the two named health checks explicit; do not introduce a generic readiness abstraction before the failing axis is measured. |
| A13   | Preserve the original timeout as the primary failure and append diagnostic context without swallowing it.                        |
| A14   | A focused parser/failure-path test is necessary, while hosted Postgres-tier evidence remains the authoritative behavior proof.   |

## Goal

First capture the Garnet resource's per-check health detail at the `runtime.wait.garnet` failure
point and answer exactly one question: is `garnet_resp` unhealthy, is `test_only_garnet_resp`
unhealthy, or are both unhealthy? Then, in this dedicated lane and only after that split, make the
readiness signal reliable by construction: preserve the implicated check's observations, fail a
stable unpublished/unreachable state well before the outer ceiling, and repair only the ownership
surface selected by the evidence.

## Scope

- S1: commit only `plan.md`, `research.md`, and `worklog.md` in this run directory.
- After PR #1773 is sequenced: amend the existing listener readiness verifier so a failed aggregate
  wait captures and reports all health checks attached to the matching Garnet resource.
- Add focused tests proving a wait failure retains the original command failure and prints both
  named health reports when present.
- Run the exact hosted Postgres-tier observation at the diagnostic head and record the split in
  `research.md`/`worklog.md`.
- After the split, replace the opaque aggregate-only wait with a described-state verifier that
  distinguishes resource-not-published, check-not-published, expected-check unhealthy, and
  sibling-check blocking states; include status/description/data/exception for every blocker.
- Use the existing 30-second fixture observation window as the stable terminal deadline for an
  unchanged unpublished/unreachable state, while retaining 300 seconds as the unchanged outer
  fail-safe.
- Re-scope the implicated real-product or test-fixture repair path after the hosted split, then
  complete the hosted proof standard in this lane.
- If the split reaches the real RESP probe, replace its raw socket protocol implementation with a
  maintained Node Redis client in the isolated generated AppHost package, and make authentication
  and protocol failures terminal, named health results.
- If the split reaches the synthetic fixture, make its Deno listener implement the exact maintained
  client's negotiation and PING contract before using it as a readiness oracle.

## Non-Scope

- No timeout increase, retry-budget change, readiness bypass, or check removal.
- No repair to the real check or synthetic fixture before the split is observed.
- No Garnet 2.x bump or 1.x arm-alignment change without a separate Docker-less compatibility
  failure proving that version work belongs to #1844.
- No `@db/redis` import in the Node AppHost while the D-7 compatibility copy is required; revisit
  client convergence only with the Aspire 13.6/S12 Deno-hosting adoption.
- No new hand-rolled AppHost RESP parser unless a measured restore/type-check failure rejects both
  maintained Node-client candidates.
- No `packages/cli/src/**`, generated asset, AppHost template, public API, or command change in this
  plan.
- No local Aspire, Docker, scaffold, `e2e:cli`, container, or runtime-resource operation.
- No overlap with PR #1773 until the supervisor explicitly sequences it.
- No PLAN-EVAL self-certification, PR creation, or merge/label operation.

## Locked Product Path Ceiling

**LOCKED FOR THE PRE-SPLIT SLICE: zero product paths.** This diagnostic/reliability plan may not
modify any file under `packages/cli/src/**`, `packages/cli/bin/**`, or generated scaffold assets.

After #1773 is sequenced, its code ceiling is exactly two existing E2E-harness paths:

1. `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`
2. `packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`

No new runtime-directory child is allowed. The failed-wait capture and reliable-state classifier
must fit these two existing files. Any need for a third code/test path, or the causal repair
selected by the hosted split, is a rescope and requires a revised locked ceiling before editing. PR
#1773 remains open and owns the parent E2E tree, so even these two paths are blocked until the
supervisor sequences them.

## Locked Decisions

| ID  | Decision                                                                                                                                                                          | Rationale                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Capture `aspire describe --format Json` on the failed wait path and report the matching resource's complete `healthReports` map.                                                  | The aggregate timeout alone cannot distinguish the checks; complete named reports also preserve host/port/error data for follow-up.                    |
| D2  | Preserve the original wait exit/error and attach the health snapshot as diagnostic context.                                                                                       | Diagnostics must not turn an actual timeout into a false success or a different primary failure.                                                       |
| D3  | Do not hard-code a diagnosis or remove either check.                                                                                                                              | The two possible outcomes require opposite repairs.                                                                                                    |
| D4  | Keep the 300-second budget unchanged.                                                                                                                                             | The issue explicitly forbids a blanket increase, which would only hide the unsatisfied check.                                                          |
| D5  | Add no file and no gate; edit the existing verifier and its existing test module.                                                                                                 | The runtime directory is at its 12-child ceiling and carries open debt.                                                                                |
| D6  | Stop code mutation after the hosted split until the implicated repair ceiling is re-locked; retain this dedicated lane.                                                           | Product versus fixture ownership cannot be selected safely before per-check evidence, but the widened mandate keeps diagnosis and repair together.     |
| D7  | Do not treat #1740 as causal from timing alone.                                                                                                                                   | Both tiers' Garnet entries omit `Port`, so the proposed tier asymmetry is statically absent and the generated endpoint is unchanged for those inputs.  |
| D8  | Model four explicit states: resource absent, health key absent, expected key non-Healthy, and sibling report blocking aggregate health.                                           | Those states lead to different ownership and error messages; an aggregate timeout erases the distinction.                                              |
| D9  | Preserve each report's status, description, data, and exception, and print the blocking key names.                                                                                | The RESP factory already exposes code/host/port; reliable evidence must not discard it.                                                                |
| D10 | A stable unpublished or unreachable observation terminates after the existing 30-second fixture deadline; 300 seconds remains the unchanged outer fail-safe.                      | Normal hosted Garnet readiness measured 1007-1758 ms, while the existing fault fixture already treats 30 seconds as its transition bound.              |
| D11 | Do not change Garnet versions in this incident plan.                                                                                                                              | Both tiers select the same 1.1.1 container arm; skew is cross-environment risk, not the observed tier-asymmetry cause.                                 |
| D12 | Keep the AppHost readiness client Node-native while D-7 is active; do not use `@db/redis` there.                                                                                  | `_aspire-compat.mts` is intentionally executed by Node and JSR marks `@db/redis` supported only on Deno.                                               |
| D13 | If the real RESP path is implicated, prefer current `ioredis` 6.x over `redis` for the generated AppHost, subject to hosted Garnet 1.1.1 compatibility proof.                     | It is a maintained Node client, is already the repository's Redis-client family, and its measured install graph is 1.44 MB versus 7.65 MB for `redis`. |
| D14 | Configure the health client as a bounded one-shot: no reconnect, no offline queue, 2-second connect/command/socket limits, explicit error handling, and unconditional disconnect. | A health callback must return one observation; library defaults that retry or queue would recreate the opaque wait at a lower layer.                   |
| D15 | Treat `NOAUTH` as `Unhealthy`, never `Degraded`, and preserve the server error in health data.                                                                                    | Aggregate `Healthy` can never be satisfied by `Degraded`; auth is absent today, so reaching this path is a configuration/protocol failure.             |
| D16 | Do not add `@db/redis` to implement the Deno fault controller; it is a client, while the fixture is a server.                                                                     | The controller must parse and answer the selected client's bounded HELLO/PING exchange; a second client dependency cannot supply that server role.     |

## Open-Decision Sweep

| Decision                       | Status                                                                                 | Notes                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which check is unhealthy?      | safe to defer through S1 and the diagnostic code slice; **must resolve before repair** | Resolved only by hosted per-check evidence.                                                                                                                   |
| Exact repair path              | safe to defer; **must resolve before repair**                                          | Test-only unhealthy means E2E fixture ownership; real unhealthy means product readiness ownership.                                                            |
| Host/port resolution follow-up | safe to defer until split                                                              | Inspect report `description`/`data` plus controller/DCP logs for the implicated check.                                                                        |
| #1740 endpoint-port lead       | resolved for static premise; contingent at runtime                                     | No Garnet `Port` differs by tier and unpinned generated output is unchanged. Reopen only if the real check fails with contradictory hosted endpoint evidence. |
| Garnet version skew            | resolved for this incident; contributory risk only                                     | Hosted Postgres and SQLite use the same 1.1.1 container arm. Do not align/bump without a Docker-less compatibility repro.                                     |
| Maintained Node client         | preferred conditionally; final lock follows the named split                            | `ioredis` 6.0.0 is the smallest current candidate and manages RESP3 negotiation/fallback; hosted Garnet 1.1.1 proof remains mandatory.                        |
| `NOAUTH` reachability          | excluded for the checked-in managed paths; retained as a fail-loud contract            | Cache schema/generator expose no auth input, managed commands pass no auth flags, external mode has no RESP check, and Garnet defaults to `NoAuth`.           |
| Deno controller library        | resolved now                                                                           | `@db/redis` is Deno-compatible but client-only; keep the fixture a bounded server and make its supported handshake explicit.                                  |
| Timeout budget                 | resolved now                                                                           | No increase.                                                                                                                                                  |

## Design

### Public surface

- No published or command surface changes.
- The existing E2E-only `ListenerHealthReport`/readiness verifier remains internal to the harness.

### Domain vocabulary

- `ListenerHealthReport` — one named Aspire custom health report.
- `healthReports` snapshot — the complete named check map for the matched Garnet resource at the
  aggregate wait failure.
- `never published` — matching resource absent, or resource present but required key absent, for the
  stable observation deadline.
- `published but never healthy` — required key present but stably non-Healthy, with its full
  observation retained.
- `sibling blocker` — required real key Healthy while another named report (notably the test-only
  key) prevents aggregate health.
- `real` / `test-only` — `garnet_resp` and `test_only_garnet_resp`; these names remain explicit in
  evidence and are not merged into a new abstraction.

### Ports

- Existing `aspire wait` subprocess — authoritative aggregate wait.
- Existing `aspire describe --format Json` subprocess — read-only per-check evidence source.
- No new port/interface is introduced.

If the split unlocks the product probe, `ioredis` is the external Node adapter behind the existing
`createRespPingCheck` factory. The factory remains the single health-result policy seam; the client
owns RESP framing, parsing, HELLO negotiation/fallback, and PING. A fresh client is connected,
pinged, and disconnected inside each invocation so no mutable connection state crosses Aspire health
evaluations.

The diagnostic slice retains `aspire wait` and captures `describe` on failure. After the split, the
reliability slice uses repeated `describe` snapshots as the state source so it can terminate and
name a stable failure before the aggregate command's opaque wall-clock timeout.

### Constants

- Existing `DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS = 300` remains byte-for-byte unchanged.
- Existing health keys remain `garnet_resp` and `test_only_garnet_resp`.
- Existing `LISTENER_READINESS_TIMEOUT_MS = 2_000` remains the one-attempt client deadline.
- Candidate generated AppHost dependency is exact `ioredis` `6.0.0`; it is not added before the
  split and post-split PLAN-EVAL.
- The reliability slice reuses the existing fixture values `REPORT_DEADLINE_MS = 30_000` and
  `REPORT_POLL_MS = 1_000` semantically; it does not create a larger timeout.

## Commit Slices

| # | Slice                                                                                                                              | Proving gate                                                                                                                                                        | Files                                           |
| - | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1 | Record the no-diagnosis S1 research, locked diagnostic plan, measured base gates, collision, and proof standard.                   | Artifact review; base static gate table; `deno.lock` byte comparison.                                                                                               | the three run artifacts only                    |
| 2 | After supervisor sequencing of #1773, preserve per-check health detail on the failed aggregate wait path.                          | Focused structured test/check/lint/fmt; original timeout remains primary and both keys appear in the fixture.                                                       | the two locked E2E paths only                   |
| 3 | Capture the hosted Postgres-tier split and stop before repair.                                                                     | Hosted `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/tmp/e2e-report-scaffold-runtime.json`; per-check snapshot answers the split. | `research.md`, `worklog.md` only                |
| 4 | After the split and a re-locked ceiling, make the verifier classify and fail stable unpublished/unreachable states loudly.         | Focused state-machine/parser tests; normal hosted readiness remains green; a fixture blocker names its key/code/host/port within the 30-second stable deadline.     | two locked E2E paths unless rescope is approved |
| 5 | Repair the evidence-selected real check or test-only fixture and complete authoritative hosted proof.                              | Postgres hosted pass at fix head plus #1747/#1754 reruns; no bypass, version guess, or timeout increase.                                                            | unknown until split; must be re-locked          |
| 6 | If the real check is selected, replace raw RESP with the bounded Node client and make the Deno fixture speak that exact handshake. | Focused framing/fragmentation/auth/timeout tests, generated AppHost restore/type-check, then the full hosted proof standard.                                        | candidate paths only; must be re-locked         |

## Gate Table and Measured Base Baselines

| Order | Gate                                                      | Base result at `8f1fcb2bc`                                                       | Required after slice 2/3                                                                                                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Focused structured test wrapper on readiness/splice tests | PASS, 8/8                                                                        | PASS; add failure-path assertions without weakening current tests.                                                                                                                                                                                                                                                                                                       |
| 2     | Structured check on the two locked files                  | PASS, 2 selected, 0 diagnostics                                                  | PASS.                                                                                                                                                                                                                                                                                                                                                                    |
| 3     | Structured lint on the two locked files                   | PASS, 2/2 processed, 0 findings/refusals                                         | PASS.                                                                                                                                                                                                                                                                                                                                                                    |
| 4     | Structured format on the two locked files                 | PASS, 2/2 processed, 0 findings/refusals                                         | PASS.                                                                                                                                                                                                                                                                                                                                                                    |
| 5     | E2E workspace structured check                            | PASS, 185 files, 0 diagnostics                                                   | PASS if the supervisor requests workspace-wide static evidence.                                                                                                                                                                                                                                                                                                          |
| 6     | E2E workspace structured format                           | PASS, 185/185, 0 findings/refusals                                               | PASS if requested.                                                                                                                                                                                                                                                                                                                                                       |
| 7     | E2E workspace structured lint                             | REFUSAL, exit 2: detached fixture catalog `zod`; 0 findings                      | Do not call this PASS. Use the focused clean gate; any full-root sufficiency decision belongs to the supervisor.                                                                                                                                                                                                                                                         |
| 8     | Lock hygiene                                              | PASS; SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` | Byte-identical.                                                                                                                                                                                                                                                                                                                                                          |
| 9     | Hosted Postgres-tier diagnostic                           | NOT RUN by S1 constraint                                                         | Required to answer the split. Exact command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/tmp/e2e-report-scaffold-runtime.json`. Instrument the failure path to persist pre-cleanup `aspire describe --apphost <exact-generated-apphost.mts> --format Json --non-interactive --nologo` and upload it plus `~/.aspire/logs/cli_*.log`. |
| 10    | Hosted fix-head proof                                     | NOT RUN; no repair exists                                                        | Required after the later repair plan.                                                                                                                                                                                                                                                                                                                                    |

## Authoritative Proof Standard

A unit test is necessary but not sufficient. Final repair acceptance requires all of the following:

1. The diagnostic failing-head run captures the status of both `garnet_resp` and
   `test_only_garnet_resp`, selecting the correct ownership path.
2. `runtime.wait.garnet` passes on the **Postgres tier** in a hosted `scaffold.runtime` run at the
   repair head.
3. #1747 and #1754 are rerun at that repair head and are green.
4. The 300-second timeout is not increased and neither check is bypassed.
5. An intentionally absent health key and an intentionally unreachable listener fail with distinct
   diagnostics that name the resource, health key, last state, and observed status/description/
   code/host/port; the stable terminal case does not consume the 300-second ceiling.

## Risk Register

| Risk                                         | Mitigation                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A fourth confident but unsupported diagnosis | Treat the split as unresolved until both named reports are captured.                                                  |
| Diagnostic masks the original failure        | Preserve wait error/exit as primary; attach bounded structured health context.                                        |
| Diagnostics race cleanup                     | Capture `describe` inside the failing gate before command return triggers suite cleanup.                              |
| Directory debt deepened                      | Add no file; edit the existing verifier.                                                                              |
| PR #1773 collision                           | S2 is blocked until supervisor sequencing; do not edit owned E2E paths now.                                           |
| Recency turns #1740 into a false diagnosis   | Keep its failed static premise in research; reopen only after real-check and contradictory hosted endpoint evidence.  |
| A timeout increase hides the defect          | D4 locks the budget at 300 seconds.                                                                                   |
| Unit-only false confidence                   | Hosted Postgres-tier pass plus #1747/#1754 reruns is the proof bar.                                                   |
| Fail-fast rule rejects normal startup        | Require a stable repeated state for the existing 30-second observation window; retain the 300-second outer fail-safe. |
| Version churn substitutes for diagnosis      | Both tiers use the same arm; exclude version changes unless Docker-less compatibility evidence re-scopes the issue.   |

## Anti-Patterns to Resolve or Avoid

| AP        | Status             | Plan                                                                        |
| --------- | ------------------ | --------------------------------------------------------------------------- |
| AP-1 / A8 | existing debt risk | No new runtime child and no unrelated registry growth.                      |
| AP-18     | risk               | Assert semantic named reports and statuses, not a giant whole-log snapshot. |
| AP-25     | risk               | Aspire process access remains in the existing E2E runtime edge.             |

## Fitness and Debt Implications

| Item                                     | Disposition                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Static gates                             | Required through structured focused wrappers.                                         |
| Runtime/Aspire                           | Hosted diagnostic required; locally forbidden in S1.                                  |
| JSR/public-surface gates                 | N/A for this unpublished E2E diagnostic.                                              |
| `quality:gate` / full Archetype-6 matrix | N/A for S1 artifacts; re-evaluate only if later repair touches `packages/cli/src/**`. |
| `scaffold-runtime-a8-f16-1333`           | Do not deepen; no new file/gate. No debt entry is created or closed in S1.            |

## Deferred Scope

- The exact causal repair path, but only until the per-check split is measured; the widened mandate
  retains that repair in this dedicated lane after re-scope.
- Stable release/canary work.
- Any general health-diagnostic refactor beyond the one failure path.

## Dependencies and Stop Conditions

- PR #1773 is still open at `bd239f9160e7b65808bd7c4fc8bbd61c91e3dd99` and owns
  `packages/cli/e2e/**`; S2 stops pending supervisor sequencing. Its checks are green, but green is
  not a release of path ownership.
- The exact 300451/300465 run/job identities are recorded. Their DCP/AppHost logs were runner-local
  and not uploaded, which is why a new pre-cleanup diagnostic capture is required.
- PLAN-EVAL disposition belongs to the supervisor. This generator does not self-certify.
- Any request for a hosted observation before diagnostic instrumentation should use the exact
  canonical command above and be supervisor-dispatched; this leaf holds no runtime lease.
