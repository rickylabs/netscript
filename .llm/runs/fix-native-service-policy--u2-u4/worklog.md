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
Revision 3 applies the addendum's appended "complete checkpoint and Vary correction"
(`final-checkpoint-correction.md`) by targeted edits; prior revisions retained by root.

### Public surface

- U2: **none**. `withCors()` documented behavior changes: under `withCors()` the final response
  carries exactly the native checkpoint for all six `access-control-*` headers (each value restored,
  each absence deleted) and `Vary` = union of checkpoint and final tokens (`Origin` at most once,
  only when native policy appended it; none forced for `'*'`); downstream/upstream/oRPC CORS headers
  are replaced. No `withCors()` ⇒ unchanged. `createServiceCorsMiddleware` stays internal. Revision-1 knob
  `RPCHandlerConfig.cors` is **dropped** (redundant under the complete authority).
- U4: `AnonymousRequestMatch { method: 'GET'|'HEAD'|'POST'|'PUT'|'PATCH'|'DELETE'; path }`,
  `AnonymousRule = string | AnonymousRequestMatch`, `AuthnOptions.allowAnonymous?: readonly
  AnonymousRule[]`; re-exported from `./auth` and root `mod.ts`. Exact method (GET ≠ HEAD) ∧
  byte-exact raw and decoded path. `TypeError('[netscript.service.auth] invalid anonymous request:
  …')` at guard construction.

### Vocabulary and constants

Six access-control response headers: `access-control-allow-origin`, `-allow-credentials`,
`-expose-headers`, `-allow-methods`, `-allow-headers`, `-max-age`. Checkpoint = the value **or
absence** of all six as pinned Hono left them on the placeholder before `next()` (ACAO for allowed
origin only; ACAC whenever `credentials`; ACEH whenever `exposeHeaders`, both independent of the
origin decision; preflight trio absent) plus the placeholder `Vary` tokens. Final `Vary` = union of
checkpoint and final tokens, deduplicated case-insensitively, `*` wins, `Origin` at most once.
Anonymous method vocabulary = uppercase builder route methods + HEAD;
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
- Revision 3 turn (targeted edits only): read `final-checkpoint-correction.md` and the appended
  addendum section "Root's complete checkpoint and Vary correction before evaluation"; re-checked
  pinned Hono `cors/index.ts` — `if (opts.credentials) set(ACAC)` and `if (exposeHeadersStr)
  set(ACEH)` run independently of `allowOrigin`; `Vary: Origin` appended post-`next()` only when
  `opts.origin !== '*'` — and `context.ts` `set res` (placeholder headers win over a returned
  `Response`'s). Corrected plan.md (semantics, code shape, conformance oracles, Vary union
  controls, risks), decisions.md (D-U2-1 steps 1/3, D-U2-4, M-U2-1 sentence), this Design section,
  context-pack.md, research.md §2.2, drift.md D10, source-receipt.json roles. No hash regenerated,
  no runtime evidence invented.
- Nothing outside this run directory was modified. No runtime, test, build, install, delegation or
  provider call.

## Revision 4 Design supplement (root-authorized projection)

This append-only supplement mechanically copies native-generator decisions verbatim; it adds no orchestrator architecture.
Root fully read the actual revision-4 plan and decisions and authorized this projection after the same native turn
hit its unchanged 300-second bound. That timeout and every prior byte remain preserved. Implementation and
independent PLAN-EVAL are still gated. Root normative dispositions in root-policy-addendum.md control.

Supersession: the earlier Design has nine U4 paths and treats the builder as inspect-only. Native plan revision 4
and D-U4-7 supersede those statements: U4 has TEN paths, including behavioral service-builder-impl.ts.
U2 retains its existing scope and complete six-value checkpoint plus checkpoint/final Vary union.

### Verbatim generated excerpt: D-U4-7

Source: decisions.md SHA256 2810bb69915547b3e17011fb547bb6f5a69a8209def06e4e9679418f30d623da; UTF8 byte offset 12047, length 3397; excerpt SHA256 53de64d15acf71858e6d74242d21b8b939319d203332e35b2b6894bff969b89e.

### D-U4-7 (LOCKED, revision 4, root-authorized) Health routes register inside `build()`, after authn/authz, before deferred routes

- Fact (root source read + measured diagnostic at 1582, receipt sha256
  `2e72751b03539a73a33516f0c5ecb3af5cdc009165fd6c5c8dd7e3decdd6d5c3`, `--check --cached-only
  --frozen`, deny-net/run/write, no listener/KV/provider): `withHealth()` calls `this.app.get(...)`
  three times immediately (`service-builder-impl.ts:422-431`); `build()` installs authn/authz
  afterwards (`:502-532`). Hono dispatches `HEAD` to `GET`. Result with reject-all authn,
  `protect: ['/']`, `allowAnonymous: ['/other']`, with and without prior CORS: `GET|HEAD /health`,
  `GET /health/live`, `HEAD /health/ready` ⇒ `200`/authn `0`/raw `0`; `POST /health` ⇒ `401`/authn
  `1`; `GET|POST /other` ⇒ `200`/raw `1`; `POST /guarded` ⇒ `401`/authn `1`. The documented
  statement "a custom nonempty list replaces the native default; the assertion does not add
  `/health`" is therefore **not true on the wire for health `GET`/`HEAD` today**, and no exact
  entry (D-U4-1..3) can change that without a builder owner.
- Decision: `packages/service/src/builder/service-builder-impl.ts` becomes a **behavioral U4 owner**
  (10 paths). `withHealth()` keeps `healthConfigured` idempotency and captures `checks`/
  `includeDetails`; a private `installHealth()` (own `installed` guard) registers the identical
  three `GET` handlers with identical arguments; `build()` calls it after `installAuth()` and
  `installBodyLimit()` and before `installDeferredRoutes()`. No public option, no private consumer
  factory, no other ordering rewrite; `serve()` keeps calling `build()`.
- Preserved: omitted/`[]`/`['/health']` keep health public (prefix, method-blind); legacy prefix
  matching; exact object `GET` ≠ `HEAD`; contract-policy precedence (D-U4-5); `checks`/`details`/
  readiness semantics (same factories, live arrays, `withHealthCheck()` after `withHealth()` still
  honored); OPTIONS preflight still answered by CORS before auth.
- Changed (stated honestly): a custom non-empty list that excludes `/health` now guards health
  `GET`/`HEAD` (401 with a rejecting authenticator) — previously `200`. Not every builder-visible
  legacy result is unchanged. Release note: CHANGELOG Unreleased **Changed** entry naming the
  ordering, the affected configuration and the fix (add `'/health'` or the six exact entries);
  pinned `**Breaking (0.0.8):**` strings byte-identical. Classification → M-U4-2 (open).
- Oracle correction: "invalid entry ⇒ `TypeError` before any route is installed" is withdrawn
  (health registers eagerly today; after D-U4-7 the error still surfaces in `build()`/`serve()`
  before any handler executes and before a listener). The oracle is now "before listener/handler
  execution": no authenticator, authorizer, health or catch-all call; `define-service` `serve()`
  rejects with no port opened.
- Proving owners: `tests/auth/builder-auth_test.ts` (health-order control with root's measured RED
  baseline → intended GREEN, counts for authn/authz/catch-all/health handler, trio `GET`/`HEAD`,
  preservation rows, repeated `withHealth()`/`build()`/`serve()` lifecycle) and
  `tests/auth/define-service-auth_test.ts` (`HEAD /health` 401 under a GET-only exact list, reachable
  only with this owner). Real-service controls, not matcher-only proof. All UNRUN.


### Verbatim generated excerpt: D-U2-1 step 3 / Vary

Source: decisions.md SHA256 2810bb69915547b3e17011fb547bb6f5a69a8209def06e4e9679418f30d623da; UTF8 byte offset 2760, length 1069; excerpt SHA256 cbdb283f10fa0dd09e62b4c5b95fe4e37de531b149183e86a80d99878187c608.

  3. Otherwise, on the final `c.res`, **restore each of the six**: set the checkpoint value, or
     **delete** the header where the checkpoint recorded absence. Set `Vary` to the **union** of the
     checkpoint tokens and the final response's tokens (downstream + Hono's post-`next()` `Origin`
     append), deduplicated case-insensitively, first-seen spelling and order, `*` collapsing
     everything, header removed when empty. `Origin` therefore appears at most once; native policy
     appends it only for origin ≠ `'*'`, and no `Origin` is forced for an explicit wildcard — but
     (root normative interpretation) the union **always preserves a supplied downstream `Origin`
     token**, wildcard included; only a fixture that supplies no `Origin` token proves absence.
     Mutate in place through Hono's finalized-safe `c.header()` (which rewraps immutable-header
     responses such as `Response.redirect`/`fetch` results; `value === undefined` deletes) or one
     explicit rewrap; never reassign `c.res` (the setter would re-apply the stale headers).

### Root normative release-note disposition

The copied D-U4-7 open M-U4-2 marker is historical. Root has resolved it in root-policy-addendum.md:
Unreleased Added for exact entries plus Changed for health registration; name the GET/HEAD 200-to-401
compatibility impact for custom lists excluding health, migration, and release breaking-impact summary.
Pinned 0.0.8 strings stay unchanged. The existing metadata labels remain preserved and explicitly superseded.
