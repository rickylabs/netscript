# QWEN FINAL ADVERSARIAL ACCEPTANCE EVALUATION — RFC-A (#1390) × RFC-B (#1389)

## 0. Identity and transport

| Field | Value |
| --- | --- |
| Evaluator | Qwen 3.8 Max (`openrouter/qwen/qwen3.8-max`), fresh session, maximum reasoning effort |
| Role | Final independent adversarial acceptance reviewer (root-orchestrator-owned pass; separate from generator Codex and cycle-1/2 evaluator Claude Fable 5) |
| Date | 2026-08-08 |
| Transport | OpenCode CLI on Linux; direct `git`/`gh`/registry/web access from the evaluation environment |
| Mutation boundary honored | This session wrote **only** this report. No RFC text, fixture, harness artifact, product code, branch, PR, label, comment, issue, milestone, or merge state was touched. No subagents or rival evaluators were launched. |

## 1. Exact evaluated SHAs

| Object | SHA | Verified |
| --- | --- | --- |
| RFC-A accepted content (`rfcs/0000-sdk-client-contributions.md`) | **`78a7cecd1d5eaafa7a65bc25a21af497567128dc`** | `git show` in `/home/codex/repos/ns-rfc-sdk-client`; RFC text byte-identical at branch HEAD (diff content-commit→HEAD touches only `.llm/runs/` artifacts) |
| RFC-A branch HEAD (cycle-2 verdict artifact) | `14b5c858cbead4aabe06e991528d8e9eaaaca7dc` | matches live `gh pr view 1390 .headRefOid` |
| RFC-A fixture | `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` @ `14b5c858c` | read in full |
| RFC-B accepted content (`rfcs/0000-command-composition-kit.md`) | **`c98c08adabbd992a557ff7c596deae68b9c9cd62`** | `git show` in `/home/codex/repos/ns-rfc-command-kit`; RFC text byte-identical at branch HEAD |
| RFC-B branch HEAD (cycle-2 verdict artifact) | `57b51128fbc28187b55e1e377cd3e1777332dfa1` | matches live `gh pr view 1389 .headRefOid` |
| Cross-RFC brief | `CROSS-RFC-REVIEW.md` @ `cb0ca256e` in `/home/codex/repos/netscript-fable5-remediation-plan` | read in full |
| Product baseline | `origin/main` @ `fac9e339042c5394bf882311657d8981d353a1c3` | merge-base of both RFC branches; both worktrees clean |

## 2. Evidence read and executed

**Read (complete):** both RFCs at accepted SHAs (1,611 + 1,966 lines); both `plan-eval.md` histories (cycle 1 findings F-A1–F-A10 / F-B1–F-B7 + cycle-2 resolution tables); RFC-A committed type fixture (503 lines); both `final-handoff.md`; RFC-A `drift.md` (via cycle-2 artifact set); both cycle-2 worklog gate tables; `CROSS-RFC-REVIEW.md`; seed-run `MASTER-PLAN.md`, `ISSUE-DEDUP-AND-SUPERSESSION.md`, `FILING-LOG.md`; `rfcs/README.md` (RFC process); `0000-template.md` presence; netscript-pr skill label/lifecycle sections; `.github/labels.yml` status taxonomy; doctrine `02-public-surface.md` sanctioned oRPC-types exception.

**Executed (independent, not taken from prior evaluators):**

- `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` → **exit 0** (third independent execution of this gate).
- Live registry queries (npm): `@orpc/client` / `@orpc/server` dist-tags `latest=1.15.0`, `beta=2.0.0-beta.26`; publish timeline (v1.15.0 at 2026-08-08T13:52Z, **after** beta.26 at 11:21Z; seven v1 patches since 2026-07-25); `@orpc/opentelemetry` dist-tags `latest=1.14.11`, `beta=2.0.0-beta.26` (v1 line confirmed).
- Primary upstream fetch: official v1→v2 migration guide (`v2.orpc.dev/docs/migrations/from-v1`) — verified wire incompatibility, middleware-dedup removal, `.$meta`→`defineMeta`, GET rejection by default (`allowMethods` = POST/PUT/PATCH/DELETE), `Sec-Fetch-Mode` CSRF plugin, `status`→`errorStatusMap` split, `safe()` result-shape change, `isDefinedError`→`isInferableError`, serializer-instance change, `@orpc/otel`→`@orpc/opentelemetry`, `RequestHeadersPlugin`→`RequestHeadersHandlerPlugin`, Zod-v4-only `@orpc/zod`, TanStack package consolidation.
- Live GitHub: PR #1390/#1389 state/labels/head/mergeable/body/comments; GraphQL review threads (**0 total / 0 unanswered on both**); check-run state at both HEADs (all lanes `skipped` — path-filtered docs-only); full issue sweep of #1348–#1388 (titles/states/milestones/labels), plus #451, #1093, #1278, #1293, #1347, #1320 context; `rfc`-labelled issue list; PR #822 file list (no `rfcs/` files → no numbering race).
- Worktree source verification at baseline (every load-bearing RFC claim spot-checked): closed 9-field `CreateServiceClientOptions` with reserved no-op `port`/`timeout`; context-less `ServiceClientMethod`; `inferRPCMethodFromContractRouter` at `http-client-link.ts:17/:82` (GET live today); GET-only dedupe filter; `retry: 0` default; trace injection at `:90-91`; `baseContract: ReturnType<typeof oc.errors>` erasure at `contract-primitives.ts:81`; six-code `commonErrorMap`; current erased `BaseContractErrors = MergedErrorMap<Record<never,never>, ErrorMap>`; `'~orpc'` accessor in `ContractProcedureLike`; `withTransaction()` root-client assertion (`database/mod.ts:128`); 5-value `IsolationLevel` incl. MSSQL `Snapshot`; `WorkerIdempotencyPort` "exactly-once-effective" comment (`:30`); MySQL adapter `SNAPSHOT` (`:480`); queue adapter runtime `ensureSchema`/`CREATE TABLE IF NOT EXISTS` (`:296-348`); telemetry `netscript.correlation.id` (`messaging.ts:15`) and `netscript.idempotency.key` (`saga.ts:12`); Desktop `createORPCClient` + MessagePort `RPCLink` (`desktop/application/desktop-rpc-client.ts:1-32`); `packages/service/deno.json` has **no** `@netscript/database` dependency (new edge genuinely new); `plugin-contributions.ts` closed `'auth-backend'` doctor literal, no `sdkClients` group; `create-service-query-utils.ts:63` cast fast path; oRPC procedure context today is `context: {}` (`service/src/primitives/handlers.ts:126/:156`) with `principal` only in the Hono middleware bag; Prisma 7.8.0 in lock; zod 3.25.76 + 4.4.3 coexisting in lock; `deno.lock` oRPC family pinned 1.14.6; `rfcs/` on main contains only template+README (zero numbered RFCs).

## 3. Severity-ranked findings table

Prior evaluators' artifacts were treated as evidence only; every finding below was re-derived against current source/live state.

| # | Sev | RFC | Finding | Evidence / disposition |
| --- | --- | --- | --- | --- |
| Q1 | **Low (advisory, board)** | B | Guide-level envelope derivation uses `context.principal.*`, `context.correlationId`, `context.traceHeaders`, `context.signal` inside the oRPC handler, but today's oRPC procedure context is `context: {}` (`handlers.ts:126/:156`); `principal` exists only as an untyped Hono bag entry — exactly the defect #1387 (TA-04) is filed to fix. RFC-B's issue decomposition never cross-references #1387/#1383. | Not a design blocker: the kit contract is actor-source-agnostic (caller supplies `CommandEnvelope.actor`; system actors explicit; absence never anonymous). **Repair:** amendment on #1363 (and backlink on #1387) naming the typed-principal shape as the consumer dependency for the authenticated envelope path, so Stage-8 generated handler examples compile against a real surface. |
| Q2 | **Low (advisory, board)** | A | #1350's live body is exactly the `safe()`/error-map repair (verified) and does **not** own `NetScriptProcedureMeta` initialization. RFC-A Stage 1b metadata therefore has no owner until the Stage-0 decision (widen #1350 vs dependent child) is recorded. | Correctly staged by the RFC (Stage 0; FCP Q6), but it is a **hard downstream edge**: #1352 auth dogfood cannot ship without the metadata vocabulary. Must be recorded at/before numbering, not left to FCP drift. |
| Q3 | **Info** | A | v2 gate list does not explicitly name the `@orpc/zod` **Zod-v4-only** requirement (verified in migration guide) while the repo lock carries both zod 3.25.76 and 4.4.3 and #1320 (single Zod) is blocked upstream. | Fold into the v2 epic scope row (schema/OpenAPI parity). RFC-A's gate list is a stated minimum, so this is an addition, not a defect. |
| Q4 | **Info** | A | The `74 non-test / 91 total` oRPC file count is the worklog's recorded scan; my independent quick greps with different exclusion rules produced 39–56. Direction (broad cross-package footprint) confirmed; exact count is scan-definition-dependent. | No action; the number is motivation, not a gate. |
| Q5 | **Info** | A+B | `CommandTelemetryStart.idempotency` is `'claimed' \| 'not_requested'` while result/attribute vocabulary adds `'replayed'/'missing'/'mismatch'/'busy'`. Coherent because the span starts before the claim resolves (algorithm step 3 precedes step 5) and final attributes come from `finish(result)` — but the asymmetry deserves one doc line at implementation. | Implementer note, not an RFC defect. |
| Q6 | **Info (process)** | A+B | All CI check runs at both HEADs are `skipped` (path-filtered docs-only + `ci:skip-*` labels, ruled valid by cycle 2 — diff is RFC + run artifacts + one compile-only fixture, no package/lock/generator change). The **only** compile evidence is the recorded fixture gate; re-executed here (exit 0). | Acceptable at RFC bar; root orchestrator should know no CI lane compiled these branches. |
| Q7 | **Info (process)** | A+B | Frontmatter `target-milestone` convention differs (A: 0.0.7 = implementation; B: 0.0.6 = ratification, footnoted). Both are factually consistent with the live board (verified: #1349–#1353 in 0.0.7; #1361/#1348 in 0.0.6; #1362–#1364/#1363 in 0.0.8; #1350 in 0.0.7). | Harmonize convention at numbering. |
| Q8 | **Info (process)** | A+B | MASTER-PLAN fork F4 recorded "issue-hosted" as the default, but execution followed the canonical file-based process of `rfcs/README.md` (file + companion tracking issue). These are the first file RFCs (`rfcs/` on main has none); PR #822 adds no `rfcs/` file, so no numbering race. | Retire the F4 divergence note at numbering; maintainer chooses whether RFC-A or RFC-B receives 0001. |
| Q9 | **Info (hygiene)** | A | PR #1390 body DoD checkbox "Formal cycle-2 verdict is recorded" remains unchecked although the APPROVED verdict comment (19:01:57Z) and artifact exist; body phase line still says `status:plan-eval` while the live label is `status:augment-review`. | Cosmetic; fix at FCP prep. |

**No critical or major findings.** All 17 cycle-1 findings (F-A1–F-A10, F-B1–F-B7) were mechanically re-checked against the accepted content and are **confirmed resolved** — see §5.

## 4. Individual verdicts

### 4.1 RFC-A — Typed SDK client contributions (PR #1390): **PASS_ACCEPT**

The RFC is decision-complete at the RFC bar:

- **Seam law is closed.** Descriptor protocol (`family/major` closed at 1), id grammar/limits, context declaration ↔ TypeScript required/optional bijection, `headerKeys` as reserved-output subset, mandatory `responseCache` trichotomy, sequential prepare with deterministic first failure, duplicate rejection with named conflict markers, and order-independence (valid contributions commute) are all normative with runtime re-validation for JS/widened/plugin boundaries.
- **Compatibility is proven, not asserted.** Every widened public generic carries an explicit default (normative table); the committed in-tree fixture compiles real `ContractLike`/`defineServices`/`ServiceQueryUtils`/key/desktop surfaces, pins the exact 3-tuple default server key, the 5-tuple partitioned key, direct-only omission, required-context call/query arguments, duplicate-context diagnostic, and the 16/17 budget — and I re-executed it to exit 0.
- **The hard lifecycle cases are settled.** Prepare-once-per-epoch with byte-equivalent replay across unary retries; iterator-phase reconnect = new epoch with exactly one re-preparation (credential rotation fixture mandated); abort semantics; dedupe header-safety; desktop MessagePort rejection (type + runtime + generator); reserved framework keys excluded from the contribution projection; private ports located, unexported, and absence-gated via `deno doc` + packed-consumer negatives.
- **Security model is explicit.** Redaction list, partition non-secret law, cleartext/loopback bearer rules, redirect/cookie/CORS limitations, input-as-borrowed-data duty, and the metadata-guides-but-does-not-enforce boundary.
- **Upstream boundary is honest.** Zero-oRPC gate scoped to new RFC-A + generated declarations under a non-growing #1350/#1278 allowlist (doctrine's sanctioned oRPC-types exception verified); stable-v1 first adapter; v2 fenced into its own RFC/spike with a complete gate matrix.

Residual decisions are the eight FCP questions, all policy-safe under my own adjudication (§7), with Q6 (metadata ownership) carrying the §3-Q2 recording obligation.

### 4.2 RFC-B — Production command composition kit (PR #1389): **PASS_ACCEPT**

The RFC is decision-complete at the RFC bar:

- **The atomicity claim is exactly one store commit**, enforced by construction: `sideRecordAtomicity: 'same_commit'` is a construction invariant, all four side-record delegates derive from the transaction callback's `TTx`, `callbackAttempts: 'one'` forbids adapter replay, and the refusal boundary rejects every cross-store/network-in-transaction shape rather than weakening the promise.
- **The previously-silent boundary decisions are now normative.** Per-provider receipt-claim algorithms (PG `ON CONFLICT DO NOTHING RETURNING` + transaction-local `lock_timeout` save/restore, `55P03`→busy, `40001` retryable; MySQL savepoint recovering **only** 1062 with `INSERT IGNORE` explicitly forbidden, session `innodb_lock_wait_timeout` restore-or-discard; MSSQL `UPDLOCK/HOLDLOCK` on the named generated unique index with `SET LOCK_TIMEOUT` restore; busy callback-terminal; every timeout path rolls back) — mechanically sound against provider semantics and poison-free by construction.
- **Package ownership is acyclic and declared.** Relay runtime (decoded delivery/sinks/supervisor) in `@netscript/service/commands/relay`; raw rows/lease/token/release in `@netscript/database/commands`; the only new edge is `service → database` (verified absent today in `packages/service/deno.json`); database imports no service type.
- **Reuse discipline is recorded.** Queue non-wrapping decision with real reasons (delete-on-ack/DLQ semantics, runtime DDL verified present, `TTx` join impossibility); pattern/test reuse only, with a named reconciliation prerequisite before any code sharing.
- **Identity law is complete.** JCS/RFC-8785 request hash over the exact versioned semantic request; key hash separate; scope/fingerprint determinism with frozen-value conformance; execute-as-new for changed scope/renamed command stated honestly as the consequence plus migration obligation; definition-version change under a stable key = mismatch.
- **Capability honesty is enforced.** `selectableIsolationLevels` vs `defaultIsolation` split; MySQL blocked on `SNAPSHOT` removal + allow-listing (defect verified live at `adapter.ts:480`, distinct from #1293); SQLite default-only shape deferred to FCP Q2 with no support claim; Deno KV and multi-store refused.
- **Conformance is the strongest artifact in either RFC**: 20-item positive/negative matrix, 10 named fault seams, real-provider requirement (no type-only fakes), and the root-client negative control.

Residual decisions are the four FCP questions, all policy-safe with recorded recommendations; plus the §3-Q1 advisory cross-reference.

### 4.3 Cross-RFC verdict: **COMPOSE CLEANLY — PASS**

- **No circular dependency.** Shared prerequisite #1350 (0.0.7) is one-way; RFC-A stages 1a/1b and RFC-B stage 0 both consume it. RFC-B's new `service → database` edge is acyclic. Neither RFC imports the other's surface.
- **No conflicting error ownership.** RFC-A's `SdkClientContributionError` is local, pre-dispatch, never a contract error, never `.errors(...)`-mergeable; RFC-B's `commandErrorMap` is route-opt-in contract vocabulary. Both require #1350's literal-preserving `ContractBuilder` spelling; whichever lands first establishes it and the other reuses (obligation explicit in both texts; current erased spelling verified live, so #1350 is genuinely prerequisite).
- **No conflicting context/telemetry/idempotency ownership.** RFC-A reserves trace headers to the client transport (final `traceparent` must describe the SDK client span — verified injection point at `http-client-link.ts:90`); RFC-B persists validated W3C context in durable rows and emits `command.*` vocabulary from `@netscript/telemetry/attributes` with stricter redaction than today's messaging/saga attributes (asymmetry acknowledged, cleanup owned as FCP Q3). Disjoint layers. RFC-A's permitted `idempotency-key` **header** and RFC-B's envelope `idempotencyKey` **input field** are different layers; the future HTTP recipe (#1364) must name the authoritative one for services accepting both — watch item, not a conflict.
- **No duplicated primitives.** No existing JCS/canonicalization utility exists in `packages/` (verified), so RFC-B's codec is new, not reinvented; RFC-A's descriptor/reference types have no prior seam; plugin discovery routes through #1093 rather than a second switch system.
- **One cosmetic inconsistency** (frontmatter milestone convention, §3-Q7) and **one shared spelling obligation** — both already named in the cross-RFC brief.

## 5. Cycle-2 resolution audit (all 17 findings)

Independent re-check against the accepted content SHAs; "anchor" = location in the accepted RFC text.

| Finding | Cycle-2 claim | Adversarial re-verification | Result |
| --- | --- | --- | --- |
| F-A1 scoped zero-oRPC gate | resolved | Anchor present (scoped to new declarations + generated clients; non-growing allowlist; doctrine sanction verified); gate now passable in principle | **Confirmed** |
| F-A2 server key algebra | resolved | Default exact 3-tuple preserved (fixture asserts it against live `createActionQueryKey`); 5-tuple partitioned shape; six-surface disposition table; cast fast-path restricted; upstream fixture dispositioned (verified cast at `create-service-query-utils.ts:63`) | **Confirmed** |
| F-A3 compatibility defaults | resolved | Normative defaults table covers every widened public generic; fixture proves default assignability of `ServiceClient`/`ServiceQueryUtils` | **Confirmed** |
| F-A4 stream reconnect credential | resolved | Epoch model normative; reconnect = fresh single preparation; mandatory A→B rotation fixture with preparation-count 2 and per-epoch byte equality; aborted stream starts no epoch | **Confirmed** |
| F-A5 desktop bypass | resolved | Out of scope with rejection: excess-property + runtime `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`; targets browser/server only; generator failure; docs obligation; fixture `@ts-expect-error` against real `CreateDesktopServiceClientOptions` | **Confirmed** |
| F-A6 private ports | resolved | Location `src/internal/client-contributions/` (named files, no barrel, absent from exports); doc-graph + packed-consumer negative gates incl. exact specifier rejections | **Confirmed** |
| F-A7 context projection | resolved | Contributors see declared-context projection + `signal` only; seven framework keys reserved and rejected; forced-retry fixture drives `context.retry: 1` (verified `retry: 0` default live); private prepared-call channel specified incl. context-replacement preservation | **Confirmed** |
| F-A8 v2 corrections | resolved | GET direction corrected (GET live today at `http-client-link.ts:82`; v2 rejects GET by default — verified in migration guide); `inferRPCMethodFromContractRouter` replacement + dedupe no-op gates present; OTel rename assigned to #1351 (verified `@orpc/opentelemetry@1.14.11` on v1 line and repo using `@orpc/otel`); lock-only family pinning stated | **Confirmed** |
| F-A9 in-tree fixture | resolved | Fixture committed, models real surfaces; **re-executed: exit 0** | **Confirmed** |
| F-A10 adopted facts | resolved | Per-attempt header resolution + header-safe dedupe cited as fact; raw-input sensitivity sentence present; Stage 1a/1b split explicit; v1-maintained evidence present (re-verified live today) | **Confirmed** |
| F-B1 claim algorithms | resolved | Normative per-provider table with lock-timeout mechanics, busy-terminal semantics, rollback-everywhere; poison-free by construction; conformance item 10 adds provider-specific negative controls; primary citations appended | **Confirmed (exceeds bar)** |
| F-B2 relay ownership | resolved | Ownership rows complete; decoded-vs-raw split; `service → database` declared as a **new** edge (verified absent); database imports no service type | **Confirmed** |
| F-B3 queue reuse | resolved | Decision recorded with real reasons; runtime DDL verified live; reconciliation child proposed for owner filing; rejected-alternative entry present | **Confirmed** |
| F-B4 scope instability | resolved | Execute-as-new law where identity is defined; determinism obligation on `scope()` mirroring `fingerprint()`; negative conformance items 5–6 (changed scope; renamed command; changed version = mismatch) | **Confirmed** |
| F-B5 MySQL SNAPSHOT | resolved | Named in capability matrix + Stage-6 exit condition; defect verified live at `adapter.ts:480`; #1293 kept adjacent and distinct | **Confirmed** |
| F-B6 transaction client type | resolved | Generator-owned `CommandTransactionClient = Omit<Prisma.TransactionClient, …>` with engine-module re-export; Prisma 7.8 probe consistent with lock (7.8.0); `withTransaction` root-client repair retained (assertion verified live) | **Confirmed** |
| F-B7 batch (a–h) | resolved | All eight verified: A4 archetypes; literal-preserving spelling pinned to #1350 (current erased spelling verified live); `claimed` vocabulary unified; ratification-milestone footnote; `WorkerIdempotencyPort` wording fix obligated (comment verified live at `:30`); SQLite selectable/default split in FCP Q2; `db command-store add` sub-noun with `db init` distinction + negative CLI test; telemetry asymmetry acknowledged with cleanup question | **Confirmed** |

**Conclusion:** cycle 2 genuinely resolved every finding, including the negative gates (desktop rejection, packed-consumer negatives, forbidden telemetry fields, root-client negative control, provider negative controls) and public/package ownership (zero-oRPC scoping; service/database relay split; no new package). The PASS verdicts are substantiated.

## 6. oRPC v2 migrate-first decision (RFC-A question 4)

### 6.1 Current upstream state (verified live today, 2026-08-08)

- `@orpc/client` / `@orpc/server` dist-tags: **`latest` = 1.15.0 (stable), `beta` = 2.0.0-beta.26**. v1.15.0 published 2026-08-08T13:52Z — *after* beta.26 (11:21Z). Seven v1 patch releases since 2026-07-25. **Stable v1 is actively maintained; v2 is pre-release and churning (beta.21→beta.26 in 13 days).**
- Official migration guide confirms: RPC wire protocol changed (**v1 client cannot talk to v2 server** — coordinated deploy required); automatic middleware deduplication removed (double-execution hazard); `.$meta` replaced by `defineMeta` plugins; GET rejected by default (`allowMethods` defaults POST/PUT/PATCH/DELETE; `SimpleCsrfProtectionHandlerPlugin` checks `Sec-Fetch-Mode`); `status` removed from error definitions → handler `errorStatusMap`; `safe()` result reshaped (typed third element + `isSuccess` fourth); `isDefinedError` → `isInferableError`; serializer becomes an instance with string-keyed handlers; `RPCLink` url split into `origin`+`url`; interceptor renames; `@orpc/otel` → `@orpc/opentelemetry`; `RequestHeadersPlugin` → `RequestHeadersHandlerPlugin` (incoming server handler plugin); `@orpc/zod` requires **Zod v4**; TanStack consolidated into one package with `scoped` defaults.

### 6.2 Decision matrix

| Option | Technical merit | Risk | Verdict |
| --- | --- | --- | --- |
| **A. Migrate to v2 first, then build the seam** | v2 brings typed-error/status redesign, meta plugins, CSRF plugin, serializer instance — none of which provides outbound header ownership, duplicate/conflict law, cache-partition declaration, redaction, or plugin discovery. `RequestHeadersHandlerPlugin` is incoming-server-only and absent for direct calls. v2 TanStack still excludes client context from keys, so RFC-A's partition/direct-only law survives unchanged. | Beta dependency for a framework publish surface; wire incompatibility forces coordinated client/server rollout across a generated-app ecosystem before the seam even exists; 74-file blast radius; middleware double-execution audit; GET/dedupe law rewrite; Zod-v4 entanglement while #1320 is blocked. | **REJECT** |
| **B. RFC-A on stable v1 now; v1.15.0 family move as a separate lock-only decision; v2 as its own RFC/spike later** | Seam is upstream-major-neutral by construction (three NetScript ports; zero upstream identities in new declarations); stable v1 adapter proven against locked 1.14.6 lifecycle facts; v1.15.0 available today with a normative lock-only whole-family gate; v2 adapter later must pass the same conformance suite. | Minimal: v1 line maintenance (verified active); v2 work deferred, not avoided. | **RECOMMEND** |
| **C. Run the v2 spike in parallel now** | Read-only spike could de-risk the future RFC. | Splits attention during 0.0.7/0.0.8 delivery; beta target moves under the spike; no implementation value until RFC-A ports land (ports are the migration boundary). | **Only after RFC-A acceptance, as a filed tracking issue, unscheduled** |

### 6.3 Real v2 benefits vs. features that do not solve the seam

- **Real (transport/server-owned, belong to the future v2 RFC):** wire/protocol modernization; `errorStatusMap` + typed-error redesign (interacts with #1350's `safe()` shape — note v2 changes `safe()` arity again); middleware model; GET/CSRF policy plugins; serializer instance (Fresh/Desktop parity work); unified websocket; hibernation; consolidated TanStack package.
- **Do NOT solve the outbound typed contribution seam:** request-header handler plugin (incoming only; no ownership/conflict/async-resolution/redaction/cache-partition semantics); metadata plugins (server procedure metadata, not client preparation); retry/dedupe plugin renames (transport policy the SDK already owns); TanStack client-context exclusion (preserves RFC-A's law rather than replacing it).

### 6.4 Recommended sequencing and prerequisites

1. Accept RFC-A; implement stages 0–5 on stable v1.
2. #1351 decides the **lock-only exact-family move to v1.15.0** (timely: it is today's `latest`), with `deno ci --frozen` + no-mixed-family evidence; no manifest pin churn; no v2.
3. After RFC-A acceptance, **file one new v2 migration RFC tracking issue** (`rfc` label, ratification-adjacent milestone, implementation unscheduled). Prerequisites: RFC-A stages 2–3 landed (the three ports are the migration boundary); owner beta-risk decision (wait for `latest` dist-tag unless explicitly accepted); #1351 complete. Gate list: RFC-A's v2 gate matrix **plus** (from this pass) the Zod-v4 requirement and the v2 `safe()`/`isInferableError` shape change vs the landed #1350 spelling. The v2 adapter must pass RFC-A's entire contribution conformance suite before its migration RFC may enter FCP (already normative).

## 7. FCP safety and owner decisions required before numbering/merge

Adjudicated independently — all remaining FCP questions are policy-safe (both outcomes typed/implemented in the RFC text; no rework risk):

**RFC-A (8 questions):** Q1 budget ≥16 (fixture-proven); Q2 env-reading factory (scoped either way); Q3 #451 scheduling (independent); Q4 naming refinements (semantics fixed); Q5 wrapper-vs-memo (both fixture-constrained); Q6 metadata ownership (vocabulary normative either way — but see recording obligation below); Q7 incoming companion default (direct-call absence mandated either way); Q8 v1.15.0 before/after seam (both supported by the lock-only gate). Q9–Q11 belong to the separate v2 RFC.

**RFC-B (4 questions):** Q1 idempotency default (recommendation: required, explicit opt-out only); Q2 SQLite default-only shape (recommendation: accept shape, release later, no support claim); Q3 correlation telemetry (recommendation: durable-row/log-only default + separate vocabulary cleanup); Q4 retention defaults (recommendation: explicit deployment values until operational evidence).

**Decisions that MUST be recorded by the owner before/at numbering:**

1. **RFC-A Stage 1b metadata ownership** — widen #1350 or file a dependent child (hard prerequisite for #1352; verified #1350 does not own it today).
2. **RFC-A v1.15.0 sequencing** — before or after the minimal seam (either valid; decide to unblock #1351).
3. **RFC-B Q1 idempotency default** (shapes generated scaffolds/telemetry defaults).
4. **RFC-B Q2 SQLite disposition** (decides whether the optional child files at all).
5. **Cross-RFC frontmatter `target-milestone` convention** — pick one at numbering.
6. **RFC numbering order** — 0001/0002 assignment between RFC-A and RFC-B (maintainer choice; no race with #822).

## 8. Board consequence audit (audit only — nothing created)

### 8.1 Amendments to existing issues (owner-executed, text sources identified)

| Issue | Amendment | Source |
| --- | --- | --- |
| **#1349** (0.0.7) | Add RFC-A Stage-2 scope: descriptor/composer, defaulted context-generic client/query surfaces, private `src/internal/client-contributions/` ports + `deno doc`/packed absence gates, prepared-header channel statement, server/TanStack key algebra surfaces, reconnect preparation law, desktop rejection, cache handling. | RFC-A stage table + CROSS-RFC §2 |
| **#1350** (0.0.7) | Stage-0 reconciliation: record the literal-preserving four-generic `ContractBuilder` spelling shared by both RFCs; record the Stage-1b metadata decision (widen vs child). Verified current body is `safe()`-only. | RFC-A stages 0/1a/1b; RFC-B stage 0 |
| **#1351** (0.0.7) | Add: `@orpc/opentelemetry` rename decision (v1-line 1.14.11 available; repo currently on `@orpc/otel`); lock-only exact-family pin policy for the v1.15.0 move; GET-dedupe no-op trap as an acceptance row; explicit "no v2 migration in this issue". | F-A8b/c/d; RFC-A transport section |
| **#1352 / #1353** (0.0.7) | #1352: auth-core bearer factory, access-metadata behavior, redaction, partition/direct-only, manifest reference, scaffold choice (blocked-by metadata decision). #1353: re-scoped to final-trace-ownership proof (transport retains sole final injection; contributor trace-header ownership rejected). | RFC-A stages 4–5 |
| **#1362** (0.0.8) | Command-handler generation depends on the #1362 layered service shape; generators refuse missing layering. | RFC-B CLI section |
| **#1363** (0.0.8) | Inherit RFC-B's 10-child table (labels/milestones as listed in the RFC); relay-ownership + claim-algorithm references; `CommandTransactionClient` generator deliverable; **new from this pass:** name #1387's typed-principal shape as the consumer dependency for authenticated envelope derivation (§3-Q1). | RFC-B decomposition + this eval |
| **#1364** (0.0.8) | Consume the stable outbox ID in the webhook recipe; name which idempotency carrier is authoritative (header vs envelope) for services accepting both. | RFC-B sink rules; CROSS-RFC §1 |
| **#1387** (0.0.8) | Backlink: command-kit envelope derivation consumes the typed-principal/context surface this issue creates. | This eval (§3-Q1) |
| **#1293** | None — stays adjacent; the MySQL `SNAPSHOT`/allow-list fix is the distinct Stage-6 child. | F-B5 |

### 8.2 Genuinely new issues required (file by owner after acceptance)

| New issue | Type | Milestone/labels | Dedup check |
| --- | --- | --- | --- |
| **oRPC v2 migration RFC tracking issue** (the only new epic-scale object) | `rfc` tracking issue for a future RFC/spike | Ratification-adjacent (`0.0.6`-era or Backlog until scheduled); `rfc`, `type:docs`/`type:feat` at RFC filing, `priority:p2` until owner beta decision | **Not a duplicate**: full #1348–#1388 title sweep verified; #1351 is stable-v1 transport consolidation and must say "no v2 migration" |
| RFC-A Stage 6 locale non-auth proof child | feat child of the #1348 family | 0.0.7; `type:feat`, `area:sdk`, `priority:p1` | Distinct from #1352 (auth) and #1353 (trace proof) |
| RFC-A Stage 1b metadata child — **only if** Stage 0 chooses child-over-widen | feat/fix child | 0.0.7 | Would not duplicate #1350 once the decision is recorded |
| Queue runtime-DDL reconciliation child (RFC-B prerequisite for future code sharing) | fix | 0.0.8; `type:fix`, `area:database`, `priority:p2` | No live issue covers queue `ensureSchema` externalization (verified) |
| SQLite command-store child — **only if** FCP Q2 accepts | feat | FCP-decided | Distinct from #1293/#1363 children |

### 8.3 Dependencies/milestones verification (live board matches RFC sequencing)

#1348/#1361 in 0.0.6 (ratification); #1349–#1353 in 0.0.7 (RFC-A implementation); #1350 in 0.0.7 (shared prerequisite, consumed by RFC-B stage 0); #1362–#1364 + #1363 umbrella in 0.0.8 (RFC-B implementation); #451 Backlog; #1093/#1278/#1293 in 0.0.6. All 41 filed issues open, correctly milestoned, `status:triage`. No duplicate of either RFC exists among #1348–#1388 or other live issues (also checked #572/#822 draft PRs — neither overlaps; #822 files no `rfcs/` content).

## 9. Process readiness audit

| Check | State | Verdict |
| --- | --- | --- |
| Draft state | Both PRs draft, MERGEABLE, base `main` | Correct — RFCs stay draft until acceptance |
| Labels | Both: `rfc`, `type:docs` (+ `type:test` on #1390 for the compile-only fixture — honest), correct `area:`/`priority:p1`, `ci:skip-e2e`/`ci:skip-scaffold` (valid: no runtime/generator/export/lock change in either diff), exactly one `status:` (`augment-review` — correct phase for this advisory pass) | Compliant |
| Check selection | All CI lanes skipped at both HEADs (path-filtered docs-only); fixture compile gate recorded and re-executed here (exit 0) | Valid, with §3-Q6 caveat |
| Reviewer separation | Generator (Codex) ≠ PLAN-EVAL cycles 1–2 (Claude Fable 5, owner-designated, same session both cycles, separate from generator) ≠ this adversarial pass (Qwen 3.8 Max, fresh, no subagents) | Separation intact |
| RFC numbering | `rfcs/README.md`: maintainer assigns next free integer at acceptance; both files correctly `0000`; first-ever file RFCs; no race (#822 adds no file) | Ready for maintainer |
| FCP rule | Maintainer announces ~7-day FCP with disposition; **not yet announced on either PR** | **Mandatory wait** |
| Unresolved threads | GraphQL: 0 review threads on both PRs; review-thread gate PASS recorded | Clean |
| Closing keywords | PR bodies reference #1348/#1361 **without** closing keywords (correct: tracking issues stay open for implementation); no epic-closing keywords anywhere | Correct |
| PR body hygiene | #1390 DoD checkbox + phase line stale vs live verdict/label (§3-Q9) | Cosmetic fix at FCP prep |

**Merge readiness:** technically both PRs could merge green today, but **must not**: `rfcs/README.md` requires the formal FCP interval and maintainer acceptance before numbering/renaming/merge, and both PR bodies themselves instruct "keep draft; do not number or merge until maintainer acceptance and remaining owner-directed review passes complete". This evaluation's PASS_ACCEPT is the final technical gate; the FCP interval is a **process** wait, not a technical deficiency.

## 10. Root-orchestrator action list

1. **Record this verdict** on both PRs (structured comment citing this artifact); move `status:augment-review` → the FCP-entry state per lifecycle; fix #1390's stale DoD checkbox/phase line.
2. **Owner records the six decisions** of §7 (metadata ownership, v1.15.0 sequencing, RFC-B Q1–Q4, milestone-frontmatter convention, numbering order).
3. **Announce ~7-day FCP** on #1390 and #1389 with disposition **accept**, attaching the FCP question sets and recommendations.
4. **At FCP close:** mark PRs ready-for-review, assign RFC numbers, rename to `rfcs/NNNN-*.md`, fill frontmatter (harmonized milestone convention), `status:ready-merge`, merge. Tracking issues #1348/#1361 stay open, milestoned, carrying the accepted RFC link.
5. **Post board amendments** of §8.1 (marker-comment convention per Stage-H practice).
6. **File new issues** of §8.2 in order: v2 migration RFC tracking issue (after RFC-A merge), locale child, metadata child (if chosen), queue-reconciliation child (owner decision), SQLite child (if FCP accepts).
7. **Dispatch implementation only after** amendments land: RFC-A stages 0–5 against #1349–#1353 (0.0.7) with #1350 first; RFC-B stages 0–9 against #1363 children (0.0.8).
8. **Hold the line:** no v2 beta in any implementation PR; #1351 owns the only oRPC movement (lock-only v1.15.0 decision); the v2 RFC must clear RFC-A's conformance suite on its adapter before its own FCP.

---

## Verdict summary

- **RFC-A (#1390 @ `78a7cecd1`): PASS_ACCEPT** — technically ready for FCP/acceptance; mandatory process wait (FCP interval) applies; owner decisions §7 items 1–2 must be recorded at numbering.
- **RFC-B (#1389 @ `c98c08ada`): PASS_ACCEPT** — technically ready for FCP/acceptance; mandatory process wait (FCP interval) applies; owner decisions §7 items 3–4 must be recorded.
- **Cross-RFC: PASS** — composes cleanly; no circular dependencies, no conflicting error/context/telemetry/idempotency ownership, no duplicated primitives; one shared #1350 spelling obligation and one watch-item intersection, both already owned.
- **oRPC v2 migrate-first: REJECTED** — implement RFC-A on stable v1 now; separate lock-only v1.15.0 decision in #1351; one new v2 migration RFC tracking issue filed after RFC-A acceptance, implementation unscheduled, gated by RFC-A's conformance suite.
- **Cycle-2 findings:** all 17 (F-A1–F-A10, F-B1–F-B7) independently confirmed resolved.
- **New findings:** none above Low; two Low board advisories (#1363↔#1387 principal dependency; #1350 metadata ownership recording) and seven Info items, all with exact repairs in §3/§8.
