# PLAN-EVAL — fix-native-host-policy--u1

- Plan evaluator session: ses_e8149b729ffeT3e3Xjhrqyql5U / 2026-10-27. Observed model openrouter/x-ai/grok-4.7. Requested openrouter/x-ai/grok-4.7 variant xhigh is a label only, not reasoning-effort attestation. Same first review, continued after the 18:55:58Z incomplete turn. Not a second architecture round. Generator ses_e817b95e9ffe8KjbVBmpy4yDxZ was not resumed.
- Run: fix-native-host-policy--u1
- Surface / archetype: plugins/workers and plugins/streams. Archetype 5 plugin, runtime subtype folded in (listener start/stop/drain).
- Scope overlays: SCOPE-service, SCOPE-docs
- Baseline claimed by the packet: 1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d, branch fix/native-host-policy. Evaluated subject is the six unchanged generator artifacts plus normative plan-review-addendum.md sha256 293f39b8b11ab54882b673ed2a6e0904adcdee76da48f6a6aa54cc677da0f660. Addendum controls on conflict. Overridden plan prose is not authorized.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | research.md re-baselines a833 to 1582. Spot-check: plugins/workers/services/src/main.ts:48-51,59-62,101-103 and plugins/streams/services/src/main.ts:34-38,91-135 match port text, #1383 reason, legacy start shape, and 6/9/12 protocol arrays. Both deno.json files export ./services and already publish services/**/*.ts while excluding *_test.ts. |
| Decisions locked | PASS | Combined lock is plan.md §3-§4 and decision-map.md Q1-Q2, as corrected by addendum §§1-5. Native contracts: assertServiceAuthPolicy (service-auth-policy.ts:29-77), ServeOptions.port 0 and tls (types.ts:161-217), listener options.port ?? defaultPort and real Deno.serve cert/key (service-listener.ts:92-119), createPluginService auth-first then .serve() (create-plugin-service.ts:156-229). |
| Open-decision sweep | PASS | No deferred decision forces U1 rework. Plan §13 items 1 and 3 are closed by the addendum plus the source below. Item 2 is measurement-only. Q3-Q8 stay outside U1. |
| Commit slices (< 30, gate + files each) | PASS | plan.md §5-§6. Eight ordered slices. Product surface is the same 12 paths. S1/S4 are RED against the new subpath; S2/S5 GREEN the factory; S3/S6 finish adapters and oracles; S7 changes no product file. Each slice is far under 30 paths. |
| Risk register | PASS | plan.md §10 as corrected. R3 deferral and R5 cast budget are withdrawn. F-10 cap is 500 (doctrine 09:267); planned tests stay ≤480. Rollback §11 does not approve legacy exposure. |
| Gate set selected | PASS | Archetype-5 matrix required gates are selected in plan.md §8 (F-2/F-4 n/a). Runtime proof is the owned real-listener suites; Aspire topology is unchanged, and scaffold.runtime remains a merge-readiness check. e2e-cli-prod is not DEBT_ACCEPTED. See Notes. |
| Deferred scope explicit | PASS | plan.md §12, decision-map.md Q3-Q8, addendum §5. U2, U3, E1, #829, #2364, release pins, and S16 are out of U1. U1 green does not qualify hosts or close upstream issues. |
| jsr-audit surface scan (pkg/plugin) | PASS | Rubric applied to the planned surface, not executed. plan.md §3 and §9 match jsr-audit metadata, @module, @param, @returns, @example, explicit returns, and dry-run. Public names resolve to @netscript/service, @netscript/service/auth, and @netscript/plugin/sdk. S7 is the proving slice. No new dependency. |

## Open-decision sweep (evaluator-run)

None that force U1 rework.

- Cast / PluginServiceContext: closed. Addendum §1 withdraws plan.md §4.12 and §10 R5. The type is structural (plugin-service-context.ts:2-22). A typed object literal with db.getClient(), contracts, kv, logger, and env satisfies it. createPluginServiceContext is exported from @netscript/plugin/sdk and already has a cast-free constructor test. Workers currently read only ctx.env.PORT (main.ts:48). No new any, cast, @ts-*, deno-lint-ignore, or quality-allow is authorized.
- TLS live oracle: closed. Addendum §2 withdraws plan.md §10 R3 and §13.1. tls-listener_test.ts:5-6 and :100-135 use MIItest and stub Deno.serve; that is not proof. The product listener performs a real Deno.serve bind when tls is present (service-listener.ts:114-119). Inline PEM in the already owned service_test.ts files is feasible and does not add a path, dependency, or verification bypass. Absence cannot become GREEN.
- Protocol counts: closed. Source wins: 6 methods, 9 allowHeaders, 12 exposeHeaders (streams main.ts:103-128). Plan §4.6 eleven/fourteen is not authorized.
- Quality baseline content: safe to defer to S0 capture. It does not change the API or the zero-new-violation gate.
- U2/U3/E1/#829/#2364/release/S16: safe to defer. U1 forwards auth, cors, and serve by identity and does not touch workers streams/factory.ts or streams/mod.ts. Those leaves still need their own acceptance.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

None.

## Notes

Implementation is still not authorized by this verdict. Root substantive review remains required. Implement the combined proposal, not withdrawn plan prose.

1. No new cast. Workers test fixture is a real PluginServiceContext object literal, or createPluginServiceContext with typed resolvers and getEnvironment so Deno.env is not captured. Do not spend a quality-allow if KV setup is awkward. service.ts must not import @netscript/kv/redis; a test may use the existing workers KV dependency. Factory getKv() stays inside start (service-runtime.ts:89-90).

2. TLS oracle, both owned service_test.ts files, because each factory could drop tls: clear NETSCRIPT_TLS_CERT_FILE and NETSCRIPT_TLS_KEY_FILE; pass the caller serve object by identity with hostname 127.0.0.1, port 0, handleSignals false, and tls cert/key; observe addr.port > 0 and a successful trusted https exchange via Deno.createHttpClient({ caCerts }) or an equivalent non-bypass trust anchor; stop and show the port can be bound again. Cert must be valid on the test date and name 127.0.0.1. No openssl, new file, new dependency, or rejectUnauthorized false. If that cannot fit the owned file, stop for a reviewed footprint change. Do not defer to E1.

3. Copy these arrays exactly. Methods: GET, POST, PUT, DELETE, HEAD, OPTIONS. allowHeaders: Content-Type, Authorization, Stream-Seq, Stream-TTL, Stream-Expires-At, Stream-Closed, Producer-Id, Producer-Epoch, Producer-Seq. exposeHeaders: Stream-Next-Offset, Stream-Cursor, Stream-Up-To-Date, Stream-Closed, Producer-Epoch, Producer-Seq, Producer-Expected-Seq, Producer-Received-Seq, etag, content-type, content-encoding, vary. Caller values replace per field. New factory has no wildcard default. Legacy streams adapter keeps origin '*' plus these arrays. Reason text stays the #1383 sentence now in both main.ts files. Missing-port errors stay Workers API requires the host-provided PORT environment variable. and Streams requires the host-provided PORT environment variable.

4. Do not mark e2e-cli-prod DEBT_ACCEPTED. release-gates.md:26-40 makes it post-publish authority for a plugin publish-shape change. Pre-publish evidence is unrun, dependency e2e-cli-prod.yml after publish. publish dry-run, clean-source consumer, verify-plugin, and scaffold.runtime do not replace it and do not close S16. Plan §8's waiver sentence is withdrawn by addendum §4.

Retained suites confirmed on disk: workers describe-route_test.ts, generated-jobs_test.ts, init_test.ts, trigger-path-id_test.ts; streams main_test.ts, proxy_test.ts, durability_test.ts, sse-contract_conformance_test.ts, tests/bounded-file-store_test.ts, tests/bounded-segment-log_test.ts, tests/storage-restart_test.ts, tests/storage-rss_test.ts. Default auth prefixes remain /api protected and /health anonymous (auth-middleware.ts:33-36); raw /* needs explicit protect ['/']. AP-22 allows this services/mod.ts because ./service is a declared subpath export (doctrine 09:152-154).
