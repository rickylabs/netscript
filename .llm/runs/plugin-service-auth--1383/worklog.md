# Worklog

## 2026-09-08 — Follow-up planning bootstrap

PR2002 merged after independent review, final-head CI and104 runtime gates. Preserve the completed planner proposal and routing receipt; create an isolated follow-up for issue1383 factory policy. Initial proposal is not approved; correction.md returns technical choices and native-semantics issues before independent evaluation. No source implementation or release.

## 2026-09-08 — Draft PR and same-session revision

Draft PR2003 opened at f2faf5dac with status:plan, milestone0.0.8 and unchecked implementation acceptance. Fresh matrix CLI selected Fable5.1 medium for complex.plan; resumed existing session7930bfda-966a-4a1c-aa82-53c07cd8116b through AGENTIC, handle91482. planner-correction.md is the correction brief. No implementation or release authorization.

## 2026-09-08 — Independent plan FAIL_FIX and bounded amendment

Evaluator handle93058 exited0 with FAIL_FIX in plan-eval.md: RPC read proof/policy, ambiguous shapes, runtime-helper placement, risk register. No implementation. Coordinator queried MCP and inspected native createContractAuthorizer docs/tutorial/source, then recorded plan-amendment-1.md rather than rewriting the original plan. Native metadata now owns transport-independent requirements; complete union rejection table and risk register added. Second evaluation remains required.

## 2026-09-08 — independent round two PASS and implementation admission

Round two reviewed b3576e116, resolved all four FAIL_FIX findings and returned PASS. Evaluator process36944 exited0; original and second verdicts preserved. Coordinator admits the composite plan into implementation, starting S0/S1. PR2003 remains partial issue1383 work; no release, publication, or downstream adoption permission.

## 2026-09-08 — S0 baseline and S1 shared policy code

Baseline auth wrappers:39 passed. Added native ServiceAuthPolicy types and assertion, runtime rejection/redaction tests and type-soundness fixture. Auth suite78 passed/0 failed/0 ignored;51 files check/lint/fmt passed; package doc-lint0 errors; quality:gate exit0 (existing warnings retained). Receipts s1-*. Source rationale: native options.ts/types.ts, doctrine public-surface and modules/helpers, MCP service-layer-authn-authz-middleware guidance; independent plan-eval-2 PASS.

Board phase moved through REST after gh pr edit's missing read:org failure. Generic NetScript board check before/after remains exit1/incomplete at500 items (existing unrelated anomalies), not a global board PASS. Only PR2003 phase changed to impl; Cockpit child WIP unchanged. Phase evidence comment5577541326. No source tests or gates bypassed. S2 factory integration next; generated output/runtime/independent review still required.

## 2026-09-08 — S2 factory guard and S3 compatibility declarations

Factory now requires/asserts the shared policy before construction and applies native auth after context, before RPC. 12 focused tests pass:401/403/200 REST/RPC/raw routes, key-order independence, verifier503 redaction, RPC handler nonentry and JavaScript malformed-policy refusal. The initial health assertion failed; source builder registers built-in health endpoints before installAuth. Corrected the test to preserve public built-ins and verify a separate /health/private raw route is guarded under custom anonymous replacement. This is native behavior, not a factory exception. Original failed receipt retained.

First-party mains and existing test callers explicitly declare their current public behavior, naming pending credential propagation/session seeding/access policy/discovery. Additional test callers found beyond plan S14 were migrated mechanically to preserve compilation; no guarded adoption claimed. Combined tree:337 tests PASS,13 ignored,0 failed;522 files check PASS. Focused check/lint/fmt PASS;quality:gate exit0 with warnings. Doc-lint initially17; exporting native policy dependencies removes2 new findings. Baseline worktree and current both15, same paths/counts, full doc-lint remains FAIL. S2/S3 source hashes and every receipt committed. Full generated CLI consumer and runtime/evaluation gates remain open.

## 2026-09-08 — S4 guarded CLI generator

Native plugin new emits guarded auth discovery, a contract-aware authorizer, and read access metadata on list and describe. Uses native baseContract metadata/errors plus plugin errors without the old as-unknown cast; native release specifiers for framework imports; local-source mode omits pins. Manifest declares auth dependency. Source: native service contract authorizer, contracts primitive and public plugin authoring MCP guidance (s4-guidance.json).

Executed public CLI plugin new and native generate plugins in a real scaffold. First emitted check failed because generated core was absent from root Deno workspace. Extended the command through existing PluginWorkspaceMutator.ensureWorkspaceMember to register core alongside plugin members (no handwritten workspace writer). Retained failed receipt, regenerated through CLI;21 emitted files now check and2 generated contract/manifest tests pass. Generator7 tests pass;4 source files check/lint/fmt pass;quality:gate and JSR specifier gate pass.

Execution corrections retained: netscript-dev does not expose plugin new; public netscript.ts does. scaffold.plugins requires its fixed plugin set and samples: auth-only selection failed before execution, no-samples attempt failed registry generation; unmodified default suite17/17 passed. No-samples cleanup's unset Docker client warning did not establish daemon unavailability; final run uses owner-provided DOCKER_HOST. No AppHost was started. Root lint/fmt exclude CLI; wrappers initially refused all-excluded, then explicit four-file config used the same root style/rules without unrelated path exclusions, receipts retained. Generated registry/files were never hand-edited.

S5 remains: commit a repeatable CLI-generated native-auth HTTP/SDK probe into scaffold.plugins. Current17-gate suite and generated2 tests do not prove live authorization. S6 carriers, full scaffold.runtime and independent implementation evaluation remain. No release, publication or installed-consumer claim.

## 2026-09-08 — S5 executable defect, not a PASS

New native-session probe type-checks22 generated files but read-scoped REST returned403 instead of200. Flat core policy geometry differs from plugin binder version/namespace geometry. Direct assembled-router input fails TS2345 on its broad/lazy type and was reverted. Native guidance requested; exact source-backed repair returned to original planner. No passing runtime/client claim. Probe source and sanitized failure receipt retained; no changed goal or owner preference fork.

## 2026-09-08 — S5 gate registration while binding repair runs

Added critical behavior.generated-guarded-plugin to scaffold.plugins, backed by the committed native-session probe. Source-only fixture explicitly skips78 for a non-local workspace, never a published compatibility PASS. e2e gates lists the new gate;6 source files check and lint PASS;3 existing suite-builder tests PASS. Actual generated read still FAIL until binding repair lands; no suite runtime PASS inferred from registration. Original planner process84113 confirmed live, no restart. Harness owner publication279 remains OPEN with no new receipt.

## 2026-09-08 — binding amendment returned

Original planner84113 terminal exit0; binding-repair-plan.md returned native contract-side mount with shared coordinates. File arrived during gate-registration commit96c902b11; terminal read confirms complete plan, no later file delta. New public helper requires independent bounded amendment review. Third plan-evaluation turn preserves prior history and matrix repair policy. Coordinator requires retaining original failure receipt and honest15-finding doc-lint baseline comparison. No helper implementation admitted yet.

## 2026-09-08 — cycle-three in-flight repair correction

Evaluator55971 terminal exit0; binding-repair-eval FAIL_FIX confirms technical repair, only receipt preservation and explicit15-finding doc-lint comparison remain. Coordinator prior brief incorrectly prohibited the matrix-mandated fixable-plan edit on cycle3. Returning same evaluator for scoped in-flight F1/F2 repair and certification, not resetting/incrementing a fourth review cycle. Owner informed in commentary. Two inspection-only lock entries (exactcontract1.15.0,zod4) preserved as patch and removed; no dependency change intended, no broad lock reset.

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
