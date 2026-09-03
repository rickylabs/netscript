use harness

# Slice S5 — typed bearer credential contribution (#1352)

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `netscript-doctrine` — `packages/sdk` and `packages/service` (Archetype 4) public surfaces.
- `netscript-deno-toolchain` — `deno doc` before broad source reads.

## Standing plan — follow it, do not redesign

The clustered plan is at `.llm/runs/feat-sdk-credential-contribution--1352/clustered-plan.md`
(**section "Slice S5 — typed bearer credential contribution (`#1352`)"**, with its expected touch set
and the **hard 27-file ceiling**). Read that section before writing code. Its decisions are locked; if
reality contradicts one, record it in `drift.md` and continue — do not silently redesign.

## Dependencies are satisfied

- **#1349** shipped the contribution seam:
  `packages/sdk/src/internal/client-contributions/{adapter-ports,prepared-call,stable-v1-adapter}.ts`
  and `packages/sdk/src/client/sdk-client-contribution.ts` are on `main`.
- **#1351 (Internals, transport consolidation) is CLOSED**, which is what unblocked this slice.
- **#1886** closed #1349's acceptance tripwires — the forbidden public link names and
  `SDK_CONTRIBUTION_RUNTIME` now have real assertions. Do not weaken those.

**Consume the seam; do not rebuild it.**

## What this slice proves

Today the client authors only `Content-Type` plus optional `traceparent`/`tracestate`: there is **no
credential field** on the client options (`packages/sdk/src/ports/service-client.ts:129-155,203-222`)
and no client contribution group in
`packages/plugin/src/config/domain/plugin-contributions.ts:12-39`, while the server already reads
credentials (`packages/service/src/auth/static-credential-authenticator.ts:108-117`). S5 closes that
loop through the contribution seam.

## Prohibitions carried from the #1349 amendment — these are hard

- Do **not** publicly export `createHttpClientLink`, `ClientLinkPort`, `ClientLinkCallOptions`, or any
  internal adapter port. `#1886`'s tests assert their absence; if your change trips them, the change is
  wrong, not the test.
- Do **not** accept upstream interceptor/plugin callback arrays.
- Keep `port` and `timeout` **accepted and deprecated**, never removed.

## Credential handling — non-negotiable

Credentials must never be logged, embedded in a generated artifact, or written to a run directory.
Assert this in tests, not just in review: a test that proves a credential does **not** appear in
emitted output or logs is part of the deliverable.

## Ordering

S6 (#1353) and S7 (#1467) follow this slice and rewrite the **same** header-authorship callback
(`packages/sdk/src/client/http-client-link.ts`). Confine your edits there to what S5 needs, and name in
`worklog.md` every shared file you touch so the supervisor can serialise the next slice.

## Gates

Focused `packages/sdk` and `packages/service` check/test/lint/fmt via the structured wrappers;
`deno doc --lint` measured **A/B against base** (the sdk export map has pre-existing findings — report
*new* diagnostics, never absolute); publish dry-run; exact `deno.lock` hash — if the lock moves,
diagnose and report rather than committing churn. **Do not run any local runtime, Aspire, Docker,
browser, or `e2e:cli` gate.**

## PR contract

Full metadata **in the same action as opening**: `orchestrator:features`, `status:impl`, `type:feat`,
`priority:p1`, `wave:v1`, `area:sdk`, milestone **0.0.7**. Use `Refs #1352` with **no closing keyword**
— closure is the supervisor's decision after close-gate verification, and #1348 is an epic that must
never carry one.

Keep `worklog.md` and `drift.md` under `.llm/runs/feat-sdk-credential-contribution--1352/`.
