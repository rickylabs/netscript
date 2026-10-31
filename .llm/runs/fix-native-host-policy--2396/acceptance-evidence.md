# Acceptance evidence for issue2396

The original issue has eight plain-bullet acceptance entries. This records implementation
proof and its limits, without converting pending CI or publication into completed acceptance.

| Entry | Source and proof | Limit |
| --- | --- | --- |
| 1 Legacy consumers and request behavior | Workers legacy and host-policy tests preserve public delegation, host-global KV, opaque DB context, plugin runtime context, native principal, canonical/deprecated RPC, REST and actual SSE. Streams legacy test starts the plural public entrypoint and stops it through its native signal handler. Service/plugin824 and worker/stream231 tests pass. | Workers OpenAPI document returns500 on exact main; authenticated factory/legacy parity is preserved. This change does not repair that inherited router defect. |
| 2 Auth policy before I/O and guarded401/503 | Both service_test owners run inert imports and invalid/missing/mixed/blank policy controls with permissions denied; native policy assertion runs first. Explicit public and real guarded listener tests cover missing/wrong credentials and verifier-unavailable503. | Explicit public mode remains an intentional host decision. No automatic credential adoption. |
| 3 Native procedure/raw seam and anonymous callers | Native service auth/health suites cover exact method/path matches, custom lists and default probes. Real workers RPC and streams raw-route tests use native authenticators/authorizers. The host guide documents native /api defaults, raw-route protect selection and exact GET/HEAD health migration. | Service-info remains public by the existing immediate route seam. #2364 parameterized contract policy is separate. |
| 4 Browser CORS and stream protocol | Native response-authority and factory host tests exercise exact allowed origins, unrelated/lookalike/null/malformed denials, preflight before auth, auth rejection responses, six protocol methods, nine allowed and twelve exposed headers. Actual proxy bytes and missing-stream long-poll204/up-to-date behavior pass. Reader headers retain native callbacks and explicit-empty replacement semantics. | Browser CORS is response access policy, not request authorization. Caller-supplied protocol arrays replace native defaults. |
| 5 Native listener and lifecycle | Real loopback ephemeral listeners report observed RunningService.addr; explicit port wins over invalid context/process fallbacks. Native TLS trust/rejection, caller signal, in-flight drain, independent listeners and actual port reuse controls pass. | Host-owned KV/producers remain available after worker shutdown. No shared process restart or process-manager migration. |
| 6 Explicit internal SDK identity and discovery | Real worker host test composes native internal and existing host authenticators, discovers workers through the public SDK seam, calls describe/listJobs, verifies a real producer snapshot, rejects wrong target and duplicate authorization ownership, and preserves the existing client. Native SDK credential/discovery/observability controls137/0/0 pass. | Credentials remain explicit backend configuration; no topology/browser secret bytes, issuer or default contribution. |
| 7 Inert streams and preserved runtime | Singular imports run under denied permissions. Factory delegates to the same bounded native store/proxy, retains storage probe and file-vs-memory semantics, real restart/denial/health tests, missing-stream and header repair. Stop/startup-failure/signal/drain tests prove front/upstream cleanup. Legacy plural entrypoint delegates with authored public/wildcard policy. | Production substrate/durability certification remains existing release scope; ephemeral memory remains documented. |
| 8 Consumers, package graph and adoption docs | Native facade positive/negative compiler consumers, exact exports, source type identity, six member publication dry-runs,303-subpath generated corpus, new host recipe/READMEs/CHANGELOGs/references and four freshness gates pass. Both new service subpaths have zero doc findings. | Actual published consumer graph and e2e-cli-prod are UNPROVEN until the first exact0.0.9canary. HOST-POLICY-PUBLISHED-GRAPH-2396 records the release-owned closing gate. Required premerge runtime CI is separate and cannot be waived by that debt. |

Final test paths: plugins/{workers,streams}/services/src/tests/. Source/check/test summaries are
in gate-summary.json. Baseline full-export documentation errors remain FAIL: workers2,
streams3 and prerequisite Fresh45; normalized exact-main findings match, with no waiver.

Read-only sibling review: sagas keeps its existing context-taking KV/DB projection seam;
triggers keeps its bootstrap and HMAC webhook ingress. No new sibling startup API is needed
for the named workers/streams seam. #829 and #2364 remain outside this implementation.

## Current-main reconciliation

Final source integrates main4aa734e2b6ca93119462ec2e0cd34b729df51bfd, including the
reviewed telemetry/locked-fixture and worker retry/dead-letter changes. Only generated carrier
conflicts occurred; no authored runtime/test conflict. All carriers were canonically refreshed.
Current union root check3857/33 PASS; combined service/plugin/Fresh/workers/streams/native SDK
and inherited worker retry tests1504 passed,0 failed,4 ignored. The four ignored cases are
main's Redis adapter variants without local NETSCRIPT_TEST_REDIS_URL; CI supplies owned Redis.
All333 service/plugin TypeScript lint/fmt targets pass with no drops. Quality/architecture,
six published-member dry-runs, four canonical freshness checks,479 JSDoc examples and export
drift pass. Current native JSR included list93 has no tests/helper. Current-main normalized
doc findings remain workers2/streams3/Fresh45 with native service0 and both factory paths0.
See doc-lint-baseline-refreshed.json and latestValidation in gate-summary.json.
