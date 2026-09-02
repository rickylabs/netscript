# Research — SDK client S6/S7 closeout

## Re-baseline

- Live issues: #1353 and #1467, both open with seven unchecked acceptance boxes on 2026-09-02.
- Merged implementations: #1921 (`997b836bacd0269f47723aefbd235fae55c05c19`) and #1922
  (`4720596fcd0a4c00d72616bec9739be8796718fe`).
- Re-derived against `origin/main` at `850cc7757d11d420b9061dbe6a61536357ab77fe`.
- #1353's 2026-08-13 amendment is normative: tracing is not a contribution, the transport remains
  the final trace-header author, and no `traceContextContribution()` may exist.

## Published-surface findings

- `deno doc packages/sdk/mod.ts` and `deno doc packages/sdk/src/client/mod.ts` expose
  `createLocaleSdkClientContribution`, `LocaleSdkClientContext`, and
  `LocaleSdkClientContribution`.
- `deno doc --filter SdkClientContribution packages/sdk/src/client/mod.ts` states that transport,
  retry, tracing, discovery, and dispatch remain SDK-owned.
- Neither doc surface contains `traceContextContribution`; `traceparent`/`tracestate` occur only in
  the compatibility `ServiceClientContext.traceHeaders` field.

## Negative-claim findings

- `validateHeaderKeys()` rejects `traceparent`, `tracestate`, and case variants through
  `RESERVED_HEADERS`; explicit diagnostic tests name the offending descriptor.
- Contribution preparation receives only `context`, `input`, `procedure`, `signal`, and `transport`,
  and the projected context excludes `traceHeaders`.
- `createHttpClientLink()` authors final trace headers inside its CLIENT-span `fetch` wrapper with
  `Headers.set()`.
- Audit finding: the same final injection is unconditional. With `propagateTraceContext: false`, a
  sampled CLIENT span still emits `traceparent`. That contradicts #1353 acceptance box 5, which
  requires disabling propagation to emit neither trace header.

## Doctrine / profile

- `packages/sdk` is Archetype 2 — Integration, current verdict **Keep**: preserve
  discovery/client/cache adapter boundaries.
- This closeout uses the docs overlay because its primary vehicle is the harness evidence directory.
- The residual is confined to the existing transport composition point plus its focused regression
  proof; no new public surface, port, folder, package, or debt entry is justified.

## jsr-audit surface scan

- No package manifest, export map, dependency, or public API change is planned.
- `deno doc` is the public-surface authority. JSR-specific re-audit is N/A for this closeout; the
  required package and documentation gates are fixed by the owner brief.

## Open questions

- None. The negative acceptance text decides the residual behavior.

