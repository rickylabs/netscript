# Root substantive findings and normative policy dispositions

Milestone coordinator `/root`, 2026-10-27. These dispositions were delivered after root fully read
the actual Fable-generated research.md (17KB) and decisions.md (10KB), before PLAN-EVAL. They are
prospective corrections, not retrospective model approval. The in-flight original generation is
preserved; correction must use the same supported native Fable session after it settles. No
implementation or evaluator inference is authorized by this addendum.

## U2 load-bearing counterexample

Disabling oRPC CORS DOES NOT meet the raw streams/service authority requirement. The locked public
`@durable-streams/server@0.3.9/src/server.ts:446` unconditionally emits ACAO `*` plus methods,
allow/expose headers; line1124 emits ACAO `*` again for SSE. Upstream
`plugins/streams/services/src/proxy-headers.ts` strips no CORS headers and explicitly documents
preserving them; `proxy.ts` forwards and calls `sanitizeProxyResponse`, retaining that wildcard.
Thus a Hono denied/absent checkpoint still lets the raw upstream wildcard survive even with
`serveRpc:false`. The generated D-U2-1 public `cors` boolean may solve RPC but is insufficient alone.

The revised plan must preserve native service-owned decisions for **all six access-control headers,
including ABSENCE**, across real raw conflicting headers, cookies, immutable responses, errors and
Vary. Use native service-owned preservation or a justified complete alternative; no permanent private
EIS wrapper, universal option bag or duplicate origin-policy engine. Do not evaluate the current
D-U2-1 as complete. All behavior remains source-derived/UNRUN.

## U4 source correction and exact method policy

Research3.1 incorrectly lists `DELETE /health%2Fx` as prefix-bypassed. Its own3.2 correctly observes
that encoded `%2F` stays encoded, so `/health` prefix does not match that representation. Preserve
the actual raw/decoded distinction without inventing an exploit.

An object rule MUST mean **exact method AND exact raw/decoded path**. GET does **not** implicitly
exempt HEAD. Legacy string semantics remain unchanged. When desired, document three explicit GET
health entries plus three explicit HEAD entries; there is no exported helper constant or new option.

## Remaining root policy choices resolved

- M-U2-1: use an **Unreleased Fixed** entry with an explicit migration sentence describing changed
  no-withCors RPC behavior, preserving pinned0.0.8 Breaking strings. Adjust classification honestly
  if the final solution instead preserves no-withCors behavior.
- Conditional docs-reference owners are allowed when an actual gate/type/public-surface dependency
  requires them; do not omit a proving owner to maintain a candidate footprint.

No user approval is needed for these coordinator dispositions. Root must still read the revised
complete packet before the separate different-family PLAN-EVAL. All implementation, independent
IMPL, runtime/browser/listener, published release and S16 shipping gates remain pending.

## Root's measured in-process negative control

Root subsequently reproduced the counterexample on actual public `createService` at exact1582,
cached-only/frozen with no dependency/lock changes. With `withCors({origin:[allowed]})`, `withHealth`
and a raw GET response bearing upstream-shaped conflicting CORS headers:

- Hostile `/health`: ACAO absent, Vary Origin.
- Same hostile `/raw`: ACAO `*`, allow-headers `authorization, content-type`, expose-headers
  `Stream-Next-Offset`, Vary Origin.
- Allowed `/raw`: intended exact origin, upstream allow/expose headers still present.

Read-only input receipt (do NOT execute its script during planning):
`C:/Users/ericc/source/repos/eis-chat-netscript-008-foundation/.netscript/agent/native-cors-raw-characterization.json`.
Receipt SHA256 `8079d15304b28193cf28e35550f4ad3018c1358f3d045c034e9f274173e2f4ad`, 1,252 bytes.
It explicitly records source1582, syntheticHeaderFixture=true, rawCalls=2, listenerStarted=false,
upstreamServerStarted=false, browserExploitObserved=false. This is genuine in-process native
negative evidence, not an exploit/full security proof, and must be included in revision/PLAN-EVAL.
Root also supplies locked server source SHA256
`a6e3352a7455e8dd50905c134e983cfc0fe5c52d094c1b5ea2d82a1948c2e0cc`.

## Root's complete checkpoint and Vary correction before evaluation

After fully reading the revised decisions, root requires the following prospective correction via
the SAME native generator session after its current turn settles. This is root policy, not an
orchestrator-authored replacement architecture or retrospective evaluator approval.

- Snapshot **ALL SIX** service CORS header values, including null/absence, rather than only the three
  fields currently emitted by Hono on ordinary GET responses.
- Snapshot checkpoint/prior `Vary`, then **UNION checkpoint and final Vary** with case-insensitive
  token deduplication and `*` winning. Final-only deduplication loses a prior `Cookie` or
  `Accept-Encoding` token when a downstream handler overwrites Vary.
- "Single Vary Origin" means Origin appears at most once when present or required by native policy.
  Do not force Origin onto an explicit wildcard policy where native Hono leaves it absent.
- Include a negative control whose handler overwrites Vary with a different token, proving retention
  of checkpoint, downstream and native Origin tokens. All six absence decisions must remain exact.

No additional public options or implementation owners are required by this correction. Update the
actual generated plan, decisions and worklog Design consistently before independent PLAN-EVAL;
orchestrator must not hand-edit those generated architecture artifacts.

## Root-authorized mechanical metadata overrides after actual native settlement

Root explicitly directs these operating-metadata corrections without another architecture turn.
The same native session settled its final correction at 2026-10-27T21:11:13.771Z, exit 0,
timedOut=false, observed `claude-fable-5-1`, xhigh requested only. The original generated revision-3
bytes are preserved under `prior-drafts/generated-revision3/`; this addendum does not rewrite them.
The evaluator MUST read these explicit overrides with the generated packet.

1. The generated consumer gate's `plugins/streams/services/tests/` does not exist. Its canonical
   replacement is the following exact existing owners, retaining the other verified gate owners:

   ```powershell
   deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/streams/services/src/proxy_test.ts plugins/streams/services/src/main_test.ts plugins/streams/tests/service/proxy-headers_test.ts packages/plugin/tests/service/ packages/cli/src/kernel/templates/aspire/helpers/tests/workspace-cors_test.ts
   ```

   All five selected paths exist; the service directory contains existing tests. This is a
   prospective UNRUN command, not a gate receipt, source addition or new policy.

2. The earlier source-receipt label `service-cors.ts` = "JSDoc-only owner" was stale. The canonical
   plan's behavioral U2 owner controls: `createServiceCorsMiddleware` implements the complete
   six-value checkpoint/restore and Vary union. The final native correction has now also corrected
   that role string and marked dropped revision-1 owners inspect-only. Baseline source SHA256
   remains `a34a7f6339dc3bc0af0a6b9573200c3d70424298e3818cbd361fc16034928198` unchanged.

No source edit, source-hash rewrite, public API, implementation owner or policy is added by these
metadata dispositions. Root full read and separate different-family PLAN-EVAL remain required;
implementation and paid evaluator inference are not authorized here.

## Root normative wildcard/Vary interpretation after complete semantic read

Root fully read the addendum, generated plan, decisions and Design. The mechanism's
`UNION(checkpoint, final)` **always preserves a downstream Origin token if supplied**. "No forced
Origin for wildcard" never means deleting an existing Origin token. The generated wildcard `/raw`
fixture supplies `vary: origin, Accept-Encoding`; its current "has no Origin" oracle is therefore
stale and is explicitly overridden as follows:

- An explicit wildcard policy causes native Hono to add no Origin token.
- The authority still preserves supplied checkpoint/final tokens, including downstream Origin,
  case-insensitively at most once, subject to `*` winning the complete union.
- For the existing wildcard `/raw` fixture, preserve its supplied Origin and Accept-Encoding.
- Add a separate wildcard fixture with no supplied Origin token to prove actual Origin absence.

The evaluator MUST apply this override to the stale generated test-oracle wording. Original
generated bytes remain unchanged in place and in `prior-drafts/generated-revision3/`. This is root's
explicit interpretation of the already-selected union mechanism, not a new option, owner, policy
engine, generator turn or runtime result. Independent evaluation and implementation remain gated.

## Root prospective U4 health registration correction (measured at current source)

Root read `service-builder-impl.ts` and confirmed that `withHealth()` eagerly registers the three
GET routes before `build()` installs authentication/authorization. A new bounded public in-process
diagnostic now measures the consequence at exact source1582, both without CORS and with prior CORS:

| Request, with protect `['/']` and allowAnonymous `['/other']` | Status | Authenticator calls | Raw handler calls |
| --- | --- | --- | --- |
| GET /health, HEAD /health | 200 | 0 | 0 |
| GET /health/live, HEAD /health/ready | 200 | 0 | 0 |
| POST /health | 401 | 1 | 0 |
| GET /other, POST /other | 200 | 0 | 1 |
| POST /guarded | 401 | 1 | 0 |

The authenticator always rejects. This is actual current behavior, not a proposed matcher result.
Diagnostic receipt: `.llm/tmp/native-service-policy-plan-20261027/health-registration-diagnostic-warmed-20261027/receipt.json`,
SHA256 `2e72751b03539a73a33516f0c5ecb3af5cdc009165fd6c5c8dd7e3decdd6d5c3`.
Portable2.9.7 actual `--check --cached-only --frozen`, explicit30s bound, clearEnv,
`--deny-net --deny-run --deny-write`; exit0 in2.43s, no listener/provider/KV, four protected hashes
unchanged. Initial missing-public-cache attempt remains a separate setup failure.

Root prospectively authorizes adding `packages/service/src/builder/service-builder-impl.ts` as a
behavioral U4 owner and the required existing test owner. Defer health registration until AFTER
authn/authz installation and BEFORE deferred raw routes. Preserve omitted/empty/default-string
health-public semantics and legacy prefix matching; an exact GET-only entry must not exempt HEAD.
No implementation is authorized yet. A targeted SAME-generator packet correction (maximum300s,
not a900s recrawl) plus root full read and actual independent PLAN-EVAL are required before source.

Root fully read the actual diagnostic, runner and `revise-health-order.md` (SHA256
`621317887f9f4e1f76b616d252f2ff60aeb1888d840f34fab554cc5aa0613fef`) and authorizes exactly one
same-session300s correction via the existing native subscription suite; no paid fallback/source.
Evidence qualifications: runtime imports use public `createService`; the erased AuthenticatorPort
type import is from internal `src/auth/types.ts`, not a public subpath. The512KiB output check is
after capture, not a streaming hard cap. The probe explicitly opens no KV and network is denied;
this is not a general attestation about every possible module-import side effect. Retain original
diagnostic receipts and their wording unchanged with these explicit qualifications.

## Root normative supersession and M-U4-2 release disposition

Root fully read the actual revision-4 plan/decisions diffs against revision3 and authorizes a
mechanical faithful projection, with no further generation turn. The appended worklog section
"Revision 4 Design supplement (root-authorized projection)" copies native-generator D-U4-7 and
revised D-U2-1 step3/Vary VERBATIM; `design-projection-receipt.json` binds the source file hash,
UTF8 byte offsets/lengths, excerpt hashes and exact preservation of all11033prior worklog bytes.
This is not orchestrator-authored architecture. The native300s timeout remains historical fact.

For evaluation, the canonical combined packet is this root addendum, native `plan.md` revision4,
native `decisions.md` revision4, and the appended Design supplement. Older Design/context/research/
drift/source-receipt ROLE statements naming nine U4 paths or a builder inspect-only owner are
explicitly superseded: U4 has TEN paths, including behavioral `service-builder-impl.ts` and the
existing proving tests named by D-U4-7. Historical metadata and all baseline source hashes stay
unchanged. Source-receipt hashes remain byte authority; stale labels do not grant/deny source scope.
The evaluator MUST read these explicit supersessions, not treat the300s partial turn as a complete
standalone packet or silently ignore its outcome.

Root resolves **M-U4-2**: Unreleased **Added** for exact anonymous entries plus **Changed** for
health registration. State the compatibility impact explicitly: BEFORE, health GET/HEAD returned
200 despite a custom anonymous list excluding health; AFTER, those requests return401 under a
rejecting authenticator when excluded. Migration: add `'/health'` to retain the legacy prefix
capability, or use the three GET plus three explicit HEAD exact entries when that is the intended
capability. This is a security-policy fix WITH compatibility impact and must appear in the release
breaking-impact summary. Preserve all pinned0.0.8 strings byte-for-byte; do not claim every legacy
builder-visible result remains unchanged. The copied/generated "M-U4-2 open" text is superseded.

Existing builder F-1 and test-shape F-10 baseline constraints are recorded in
`baseline-constraints.md`. Registry presence is not a new debt waiver or closure; independent
evaluation must assess the affected baseline and prospective gate results. No implementation,
release, actual independent verdict or paid launch is authorized by this projection/disposition.

## Root targeted existing-debt delta and conditional proving owner

After fully reading the projection and existing registry entry, root accepts a bounded numerical
F-1 delta on the EXISTING service-builder debt: U4 may grow its629-line baseline by at most32
(maximum661, same count convention), solely for new health state / `installHealth`. F-1 remains
**DEBT_ACCEPTED**, not PASS; there is no broad decomposition or size waiver. The exact subbullet is
appended within `.llm/harness/debt/arch-debt.md`'s existing service residual F-1 entry, preserving
other entries and the inspect-only335-line `src/types.ts` baseline. Owner: NetScript service
migration coordinator + rickylabs. Remediate additional growth by2026-11-10 or the stable API line,
whichever is earlier, without automatic extension. All runtime/test/docs/release gates still stand.

The registry is ONE additional existing METADATA owner in the footprint, not a new product owner.
The independent evaluator must assess the explicit delta's validity upfront; do not copy unrelated
U1/worker debt or infer this registry decision as an architecture/test/runtime PASS.

All affected TEST files have a hard maximum of480physical lines. If the honest matrix needs a
focused `packages/service/tests/auth/health-auth-order_test.ts`, root preauthorizes that CONDITIONAL
proving owner, selected and locked before implementation, within the below30-path footprint. This
is not new F-10 debt and does not permit golf, skipped controls or fewer behavior oracles. U4 thus
has10 native-plan owners +1 existing registry metadata owner +1 conditional focused test; U2's
existing scope and conditional docs owner remain as recorded. No new generator turn is needed.

## Root normative U4 failed-auth-installation acceptance condition

Before independent evaluation, root read the existing `installAuth()` source and found that it sets
`authInstalled = true` BEFORE `createAuthnMiddleware()` / `normalizeGuard()` can throw. An invalid
new anonymous rule could therefore reject the first `build()` but leave that flag true, allowing a
subsequent `build()` / `serve()` to skip auth installation and proceed to health/routes/listening.
This is a source-backed failure path, not a newly executed listener or exploit characterization.

Root requires the already-owned behavioral builder change to keep invalid configuration failclosed
across repeated `build()` AND `serve()`: all attempts reject before listener or handler execution.
Installation must not mark auth installed before validation succeeds. Prepare BOTH native authn /
authz middleware before any registration and mark installed only after successful installation,
or justify an equivalent failclosed arrangement to the independent evaluator. Do not swallow the
TypeError, reset into an unguarded fallback, or introduce a new API / general builder redesign.

Prospective proving controls must include an invalid exact-rule first-build rejection, repeated
build rejection, and subsequent serve rejection with zero listener / health / raw-handler calls;
also retain valid repeated-build / serve idempotence and existing contract/authz behavior. All
existing size, test480, footprint and source-owner constraints still apply; the evaluator must
assess the concrete validation/flag/registration atomicity and bounded-growth feasibility upfront.
This is root's normative acceptance clarification of invalid-config-refuses-startup, not another
generator turn, retrospective generated-plan approval, implementation authorization or test PASS.
