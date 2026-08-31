# Plan: diagnose and deterministically harden Garnet readiness

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

Capture the Garnet resource's per-check health detail at the `runtime.wait.garnet` failure point and
answer whether `garnet_resp`, `test_only_garnet_resp`, or both are unhealthy. Independently of that
historical split and of any version result, replace the defective RESP probe with one deterministic,
bounded RESP2 PING observation and make the gate distinguish a never-published health key from a
published-but-unhealthy key.

## Scope

- S1: commit only `plan.md`, `research.md`, and `worklog.md` in this run directory.
- After PR #1773 is sequenced, repair the Node AppHost probe to send the canonical RESP array PING,
  accumulate a bounded reply across TCP reads through CRLF, and classify the exact reply.
- Add in-process listener tests for split and single-segment `+PONG`, `NOAUTH`, garbage, closed
  port, and accept-without-reply behavior.
- Amend the existing listener readiness verifier so it polls named health reports for at most 30
  seconds and reports all checks attached to the matching Garnet resource.
- Add focused tests proving distinct never-published and published-unhealthy failures.
- Run the exact hosted Postgres-tier observation at the diagnostic head and record the split in
  `research.md`/`worklog.md`.
- Replace the opaque aggregate-only wait with a described-state verifier that distinguishes
  resource-not-published, check-not-published, expected-check unhealthy, and sibling-check blocking
  states; include status/description/data/exception for every blocker.
- Use a 30-second Garnet gate deadline with one-second observations; retain no 300-second Garnet
  wait path.
- Complete the hosted proof standard after the collision and PLAN-EVAL gates are cleared.

## Non-Scope

- No timeout increase, readiness bypass, or check removal.
- No Garnet 2.x bump or 1.x arm-alignment change without a separate Docker-less compatibility
  failure proving that version work belongs to #1844.
- No Redis client dependency, RESP3 negotiation, authentication flow, `CLIENT` command, or reusable
  general-purpose RESP parser. A full client adds handshake surface that a liveness probe does not
  need.
- No change to the Deno synthetic listener unless evidence shows it violates the minimal PING
  contract.
- No local Aspire, Docker, scaffold, `e2e:cli`, container, or runtime-resource operation.
- No overlap with PR #1773 until the supervisor explicitly sequences it.
- No PLAN-EVAL self-certification, PR creation, or merge/label operation.

## Locked Product Path Ceiling

**LOCKED NOW: zero code paths while PR #1773 owns `packages/cli/e2e/**` and PLAN-EVAL remains
supervisor-owned.** After both gates clear, the complete code ceiling is exactly these six existing
paths:

1. `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`
2. `packages/cli/src/kernel/assets/embedded.generated.ts` (mechanical regeneration only)
3. `packages/cli/src/kernel/templates/aspire/helpers/tests/aspire-compat-health-checks_test.ts`
4. `packages/cli/e2e/src/application/gates/scaffold/runtime/listener-readiness-gates.ts`
5. `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`
6. `packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`

No new file or runtime-directory child is allowed. Any seventh code/test path requires an explicit
rescope before editing.

## Locked Decisions

| ID  | Decision                                                                                                                                                   | Rationale                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Poll `aspire describe --format Json` and report the matching resource's complete `healthReports` map.                                                      | The aggregate timeout alone cannot distinguish the checks; complete named reports also preserve host/port/error data for follow-up.                   |
| D2  | Preserve the last described state and any describe subprocess error as diagnostic context.                                                                 | Diagnostics must not turn a failed observation into false success or erase the command failure.                                                       |
| D3  | Do not hard-code a diagnosis or remove either check.                                                                                                       | The two possible outcomes require opposite repairs.                                                                                                   |
| D4  | Replace Garnet's 300-second opaque wait with a 30-second named-health deadline; do not increase any timeout.                                               | Normal hosted readiness is 1007-1758 ms and the fixture already uses 30 seconds as its transition bound.                                              |
| D5  | Add no file and no gate; edit the existing verifier and its existing test module.                                                                          | The runtime directory is at its 12-child ceiling and carries open debt.                                                                               |
| D6  | Fix the minimal RESP probe regardless of the historical split or version outcome, while still capturing the split when hosted evidence is available.       | Fragment-sensitive framing and opaque diagnostics are defects independently of the historical trigger.                                                |
| D7  | Do not treat #1740 as causal from timing alone.                                                                                                            | Both tiers' Garnet entries omit `Port`, so the proposed tier asymmetry is statically absent and the generated endpoint is unchanged for those inputs. |
| D8  | Model four explicit states: resource absent, health key absent, expected key non-Healthy, and sibling report blocking aggregate health.                    | Those states lead to different ownership and error messages; an aggregate timeout erases the distinction.                                             |
| D9  | Preserve each report's status, description, data, and exception, and print the blocking key names.                                                         | The RESP factory already exposes code/host/port; reliable evidence must not discard it.                                                               |
| D10 | Poll named health state once per second for no more than 30 seconds; terminal protocol/configuration failures may fail immediately.                        | Startup-transient absence/refusal remains retryable, while `NOAUTH` and malformed completed replies cannot heal without configuration change.         |
| D11 | Do not change Garnet versions in this incident plan.                                                                                                       | Both tiers select the same 1.1.1 container arm; skew is cross-environment risk, not the observed tier-asymmetry cause.                                |
| D12 | Add no Redis client dependency.                                                                                                                            | `@redis/client` adds `HELLO`/`CLIENT SETINFO` handshake behavior and forcing RESP2 still hung against the supervisor's minimal responder.             |
| D13 | Send exactly `*1\r\n$4\r\nPING\r\n` and accumulate bytes through the first CRLF-terminated reply.                                                          | This is the minimal canonical RESP2 command and removes TCP-segmentation sensitivity.                                                                 |
| D14 | Make one connection attempt per Aspire health evaluation with one 2000 ms connect-plus-read deadline and a 64-byte diagnostic capture ceiling.             | Aspire already repeats health evaluations; internal retry would add latency and nondeterminism.                                                       |
| D15 | Treat `NOAUTH` as `Unhealthy`, never `Degraded`, and preserve the server error in health data.                                                             | Aggregate `Healthy` can never be satisfied by `Degraded`; auth is absent today, so reaching this path is a configuration/protocol failure.            |
| D16 | Render received bytes deterministically: printable ASCII literal, backslash/CR/LF escaped, other bytes as `\xHH`, and a truncation marker beyond 64 bytes. | Diagnostics must be stable, bounded, and useful for binary or malformed replies.                                                                      |

## Open-Decision Sweep

| Decision                       | Status                                                                                                                           | Notes                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which check is unhealthy?      | safe to defer through the mandatory reliability repair; **must resolve before claiming historical cause or adding causal scope** | Resolved only by hosted per-check evidence.                                                                                                                   |
| Exact repair path              | resolved for the mandatory reliability repair                                                                                    | Fix the probe and gate on their own merits; the split still selects any additional causal repair.                                                             |
| Host/port resolution follow-up | safe to defer until split                                                                                                        | Inspect report `description`/`data` plus controller/DCP logs for the implicated check.                                                                        |
| #1740 endpoint-port lead       | resolved for static premise; contingent at runtime                                                                               | No Garnet `Port` differs by tier and unpinned generated output is unchanged. Reopen only if the real check fails with contradictory hosted endpoint evidence. |
| Garnet version skew            | resolved for this incident; contributory risk only                                                                               | Hosted Postgres and SQLite use the same 1.1.1 container arm. Do not align/bump without a Docker-less compatibility repro.                                     |
| Redis client                   | rejected                                                                                                                         | Connect-time negotiation adds health-probe failure modes; use one correct framed RESP2 PING.                                                                  |
| `NOAUTH` reachability          | excluded for the checked-in managed paths; retained as a fail-loud contract                                                      | Cache schema/generator expose no auth input, managed commands pass no auth flags, external mode has no RESP check, and Garnet defaults to `NoAuth`.           |
| Deno controller library        | resolved now                                                                                                                     | `@db/redis` is client-only; keep the fixture a bounded server that answers the minimal PING contract.                                                         |
| Timeout budget                 | resolved now                                                                                                                     | No increase.                                                                                                                                                  |

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

- Existing `node:net` socket — narrow transport port for one framed PING, not a reusable client.
- Existing `aspire describe --format Json` subprocess — read-only named-health evidence source.
- The readiness verifier polls `describe` rather than delegating the entire diagnosis to opaque
  aggregate `aspire wait`.

### Constants

- Existing health keys remain `garnet_resp` and `test_only_garnet_resp`.
- `LISTENER_READINESS_TIMEOUT_MS = 2_000` is the single attempt's total connect-plus-read deadline.
- `RESP_PING_COMMAND = "*1\\r\\n$4\\r\\nPING\\r\\n"`.
- Reply accumulation is capped at 256 bytes; exceeding it is `EPROTO`.
- Diagnostic reply capture is capped at 64 bytes.
- Garnet readiness deadline is 30 seconds, polled once per second (at most 30 observations).

### Required focused cases

| Case                                      | Required verdict and evidence                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `+PO`, pause, then `NG\r\n`               | `Healthy`; proves TCP segmentation does not affect the verdict.                                   |
| One-write `+PONG\r\n`                     | `Healthy`.                                                                                        |
| `-NOAUTH ...\r\n`                         | `Unhealthy`; code `NOAUTH`, endpoint/elapsed/escaped bytes present.                               |
| Garbage/non-RESP reply                    | `Unhealthy`; code `EPROTO`, escaped received bytes present.                                       |
| Closed local port                         | `Unhealthy`; code `ECONNREFUSED`, completes well below the 2000 ms deadline and records elapsed.  |
| Accept connection but never send a reply  | `Unhealthy`; code `ETIMEDOUT`, completes at the 2000 ms deadline without hanging.                 |
| Required health key absent through gate   | Gate says the key was never published.                                                            |
| Required health key present and unhealthy | Gate says the key exists and is unhealthy, preserving status/description/data/exception and name. |

## Commit Slices

| # | Slice                                                                                                               | Proving gate                                                                                             | Files                        |
| - | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1 | Record the no-diagnosis S1 research, locked diagnostic plan, measured base gates, collision, and proof standard.    | Artifact review; base static gate table; `deno.lock` byte comparison.                                    | the three run artifacts only |
| 2 | After supervisor sequencing and PLAN-EVAL, implement the minimal bounded RESP PING and regenerate the asset barrel. | Six in-process cases pass; focused check/lint/fmt; `deno.lock` unchanged.                                | locked paths 1-3             |
| 3 | Implement the 30-second named-health classifier and distinct gate diagnostics.                                      | Focused tests distinguish never-published from published-unhealthy and retain key/status/data/exception. | locked paths 4-6             |
| 4 | Capture the hosted Postgres-tier split and complete authoritative proof.                                            | Hosted `scaffold.runtime` Postgres pass at fix head plus green #1747/#1754 reruns.                       | artifacts only after code    |

## Gate Table and Measured Base Baselines

| Order | Gate                                                      | Base result at `8f1fcb2bc`                                                       | Required after slice 2/3                                                                                                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Focused structured test wrapper on readiness/splice tests | PASS, 8/8                                                                        | PASS; add failure-path assertions without weakening current tests.                                                                                                                                                                                                                                                                                                       |
| 1a    | Focused compatibility health-check tests                  | PASS, 8/8; both probe paths byte-identical to base                               | PASS with split/single `+PONG`, `NOAUTH` Unhealthy, garbage bytes, fast closed port, and silent-server deadline cases.                                                                                                                                                                                                                                                   |
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
4. No timeout is increased and neither check is bypassed.
5. An intentionally absent health key and an intentionally unreachable listener fail with distinct
   diagnostics that name the resource, health key, last state, and observed status/description/
   code/host/port/elapsed/received bytes; the terminal case does not consume a 300-second wall.

## Risk Register

| Risk                                         | Mitigation                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A fourth confident but unsupported diagnosis | Treat the split as unresolved until both named reports are captured.                                                 |
| Diagnostic masks the observation failure     | Preserve describe error/exit and the last bounded structured health context.                                         |
| Diagnostics race cleanup                     | Capture `describe` inside the failing gate before command return triggers suite cleanup.                             |
| Directory debt deepened                      | Add no file; edit the existing verifier.                                                                             |
| PR #1773 collision                           | S2 is blocked until supervisor sequencing; do not edit owned E2E paths now.                                          |
| Recency turns #1740 into a false diagnosis   | Keep its failed static premise in research; reopen only after real-check and contradictory hosted endpoint evidence. |
| A timeout increase hides the defect          | D4 replaces the opaque Garnet wait with a smaller named-health deadline.                                             |
| Unit-only false confidence                   | Hosted Postgres-tier pass plus #1747/#1754 reruns is the proof bar.                                                  |
| Fail-fast rule rejects normal startup        | Retry transient absence/refusal for the 30-second window; fail terminal protocol/configuration states immediately.   |
| TCP segmentation changes verdict             | Accumulate a bounded reply through CRLF and prove split `+PO` / `NG\r\n`.                                            |
| Version churn substitutes for diagnosis      | Both tiers use the same arm; exclude version changes unless Docker-less compatibility evidence re-scopes the issue.  |

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
