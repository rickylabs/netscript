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
