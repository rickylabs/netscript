# Native service policy: coordinator authorization

Milestone coordinator `/root`, 2026-10-27. User grants full autonomy on EIS-Chat
NetScript0.0.8 epic500 and requests delegation. This isolated upstream worktree
`fix/native-service-policy` starts at1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d.
Exact CLI0.0.8 agent init --with-docs succeeded190 prose/1 API/8 exports before
dispatch. A temporary local service alias was restored byte-exact; eight known
tracked initialization changes were inspected/restored. No product source changed.

Root explicitly authorizes the **architecture PLAN generation and separate
different-family PLAN-EVAL roles**, not implementation yet. Rationale: native
service CORS response authority crosses REST/RPC/error paths, and the anonymous
health prefix cannot safely exempt a raw catch-all host by exact method/path.
These public policy/lifecycle contracts require locked decisions and adversarial
acceptance; file count alone does not authorize a privileged tier.

Resolve current roles/routes with the pinned matrix through the agentic suite.
Use only existing suite launch/watch/steer APIs. The verified task-owned official
native CLI2.1.251 and existing authenticated native subscription may be reused
without copying credentials/profiles, global installation or unrelated MCPs.
Use strict task-owned NetScript configuration and project approval settings;
readiness, actual model/session identity and raw outputs must be retained. No
ad-hoc WSL/Codex launcher, invented fallback, or unguarded paid provider call.
Any paid route requires a fresh actual expense decision; report it to root
before dispatch so concurrent runs cannot spend the same stale allowance.

Produce one compact research/plan/decision/context packet for the following
two explicitly separate implementation leaves. Root must substantively read the
generated packet before the independent evaluation, then read the actual verdict
before implementation authorization. Do not hand-write a plan as a substitute for
the routed architecture generator or self-certify acceptance.

U2: native CORS response authority. Existing EIS conformance identifies the six
access-control headers/Vary/error and RPC-inner-plugin overwrite problem. Prefer
one native service-owned authority, preserve standalone RPC compatibility and
native handler/body/cookie semantics. The original3-4-path footprint is a candidate,
not authority to omit a proving owner. No new public option bag without necessity.

U4: supported exact method/path anonymous health matching. Current string lists
use prefixes; [] restores default /health, and BOTH authn/authz skip before ordinary
authorizer dispatch. Locked raw streams can create arbitrary path names. A proposed
additive exact-request object in allowAnonymous could retain legacy strings/defaults
while enabling a nonempty exact-only list. It is a candidate to evaluate, not an
already-approved API. No sentinel prefixes or EIS middleware/router copies.
Candidate five paths: auth/options.ts, auth/auth-middleware.ts, the owning
middleware/builder-auth tests and service README. Canonical/encoded path behavior,
HEAD, OPTIONS/CORS and explicit matched-public procedures must be decided from
actual native semantics. Count denied downstream mutations, not only statuses.

Preserve U1's approved twelve plugin-host paths: NO edits to them, public factories,
their artifacts, or concurrent implementation. U3 headers, E1 issuer/role/TTL,
ordinary-browser auth, reader credentials, process supervision, release/version/
dependency/lock changes and EIS adoption are outside this planning leaf. The plan
must name those dependencies, not silently solve or waive them. Public legacy
hosts are never a security-approved shipping fallback. No exploit is claimed.

Inputs: EIS coordinator run
`C:/Users/ericc/source/repos/eis-chat-netscript-008-foundation/.llm/runs/feat-netscript-008-foundation--s00-s01/`
contains s16-remediation-proposal/footprint/security decision, source receipts and
s16-e1-policy-research-20261027.md. The immutable original worker research is
SHA2567a78f5757a2667f8544759868525a3ee53c1179d54570a4b8918c627376e0dbe.
Fresh independent source inspection and active installed NetScript MCP/docs are
required before locking the proposal. Relevant doctrine/harness/PR skills control.

All implementation, runtime qualification, independent IMPL-EVAL, published
production E2E/release and S16 acceptance are still pending. Canonical release
staging permits documented prepublication debt with a named alpha/beta target;
it never makes unrun published E2E green or waives release/S16 gates.

## Design (generator checkpoint, appended; coordinator text above preserved byte-exact)

Session `c2672910-4296-4cbf-b7be-4652f52837eb` (native Fable 5.1 @ xhigh), 2026-10-27. PLAN only;
no implementation, no gate run, no evaluator verdict. Revision 2 applies
`root-policy-addendum.md` after root read research.md/decisions.md revision 1 (retained by root).

### Public surface

- U2: **none**. `withCors()` documented behavior changes: under `withCors()` the final response
  carries exactly the configured decision for all six `access-control-*` headers (presence and
  absence) and one `Vary: Origin` token; downstream/upstream/oRPC CORS headers are replaced. No
  `withCors()` ⇒ unchanged. `createServiceCorsMiddleware` stays internal. Revision-1 knob
  `RPCHandlerConfig.cors` is **dropped** (redundant under the complete authority).
- U4: `AnonymousRequestMatch { method: 'GET'|'HEAD'|'POST'|'PUT'|'PATCH'|'DELETE'; path }`,
  `AnonymousRule = string | AnonymousRequestMatch`, `AuthnOptions.allowAnonymous?: readonly
  AnonymousRule[]`; re-exported from `./auth` and root `mod.ts`. Exact method (GET ≠ HEAD) ∧
  byte-exact raw and decoded path. `TypeError('[netscript.service.auth] invalid anonymous request:
  …')` at guard construction.

### Vocabulary and constants

Six access-control response headers: `access-control-allow-origin`, `-allow-credentials`,
`-expose-headers`, `-allow-methods`, `-allow-headers`, `-max-age`. Decision snapshot = the first
three as Hono wrote them on the placeholder before `next()`. `Vary` tokens deduplicated
case-insensitively, `*` wins. Anonymous method vocabulary = uppercase builder route methods + HEAD;
OPTIONS excluded. Path validation rejects `% * : { } ? # \`, whitespace, `//`, trailing `/` (except
`/`), non-absolute. No helper constant, no sentinel prefix, no option bag.

### Commit slices

1. U2 (4 paths + 1 conditional): `src/middleware/service-cors.ts`,
   `tests/cors-response-authority_test.ts` (new), `README.md`, `CHANGELOG.md`
   [+ `docs/site/reference/service/index.md` prose if the docs parity gate requires].
2. U4 (9 paths): `src/auth/options.ts`, `src/auth/auth-middleware.ts`, `src/auth/mod.ts`,
   `mod.ts`, `tests/auth/middleware_test.ts`, `tests/auth/builder-auth_test.ts`,
   `tests/auth/define-service-auth_test.ts`, `README.md`, `CHANGELOG.md`.

### Deferred scope / dependencies

U1 (twelve plugin-host paths, public factories — untouched), U3 per-request headers, E1
issuer/roles/TTL/reader credential/browser bootstrap, EIS adoption, process supervision,
release/version/lock, #2396/#829/#2364; Q-U2-3 `withCors()` stacking, Q-U2-5 oRPC `CORSPlugin`
removal / no-`withCors()` reflect, Q-U2-6 non-CORS browser headers, Q-U4-2 route-aware denial,
Q-U4-3 scaffold emission of exact entries.

### MUST RESOLVE status

M-U2-1 resolved by root → Unreleased **Fixed** + migration sentence (no-`withCors()` unchanged,
stated honestly). M-U2-2 dissolved (no public type change in U2; docs page stays a conditional
prose owner). M-U4-1 resolved by root → no helper; README documents 3 GET + 3 HEAD entries. No
open MUST RESOLVE remains; deferred items above are dependencies, not blockers for PLAN-EVAL.

### Contributor path

Root reads this packet → separate different-family PLAN-EVAL (lane-policy route) → root reads the
verdict → only then WSL Codex implementation slices (U2 then U4), each proven by the package-scoped
gates in plan.md, then `deno task e2e:cli` at merge readiness. No self-PASS here.

### Evidence log (this session)

- Prior turns: `.agents/skills/netscript-harness`, `.llm/harness/{workflow,gates,evaluator}` read;
  NetScript MCP `find_guidance` (CORS/withCors/oRPC; allowAnonymous/protect), `get_doc
  pages/reference/service#pipeline-order`, `#cors-origins`,
  `#contract-declared-authentication-and-authorization`, `search_docs` ×2 — results matched the
  checked-in docs (research.md §1). Source hashes in `source-receipt.json`; HEAD
  `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`; tracked product tree clean.
- This turn (bounded, read-only): `root-policy-addendum.md` in full; Hono 4.13.13 `cors/index.ts`
  (decision written pre-`next()`, `Vary: Origin` appended post-`next()` via `c.header`) and
  `context.ts` (`set res` always rewraps and re-applies placeholder headers; `c.header()` rewraps
  when finalized); `@durable-streams/server@0.3.9/src/server.ts` sha256
  `a6e3352a7455e8dd50905c134e983cfc0fe5c52d094c1b5ea2d82a1948c2e0cc` lines 446-458 and 1124
  (`ACAO *`, methods, allow/expose headers); `plugins/streams/services/src/proxy-headers.ts`
  (preserves CORS headers verbatim), `proxy.ts` (`fetch` + `sanitizeProxyResponse`), `main.ts:100-128`
  (`origin: '*'`, `exposeHeaders` list, `serveRpc: false`, raw `all /*`); root receipt
  `native-cors-raw-characterization.json` 1,252 bytes sha256
  `8079d15304b28193cf28e35550f4ad3018c1358f3d045c034e9f274173e2f4ad` read, **not executed**.
- Nothing outside this run directory was modified. No runtime, test, build, install, delegation or
  provider call.
