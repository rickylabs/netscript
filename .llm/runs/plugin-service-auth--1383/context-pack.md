# Plugin service auth policy — independent plan repair

Existing issue #1383; follow-up to merged PR #2002 at baseline 6d6b3057f28e5edf1b55ff911c131c71c64dc919. Branch feat/plugin-service-auth-policy, draft PR2003. Cockpit child WIP remains #4/#9.

Revision2 plan.md received independent FAIL_FIX at570f88894; preserve plan-eval.md. The coordinator amendment plan-amendment-1.md addresses procedure-aware REST/RPC authorization, ambiguous-policy rejection, runtime-helper placement and the risk register. The composite plan has two author families. Round2 completed in the same independent evaluator session, using matrix-plan-evaluator-2.json, with PASS in plan-eval-2.md at b3576e116. Process36944 exited0. Coordinator admitted implementation. S0 baseline39 auth tests and S1 shared policy code are complete:78 auth tests,51-file check/lint/fmt,doc-lint and quality gate passed. S2 factory enforcement and S3 public declarations are implemented. See s2-s3-verification.json:12 focused tests,337 regression tests with13 ignored,522-file check,quality pass;doc-lint15 matches baseline and remains fail. S4 CLI generator implemented and verified:7 generator tests,21 emitted files check,2 emitted tests,standard17-gate scaffold.plugins pass. Public netscript.ts exposes plugin new (netscript-dev does not). Command now registers the generated core through native ensureWorkspaceMember. S5 repeatable live native-auth/SDK generated consumer proof is next; current checks are not that proof. See s4-verification.json for generated project path and command receipts. Full generated consumer, runtime, and independent implementation gates remain outstanding.

No NetScript release, canary, tag or publication is authorized. Owner approval requires a concrete meaningful milestone bundle and evidence; prerequisite merges are not publication permission. No Cockpit installed-artifact, authorized attention or downstream native completion is inferred from this plan.

S5 runtime probe at72dbf3cf2 found a real defect: native read-only session REST returns403, expected200. Flat core contract geometry lacks assembled version/namespace. Direct router experiment failed TS2345 and is reverted. Source-backed repair now running in original planner session7930bfda-966a-4a1c-aa82-53c07cd8116b, process84113, capture/tmp/cockpit-binding-repair-planner.jsonl. Poll same handle; do not restart on observation timeout. Output binding-repair-plan.md. Matrix/brief/dispatch retained. No live auth PASS; goal intact.

Binding planner84113 is TERMINAL exit0/success (binding-repair-result.json); plan committed96c902b11. Independent amendment review at5f9d9393d is running in same Muse session ses_f82065586ffeLljGd8IO7l8SLt, process55971, capture/tmp/cockpit-binding-eval.jsonl, receipt binding-eval-launch.jsonl. Output binding-repair-eval.md; no new public helper implementation before PASS. Fresh matrix-binding-evaluator.json, third plan review history retained. Standard scaffold.plugins now includes critical behavior.generated-guarded-plugin (96c902b11); it has not passed live yet.

## Binding implementation checkpoint — 2026-09-08

Independent cycle-three in-flight plan repair PASS is in binding-inflight-eval.md; prior FAIL_FIX remains preserved. Implemented contract-side mount, shared assembly coordinates and generated constant.

Executable evidence discovered a plan assumption was false: authorizer remapDeprecatedRpcPath rewrote canonical /api/rpc/v1/sample/list to /api/rpc/v1/sample/sample/list. New assembled-router test initially passed 7 and failed 1 (RPC403 vs200). The bounded correction excludes the canonical replacement prefix, matching the native transport distinction in packages/service/src/builder/service-rpc.ts:70-75. This expands the amendment's test-only service scope to a small runtime fix; independent implementation review must explicitly inspect this deviation. No new permission or fallback semantics. [observed - packages/service/src/auth/contract-authorizer.ts remapDeprecatedRpcPath; packages/plugin/tests/service/create-plugin-service-auth_test.ts mounted contract case]

The service test's first compile failed because @orpc/contract is not a service dependency (s5a-binding-tests.json). Reused existing baseContract.prefix instead, with no dependency addition. Focused14 tests PASS (s5a-binding-tests-2.json), broader94 tests PASS (s5a-regression-tests.json).

Reused generated workspace retained an old framework copy and failed export checking (/tmp/cockpit-s5-probe-4.log). Fresh native scaffold.plugins passed17/failed1: authorized REST and SDK reads succeeded, but probe expected POST while native contract-derived method was GET. Probe now explicitly sets native transportPolicy.method to POST, preserving every assertion. Source authority packages/sdk/src/internal/transport-policy.ts and packages/sdk/tests/transport-policy_test.ts. No SDK product change. Full fresh suite rerun process56221, log /tmp/cockpit-s5-scaffold-plugins-2.log. Typecheck process73016. Poll these exact handles, never infer completion.

No release, tag, canary or publication authorized. Full runtime, doc-lint baseline comparison, generated documentation carriers, independent IMPL-EVAL and exact-headCI remain required. No Cockpit installed artifact or live attention/Mobile compatibility is claimed.

Processes56221/73016 TERMINAL exit0. Fresh scaffold.plugins18/18 PASS, check11filesPASS, scopedlintPASS. Durable success s5-runtime-PASS.json; original failure preserved. S6 documentation/carriers/doc-lint baseline, full runtime, independent implementation review and exact-headCI remain next.

## S6 checkpoint
Documentation updated in c73a85ff4/de8b2e765. Export corpus, prose bundle and publish assets generated; initial dirty-source refusal and422-byte embedded-doc budget excess were corrected by committing sources and shortening duplicate authoring prose, without changing the budget. quality gate, exports drift, JSDoc examples and publish-assets freshness PASS. Package publish dry-run (no allow-slow-types) PASS. Doc-lint comparison FAIL:17 versus15, exactly2 new upstream oRPC privateTypeRef findings at contract-mount.ts. Qualified-import experiment unchanged17, reverted. No exception accepted; independent evaluator must assess this explicit deviation from plan's zero-new bar.

Full runtime is LIVE process42889 log/tmp/cockpit-s6-runtime.log; generated root .llm/tmp/cli-e2e/plugin-smoke-20260908-040707. AppHost described with actual resources. Exact three source containers identified by own mount path/sharedDCPcreator:3beb03accf79 postgres,3c588e2933d6 redis,ae93e84203a4 garnet. Owner-authorized exact-ID relay LIVE24562, ownercockpit-policy-s6-0908, registry/tmp/cockpit-policy-s6-relay.json, log/tmp/cockpit-policy-s6-relay.log, --since2026-09-08T02:10:54Z fromDockercreatedtime. Stop/cleanup only this relay after suite terminal; retain foreign resources. No final runtime verdict yet.

Fresh matrix-implementation-evaluator.json captured, but NO evaluator dispatched yet; query again immediately before dispatch. No release authorized.

## Runtime and review checkpoint
Full scaffold.runtime42889 TERMINAL exit0:104passed0failed0skipped. Receipt s6-runtime-receipt.json. AppHost shutdown gatepassed. Relay24562 TERMINAL exit0 after SIGTERM to verified own registryPID; dockerps confirms all three source containers and this relay removed, foreign resident resources untouched.

Independent implementation evaluator LIVE40319, NEW session via AGENTIC OpenCode, fresh matrix-implementation-evaluator-launch.json selected MuseSpark1.3max independently of OpenAI implementation. Capture/tmp/cockpit-implementation-evaluator.jsonl, launchertrace implementation-evaluator-launch.jsonl, brief implementation-evaluation-brief.md. SessionID not yet emitted in terminal capture; do not invent it or restart. Output evaluate.md. Known doc-lint17vs15FAIL is explicitly in brief; no waiver. Full runtime receipt now available to reviewer. No release authorized.

PR status moved to impl-eval, phase comment5578102700. Head259efb68a pushed. Native pr-checks process6362 terminal0 reports no current failures BUT build is still pending and most jobs skipped on draft; this is NOT exact-head CI green. Snapshot/tmp/cockpit-pr2003-checks.txt. Independent evaluator40319 remains live (last poll); do not restart.


Evaluator40319 TERMINAL exit0, session ses_f8132eca6ffesLYPOVzN00L3HB. evaluate.md FAIL_DEBT; sole
finding D2 two upstream doclint warnings. Coordinator accepted narrow debt in arch-debt.md and
appended binding plan dispositions (D1 runtimecorrection accepted byreview). Next fresh matrix query
and same-session recertification writing evaluate-2.md. Do not overwrite evaluate.md. No product
source change; runtime104PASS. No release authority.
