# PLAN-EVAL — plugin-service-auth--1383 (revision 2)

- Evaluator: Muse Spark (`opencode-go/muse-spark-1.3-contributor`), independent session (not generator session `7930bfda-966a-4a1c-aa82-53c07cd8116b`, not coordinator/author Astra; Anthropic-family generator vs Muse evaluator — family/session independence preserved).
- Route: `matrix-plan-evaluator.json`, role `plan_evaluation`, tier `complex` (`muse_spark_1_3@max → grok_4_6@high`); observed seat Muse Spark @ max, first route, no fallback. Complex-tier authority: `revision-dispatch.json` records milestone-coordinator authorization with rationale (factory-owned security policy over every plugin service + generated consumers).
- Reviewed HEAD: `570f88894` (plan.md locked at `6603a2498`; only the matrix receipt added after — plan text stable). Baseline `6d6b3057f` (merged PR #2002) confirmed ancestor. Draft PR #2003 is the review surface.
- Compliance: read-only evaluation. No plan/product edits, commits, pushes, GitHub changes, agent dispatches, AppHost starts, or releases. Cheap read-only source probes only; no runtime rerun. Wrote only this file.

## Source spot-checks (all verified at HEAD unless noted)

- S1/S2 factory chain + builder ordering: chain cors→…→context→withRPC→… [observed - `packages/plugin/src/service/presentation/create-plugin-service.ts:137-194`]; `build()` runs `installAuth()` before `installDeferredRoutes()` [observed - `packages/service/src/builder/service-builder-impl.ts:447-452`]. Confirmed.
- S3 guard semantics: caller `allowAnonymous` **replaces** default (not union) [observed - `auth-middleware.ts:179-189`]. D4 honors this. Confirmed.
- S4 `defineService` shape + #1382 shared vocabulary: `auth?: { authn; authz? }`, installed via `withAuthn`/`withAuthz` [observed - `define-service.ts:137-142,271-274`]. Confirmed.
- S5 access-meta gap: only auth contract carries `authentication:` meta; workers/sagas/triggers/streams cores + base `describe` carry none. Confirmed via grep + `base-contract.ts:111-116`.
- S6 landed authenticator + leaf export present. S7 five mains, no auth field. S8 generator emits hand-pinned `0.0.1-alpha.17` + bare `createPluginService(router, { name, version, openApi })` [observed - `new-plugin-use-case.ts:21,207-218,694-707`]. Confirmed.
- S9/S10 version machinery: `JSR_SPECIFIERS` has `plugin-auth-core`, no `plugin-auth` key; mutator maps `@netscript/plugin-auth` via the `netscriptJsrSpecifier()` **function** (not the dict) for the `auth` kind, prod-only [observed - `jsr-specifiers.ts:20,62`; `workspace-mutator.ts:125-151,406-432`]. Consistent, no contradiction. Checker leaves `${…}` placeholders version-neutral [observed - `check-netscript-jsr-specifiers.ts:1-15,100-114`]. Confirmed.
- S11 runtime suite credential-less (`expectOk` 200s), S12 no `getAccessToken` in `packages/fresh/src`, S13 `withDependencies`→`PluginReferences`→`services__<key>__http__0`, S14 consumer test starts auth/sagas/workers mains, S15 soundness-exemption by filename (`isSoundnessFixture`), S16 session `authentication:'required'` vs documented 200-discovery posture, S17 suites listed (`scaffold.plugins` exists), S18 scope vocabulary, S19 budgets (drain 30s; 10 000 = ⅓ drain + first-consumer value), S20 boxes/`as any` debt. All confirmed.
- RFC rule: `rfcs/README.md:13-23` requires an RFC for public-API/breaking/cross-cutting changes — this PR qualifies on all three readings. The plan's posture (ratified seed issues #1383/#1382 from seed PR #1347 as specification + `breaking` label, maintainer-may-request recorded, not asked) is disclosed, not waived. Acceptable as a plan stance; the RFC question stays an explicit unknown, not a hidden assumption.

## Coordinator review questions — findings

**Q1 — `isPublicAuthPolicy` placement/label. CONFIRMED ISSUE (minor, doc-level).** No such helper exists today; the union needs a runtime discriminator for the §3.2 `TypeError` path. But `options.ts` is types-only (only JSDoc-example `const`s; no `export function`), while runtime guards live in sibling modules (`contract-authorizer.ts`, `scope-authorizer.ts`, `*-authenticator.ts`) and `mod.ts` already mixes type + runtime exports — so the guard belongs in `@netscript/service/auth` but §3.1's heading "(types only, additive)" contradicts its own row. Correction is one heading/label line, not a redesign.

**Q2 — ambiguous-policy handling. GAP (bounded).** §3.2 names only "missing or neither shape → TypeError". Unspecified: `{ public: true }` without `reason` (runtime-accepts vs rejects; empty/blank reason), `{ public: 'yes' }` / `{ public: 1 }` (truthy non-`true`), both-keys shapes (`{ authn, public: true }` — guarded wins, public wins, or reject?), malformed `authn`/`authz` values. Required auth must never become an accidental public fallback, and the factory test list (§5 tests 1–7) covers only the omitted-field case. The fix is bounded: name the rejection table + add the corresponding cases to §5. No rescope.

**Q3 — GET→read rule across REST vs RPC. GAP (load-bearing for the generated proof).** `AuthzRequest.method` is the **wire** method (`c.req.method`) [observed - `auth-middleware.ts:125,207,261`]. A method-based scope rule therefore sees `POST` for RPC calls — including RPC invocations of the generated `GET` list route (RPC is mounted via `app.use(`${path}/*`)` + `rpcHandler.handle`, not per-method routes). D2 specifies the template rules as "`GET → '<name>:read'`, otherwise `'<name>:write'`" without naming the `match` predicate, and D6's generated proof asserts the `:read` 200 **only over REST GET** (raw fetch); no generated read-200 via the typed SDK/RPC path is required anywhere. Factory test 2 proves 401/403 on both transports but never a scope-granted RPC read-200. Consequence: the gate could go green on REST while generated SDK clients (RPC/`POST`) get 403 on the same read procedure in production — exactly the hidden-breakage scenario the coordinator named. Bounded fix: specify the template `match` semantics (wire-method vs procedure-aware) and add a typed-SDK/RPC read-200 assertion with the `:read` session to D6.

**Q4 — specifier/generator confinement. RESOLVED, no contradiction.** The dict-key gap vs mutator-function mapping are different mechanisms (verified above); D2 adds the `plugin-auth` key for the generator path and confines changes to this feature's imports. `check:netscript-jsr-specifiers` task exists and is in the proof commands. The absent-`./authenticator`-on-0.0.7 problem is not waved away: §4 states published consumers resolve only after an owner-approved release, local-source verification only here, no release run.

## Brief criteria (1–7)

1. **Coherent bounded part, honest posture — PASS with note.** One PR, `Part of #1383`, no closing keyword; first-party `public` reasons name concrete missing guarantees (D5, correction 5 applied); box 5 ticked-only-by-coordinator with anti-misreading guard (§7). Old-200 tests are not claimed as guarded acceptance.
2. **#1382 vocabulary compatibility — PASS.** Object opt-out permitted by #1382 target 1; `defineService` untouched (#1382 stays open); no extra anonymity policy (D4 passes options through, correction 4 applied), no private constants, no second middleware stack.
3. **Generator proof is executable CLI output — PASS except Q3 gap.** D6 exercises `plugin new` → `generate` → check → real-HTTP 401/403/200 with dependency + discovery + imports working together (correction 6 applied). FAIL item: read-200 must also run through the native SDK/RPC path (see Q3).
4. **Versions/boundaries — PASS.** Local-source ≠ published-0.0.7 stated explicitly (§4); coordinated mechanism (`netscriptJsrSpecifier` + release train) used, not hand pins; no release cut or published.
5. **Ordering/raw-routes/streams/explicit-public/first-party truth — PASS.** `installAuth()` before `installDeferredRoutes()` verified; factory test 3 covers `rawRoutes` + `serveRpc:true`; streams catch-all and triggers webhooks keep behavior under `public`; all factory callers enumerated (5 mains + generator template + S14 test); `scaffold.runtime` still required at merge; wrappers canonical throughout.
6. **Meaningful type-valid tests — PASS.** Soundness fixture uses the scanner-exempt `-soundness_test.ts` mechanism; `deno eval` JS boundary uses no casts/suppressions; no `quality-allow` invented; no edits to #1382/#1384/#884/#885/#934 (all referenced as open only).
7. **Forks/RFC — PASS.** Zero owner forks remain (D1–D7 all chosen within ratified issue text). RFC posture disclosed per `rfcs/README.md` rule; `breaking` label + migration snippet (D8) planned. No invented approval flow.

## Plan-gate checklist

| Box | Result |
| --- | ------ |
| Research present and current (§1 S1–S20 re-verified at `6d6b3057f`, `initial-plan.md` superseded explicitly) | PASS |
| Decisions locked (D1–D8 with rationale) | PASS |
| Open-decision sweep (§8: RFC-need, alpha-existence, denyByDefault doc drift — all safe-to-defer, none forces rework) | PASS |
| Commit slices (S0–S6, ordered, gated, filed) | PASS |
| Risk register | **FAIL** — no risk section exists in plan.md (only §8 unknowns, which are not risks+mitigations) |
| Gate set selected (wrappers, quality/doc-lint/dry-runs, specifier check, carriers, `scaffold.plugins` proof + `scaffold.runtime` merge gate) | PASS |
| Deferred scope explicit (§7 verbatim-ready) | PASS |
| jsr-audit for new surface (specifier-key addition, checker coverage, local-vs-published split named) | PASS |

## Verdict

`FAIL_FIX`

Bounded corrections (no rescope; archetype/scope — factory authority per A16/S-A16 — is sound):

1. **D6 generated proof:** add a typed-SDK (RPC) read-200 assertion with the `:read` session on the generated list procedure, alongside the REST GET 200; specify the template scope-rule `match` predicate semantics (wire-method vs procedure-aware) in D2 so the emitted rule cannot demand `:write` over RPC for a read. [Q3]
2. **§3.2 runtime check:** name the ambiguous-shape rejection table — `{ public: true }` without `reason`, empty/blank reason, truthy non-`true` `public`, both-keys `{ authn, public }`, malformed `authn`/`authz` — guaranteeing required auth never falls back to public; add the corresponding §5 factory cases. [Q2]
3. **§3.1 heading:** drop "(types only, additive)" (it adds `isPublicAuthPolicy`, a runtime guard) or move the guard to a runtime module row; placement in `@netscript/service/auth` is approved either way. [Q1]
4. **Add a risk register** (plan-gate box): e.g. template scope-rule misclassification across transports; `public`-reason rot; JSR-mode generated connector unresolvable until release; first-party `public` mistaken for acceptance; `allowAnonymous`-replace footgun in generated configs — each with the mitigation the plan already contains.

## Limits

Plan-only review: no implementation, runtime, or release judgment. `scaffold.plugins`/`scaffold.runtime` execution, exact-head CI, and any maintainer RFC request are downstream of these fixes. No owner decision is required — all corrections are technical choices within ratified issue text.
