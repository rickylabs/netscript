# Amendment 1 — resolve first independent FAIL_FIX

This amendment supersedes the conflicting parts of revision2 plan.md; all other scope and gates remain. Coordinator-authored after the independent plan-eval.md at570f88894. It is not an evaluation PASS or implementation authorization. The composite plan now has both the original planning author and coordinator as authors; the independent evaluator must remain outside both families/sessions.

## Procedure policy replaces wire-method policy (Q3)

Remove GET=>read/otherwise=>write from D2 and every generated example. Emit canonical procedure-local metadata on the generated list procedure: `access: { authentication: 'required', authorization: { scopes: ['<name>:read'] } }`. Use the existing `@netscript/contracts` baseContract/NetScriptProcedureMeta vocabulary, preserving the plugin error contract and precise metadata-bearing types; no copied metadata interface or new URL parser. The generated feature's local describe procedure receives the same explicit read policy without mutating the shared base contract. Add the required generated core dependency through the native specifier helper.

The generated connector uses native `createContractAuthorizer` over its metadata-bearing contract, passed through factory auth.authz. The service builder binds that authorizer to its actual REST and RPC paths. No broad fallback, no manual transport-prefix table, and no inferred scope from wire method. Unmatched or unmarked procedures remain denied. Only the generated feature contract is annotated here; four first-party plugin cores remain out of scope.
[observed - docs/site/tutorials/workspace/05-route-authz.md:75-123,149-185; deno doc createContractAuthorizer/ContractAuthorizerOptions; packages/service/src/auth/contract-authorizer.ts:64-108; independent Q3]

D6's CLI-produced consumer proof must invoke the generated list procedure through BOTH REST GET and the native typed SDK using RPC with the same verified session holding only `<name>:read`; both return200. Assert the actual RPC transport path/method through the native test boundary so the test cannot accidentally use REST twice. A second valid session without the required read scope (for example write-only) gets403 on the same list procedure through both transports. Anonymous and revoked sessions get401; verifier failure gets503; health remains anonymous. Use the landed native auth HTTP fixture/session lifecycle and SDK credential contribution, no handwritten fetch as the SDK proof and no forged session DTO. REST probes may use the native existing probe surface.

The current generated contract has a list procedure and no write procedure. Remove the invented generated write-route assertion. Insufficient scope is proved on that real list procedure; no unrelated generated mutation feature is added just for the test. Preserve the actual CLI generation, registry, imports and discovery proof from D6.
[observed - packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:373-425; packages/plugin-auth-core/src/adapters/auth-service-authenticator.http_test.ts and plugins/auth/tests/services/session-credentials-http_test.ts; independent Q3]

## Explicit runtime policy validation (Q1/Q2)

Replace the proposed exported discriminator isPublicAuthPolicy with one shared `assertServiceAuthPolicy(value: unknown): asserts value is ServiceAuthPolicy`, implemented in a runtime module `packages/service/src/auth/service-auth-policy.ts`. Policy types remain in options.ts; auth/mod.ts and the root export the canonical types/assertion. The factory calls the assertion before choosing its branch and before building/listening. #1382 can reuse the same validator later; it is not implemented here. The change is additive types AND runtime validation, not "types only".

Use mutually exclusive public and guarded type shapes; soundness tests reject a real authn value combined with public:true. Runtime rejection is strict at the new union boundary:

| Input | Required result |
| --- | --- |
| undefined, null, primitive, array, empty object | actionable TypeError |
| public:true without reason, non-string reason, empty or whitespace-only reason | TypeError |
| public marker other than literal true | TypeError, never guarded/public fallback |
| public policy also containing authn or authz (including explicitly undefined keys) | TypeError |
| guarded policy containing public or reason keys | TypeError |
| missing/non-object/array authn, missing authenticator, non-callable authenticate | TypeError |
| supplied malformed authz, missing authorizer, non-callable authorize | TypeError |
| public:true with nonblank reason and no conflicting keys | explicit public policy |
| valid native authn with optional valid native authz | guarded policy; preserve native options unchanged |

Errors name the two accepted policy choices and never serialize the supplied policy, credentials or principals. Validate the new discriminant and required native port shapes; do not normalize native protect/allowAnonymous policy or copy the service middleware's implementation. Test every rejection row through the JavaScript boundary and shared validator, plus relevant type-level contradictions. Existing positive factory/RPC/REST/order tests remain.
[observed - independent Q1/Q2; native AuthnOptions/AuthenticatorPort and AuthzOptions/AuthorizerPort via deno doc; service auth module's runtime-versus-options structure]

## Risk register (required plan gate)

| Risk | Likelihood | Impact | Mitigation and acceptance |
| --- | --- | --- | --- |
| RPC read treated as write | high | generated read-only client fails403 | canonical procedure metadata + same-session SDK/RPC and REST read200 |
| ambiguous policy interpreted as public | medium | accidental unauthenticated exposure | shared assertion, mutually exclusive shapes, complete rejection table |
| recorded public declarations mistaken for security completion | medium | unsafe first-party adoption claim | reasons name dependencies; issue1383 guarded-adoption/runtime boxes remain open |
| reason text becomes stale | medium | audit misleads future maintainers | each declaration names owning follow-up; review remaining scope on every adoption PR |
| generated JSR imports reference absent exports/version | high | broken published connector | native specifier generation and local-source generated proof; owner-approved coordinated publication and installed-consumer receipt still required |
| custom anonymous list drops health | medium | caller configuration surprise | preserve native replace semantics, document it, verify default/generated health and explicit replacement tests |
| generator metadata/error types drift | medium | generated package fails check or loses contract errors | precise canonical metadata type, generated workspace check and full transport proof |
| required field breaks existing callers | high | compile/startup migration failure | enumerate in-repo callers, explicit postures, actionable error and exact migration examples |

No owner question, release, publication or implementation is introduced by this amendment. Re-evaluate the composite plan before admission.
