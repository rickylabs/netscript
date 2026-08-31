# PLAN-EVAL — feat-prisma-mysql-adapter-surface--1293

- Plan evaluator session: Claude bg session `75d9028e-0277-4b1c-bc2f-cefd0ce68dd7` / 2026-08-15
- Run: `feat-prisma-mysql-adapter-surface--1293`
- Surface / archetype: `packages/prisma-adapter-mysql` / Archetype 2 — Integration
- Scope overlays: none
- Subject: `research.md`, `plan.md` at plan head `23c4d671b57282ddf2e5c3b834ac8e787d1dff09`
- Author thread under evaluation: Codex `01a0048f-8d95-7682-a3ce-1c1926aba75c` (not resumed, not
  steered)

## Attachment identity

| Field                 | Value                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Session ID            | `75d9028e-0277-4b1c-bc2f-cefd0ce68dd7`                                                                       |
| Bridge session ID     | `cse_01T55opXUMc1mMKDZaA8bRf3` (non-empty; `bridgeOutboundOnly: false`)                                      |
| Remote Control URL    | `https://claude.ai/code/session_01T55opXUMc1mMKDZaA8bRf3`                                                    |
| PID                   | `417888` (`claude bg-spare --bg-spare /tmp/cc-daemon-1000/59093fbc/spare/fdf34e6d.claim.sock`)              |
| cwd                   | `/home/codex/repos/netscript-007-features-1293`                                                              |
| Requested route       | Local PLAN-EVAL of a Codex plan: Claude · Anthropic · Fable 5 · medium (`lane-policy.md` row 45)             |
| Observed route        | `respawnFlags` in `/home/codex/.claude/jobs/75d9028e/state.json`: `--model claude-fable-5 --effort medium --remote-control` |
| Route match           | **match** (read from `respawnFlags`, not argv — argv is the spare-claim form and carries neither flag)        |

## Immutable-identity check

| Check                | Observed                                                                                     | Result |
| -------------------- | -------------------------------------------------------------------------------------------- | ------ |
| Local `HEAD`         | `23c4d671b57282ddf2e5c3b834ac8e787d1dff09` (`git rev-parse HEAD`)                            | match  |
| Remote ref           | `git ls-remote origin refs/heads/feat/prisma-mysql-adapter-surface` → `23c4d671b…7d1dff09`  | match  |
| Branch               | `feat/prisma-mysql-adapter-surface`                                                          | match  |
| Tree                 | `git status --porcelain` → 0 lines                                                           | clean  |
| Base recorded in plan| `284dda90a17a13a7e5e8e9834e5411b58887131b`                                                   | match  |

## Coordinator rulings honoured (not reopened)

1. `PrismaMySqlOptions.onConnectionError` is preserved and wired; removal was not considered.
2. `docs/site/reference/prisma-adapter-mysql/index.md` and #1112 stay outside this leaf.
3. Split-close (`Part of #1293`, no closing keyword, box 4 unchanged, #1293 open until #1112) is
   taken as given and is not evaluated here.

## Independently measured baseline (subject 3)

Commands run from `packages/prisma-adapter-mysql/` at head `23c4d671b`:

| Claim in plan/research                                     | Command                                                     | Observed                                                                                                                                                                                                                                                                                                                                | Verdict     |
| ---------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Six pre-existing `private-type-ref` doc-lint errors        | `deno doc --lint mod.ts`                                    | exit 1, `Found 6 documentation lint errors`: `PrismaMySqlTransactionAdapter["options"]`→`TransactionOptions` (adapter.ts:502); `PrismaMySqlTransactionAdapter["queryRaw"]`→`SqlQuery`,`SqlResultSet` (504); `PrismaMySqlConnectedAdapter["queryRaw"]`→`SqlQuery`,`SqlResultSet` (522); `PrismaMySqlConnectedAdapter["startTransaction"]`→`IsolationLevel` (530) | **confirmed** — count and identity match research F-16 |
| Raw dry-run green, no slow-type warning, eight files       | `deno publish --dry-run --allow-dirty`                      | exit 0, `Success Dry run complete`; file list = README.md, deno.json, mod.ts, src/adapter.ts, src/conversion.ts, src/errors.ts, src/mod.ts, src/types.ts (8 files, no `examples/`, no `tests/`); no slow-type diagnostic, only the banner line                                                                                             | **confirmed** |
| JSR helper `F-JSR-7` is a banner-count false positive      | `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/prisma-adapter-mysql --text` | `dry-run: OK slowTypeWarnings=1` / `WARN F-JSR-7 slow-types: Checking for slow types in the public API...`; helper line 439 matches `/slow type/i`, which the banner text satisfies                                                                                                                                                                                                                | **confirmed** false positive; raw dry-run is the authority (`jsr-audit` skill) |
| Upstream mariadb invokes the hook at exactly one site      | `@prisma/adapter-mariadb@7.8.0/dist/index.mjs:383-390`, `index.d.mts:61-62` | single site: `conn.on("error", onError)` on the transaction connection; documented as "Callback attached to transaction connection `error` events"; signature `(err: mariadb.SqlError)`                                                                                                                                                | **confirmed** |
| `PrismaMySqlAdapter` unexported; class extends private base| `src/adapter.ts:319-326`, `src/mod.ts:40-49`                | class has no `export`; ctor takes private `MysqlPoolClient` (32-44); root re-exports the factory, `PrismaMySql` alias (adapter.ts:742) and six types                                                                                                                                                                                      | **confirmed** |
| Probe swallows every failure                               | `src/adapter.ts:700-718`                                    | `catch (e) { debug(...); return { supportsRelationJoins: false }; }`                                                                                                                                                                                                                                                                    | **confirmed** |
| Two paths from one acquisition failure                     | `src/adapter.ts:367-395`                                    | inner `catch` (384-387) rejects `connectionReady` and rethrows; outer `.catch` (391-395) rejects again. `pool.getConnection()` failure (624) never enters the inner catch — only the outer `.catch` sees it                                                                                                                                | **confirmed**, and material to the choke-point ruling below |
| `errors.ts` has no connection predicate; no `fatal` field  | `src/errors.ts:12-19`, `196-210`                            | `MySqlError` = errno/sqlMessage/sqlState/code/message/cause; `isDriverError` is not exported and is not a connection predicate                                                                                                                                                                                                           | **confirmed** |
| mysql2 marks establishment/transport errors `fatal`        | `mysql2@3.23.2/lib/commands/client_handshake.js:311,323,371,385`; `lib/base/connection.js:208,217,456,906` | handshake errors ("Unknown handshake errors are fatal"), socket errors, `PROTOCOL_CONNECTION_LOST`, connect-timeout are all `err.fatal = true`                                                                                                                                                                                             | measured — used as the classifier's primary signal below |

Doctrine citation spot-check: A1/A2/A5/A10/A11/A13/A14 exist as named in
`docs/architecture/doctrine/01-thesis-and-axioms.md:20-106`; AP-3 (God interface), AP-4/5, AP-10,
AP-11, AP-14, AP-19, AP-25 exist as named in `09-anti-patterns-and-fitness-functions.md:46-185`.
Archetype-2 gate set F-1..F-12, F-14..F-19 matches `.llm/harness/gates/archetype-gate-matrix.md`.
`.llm/harness/debt/arch-debt.md` has no entry for `packages/prisma-adapter-mysql` (only saga-store
Prisma entries), so the plan's "no debt covers this package" statement holds.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` § Re-baseline: re-derived against `origin/main` = `284dda90a` on 2026-08-15; load-bearing findings F-5, F-6, F-7, F-10, F-13, F-15, F-16 spot-checked above and all hold                                                                                                      |
| Decisions locked                        | PASS   | `plan.md` § Locked decisions D1–D8, each with rationale; the three items reserved for this gate are ruled below and become D9–D11 (see "Required plan amendment")                                                                                                                          |
| Open-decision sweep                     | PASS   | `plan.md` § Open-decision sweep lists all six; the three "must resolve now" items were reserved for PLAN-EVAL by the coordinator's brief and are **resolved by this artifact**, so no decision that would force rework remains open. My own sweep found one unflagged item (test reachability of the internal class) — resolved by ruling R2.4 rather than left open |
| Commit slices (< 30, gate + files each) | PASS   | S1–S3 + final evidence pass; each names what it proves, its supporting checks, files, and a Tier-A stop. `executeScript` (F-9) missing from S2's file/boundary list is corrected by ruling R1.7                                                                                              |
| Risk register                           | PASS   | `plan.md` § Risk register — 12 rows with mitigations; the duplicate-notification and callback-masking rows are made concrete by rulings R1.5/R1.6                                                                                                                                          |
| Gate set selected                       | PASS   | `plan.md` § Fitness gates: Archetype-2 F-1..F-12, F-14..F-19, static gates, consumer import validation; runtime/`scaffold.runtime` correctly N/A                                                                                                                                             |
| Deferred scope explicit                 | PASS   | `plan.md` § Non-Scope, § Deferred scope and drift watch, D6/D8                                                                                                                                                                                                                             |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` § jsr-audit surface scan: applicable=true, five named risks; each has a slice — risk 1/2/3 → S1, risk 4/5 → final evidence pass + S3 dry-run file-list review. Baseline claims independently confirmed above                                                                   |

## Open-decision sweep (evaluator-run)

Decisions the plan left open that would force rework if deferred: the three it flagged (predicate,
export shape, probe fatality). Unflagged: **how tests reach `PrismaMySqlAdapter`** — the class has
no `export` in `src/adapter.ts` and the only constructor path is `PrismaMySqlAdapterFactory.connect()`
which does `await import('mysql2/promise')` + `createPool(...)`, so a fake-client test cannot inject
a `MysqlPoolClient` today. All four are ruled below; none remains open.

## Rulings

These are binding for S1–S3. Where a ruling costs something, the cost is stated.

### R1 — Callback timing and error semantics (subject 1)

**R1.1 Predicate = a package-owned classifier, applied uniformly at every driver-rejection boundary.**
"Connection error" is defined *by classifier*, not by boundary name. Add to `src/errors.ts`:

```ts
export function isConnectionError(error: unknown): boolean
```

returning `true` iff the value is a driver error (`isDriverError`) and any of:

- `fatal === true` (mysql2 marks every handshake, socket, connect-timeout and
  `PROTOCOL_CONNECTION_LOST` error fatal — measured above);
- `errno ∈ {1040, 1203}` (server capacity — the issue's "pool fails" case);
- `code ∈` a closed, exported constant set of transport/pool codes:
  `ECONNREFUSED, ECONNRESET, ETIMEDOUT, EPIPE, EHOSTUNREACH, ENOTFOUND, EAI_AGAIN,
  PROTOCOL_CONNECTION_LOST, PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR, PROTOCOL_ENQUEUE_AFTER_QUIT,
  PROTOCOL_ENQUEUE_AFTER_DESTROY, PROTOCOL_SEQUENCE_TIMEOUT, HANDSHAKE_NO_SSL_SUPPORT, POOL_CLOSED,
  POOL_CLOSED_CONNECTION, POOL_ENQUEUELIMIT, POOL_NONEONLINE`.

`MySqlError` (`errors.ts:12-19`) gains `fatal?: boolean`. `isConnectionError` may be root-exported
as a type-safe utility only if `surface:diff` records it intentionally; default is **module-internal
export** (importable by `adapter.ts` and tests, not re-exported from `mod.ts`). This is
implementable from the code as it stands; no undefined classifier remains.

**R1.2 Auth / access / missing-database / capacity — ruled.** 1045 (`AuthenticationFailed`), 1044
(`DatabaseAccessDenied`), 1049 (`DatabaseDoesNotExist`) fire the hook **iff the driver marked them
`fatal`**, i.e. when they occur at connection establishment (handshake). Raised mid-session (e.g. a
later `USE`, or a query against another schema) they are ordinary mapped errors and do **not** fire.
1040/1203 fire always. In every case the existing `DriverAdapterError` mapping is unchanged (D3):
the hook observes; it never replaces the mapped rejection. Cost: a consumer cannot distinguish
"bad credential" from "server down" *by the hook alone* — they read `err` for that; the hook's job
is "the pool could not give you a usable connection", which is exactly #1293's motivation.

**R1.3 Precedent vs intent — ruled for intent, documented as a superset of upstream.** Upstream's
"transaction connection `error` events" predicate is unreachable through our `MysqlPoolClient` /
`MysqlQueryableClient` seam (no event surface, `adapter.ts:32-44`) and does not satisfy the issue.
Our already-wider `(err: Error) => void` signature is kept; the predicate is carried by the
`PrismaMySqlOptions.onConnectionError` JSDoc (which must state R1.1/R1.2 in one paragraph and name
`isConnectionError`) and by tests. Do **not** add a connection `error`-event listener in this leaf
(no seam exists; adding one is a scope change).

**R1.4 Capability probe — notify-and-preserve-fallback.** `getCapabilities` keeps returning
`{ supportsRelationJoins: false }` on any failure; when `isConnectionError(e)` the adapter's single
notifier fires once, before `connect()` resolves. Cost, stated plainly: `connect()` still succeeds
with a dead host or bad credential; the first real operation then fails with its mapped error and
fires the hook again (once per operation — that is per-operation "exactly once", not a duplicate).
Rejecting instead would change shipped 0.0.6 `connect()` behaviour without breaking-change
authority, and would make the probe's conservative fallback dead code. The example gains what it
needs: the hook fires during `connect()` when the pool fails.

**R1.5 Observational containment — swallow + `debug` log, never aggregate, never rethrow.** The
callback is invoked inside its own `try/catch`; a throw is passed to `debug(...)` and dropped. The
primary rejection must be the **same object** (identity, not just shape) that would have been
thrown without the option set. Tests assert `===` on the rejection reason with and without a
throwing callback. Cost: a buggy consumer callback fails silently unless `DEBUG=prisma:*` is on;
acceptable for an observational hook and matches upstream's stance.

**R1.6 Single notification choke point — design constraint, not merely a test.** One private
method `#notifyConnectionError(err: unknown): void` on `PrismaMySqlAdapter` (or a module-level
`notifyConnectionError(options, err)` shared with `MySqlTransaction` via constructor injection) is
the **only** call site of `options.onConnectionError`. For `startTransaction`, notification happens
**only** in the outer `connectionLifecycle.catch` (`adapter.ts:391-395`), which is the single
observer that sees acquisition failure (`pool.getConnection()` at 624 never enters the inner
`catch`), isolation/`BEGIN` failure, and post-ready lifecycle failure exactly once each. The inner
`catch` (384-387) keeps rejecting `connectionReady` and rethrowing but must not notify. Test: one
acquisition failure → callback count exactly 1.

**R1.7 `executeScript` (research F-9) — in scope for notification, out of scope for
normalisation.** `executeScript` keeps rejecting raw (no `convertDriverError` change this leaf), but
its rejection passes through the same notifier + classifier. S2's file/boundary list must name it.

**R1.8 Boundary table as ruled** (all through R1.1's classifier and R1.6's single choke point):

| Boundary                          | Fires when                          | Rejection unchanged? |
| --------------------------------- | ----------------------------------- | -------------------- |
| Capability probe (`connect()`)    | classifier true; fallback preserved | `connect()` resolves |
| Pooled `queryRaw`/`executeRaw`    | classifier true, inside `onError()` | mapped `DriverAdapterError` |
| `executeScript`                   | classifier true                     | raw                  |
| Tx acquisition / isolation / BEGIN | classifier true, outer `.catch` only | raw via deferred    |
| Tx `queryRaw`/`executeRaw`        | classifier true, inside `onError()` | mapped               |
| `COMMIT` / `ROLLBACK`             | classifier true; cleanup still runs | raw                  |
| Disposal (`pool.end()`)           | classifier true (rarely)            | raw                  |
| Successful disposal               | never                               | —                    |

### R2 — Public adapter export (subject 2)

**R2.1 Choice B is ruled.** The concrete class stays out of the root export map;
`PrismaMySqlConnectedAdapter` remains the public result type, and `PrismaMySqlTransactionOptions`
is added and type-exported as the plan states. Reason: the issue's *need* is "an example cannot name
the type it constructs" — the example constructs `PrismaMySqlAdapterFactory` (public) and receives
`PrismaMySqlConnectedAdapter` (public) from `connect()` (`examples/basic-usage.ts:37,47`); both are
nameable today. Choice A would put `MysqlPoolClient` and `MySqlQueryable` into the surface or force
a construction redesign (`adapter.ts:32-44`, `95-102`, `319-326`), which is AP-3/AP-4 territory
and larger than a surface fix; upstream keeps the class private for the same reason.

**R2.2 Box 1 as written is not satisfied by B — said plainly.** #1293 acceptance box 1 says the
*class* is exported. Under B it will not be. The product PR's `acceptance-evidence` block must mark
box 1 as **not discharged as worded** and state that the intentionally exported connected-adapter
contract (`PrismaMySqlConnectedAdapter`, `PrismaMySqlTransactionAdapter`,
`PrismaMySqlTransactionOptions`) satisfies the stated need. Rewording box 1 is an **owner/issue
edit** the orchestrator should request; it is not the leaf's to make. Because the split-close
contract already keeps #1293 open, this does not block the product PR's own gates.

**R2.3 No `PrismaMySqlAdapter` symbol may appear in `surface:diff`** as a root export. If S1's diff
shows it, that is drift against this ruling.

**R2.4 Test reachability (unflagged open item, resolved).** Add a **module-scoped** `export` to
`class PrismaMySqlAdapter` in `src/adapter.ts` (and to `MySqlTransaction` if needed) so tests can
construct it with a fake `MysqlPoolClient`; do **not** re-export from `src/mod.ts`. `deno doc --lint
mod.ts` lints the root graph, so this does not reintroduce private-type diagnostics; the
`surface:diff` must show no root delta from it. This is the minimum seam that makes S2's tests
possible without a running MySQL.

### R3 — Capability-probe fatality (subject 1, restated as the third open decision)

Ruled in R1.4: **notify-and-preserve-fallback**. Regression tests must assert (a) `connect()`
resolves and `getConnectionInfo().supportsRelationJoins === false` when the probe rejects with a
classifier-true error, (b) the callback fired exactly once with that error, (c) the callback did
**not** fire when the probe rejects with a classifier-false error (e.g. errno 1146).

## Subject 4 — tests: can they fail, and can they reach all eight boundaries?

Yes, given R2.4. Every boundary in R1.8 is reachable through the two internal seams the class
already depends on — `MysqlPoolClient` (`query`, `execute`, `useConnection`, `close`) and the
`MysqlQueryableClient` handed to `useConnection`'s callback:

- probe: fake `query` rejects on the first `SELECT VERSION()` call, then resolves;
- pooled query/execute and `executeScript`: fake `query`/`execute` reject;
- acquisition: fake `useConnection` rejects **before** invoking `fn` (mirrors `pool.getConnection()`
  at 624);
- isolation/`BEGIN`, tx queries, `COMMIT`/`ROLLBACK`: the fake connection passed to `fn` rejects on
  the matching SQL;
- disposal: fake `close` rejects.

Required assertions so the tests can fail: exact callback call count (0 or 1) per scenario; the
argument is the same object as the driver rejection; the primary rejection is identity-equal with
and without a throwing callback; a classifier-false error at each fired boundary produces count 0.
The one boundary **not** reachable is upstream's connection `error`-event path — excluded by R1.3,
so no coverage is promised for it. The `deno.json` `test` task runs `./tests/` with
`--allow-net --allow-env`; fake-client tests need neither and will run under the contracted
`test` receipt.

## Subject 5 — surface and JSR gates; D7

- Named JSR risks each have a home: export-map delta → `surface:diff` in S1 (with R2.3 as the
  pass condition); private-type leakage → the six repairs + `deno doc --lint mod.ts` exit 0
  (raw output recorded, not summarised); inherited `provider`/`adapterName` annotations → S1;
  `catalog:` materialization → raw dry-run file list + `package.json` review; `@netscript/*` exact
  pins → **N/A, stated as N/A** (research F-21: no publishable member imports `@netscript/*`);
  runtime asset / top-level `import.meta` → confirmed absent (F-22; the only `import.meta.main`
  is in the excluded example). This discharges the risks as long as each raw output is recorded in
  the run artifacts.
- **D7 is honest scoping, not evasion.** The four contracted receipts (`check`, `test`,
  `publish-dry-run`, `arch-check`) with distinct IDs match the leaf contract, and the plan states
  the supporting checks (surface diff, doc-lint, JSR audit, quality scan) remain *required*
  acceptance/fitness evidence — they are simply not renamed as extra receipt IDs. Condition: the
  raw `deno doc --lint mod.ts` exit code and the raw `deno publish --dry-run` tail must be pasted
  into `worklog.md`/evidence at the content head, because box 3 ("`deno doc --lint` clean") is
  otherwise proven only by an un-receipted check. IMPL-EVAL should recompute sufficiency from the
  four named files and confirm those two raw outputs are present.

## Verdict

`PASS`

Rationale for `PASS` rather than `FAIL_PLAN`: the three "must resolve now" items were reserved for
this gate by the coordinator, are decisions the author lane had no authority to make, and are now
resolved above; every Plan-Gate box is otherwise satisfied with cited evidence. Sending the plan
back only to transcribe these rulings would spend a `FAIL_PLAN` cycle on clerical work.

### Required plan amendment before the first S1 code commit

The author records the rulings as locked decisions in `plan.md` (this is a run-artifact edit, not
implementation) — D9 = R1.1–R1.3, R1.5–R1.8; D10 = R2.1–R2.4; D11 = R1.4/R3 — and adds
`executeScript` to S2's boundary list. The orchestrator verifies this at the S1 Tier-A stop.
Implementation that diverges from a ruling is drift and must be recorded in `drift.md`.

## Notes

- Observation only (outside this gate): the split-close contract is coherent with the leaf's
  evidence; no objection.
- Upstream mariadb maps `getConnection()` failure through `onError` (`index.mjs:383`) while ours
  rejects raw at acquisition; normalising that is a separate change and is **not** authorised by
  this ruling (R1.7 keeps raw rejections raw).
- No PR exists at this head, so no `[PHASE: PLAN-EVAL]` comment is posted; the verdict is
  reported to the orchestrator.
