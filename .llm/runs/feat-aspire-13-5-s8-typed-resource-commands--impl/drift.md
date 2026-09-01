# Drift — S8 #1720

## D-01 — Standalone fallback absent at the S6 base

The ratified S8 scope says to retain the standalone database-operation path. At `564d465c`,
`operation-runner.ts` instead fails closed when no resident AppHost is detected, and the older
separate db-operation AppHost generator is no longer present. Slice 4 must restore an appropriately
scoped fallback or explicitly escalate a contract change; it must not claim an already-existing
fallback was preserved.

Resolution in slice 4: the fallback now starts the normal project `apphost.mts` only after
`aspire ps --format Json` proves that exact path is absent, executes the same bounded wait and
resource route, and stops only the host it started. It does not revive the removed ad-hoc
`db-operation/apphost.mts`. The existing generic explicit-start dispatcher remains available on
`<db>-cli` for non-typed operations and migrations that carry a name; its IO moved into the shared
emitted `run-tool.mts` edge.

## D-02 — S2 receipt index is narrower than the dispatch summary

The named S2 V12 help receipt covers deploy-family commands rather than full `aspire resource` and
`aspire wait` argv. A separate lifecycle receipt demonstrates wait exit 17; exit 18 is not observed
in the checked-in research receipts. Phase A treats the dispatch contract as locked and unit-tests
both exits. Phase B remains responsible for live CLI evidence.

## D-03 — 13.5.3 TypeScript visibility projection is not bit-combinable

The documentation describes `ResourceCommandVisibility.UI | ResourceCommandVisibility.Api`, but
the restored 13.5.3 `aspire.mts` emits a string enum (`UI = "UI"`, `Api = "Api"`) and
`CommandOptions.visibility?: ResourceCommandVisibility`. The documented bitwise form fails D-19
with TS2322/TS2362/TS2363. Slice 5 therefore omits the property and uses Aspire's documented
default visibility (both UI and API), preserving the intended dashboard and CLI surface without a
cast. The restored declaration and compiler evidence are cited in the slice-5 receipt.

## D-04 — D-39 supersedes the historical inotify/zombie host classification

The supervisor re-proved the host at 2026-08-30T09:27Z: `fs.inotify.max_user_instances=1024`,
Docker client/server 28.5.2 at `tcp://netscript-dind:2375`, and PID 1 is `tini` with zero zombies.
The lifecycle and watch tests are trustworthy. This run therefore treats any restore, `watchFs`,
or lifecycle-test red as a real finding and does not apply the old inotify-128 or zombie waiver.
The separately recorded remote-DinD bind-mount and loopback topology (D-42/D-43) remains the only
runtime-phase limitation; it does not change Phase A's static-only boundary.

## D-05 — Phase-B gate existed but was not registered

At the leased Phase-B preflight, the typed DB gate factory existed but `scaffold.runtime` did not
include it. A focused suite-registry test failed RED (19 passed / 1 failed). The minimal repair
registers it for PostgreSQL runtime suites and excludes it for SQLite; the focused suite-registry
and runtime-gate tests then passed 41/41. This was an S8-owned defect and was repaired before the
single live pass so that a successful suite could execute the requested evidence gate.

## D-06 — Full runtime pass stopped before typed DB evidence

The one authorized `scaffold.runtime` pass exited 1 at `generated.quality-negative` with
passed=26, failed=1, skipped=0. The report records a Fresh hydration TS2345 and missing S6 health
members after the scratch restored configured SDK 13.4.6 under CLI 13.5.3. The critical failure
occurred before runtime startup, so `runtime.typed-db-phase-b` did not execute. No retry or
workaround was attempted. Cleanup and the independent leak reporter proved zero run-owned
survivors; the supervisor relay process was left untouched.

## D-07 — ANSI task banners masked typed-command failure details

Coordinator proof run 33330455111, job 99308020561 reached PostgreSQL seed and failed exit 16, but
the typed resource command surfaced only the colored Deno task banner. The emitted runtime edge
trimmed and compared raw stderr with `startsWith('Task ')`; ANSI controls therefore bypassed the
banner filter and stopped capture before the real error line. A RED black-box template test
reproduces that exact sequence. The repair strips terminal controls before classification, keeps
the existing first-line message, additively exposes bounded actionable stderr, and persists it for
the typed command. The actual seed cause remains intentionally unknown until the supervisor's one
lease-backed diagnostic; this static slice does not speculate or repair beyond observability.

## D-08 — reconstruction counts and transient initial-main check failure

D-121 counted 7 stale S6 commits, but the reachable old segment from `5d2bd8756` through
`01f27d4d4` contains 6. Together with 17 stale S5 commits and the corrected 10 S8 commits, this
matches the stated 33 commits over the old base. The reconstruction has zero stale-hash overlap.

After the first rebase, the structured E2E check exposed a missing relative import already present
at the initially fetched `origin/main` head: `ui-data-screen-gates.ts` imported
`./generated-app-name.ts`, while the module was under `./runtime/`. This was outside S8 and was not
repaired here. Before push, `origin/main` advanced to `8a9257642`, which already contained the
unrelated import correction. The complete 13-commit reconstructed branch rebased onto that head
cleanly. Final combined CLI/E2E check passed 904 files with zero diagnostics, and the full focused
set including suite registry passed 98/98. The transient red remains recorded as command-history
evidence without broadening this behavior-preserving reconstruction.

## D-09 — D-210 base convergence is byte-preserving

The coordinator replaced the superseded D-205 seed diagnostic with exact-base convergence onto
`origin/main` `6c195acaf`. The 13-commit replay was conflict-free, every range-diff mapping is `=`,
and every one of the 20 non-generated product blobs changed by S8 is identical between old and new
heads. The asset generator produced no delta. Therefore no seed repair, listener resolution, or
other product decision was made in this run.

The structured lint/fmt wrappers initially and correctly refused partial coverage because the
workspace configuration excludes `packages/cli/`; pointing at the nested E2E member still inherited
that exclusion. A temporary standalone config under ignored `.llm/tmp/` copied the repository lint
rules and format settings without the path exclusion, after which both wrappers processed 19/19
changed TypeScript files with zero findings. The two exit-2 coverage refusals remain evidence, not
product failures.

## D-10 — D-07 did not retain Prisma structured fields

The D-216 artifact request expected the previously added actionable-stderr capture to expose
Prisma's `code` and `meta`. Both digest-verified report ZIPs and both exact job logs instead end the
typed-command detail after the third actionable line, `Invalid prisma.user.findFirst()
invocation:`. D-07 intentionally bounded the retained details to three lines, so the requested
Prisma fields are absent from the only uploaded report and cannot be recovered from these runs.
This run records that evidence literally and does not relabel the failure as P2021, P2022, P1001,
or P2002 without bytes.

The missing fields do not prevent identifying S8's deterministic connection-path defect: the typed
callback replaced Aspire's late-bound resource injection with a static AppHost configuration
lookup. The repair restores resource-expression resolution. No runtime is run locally; CI remains
the authority for the resulting database behavior.

## D-11 — declared `ReferenceExpression.getValue()` is not a supported callback capability

D-227 correctly repaired the TypeScript spelling but made an invalid equivalence between a
compile-visible SDK member and a capability implemented by the running AppHost. Run `33447847678`
proved the distinction: the call dispatches `Aspire.Hosting.ApplicationModel/getValue`, which that
runtime rejects as unknown. This supersedes D-10's final sentence: Container database commands no
longer resolve a resource expression in the typed callback at all.

Resolution: preserve the typed command surface while routing its Container operation through the
existing explicit-start `<db>-cli` executable. Aspire performs graph-time environment injection
for that resource through `withEnvironment`, `withReference`, and `waitFor`; the runner returns an
atomic bounded result to the callback. External configuration and SQLite file URLs remain on their
separate supported paths. Static coverage deliberately omits `getValue` from its minimal SDK
contract and rejects any emitted in-callback call, preventing another compile-clean capability
regression. No local runtime or evaluator was dispatched.

## D-12 — D-224 retained context but Aspire masked it behind its leading message

Run `33450804252` proves the graph-injected seed repair: `database.seed` passes and the suite reaches
58 gates. The next typed migrate failure demonstrates a distinct observability seam. D-224 retains
bounded stderr, but request mode puts its informational first line at the start of the command
message; Aspire renders only the leading portion. The uploaded report contains no result record or
AppHost log, so the later retained failure cannot be recovered from that run.

Resolution is diagnostic-first and generic: promote the first failure-shaped retained line, carry
the unchanged bounded array separately, and make the Phase-B verifier report both output streams.
No vendor-specific classifier or local runtime is permitted. The underlying migrate behavior is
not changed until the pushed diagnostic slice supplies exact CI evidence.

## D-13 — Aspire truncates typed-command messages and decisive migration guidance is stdout

Run `33452657304` at `592a8e688` proved two additional seams. Aspire renders only the first line of
a multi-line command result, and its outer process writes that rendered result to stderr. Separately,
the generated migration script writes non-interactive guidance through `console.log`, while the
emitted runner retained only stderr. This is why the first generic classifier slice still displayed
the Prisma preamble.

Resolution: add an independently bounded stdout diagnostic using D-224's existing line/byte policy,
select the concise message across both retained streams, and flatten message plus context onto one
Aspire-visible line. D-224's `actionableStderr` order, 8/24 split, 32-line cap, and 16-KiB ceiling
remain unchanged.

## D-14 — typed runtime migrate invoked migration authoring

Run `33453461545` at `a5f1ab7e0` surfaced the exact retained failure: the headless session could not
create a migration and instructed the operator to run `netscript db migrate --name
<migration-name>` in an interactive terminal. The typed runtime command was incorrectly routed to
`db:migrate:<engine>`, which is the `prisma migrate dev` authoring task.

Resolution: preserve the public Aspire action name `migrate` but map its internal task operation to
the already-generated `db:deploy:<engine>` task (`prisma migrate deploy`). Apply the same mapping to
Container request mode and direct External/SQLite execution; seed/reset are unchanged.

## D-15 — stdout retention doubled D-224's persisted total

D-13 described stdout as independently bounded and incorrectly said D-224's 16-KiB ceiling remained
unchanged. The constants remained unchanged per stream, but the persisted artifacts concatenate
both retained streams. At `e4464e9f4`, the new generic flood fixture measured a 32,767-byte error
file, 33,479-byte request result JSON record, and 32,893-byte flattened message. This is contract
drift, not a new combined-bound contract.

Resolution uses option (a): retain the D-224 line count, 8/24 head-tail split, 511-byte maximum line
allowance, tail bias, and UTF-8-safe truncation per stream, then derive a smaller final allowance
from one shared 16-KiB pool when both streams retain detail. Request serialization additionally
accounts for its JSON envelope and duplicated promoted message. The same fixture now measures
16,383 bytes, 16,384 bytes, and 16,061 bytes respectively. D-13's statement that stdout is
independently bounded is superseded by this shared persisted-total rule.

The generic failure selector also no longer scans stderr as a block before stdout. Retained lines
carry their observed complete-line capture sequence, so a real earlier stdout error outranks a later
failure-shaped informational stderr line. Separate OS pipes do not expose a total kernel timestamp;
the repair intentionally claims observed line-completion order only.

## D-16 — typed-db phase B reused an actuator known not to update health

The S8 verifier stopped the real Postgres resource and waited for its real listener key to become
Unhealthy. D-101 already documents that `aspire resource stop` suspends health evaluation for a
persistent container and leaves the last health report cached. Run `33460896691` observed exactly
that state: the resource was stopped while `postgres_listener` remained Healthy. The repair uses
D-101's synthetic Postgres listener and attached test-only key, keeping the real resource alive.

## D-17 — typed deploy success changes later listener-fixture setup indirectly

D-233 made the typed migrate/deploy command succeed, so the suite no longer takes its failure-only
AppHost restart path. The earlier restarting head later passed SQLite listener-unreachable; the
latest non-restarting head lacked the test-only Garnet report at baseline. This proves reachability
and correlation, not ownership: the available S8-free SQLite run timed out before this gate. The
runtime restriction prevents the missing current-main control, so SQLite is recorded and left
unchanged.
