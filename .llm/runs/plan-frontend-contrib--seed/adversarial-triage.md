# Adversarial Triage — per-finding dispositions (generator, stage 2 integration)

Verdict on the review: **high quality; accepted with minor citation corrections.** The reviewer
verified upstream claims against jsr sources and repo code; its seven blockers are real design
flaws, not taste. Two slips noted (S-20 cites a non-existent `05-owner-forks.md` — forks live in
`plan.md`; S-15 misnames my example's adapters as Azure/Docker/K8s — they are cloudflare/aws —
and calls the op set five-op where the example listed six) — neither changes the substance.

| # | Sev | Disposition | Integration |
| --- | --- | --- | --- |
| S-1 mount ordering | blocker | **ACCEPT** — insertion-order compilation + `configure()`-before-fsRoutes means my sketch broke both plugin middleware and host layout wrap | 04 §2 rewritten: strict register order (middleware→layout→routes), mount in a post-fsRoutes composition phase, child `App`/`NotFound` stripped; Wave-0 proof P1 |
| S-2 route normalization | blocker | **ACCEPT** — `App.route()` takes internal `Route`, not a fs route module | literal generated loaders + `normalizeFreshRouteModule` adapter owned by `@netscript/fresh/plugins`; plugin `_layout` forbidden in v1; 01/03/04 updated; Wave-0 proof P2 |
| S-3 islands unproven | blocker | **ACCEPT** — API exists (still true) but cachedOnly resolve, Preact-transform excludes, watcher scope, CSS, HMR are unproved | reclassified from "verified primitive" to "verified API, unproven behavior"; Wave-0 proof P3 with the reviewer's full matrix; plugin-vite pin/compat test |
| S-4 SSR containment | blocker | **ACCEPT** — preact-render-to-string error-boundary mode not enabled by Fresh; async components fail earlier anyway | containment contract downgraded: host-side data resolution catch + route `onError` + client-boundary; SSR zone-throw = page error documented; Wave-0 proof P4 |
| S-5 sugar placement | blocker | **ACCEPT** — runtime helpers cannot live in the framework-free contracts package | `definePluginPage`/`pluginApi`/normalizer moved to `@netscript/fresh/plugins`; real signature over Fresh `PageProps` + state-injected `pluginHost`; 01/02 updated |
| S-6 proxy security | blocker | **ACCEPT** — wildcard forwarding proxy is a confused-deputy surface | replaced by deny-by-default generated **procedure gateway** (owner/method/path/streaming policy from versioned procedure metadata); AI durable streaming stays on its specialized adapter; 04 §4 rewritten; Wave-0 proof P5 (threat model) |
| S-7 schema evolution | blocker | **ACCEPT** — new union members break strict old validators; dashboard kinds can't ride the base schema | envelope/family model: `contract: { family, major }` + per-family registered payload schemas; new base discriminants = major; negotiation tests specified; 01 rewritten |
| S-8 identity conflation | major | **ACCEPT** — package name ≠ canonical kind ≠ installation id ≠ mount id (`officialSource.canonicalName` precedent) | explicit identity quartet in 01; CSS/proxy/route keys derive from host-assigned mount id; examples aligned |
| S-9 context split | major | **ACCEPT** — functions can't cross island serialization; auth type import breaks framework-free claim | `PluginRequestContext` (server) / `PluginClientContext` (serializable) split; auth becomes a principal **port**; 01/04 updated |
| S-10 zones/nav validation | major | **ACCEPT** — open string union destroys validation; nav string ambiguous | `HostSurfaceDescriptor` (versioned, host-published); unknown vs unmounted vs capacity diagnoses; discriminated nav targets (`route`/`href`/`external`); 01/03 updated |
| S-11 registry lifecycle | major | **ACCEPT** — non-transactional emission, stale files on removal, verb is `plugin remove` | complete replace-set, deterministic empty emissions, staged atomic replace + rollback, regenerate on install/update/remove, orphan doctor check; verb corrected; 03 rewritten §4 |
| S-12 CSS/assets | major | **ACCEPT** — layer order is declaration-order, portals escape scoping, copied CSS breaks `url()` | host-owned layer-order prelude, per-plugin portal root, copy-mode url() caveat; full `AssetContribution` deferred with debt entry; 04 §8/03 §2 updated |
| S-13 auth example | blocker | **ACCEPT** — org procedures don't exist in auth v1 | example rewritten: v1 live = the real 5 procedures (account/session widget/sign-out); org console explicitly future `auth-org` capability with backend contract prerequisite |
| S-14 ai example | blocker→major | **ACCEPT** — durable chat needs session target + specialized proxy | example rewritten: v1 = durable-session runtime route (generated specialized route + auth hook); oRPC event-iterator named as the alternative; assist = capability requirement not module import |
| S-15 deploy example | major | **ACCEPT** — op set is 7 (incl rollback/secrets); core importing adapter islands reverses ownership | example rewritten: adapters contribute panels via deploy-family registry; core consumes registry; 7-op or explicitly versioned read-only v1 |
| S-16 DX hidden work | major | **ACCEPT** — exports maintenance + loader generation are Phase-1; props serializability; split JSR/local loops | 02/05/plan updated; `netscript plugin dev` watcher added; F6 resolved (no longer a fork) |
| S-17 i18n/a11y/CSP | major | **ACCEPT (scoped)** — contract-shape-affecting parts land in v1 shapes; full policies staged | message refs (`{ id, default }`) on nav/titles, locale/direction/timezone in client context, CSP/nonce seam documented, a11y gate list added to plan; deeper policy work = implementation wave |
| S-18 quality/perf | major | **ACCEPT** — no end-to-end plugin frontend test kit or budgets existed | `./testing` host-fixture kit spec + per-plugin budget table added to plan gates + 05 §5 |
| S-19 Wave 0 | major | **ACCEPT** — contracts frozen before mechanism proofs is backwards | plan re-phased: **Wave 0 = five disposable proofs (P1–P5)**, Wave 1 re-sliced narrow, gateway its own reviewed wave |
| S-20 fork re-triage | major | **ACCEPT** — technical invariants removed from fork list | F4/F6 resolved by S-7/S-16; F2 expanded to full route-pattern/reserved-path collision rules; genuine policy forks retained (see plan.md revised F-table) |

Integration commit(s) follow this file; each doc carries a change note referencing the S-numbers
it absorbs.
