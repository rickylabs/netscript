de9f6df3561d9e27587dd63687c8825254e9c3d5
VERDICT: PASS

# IMPL-EVAL — fix-native-service-policy--u2-u4 / PR 2422 (debt continuation)

- Same session `ses_e7f6de463ffeReuJZAVbOznsLd`. Requested xai Grok 4.7/xhigh; observed model id `openrouter/x-ai/grok-4.7`. Effort is not runtime-attested. No new session or route.
- Target unchanged: `fix/native-service-policy`, base `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`, HEAD `de9f6df3561d9e27587dd63687c8825254e9c3d5`. Archetype 4 + SCOPE-service. Architecture tier remains root-authorized.
- Write limit: no file write. This text replaces the preserved public final as the revised complete report. The preserved final was not edited.
- Merge disposition: **not ready**. This PASS is not a close-gate, security, arch:check, Windows, e2e, EIS, or release waiver. Numeric F-1 is **DEBT_ACCEPTED**, not a fitness PASS.

## Coverage

Original twenty reads remain qualified by root and are not repeated: parts 01–18 through EOF, original-review-questions, current-ci-context. Own MCP in this same session remains `search_docs({query:'withCors', limit:3})` and verbatim `get_doc` for CORS origins and Pipeline order.

This continuation read all three supplements through EOF: `canonical-entry.md` 29, `original-public-final.utf8.md` 67, `root-gap-and-debt-delta.md` 62. The preserved final still says Debt entry bytes **NOT RE-READ**. That statement is historical. It did not read `.llm/harness/debt/arch-debt.md`. This continuation did read the full canonical service entry supplied as `canonical-entry.md`, identified by root as physical lines starting at 2809 and ending immediately before `## plugins/sagas`. The rest of the registry file was not in this read and is not claimed.

## Debt qualification (revised)

Original report: debt bytes **NOT RE-READ**; not `FAIL_DEBT` only because no malformation was then evidenced. That was incomplete.

This continuation: full service entry read. Canonical file `.llm/harness/debt/arch-debt.md`, full-file SHA256 `74e43f6a6c914c5af55edd107d9c5a06a289ae795d5b980d37af89c0a38d7fb9`, baseline-to-HEAD **+14/-0**, no other registry change in the supplied diff.

Parent fields are present: reason (pre-#1386 F-1 overrun; CORS extracted to `service-cors.ts`; builder/types decomposition still separate), owner (service maintainers / architecture follow-up), target (next decomposition pass, before the stable public API line), linked change (PR #2193), created 2026-10-10, status open, gate F-1 with close conditions of builder ≤500 and `types.ts` ≤300.

The added U4 sub-bullet has the mandatory delta fields: scope reason (health state / `installHealth()` only), explicit **DEBT_ACCEPTED, not PASS**, no broad size waiver, owner (service migration coordinator + rickylabs), deadline **2026-11-10 or the stable API line, whichever is earlier, no automatic extension**, authority (`plan.md` revision 4 and `root-policy-addendum.md`), `types.ts` inspect-only at 335, F-10 not waived, affected tests ≤480, and no source authorization by the entry itself.

Independent bounds from `root-gap-and-debt-delta.md`, checked against the already-read source: builder **633** versus baseline 629, permitted +32, maximum **661**. Net growth is +4, inside the cap. `types.ts` **335**, unchanged and inspect-only. Auth tests **477 / 433 / 299 / 332**, all ≤480. Deadline is still future relative to 2026-10-28. The entry is not closed. No new debt alias or native-behavior waiver was added.

Disposition: **bounded DEBT_ACCEPTED**. Not malformed, not deepened past the recorded cap, and not `FAIL_DEBT`.

Two limits, neither a registry defect: the parent gate sentence still says `arch:check` exits zero. That sentence is pre-existing and outside the +14 delta. It is stale and is **not** current evidence. Composite arch:check remains FAIL at the cold DB identity prerequisite. The U4 bullet cites plan revision 4; accepted plan revision 5 folded the `installAuth` prepare-then-mark reorder into the same 661 cap and forbade a further registry edit. Actual 633 is inside that cap. Revision 5’s absorption is not an unrecorded deepening.

## Verdict definition applied

Approved U2/U4/Q1–Q4 behavior remains present and backed by the prior source read plus retained in-scope receipts. Debt is now a valid bounded acceptance, not an unread exemption. No implementation defect requires generator re-steer. Red rows below stay red.

## Gate rows

| Gate | Result | Evidence |
| --- | --- | --- |
| Plan-gate before impl | PASS | Original `FAIL_PLAN` `234a7791…66159` kept; same-session recheck `PASS` `dcf8daeb…7b014`; root plan acceptance. Q1–Q4 `PLAN-EVAL: N/A` is the recorded fixed-behavior authorization. |
| Design checkpoint | PASS | `worklog.md` Design section: public surface, slices, deferred scope. |
| U2 CORS authority | PASS | `service-cors.ts:59-91`: one Hono resolver; six headers including absence; preflight unchanged; one `c.header('vary')` rewrap; set/delete restore; case-insensitive Vary union, `*` wins. Owning 221/0/0 retained. |
| U4 exact match + atomic install | PASS | `auth-middleware.ts:233-239`: method plus raw and routed equality. Both constructors finish before either `app.use` at `service-builder-impl.ts:519-535`. Health predicate and post-success mark; `build()` order at `:508` is auth, body limit, health, deferred routes. |
| Health snapshot vs readiness | PASS | `health.ts:106-108` snapshots checks. Readiness at `health.ts:327` keeps the live array. No post-install dynamic health API. |
| Compatibility migration | PASS | Custom lists excluding `/health` return 401. Plugin oracle `create-plugin-service-auth_test.ts:134`. README/CHANGELOG name `'/health'` or six entries. Pinned 0.0.8 strings remain. |
| Q1 TCP ownership | PASS | `database-connectivity.ts:287-304`: signal, close in finally, late abort is failure, deadline cleared on every path. Three attempts and two 2000 ms delays retained. |
| Q2 stdout / Q3 file URL | PASS | Stdout drained through EOF and reader released. `fromFileUrl` is narrow. Q1 18/0, Q2 3/0, plugin 11/0 retained. Four malformed-policy controls and health 401 stay live. |
| Q4 native source ownership | PASS | `body-limit.ts:114-142`: Hono remains the only 413 resolver. Lazy zero-prefetch source ownership; no clone/tee/count loop. Declared-length and bodyless paths stay native. Signal preserved. Completed readers are not cancelled; cancel errors are swallowed. Disconnect `handlerEntries === 0`; handler-error is one entry and the same `Error` (`body-limit_test.ts:313`). Owning 14/0/0 retained. |
| In-scope static / publish | PASS (retained, not re-run) | Selected check/lint/fmt, eight export docs, quality scan, direct doctrine, JSR surface, publication dry-run, scratch cleanup. Not re-executed here. |
| Consumers | PASS (retained) | Broad consumers 26/0/0 after the locked 200→401 edit. Plugin source was inspected. Streams/Aspire sources were not re-opened. |
| Linux CI | PASS (coordinator-reported, not re-executed) | Run 40622518654: six shards, typecheck, and check-test PASS. Mapped-peer Linux module passed. No Windows skip inferred. |
| Budgets | PASS | Builder 633/661. `types.ts` 335 inspect-only. Auth tests ≤480. CORS test 480. Q1–Q3 and Q4 caps hold, including body-limit test 322/322. |
| Public surface | PASS | Identity re-exports only. Corpus 299 surfaces, two rows, four added declarations, no old declaration change or removal. Corpus renders `method` as `unknown`; source keeps the literal union. |
| F-1 debt | DEBT_ACCEPTED, not PASS | Full service entry now read. +14/-0. Owner, deadline, no extension, 633≤661, types 335, tests ≤480. Does not waive F-10, runtime, consumer, arch, or release gates. |
| arch:check / cold DB | FAIL, open, unwaived | Stops at the database-identity prerequisite. Parent “arch:check exits zero” is stale and outside the +14. PR 2425 is not this HEAD. |
| Windows mapped-IPv4 | OPEN, unwaived | Historical native Windows refusal. Linux success is not a Windows transport fix. |
| CI quality / close-gate | FAIL, open, not this leaf | Critical BetterAuth GHSA-965c-763c-88jm remains separate and unintegrated. No security or merge waiver. This report does not set `status:ready-merge` or close an issue. |
| e2e:cli, browser, CEF, EIS, release | UNRUN | Not N/A and not waived. |

## Findings

No blocking implementation or debt defect. Prior low findings are unchanged.

1. Low, non-blocking — `packages/service/src/primitives/body-limit.ts:140`. `reader.releaseLock()` is outside the cancel `catch`. A throwing `releaseLock` can replace a 413 or primary error. Tested paths passed. Remedy: catch `releaseLock` as `cancel` is caught. Not applied here.
2. Low, non-blocking docs drift. MCP Pipeline order omits health. Source `service-builder-impl.ts:508` installs it after auth and body limit. MCP CORS origins omit the six-header replacement and configured ACAC/ACEH-on-denial facts. README/CHANGELOG state them. Remedy belongs to a later docs-parity pass. Not applied here.
3. Low, non-blocking — `service-builder-impl.ts:610`. `serve()` runs startup hooks before `build()`, so an invalid exact rule can run the DB probe before `TypeError`. Locked zero-call proof is handlers and listeners only. No listener is opened.

## Interaction conclusions

- U2 restores pinned Hono’s six-header checkpoint, including absence, and does not invent a stricter hostile-origin policy. No-`withCors` and standalone handlers still reflect.
- U4 exact rules require method plus raw and routed equality. GET does not imply HEAD. Legacy prefixes, defaults, and contract precedence remain. Health installs once after auth and body limit. Custom nonempty lists excluding `/health` change bypassed 200 to 401.
- Q1–Q3 settle the TCP signal, connection, and deadline without dropping the three attempts or two delays. Child stdout and the Windows file-URL conversion stay narrow. Original provider, subprocess, and malformed-policy controls stay live.
- Q4 does not replace Hono’s 413 decision. Cleanup must not cancel a completed source. Adapter deletion waits on an upstream ownership fix that passes these controls.
- Four historical diagnostics are `.ts.txt` data. Shipping tests stay live. That is not a discovery skip.
- Q-U2-3 stacking, Q-U2-5, Q-U2-6, U1/U3/E1, and route-aware raw denial stay deferred.

## Process

Root source acceptances were inputs, not the original verdict. RED and failed first-GREEN records remain. Q4’s first push preceded the intended index audit; later hashes match, and raw EOF whitespace findings remain. `final-checkpoint-correction.md` is historical CORS plan steering, not Q4 authority. The original public final’s NOT RE-READ debt row is superseded only by this continuation’s registry read.

## Unresolved

Cold DB arch:check, historical Windows mapped-IPv4, BetterAuth quality/close-gate, `e2e:cli`, browser/CEF/EIS, and release remain open. Raw gate JSON was not re-opened. Pinned Hono was not re-read. The remainder of `arch-debt.md` outside this service entry was not read. No whole-CI, readiness, or security PASS.

Maximum steps for this agent were reached after the three supplemental EOF reads. The revised report above is complete from those reads plus the already accepted source/MCP context. No review task remains unfinished in this continuation. No further tool use, debt edit, or generator re-steer is recommended unless root separately wants the three low findings fixed outside this verdict.