# Plan — locale SDK client contribution (#1467)

## Profile and scope

- Surface: `packages/sdk` (Archetype 2 — Integration, verdict Keep).
- Overlay: documentation, limited to SDK public usage prose.
- Issue: `#1467`; part of epic `#1348`.
- Product-file ceiling: 9, matching the predecessor cluster plan. Generated carrier changes and
  this run directory are tracked separately.

## Architecture decisions — LOCKED

1. Add `createLocaleSdkClientContribution()` beside the existing client descriptor helper. It
   returns an explicitly typed protocol-major-1 descriptor with fixed id `@netscript/sdk:locale`,
   optional `{ locale?: string }` context, and fixed `accept-language` ownership.
2. Omit the header when locale is absent and partition that state as `default`; when present, emit
   and partition by the same validated stable locale value. The descriptor remains explicitly
   composed; no automatic attachment or global locale source is added.
3. Validate and canonicalize a present single language tag via `Intl.getCanonicalLocales`, rejecting
   lists, q-values, controls, and malformed identifiers before transport. This keeps the cache
   partition stable and within the RFC's printable 1–64 character law.
4. Export through `src/client/mod.ts`. The root barrel already re-exports that entrypoint, so no
   `deno.json` export-map entry or root-barrel edit is needed.
5. Reuse the existing prepared-call, cache, retry, cancellation, and redaction machinery without
   editing `prepared-call.ts`, transport, trace, or query-key algebra.

## Open-decision sweep

- Safe to defer: broader `Accept-Language` preference-list/q-value support; a future API can add it
  without changing the single-locale factory contract.
- Safe to defer: direct-only locale variant; canonical language tags are stable non-secret cache
  partitions, so the first-party contribution can safely remain partitioned.
- Must resolve now: none.

## Commit slices

1. **Public locale descriptor and behavior proof.** Add the factory/context contract, client/root
   export reachability, focused runtime/type/cache tests, README/site examples, and run evidence.
   Proved by focused tests, scoped wrappers, doc-lint A/B, JSR audit, publish dry-run, quality/arch
   gates, carriers, and lock hash. Expected product files:
   `src/client/locale-contribution.ts`, `src/client/mod.ts`,
   `tests/locale-contribution_test.ts`,
   `tests/client-contribution-cache-query_test.ts`,
   `tests/type-fixtures/sdk-client-contributions-rfc_type.ts`, `README.md`, and
   `docs/site/services-sdk/sdk.md`.

## Acceptance evidence design

- Ownership/conflicts: descriptor constants plus construction tests in
  `locale-contribution_test.ts`, including both duplicate-owner tuple orders and reserved-header
  rejection with stable code/id/header diagnostics.
- Direct/query partition law: focused fake-fetch direct calls plus
  `client-contribution-cache-query_test.ts`; same locale yields equal keys, different locales yield
  unequal keys, and a cloned descriptor with a constant header plus a distinct declared partition
  proves key derivation calls `responseCache.partition` rather than inspecting headers.
- Generated inference: compile assertions in
  `sdk-client-contributions-rfc_type.ts` for direct clients, generated clients, generated queries,
  and query utilities with optional locale context.
- Composition/retry/cancellation/redaction: focused locale test composes an auth-shaped descriptor
  in both orders, proves one locale preparation across two retry attempts, abort behavior, and safe
  framework diagnostics that omit the invalid locale and contributor source error.
- Documentation: SDK README/site show both the canonical locale factory and an auth-shaped
  contribution example, with explicit tuple composition and cache safety notes.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Locale normalization changes cache identity unexpectedly | Canonicalization tests cover aliases, absent value, invalid lists, and exact partition output. |
| Cache proof accidentally relies on header bytes | Divergent declared-partition/constant-header test pins the actual source of key identity. |
| Public inference widens optional context | Existing RFC compile fixture gains exact generated/direct/query assertions. |
| Concurrent #1353 overlap | Never touch transport, trace headers, observability tests, or private contribution files. |
| Auth reference is unavailable on main | Use an inline auth-shaped descriptor only in tests/docs; no cross-branch integration. |
| New public symbol adds doc/publish debt | `deno doc` targeted probe, full-export A/B, JSR audit, and SDK dry-run. |
| Validation mutates lock/carriers | Hash `deno.lock` before/after; inspect every generated carrier diff before commit. |

## Gate set

Run the owner-specified SDK check/lint/fmt/test wrappers; focused tests; full-export doc-lint A/B;
SDK JSR audit and `deno publish --dry-run`; `quality:gate`; `arch:check`; documentation/carrier
cascade in the specified order; post-commit carrier checks; `git diff --check`; exact touch set; and
lock SHA-256. Do not run Aspire, Docker, browser, or `e2e:cli`.

## Deferred/prohibited scope

No edits to `prepared-call.ts`, trace headers/authorship, span topology, observability tests,
transport policy/method inference/dedupe, safe/error/base-contract repairs, query-key algebra,
auth-core production code, plugin manifests, or automatic contribution attachment.

## PLAN-EVAL

`PLAN-EVAL: N/A` — the issue and implementation brief supply the contract, acceptance rows,
placement choice, boundaries, touch ceiling, and exact gates; no architecture decision remains that
would benefit from a separate pre-implementation evaluator.
