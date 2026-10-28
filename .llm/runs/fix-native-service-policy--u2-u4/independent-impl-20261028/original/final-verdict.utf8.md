de9f6df3561d9e27587dd63687c8825254e9c3d5
VERDICT: PASS

# IMPL-EVAL — fix-native-service-policy--u2-u4 / PR 2422

- Evaluator: this new session; requested xai Grok 4.7/xhigh; observed model id `openrouter/x-ai/grok-4.7`. Session id and xhigh effort are not runtime-attested here. Generator family was OpenAI; this session did not resume it.
- Target: `fix/native-service-policy`, base `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`, HEAD `de9f6df3561d9e27587dd63687c8825254e9c3d5`. Architecture tier is root-authorized. Archetype 4 + SCOPE-service.
- Write limit: no `evaluate.md` write. This text is the complete report.
- Merge disposition: **not ready**. This PASS is not a close-gate, security, arch:check, Windows, e2e, EIS, or release waiver.

## Coverage

All frozen parts were read from offset 1 through the EOF marker: part-01 434, part-02 406, part-03 358, part-04 239, part-05 367, part-06 399, part-07 658, part-08 540, part-09 900, part-10 900, part-11 900, part-12 900, part-13 821, part-14 874, part-15 900, part-16 900, part-17 120, part-18 214, original-review-questions 156, current-ci-context 13. Prompt counts of 366/119 differ by one trailing line; nothing was truncated. No Bash, no gate rerun, no source edit.

Own MCP, this session: `search_docs({query:'withCors', limit:3})` returned `pages/reference/service` (score 4), `pages/services-sdk/how-to/add-a-service` (2), `pages/explanation/contracts` (1). `get_doc` verbatim: CORS origins and Pipeline order.

## Verdict definition applied

Approved U2/U4/Q1–Q4 behavior is present in source and backed by retained in-scope receipts. No implementation defect requires generator re-steer. Red gates below are out of this leaf’s authorized fix set or are merge gates. They are not marked PASS and are not waived.

## Gate rows

| Gate | Result | Evidence |
| --- | --- | --- |
| Plan-gate before impl | PASS | Original `FAIL_PLAN` `234a7791…66159` kept; same-session recheck `PASS` `dcf8daeb…7b014`; root plan acceptance in part-01. Q1–Q4 `PLAN-EVAL: N/A` is the recorded fixed-behavior authorization, not a missing plan. |
| Design checkpoint | PASS | `worklog.md` Design section in part-04/05, including public surface, slices, and deferred scope. |
| U2 CORS authority | PASS | `service-cors.ts:59-91`: one Hono resolver; six headers snapshotted including null before `next()`; preflight returned unchanged; one `c.header('vary')` rewrap; set/delete restore; `unionVary` is checkpoint-then-final, case-insensitive, `*` wins. No second origin resolution. Tests in `cors-response-authority_test.ts` cover hostile/allowed/absent, ACAC/ACEH independent of origin, raw/RPC/REST/401/403/413/500/redirect/stream/cookies, Vary union, env snapshot, no-`withCors` and standalone reflect. Retained owning 221/0/0. |
| U4 exact match + atomic install | PASS | `auth-middleware.ts:233-239`: object rule is method plus raw and routed equality; strings stay decoded prefixes. `options.ts` union excludes OPTIONS; GET does not imply HEAD. Both middleware constructors run before either `app.use` at `service-builder-impl.ts:519-535`. Invalid repeated build/serve stays unflagged. Health predicate `healthConfigured && !healthInstalled`, mark after three `app.get`s, called at `build()` after auth and body limit and before deferred routes (`:508`). |
| Health snapshot vs readiness | PASS | `health.ts:106-108` copies `configuredChecks` at handler construction. Readiness handler at `health.ts:327` closes over the live array. Matches the factual addendum, not the stale “both arrays live” sentence. No post-install dynamic health API. |
| Compatibility migration | PASS | Custom nonempty lists excluding `/health` are 401 in `health-auth-order_test.ts` for both CORS modes. Plugin oracle is 401 at `create-plugin-service-auth_test.ts:134`. README and CHANGELOG name `'/health'` or six GET/HEAD entries. Pinned 0.0.8 breaking strings remain. |
| Q1 TCP ownership | PASS | `database-connectivity.ts:287-304`: `AbortSignal` passed to `Deno.connect`, close in finally, late abort returns false, `clearTimeout` on every path. Three attempts and two 2000 ms delays retained. Native loopback EOF/refusal tests are distinct from four labeled unit stubs. |
| Q2 stdout / Q3 file URL | PASS | `legacy-abort_test.ts` drains stdout through EOF, cancels and `releaseLock`s in finally. Plugin eval uses `fromFileUrl`; four malformed policies and health 401 remain. Retained Q1 18/0, Q2 3/0, plugin 11/0. |
| Q4 native source ownership | PASS | `body-limit.ts:114-142`: Hono `bodyLimit` remains the only size/413 resolver. Adapter is lazy `getReader` on pull, `highWaterMark: 0`, no clone/tee/count loop. Declared-length without transfer-encoding and bodyless requests keep the native path. Replacement `Request` keeps `signal`. Completed readers are not cancelled; unfinished readers are cancelled; cancel errors are swallowed. Disconnect asserts `handlerEntries === 0`; handler-error asserts one entry and the same `Error` (`body-limit_test.ts:313`). Retained 14/0/0 with explicit sanitizers. Deletion condition remains an upstream fix that passes these controls. |
| In-scope static / publish | PASS (retained, not re-run) | Selected check/lint/fmt 126 files, docs 8 exports, quality scan, direct doctrine, JSR surface, publication dry-run, scratch cleanup, as recorded in U2/U4/Q checkpoints. Final three-line test correction rechecked one file only; production hash unchanged. |
| Consumers | PASS (retained) | Latest retained broad consumers 26/0/0 after the locked 200→401 oracle edit. Plugin source inspected here. Streams/Aspire sources were not re-opened; their pass is checkpoint evidence, not a fresh run. |
| Linux CI | PASS (coordinator-reported, not re-executed) | `current-ci-context.md`: run 40622518654, six shards, typecheck, and check-test PASS. Mapped-peer Linux module 1716/0/6 unrelated ignores. No Windows skip inferred. |
| Budgets | PASS | Builder 633/661. Auth tests 477/433/299/332 ≤480. CORS test 480. Q1–Q3 473/500, 293/360, 199/230, 204/230. Q4 152/160 and 322/322. `types.ts` 335 inspect-only. |
| Public surface | PASS | `AnonymousRequestMatch` / `AnonymousRule` are type re-exports from `mod.ts` and `auth/mod.ts` only. No new CORS option. Corpus: 299 surfaces, two rows, four added declarations, no old declaration change/removal (part-18). Corpus signature renders `method` as `unknown`; source keeps the literal union and the JSDoc example lists six methods. |
| arch:check / cold DB | FAIL, open, unwaived | Composite stops at the database-identity prerequisite before doctrine. Direct doctrine does not convert it. PR 2425 is not this HEAD and is not an integrated arch PASS. |
| Windows mapped-IPv4 | OPEN, unwaived | Historical native Windows refusal remains. Linux shard success is not a Windows transport fix. |
| CI quality / close-gate | FAIL, open, not this leaf | Critical BetterAuth GHSA-965c-763c-88jm is a separate unintegrated five-owner task. No security or merge waiver. Close-gate stays red; this report does not set `status:ready-merge` or close an issue. |
| e2e:cli, browser, CEF, EIS, release | UNRUN | Plan defers expensive e2e to merge readiness. Not N/A and not waived. |
| Debt entry bytes | NOT RE-READ | Packet and root acceptance describe only the preapproved 14-line U4 F-1 delta. `arch-debt.md` text was not in the 20 reads. No new debt or behavior waiver observed in product source. Not `FAIL_DEBT`: no malformation or deepening is evidenced. |

## Findings

No blocking implementation defect.

1. Low, non-blocking — `packages/service/src/primitives/body-limit.ts:140`. `reader.releaseLock()` sits in the inner `finally` outside the cancel `catch`. A throwing `releaseLock` can replace a returned 413 or a primary error. Tested disconnect, 413, and handler-error paths passed with sanitizers, and cancel is awaited first. Remedy: catch `releaseLock` the same way as `cancel`. Not generator-blocking on this evidence.
2. Low, non-blocking docs drift. MCP Pipeline order lists stages 1–7 and omits health. Source `service-builder-impl.ts:508` installs health after auth and body limit and before deferred routes. MCP CORS origins correctly says denied origins get no ACAO and that CORS is not authentication; it does not state the six-header replacement or that configured ACAC/ACEH remain for hostile origins. README/CHANGELOG do. The site page was a conditional owner. Remedy before release docs parity: add the health stage and the replacement sentence. Not a source mismatch and not a waiver.
3. Low, non-blocking — `service-builder-impl.ts:610`. `serve()` still runs startup hooks before `build()`. An invalid exact rule therefore can run the DB probe before the `TypeError`. Locked zero-call proof is handlers and listeners only; those tests hold. No listener is opened.

## Interaction conclusions

- U2 does not invent a stricter policy than pinned Hono. Hostile/missing origins lose ACAO and upstream `*`; configured ACAC/ACEH stay. No-`withCors` and standalone RPC/OpenAPI still reflect, including `ACAO ""`.
- U4 legacy `[]`, omitted, and `['/health']` stay method-blind prefixes. Contract `'none'` / `'required'` still wins. Arrays are copied at guard construction. Absent `withHealth()` registers no health route. Late `withHealth()` installs once on the next `build()`.
- Q4 cleanup does not cancel a completed source. Declared-length and bodyless paths do not take the adapter. Auth still returns 401 before the limit reads. Chunked 413 keeps CORS. Adapter deletion is not authorized now.
- Four historical `*_test.ts` diagnostics are `.ts.txt` data with the original manifest plus `historical-diagnostic-archive-map.json`. Shipping tests stay live. This is not a discovery skip.
- Q-U2-3 stacking, Q-U2-5 oRPC plugin removal, Q-U2-6 non-CORS browser headers, U1/U3/E1, and route-aware raw denial stay deferred as planned.

## Process

Root source acceptances are inputs, not this verdict. RED receipts and failed first-GREEN attempts remain recorded. Q4’s first push preceded the intended index audit; later raw/index/HEAD audits match, and raw EOF whitespace findings remain. `final-checkpoint-correction.md` is historical CORS plan steering, not Q4 authority. No forced all-CI or all-gates claim.

## Unresolved

Cold DB arch:check, historical Windows mapped-IPv4, BetterAuth advisory, close-gate, `e2e:cli`, browser/CEF/EIS, and release remain open. Raw receipt files and `arch-debt.md` were not re-opened here. Pinned Hono was not re-read in this session; U2 behavior is judged from service source plus the retained native-oracle tests.