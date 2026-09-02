# Acceptance audit — issues #1353 and #1467

Status is against merged `main` at `850cc7757` plus the narrowly audited closeout residual in this
branch. Initial partial findings are preserved in `research.md` and `drift.md`.

## #1353 — trace propagation

| Box | Status | Code / symbol | Test proof | Notes |
| ---: | --- | --- | --- | --- |
| 1 | SHIPPED | `createHttpClientLink`; `validateHeaderKeys`; published `SdkClientContribution` | `reserved trace header declarations identify the offending descriptor`; `composed headers retain transport-authored CLIENT spans across retry and reconnect` | No trace contribution factory exists. |
| 2 | SHIPPED | `RESERVED_HEADERS`; `projectContributionContext`; final `Headers.set` in transport | `contribution preparation receives exactly the five public fields`; `forced unary retry prepares once...`; reserved trace diagnostic test | Contributions cannot claim trace keys or observe `traceHeaders`. |
| 3 | SHIPPED | `createServiceClient` defaults propagation to true; `createHttpClientLink` applies true/false to both compatibility input and final injection | `composed headers retain transport-authored CLIENT spans across retry and reconnect` | True/per-call override yields a transport CLIENT-span header; false yields neither W3C header. |
| 4 | SHIPPED | `withSpan`, `SpanKind.CLIENT`, `rpc.system`, `server.address` | `composed headers retain transport-authored CLIENT spans across retry and reconnect` | Two unrelated contributions preserve span attributes/topology. |
| 5 | SHIPPED | `validateHeaderKeys`; propagation-gated final `injectContext` | Reserved trace diagnostic and observability tests | Reserved attempts fail deterministically; false emits no W3C headers; removing transport injection makes the true-path/span-ID assertions red. |
| 6 | SHIPPED | Transport follows contribution preparation regardless tuple order | Observability test runs `[auth, unrelated]` for retries and `[unrelated, auth]` for reconnects | Every attempt retains `authorization`, unrelated header, and exactly one transport trace header. |
| 7 | SHIPPED | Root/package gate surface | Root check 3,027 files; root tests 4,942/0/19; SDK tests 237/0/0; workspace publish dry-run exit 0 | Current branch evidence supplements #1921's independent IMPL-EVAL PASS. |

## #1467 — locale contribution

| Box | Status | Code / symbol | Test proof | Notes |
| ---: | --- | --- | --- | --- |
| 1 | SHIPPED | `createLocaleSdkClientContribution`; `LOCALE_HEADER_KEYS` | `locale descriptor owns accept-language and canonicalizes one optional locale` | Public doc surface exposes the factory and typed context. |
| 2 | SHIPPED | `validateHeaderKeys`; tuple ownership maps | `locale duplicate ownership and reserved headers fail with deterministic descriptor ids` | Both descriptor orders identify the later claimant; reserved owner is named. |
| 3 | SHIPPED | `localePartition`; `resolveSdkClientCachePartition`; query key suffixes | `locale cache keys are equal...`; `locale keys use the declared partition function...`; direct retry test | Same canonical locale is equal, different locale differs, and a constant header cannot influence the declared partition. |
| 4 | SHIPPED | `LocaleSdkClientContext`; `defineServices` generic tuple | `sdk-client-contributions-rfc_type.ts` compile fixture | Includes positive direct/generated/query calls and negative numeric-locale assertion. |
| 5 | SHIPPED | Locale descriptor plus existing preparation/cache runtime | Order, retry/cancel, cache-key, invalid-input, and runtime-boundary tests | Five distinct requested concerns have separate assertions. |
| 6 | SHIPPED | `packages/sdk/README.md`; `docs/site/services-sdk/sdk.md` | `readme-doctest_test.ts`; README fences exit 0; JSDoc examples exit 0 | Both show auth-shaped and locale contributions. |
| 7 | SHIPPED | Required SDK/docs/carrier/quality gates | SDK check 0; focused 44/0/0; full SDK 237/0/0; quality 0; JSR audit 0; corpus 0 | #1922's independent IMPL-EVAL PASS corroborates the fresh code/test gates. |

## Final outcome

- **#1353: 7 SHIPPED / 0 PARTIAL / 0 NOT SHIPPED.** The audit found and repaired one small residual
  in the existing transport seam, then added the missing negative and auth-order proof.
- **#1467: 7 SHIPPED / 0 PARTIAL / 0 NOT SHIPPED.** No locale product change was needed.
- Both `Closes #1353` and `Closes #1467` are justified. The epic remains `Part of #1348` only.
