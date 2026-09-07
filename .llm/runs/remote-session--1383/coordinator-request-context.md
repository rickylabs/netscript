# Additional native request propagation finding

Planner HTTP probe currently yields directSessionId:true, cookieStatus200 with authenticated:false, bearerAuthenticated:false. Do not claim cookie compatibility PASS.

Coordinator source check: git grep currentAuthRequest plugins/auth/services/src returns only the function definition in request-context.ts. main.ts start supplies context: () => ({ registry, telemetry }); routers/router-context.ts only applies authContractV1.$context<AuthServiceContext>() and never supplies request. Existing withAuthRequest captures request in AsyncLocalStorage, but no code reads it into the handler context. [observed - source3330d6f9c, named files and planner-http-session-probe.log]

The revised native session integration must include request propagation using the existing bridge, with per-request isolation and real cookie/bearer HTTP tests. A token-only change cannot fix missing context.request. Preserve scope separation from signout; do not claim live IdP flow from fixtures. No speculative new middleware or duplicate request store.

Controlled diagnostic composition in coordinator-http-context-probe.ts supplies request:currentAuthRequest() through the existing context seam. Real HTTP/native router now yields direct:true,cookie:true,bearer:false; exit0 with native listener stop and caller-owned KV disposal. This separates the missing request propagation defect from the missing bearer-to-token mapping. Receipt coordinator-http-context-probe.json; raw log retained separately. No product source was patched.
