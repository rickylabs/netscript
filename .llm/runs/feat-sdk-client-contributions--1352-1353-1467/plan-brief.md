use harness

# Clustered PLAN — sdk-client contributions S5/S6/S7 (#1352, #1353, #1467)

## SKILL

- `netscript-harness` — plan artifact shape, slice ceilings, gate evidence.
- `netscript-doctrine` — `packages/sdk` (Archetype 4) public surface and gates.
- `netscript-deno-toolchain` — `deno doc` to learn published surfaces before reading source.

**Produce a plan only. Write no product code.** Deliverables: `research.md`, `plan.md`,
`context-pack.md` under
`.llm/runs/feat-sdk-client-contributions--1352-1353-1467/`.

## Why one plan and not three

Measured before dispatch: **#1352 and #1353 both rewrite the same header-authorship callback**
(`packages/sdk/src/client/http-client-link.ts:82-101`), and #1467 proves the same seam with a
non-auth contribution. They are **not surface-disjoint** and must not run concurrently. This plan
owns that shared seam once and then splits into **ordered, independently landable slices**.

The S2 adapter seam is already on `main` and is what all three consume:
`packages/sdk/src/internal/client-contributions/{adapter-ports,prepared-call,stable-v1-adapter}.ts`
and `packages/sdk/src/client/sdk-client-contribution.ts`. **Consume it; do not redesign or duplicate
it** — S1–S3 shipped it and canary5 published on it.

## What the three issues actually claim (verify each from code, do not trust this summary)

- **#1352 S5 — typed credential contributions.** Today the client authors only `Content-Type` plus
  optional `traceparent`/`tracestate`; there is **no credential field** on the client options
  (`packages/sdk/src/ports/service-client.ts:129-155,203-222`) and no client contribution group in
  `packages/plugin/src/config/domain/plugin-contributions.ts:12-39`. The server side already reads
  credentials (`packages/service/src/auth/static-credential-authenticator.ts:108-117`).
- **#1353 S6 — trace propagation as a general contribution.** `propagateTraceContext` and
  `ServiceClientContext.traceHeaders` already exist as a bespoke path
  (`client/service-client.ts:41-49,55-64`, `ports/service-client.ts:149-155`,
  `presets/define-services.ts:106-116`). This slice re-expresses that existing behaviour **through**
  the contribution seam. Treat it as a refactor with a behaviour-preservation obligation, not a new
  feature.
- **#1467 S7 — locale as the non-auth contribution proof.** Its purpose is to prove the seam is
  general rather than auth-shaped.

## Decisions the plan must lock, with rationale

1. **Ordering.** They share one file; state the order and why, and which slices could ever run
   concurrently (probably none).
2. **Where header authorship lives after the change.** One authority, not two. A second, parallel
   header path is the defect class to avoid.
3. **Behaviour preservation for #1353.** Existing consumers of `propagateTraceContext` /
   `traceHeaders` must not break; say exactly how that is proven.
4. **Credential handling boundaries for #1352.** Credentials must never be logged, embedded in a
   generated artifact, or written to a run directory. Say how the tests assert that.
5. **Per-slice file ceilings** with an expected touch set, as the workers plan did.
6. **Per-slice gates**, including whether `deno.lock` may move and a doc-lint A/B baseline
   (`packages/sdk`'s export map has pre-existing findings — measure new-vs-baseline, never absolute).
7. **Partial semantics.** Each slice references its issue with **no closing keyword**; #1348 is an
   epic and must **never** carry one.

## Boundaries

- **Do not run any local runtime, Aspire, Docker, browser, or `e2e:cli` gate.** A prior lane worker
  leaked three containers doing this out of brief.
- Prefer `deno doc` over broad source reads for published surfaces.
- Do not modify `.llm/runs` content authored by other runs — harness dirs are shared context.
