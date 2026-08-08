# RFC: production command composition kit — one transactional boundary for business state, audit, outbox and idempotency — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T3-01 · **Proposed milestone:** 0.0.6 · **Labels:** `rfc` `type:docs` `area:service`
`area:database` `priority:p1` `status:triage` · **Depends on:** none (ratification only; T3-03 is the
implementation and depends on this)

## Summary

NetScript ships every part of a production command and no composition of them: `withTransaction` is
exported and has zero callers, idempotency exists only for worker deliveries, and "outbox" and
"audit" do not exist anywhere in the codebase. Consumers therefore hand-roll the boundary that
decides whether a retried request charges twice or a committed state change is never announced — the
Wave-6 billing run, the only GO-grade run of three, wrote its entire command layer in app space. This
issue tracks ratification of **RFC-B**, which proposes a DB-adapter-neutral command composition kit
and, equally important, states per adapter where that boundary cannot exist. Ratification only —
implementation is a separate issue in a later milestone.

## Evidence

- RFC draft: `.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-B-command-composition-kit.md`
  (seed run; not yet a repo file).
- `packages/database/mod.ts:128` — `withTransaction(client, fn, options)` is exported and documented
  (`docs/site/reference/database/index.md:52`); `grep -rn "withTransaction"` across `packages/`,
  `plugins/`, `docs/` finds no caller. `$transaction` appears in no scaffold template and in no
  `docs/site/services-sdk` page.
- `packages/cli/src/kernel/assets/service/routers/v1.ts.template:25-53` — the generated write path is
  a bare Prisma delegate call with no transaction, no version condition, and no receipt.
- `packages/plugin-workers-core/src/ports/worker-idempotency-port.ts` — `claim`/`markApplied`/`release`
  with `caller`/`message-id`/`payload-hash` resolution exists, KV-backed, scoped to worker deliveries
  only.
- `grep -rln "outbox"` over `packages/`, `plugins/`, `docs/` → no match. No audit-record primitive.
- `packages/telemetry/src/attributes/helpers.ts` has job/saga/execution attribute helpers and **no**
  command vocabulary; `packages/telemetry/src/attributes/spans.ts:45-46` has `rpc.client`/`rpc.server`
  only.
- Corpus: `research/preplan-package.md` item **H**; `research/wave-6-runs.md` §R3 (billing product owns
  its command layer; two `FAIL_FIX` rounds before state advanced; empty `trigger_events` /
  `job_execution_history` relational projections while authority lived in KV) and §R2 (app-owned
  retry/compensation executor, `plugin-sagas` never adopted).

## Current surface

`@netscript/service` gives a builder, per-request context (`ctx.db`, `ctx.principal`,
`ctx.traceHeaders` — `packages/service/src/builder/service-builder-impl.ts:259-282`) and oRPC
handlers. `@netscript/database` gives an unused transaction helper and an isolation vocabulary
(`packages/database/ports/database-client.ts:59-77`). `@netscript/plugin-sagas-core` gives
`sagaCompensate`/`send`/`spawn` (`src/public/mod.ts:43`). Nothing connects them: there is no unit of
work at the handler seam, no expected-version condition, no idempotency receipt, no same-commit side
records, and no command span. `commonErrorMap`
(`packages/contracts/src/application/contract-primitives.ts:21-52`) has no conflict code, so an
optimistic-concurrency failure can only surface as a 500.

## Target contract

RFC-B is ratified (accepted, rejected, or accepted-with-amendments) with, at minimum, a recorded
decision on: the kit's public home and shape; the unit-of-work port and its published
`UnitOfWorkCapabilities`; the idempotency key + request-hash + replay-receipt semantics; the
same-commit rule for audit and outbox and the relay that delivers them; the command telemetry
vocabulary; the injected-failure conformance suite; the per-adapter capability table including the
explicit statement that **no portable atomic boundary exists across two stores**; and the refusal
boundary where a command becomes a saga. The three forks in RFC-B §8 (receipt-storage owner, package
home, `expectedVersion` transport) are answered rather than deferred.

## Acceptance

- [ ] RFC-B body is on this issue in the house numbered-section shape.
- [ ] The per-adapter capability table names, per store, whether same-commit side records are possible.
- [ ] The RFC states the cross-store negative result explicitly and claims no exactly-once delivery.
- [ ] The saga refusal boundary is defined and cross-references `sagaCompensate`.
- [ ] The three §8 forks each carry a recorded owner decision.
- [ ] The RFC names no billing-domain symbol; a reviewer confirms the surface is domain-free.
- [ ] The RFC declares its dependency on the typed-error repair and what lands without it.
- [ ] An implementation issue exists and carries `Part of #<this issue>` before this issue closes.
- [ ] Ratification adds no code; `packages/` and `plugins/` are unchanged by the ratifying PR.

## Boundaries

Do not duplicate: **#1123** (OpenAPI→MCP RFC — agent legibility of an existing API surface, not how a
command commits); **#922**/**#928** (frontend contribution contracts); **#884**/**#885** (org-aware
identity/authorization contracts and the auth conformance kit — the kit consumes `Principal`, it does
not define authorization); **#742** (saga definition versioning); **#1278** (type-soundness
ratification — this RFC must not restate the cast inventory); **#1332** (DB-schema-first docs);
**#1263** (generated by-id handler returns 500 instead of a defined 404 — a contract-error defect in
the existing CRUD template, fixed independently of this seam). This issue does **not** implement
anything: no `packages/` or `plugins/` change lands under it.

## Docs/consumer proof

Ratification is proven by the decision record, not by adoption. Adoption proof belongs to the
implementation issue: a generated project whose non-CRUD command uses the kit, a services-sdk how-to
that replaces the hand-rolled pattern, and a docs example that type-checks against the published
export map.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Pack T3 of the Fable-5
remediation plan (`SYNTHESIS.md` §4); source item **H** in `research/preplan-package.md`. Checked
against the dedup checklist in `research/github-board-open.md` §7 — no existing owner for
transactional/idempotent command composition. Draft only; no board mutation performed.
