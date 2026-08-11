# T6 — Trust model (charter Q7)

> **HISTORICAL EVIDENCE — frozen at authoring time.** Where this pack disagrees with
> `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, **the RFC wins**. Notably the package
> boundary was later corrected from `A2 plugin-devtools-core` to **A1 `packages/devtools-core` +
> A6 CLI emission + A5 plugin**, and identity/ordering were unified on `(mountId, id, apiMajor)`
> and anchors-then-`(order, mountId, id)`. See `RFC-AUTHORITY.md` and `drift.md`.


Stage-D deep-dive proposal, run `plan-devtools-contribution--seed`, baseline `main` @ `2256a67bf`.
Planning-only; no source or GitHub state was mutated. Citation convention: corpus files are
`research/<file>` (which carry their own `path:line` or saved-artifact cites); claims verified
directly against source in this session say **verified in-session** with `path:line`. Claims that
are neither cited nor gate-backed are marked `inference` or `unverified` — per the charter, an
unbackable security claim is written as an open risk, not asserted.

## Recommendation

**Trust is graded by exposure, not by contributor identity.** Every surveyed system that grades
contributors — signing, sandboxing, per-contribution RBAC, capability grammars — pays that cost for
one antecedent NetScript DevTools does not satisfy: *untrusted third-party code in a long-lived,
RBAC-governed, production-data surface* (`research/m3-admin-consoles.md`, separation verdict).
DevTools contributions are workspace packages whose server code the developer already runs with
full permissions (`research/p1-rfc-890-frontend-contrib.md` C9: #890's T0 rationale). So the RFC
defines three **exposure tiers** (DT0 local-dev default / DT1 remote-dev / DT-none production),
keeps the contribution trust model at a single class ("installed workspace code"), and spends its
entire security budget on the four boundaries that are real regardless of contributor trust:

1. **Filesystem containment** — the `resolveTarget` arbitrary-write primitive (verified in-session,
   `packages/cli/src/kernel/application/ui/registry.ts:277-284`) becomes a normative invariant with
   a test (INV-1), generalized to every contribution kind that names a filesystem target, and the
   registry-generator subprocess loses its unscoped `--allow-read --allow-write` grant (INV-2).
2. **Read-only default** — every host data-plane endpoint and every contribution kind is read-only;
   mutation is a separately declared, enumerated **action** that must route through the same
   generator/contract route the CLI uses (#400's "one generator, two callers",
   `research.md` F8) and is classified with the in-repo `ToolKind = 'read' | 'mutate' | 'meta'`
   vocabulary (`research/r5-observability-boundary.md` F17-18,
   `packages/mcp/src/domain/tool-types.ts:3-26`). No generic command/eval channel exists —
   TanStack's panel-triggered `install-devtools` npm install is the named anti-precedent
   (`research/m2-tanstack-grafana.md` F10).
3. **Production absence** — DevTools is *absent* from production via **two independent mechanisms**
   (registration seam that never runs outside dev + build-output exclusion, INV-4), stricter than
   upstream, which ships devtools into production builds **with client auth disabled**
   (`research/m1-nuxt-vite.md` D4, F11 — `DTK0008`). Production diagnostics belong to Surface 1
   per #1446's decision sentence ("two distinct hosts and two distinct contribution surfaces",
   `research.md` F3); there is **no production-enablement path for DevTools**, by design.
4. **Two tiny keeps from the market** — a per-contribution error boundary (Grafana logs loudly;
   TanStack's absence of one is its most obvious gap, `research/m2-tanstack-grafana.md` F23, F11)
   and the two-mechanism production exclusion above (TanStack distrusted one signal because hosting
   providers set build command/mode inconsistently, `m2` F6-F7).

No capability/permission grammar is introduced: Grafana — the most mature system surveyed — has
none; its dial is load/no-load (`m2` F25, marked inference there from exhaustive schema listings).
NetScript's equivalent dial is: a contribution loads or it doesn't, plus the two-value
read/mutate classification that already exists in-repo. Everything beyond that is declined below,
with the antecedent that failed.

## Threat model

Legend: **proven-by-gate** names the executable gate the RFC must ship (none exist at baseline —
each is a named slice deliverable, so every row is UNPROVEN *today*; the column states what proves
it and whether the threat itself is evidence-backed or inferred).

| # | Threat | Mitigation | Proven by / status |
| - | ------ | ---------- | ------------------ |
| T-1 | **Arbitrary file write via contribution target.** A contributed registry item with `target: '/etc/x'` or `'../../x'` writes outside the project root — `resolveTarget` passes absolute targets through and resolves escaping relatives with no containment assertion (verified in-session, `registry.ts:283`; `research/r2-fresh-ui-pipeline.md` D3). Inert while first-party; an arbitrary-write primitive the moment any third party contributes. | INV-1 containment invariant + shared resolver assertion, applied to *every* kind naming a filesystem target (registry items, `scaffold.runtime.json` `dir`/`registryPath` targets, scaffold outputs). | GATE G-1 (unit + fitness test, below). Threat evidence-backed; mitigation UNPROVEN until G-1 lands — must land in the same slice as any contribution-install code path. |
| T-2 | **Unscoped generator subprocess.** The registry-generator subprocess is spawned `deno run --config <root>/deno.json --allow-read --allow-write <generator>` — bare flags, i.e. **whole-filesystem** read/write, not merely project root (verified in-session, `installed-runtime-registry-generator.ts:412-426`; `research/r3-plugin-contribution-axes.md` F10). Declared `scaffolder.requiredPermissions` are advisory metadata, never translated to spawn flags. Mitigating fact, also verified in-session: the spawn passes **no** `--allow-net`, `--allow-env`, or `--allow-run`, so Deno's default-deny already blocks network exfiltration, env reads, and sub-spawning on this path. | INV-2: derive scoped `--allow-read=<projectRoot>` / `--allow-write=<projectRoot>/.netscript/generated,...` (plus declared scopes) from the manifest; keep net/env/run denied. In-repo precedent for validating declared paths exists: `isSafeExportPath` (`r3` F10, `protocol/manifest.ts:340-349`). | GATE G-2. Threat evidence-backed; UNPROVEN until G-2 lands. |
| T-3 | **Diagnostics channel becomes a privileged command channel.** TanStack's dev-server plugin accepts an `install-devtools` event *from the panel* and installs an npm package on the dev machine, gated only on "dev server only" (`m2` F10, drift row "a devtools event channel is read-only telemetry — actual: it isn't"). | No generic event-to-effect channel. Mutations exist only as enumerated, manifest-declared actions with `ToolKind` classification, cross-checked manifest↔runtime at registration (Grafana's field-by-field meta check, `m2` F20), each routed through the same contract route/CLI generator as the terminal (#400 line 2) and rendering its CLI-equivalent line. | GATE G-3. Threat evidence-backed (upstream precedent); UNPROVEN until G-3 lands. |
| T-4 | **Cross-origin requests against loopback mutating endpoints** (CSRF; DNS-rebinding against the dev host). A hostile web page in the same browser can POST to `localhost`. *The threat class is `inference` — no corpus citation establishes it for this stack; it is carried as a recognized risk, not an evidenced attack.* | INV-5: every non-GET DevTools endpoint requires a non-cookie token header (per-process, generated at startup) and `Origin`/`Host` verification; failure is 403 + structured log. | GATE G-4. Threat inferred; mitigation UNPROVEN until G-4 lands. |
| T-5 | **DevTools reaches production.** Upstream ships devtools into production builds with client auth disabled (`m1` D4, F11); in-repo, `/design` ships in scaffolded apps with **no dev-only gating found** (`research.md` open question 3, `r1` F13 — *unverified whether it actually reaches production users*). One exclusion signal is not trustworthy: hosting providers set build command/mode inconsistently (`m2` F7, TanStack's own inline comment). | INV-4: two independent exclusion mechanisms — dev-only registration seam (the `devtools.setup`-style hook that is simply never invoked outside dev, `m1` F2) **and** build-output exclusion. No auth-gated-in-prod fallback: absent, not locked. | GATE G-5 (production-build e2e). Threat evidence-backed upstream, `unverified` in-repo; UNPROVEN until G-5 lands. |
| T-6 | **Remote exposure without authentication** (tunnel, LAN, codespace port-forward). | DT1 tier: refuse to serve DevTools on a non-loopback bind unless browser-token auth is enabled — Aspire's shipped model: frontend defaults to `BrowserToken`, `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=false` by default, with a sanctioned `{PublicUrl}/login?t={token}` automation path (`research/m4-aspire-scalar.md` F17-19). If a token ever travels in a URL, use the fragment transport — fragments don't reach servers, access logs, or `Referer` (`m1` F12, Vite DevTools' documented rationale). | GATE G-6. Design-only; UNPROVEN. Owner fork: v1 may instead *hard-refuse* non-loopback binds and defer token auth (see open questions). |
| T-7 | **Secret leakage through diagnostics display or recording** — request headers, credentials, the Aspire `Dashboard:Api:PrimaryApiKey` reaching the browser. | INV-7: adopt RFC-A's redaction absolutes verbatim — header values, input, context, credentials, and source error causes MUST NOT be recorded, and debug mode does not relax this (`research.md` S-14, rfc:1091-1110); cache partitions are the one quotable green light ("intentionally visible in … developer tools", rfc:1117-1119). The Aspire telemetry API key stays server-side: the DevTools host proxies reads through `TelemetryQueryPort` (`r5` F10-11); the browser never holds the key. *How the host obtains the auto-generated key at runtime is an open question (`m4` OQ2) — `unverified`.* | GATE G-7. Mitigation UNPROVEN until G-7 lands; key-acquisition path unresolved. |
| T-8 | **One bad panel takes down the shell or the app being debugged.** TanStack has no error boundary anywhere on its mount path (`m2` F11, inference from the complete mount path); a throwing panel kills the tree. #890 additionally documents that an SSR render-time throw in a zone component fails the page response (`p1` C9 guarantee 4). | INV-6: per-contribution error boundary — Grafana's mechanism (`m2` F23) with inverted polarity: dev *is* the audience, so render a loud error card, never silent `null`; host-level failure mode is empty-list + logged error, never throw (`m2` F18). Data resolution runs host-side in try/catch before render (#890 C9 guarantee 1). | GATE G-8. Threat evidence-backed; UNPROVEN until G-8 lands. |
| T-9 | **Identity collision silently swaps a contribution.** Baseline: duplicate plugin identity collapses silently — `loadRegisteredPlugins` last-writer-wins on a lossy local name, so `@a/plugin-ai` and `@b/plugin-ai` collide (`r3` F9); registry-item name collision is silent last-wins at three layers, and the winner **flips** with `--force` (`r2` F11). | Duplicate contribution id within a family is a generate-time **error**, never a silent override (#890 C6 row; Grafana's singleton-slot first-registration-wins rejection, `m2` F22). Namespaced + version-suffixed ids (`<plugin>/<panel>/v1`, `m2` F13/F16) make identity auditable. | GATE G-9. Threat evidence-backed (shipped defect); UNPROVEN until G-9 lands. |
| T-10 | **Stale or partially-written generated state misrepresents the system** (integrity, not confidentiality): per-target `Deno.writeTextFile` with no temp+rename, existence-only post-checks, walker registries leaking on `plugin remove` (`r3` F8; `research.md` F17). | #890's transactional staged → `deno check` → atomic-swap replace-set — argued from this shipped defect class, not from deference to #890 (`research.md` S-16). Owned by **T7-build-dev**; T6 records the trust consequence: a diagnostics surface whose own registry can be half-written cannot be trusted to report drift. | Gate owned by T7. UNPROVEN. |

## Trust tiers

#890 parked "T1/T2 iframe sandbox trust tiers" in the dashboard epic — i.e. handed the question
here (`p1` F10). The answer this RFC gives is **not** iframe tiers: the market evidence is that
iframe ≠ sandbox — Nuxt deliberately injects `__NUXT_DEVTOOLS__` into same-origin contributed
iframes, granting live access to the running app, with no `sandbox` attribute documented, and Vite
DevTools' `custom-render` explicitly skips iframe isolation (`m1` D3, F13, F14). An iframe buys
**origin separation for embedding an already-authenticated foreign surface** (e.g. the Aspire
dashboard behind its own BrowserToken), not a containment boundary for contributed code. The RFC
therefore closes #890's parked T1/T2 explicitly (see Declines) and replaces contributor-graded
tiers with **exposure-graded** tiers:

| Tier | Boundary | Posture |
| ---- | -------- | ------- |
| **DT0 — local dev (default)** | DevTools host served only by the dev process, bound to loopback. | #890's T0 rationale holds and is inherited *for the contribution side*: installed plugins already run server code with full permissions (`p1` C9), and their scaffolders already run with whole-filesystem write (T-2) — a panel cannot gain what its package doesn't already have. What DT0 still defends: the browser boundary (INV-5, T-4) and the filesystem invariants (INV-1/2), which hold at every tier because they defend against *mistakes and supply-chain drift*, not just malice. All read-only; actions available. |
| **DT1 — remote-exposed dev** | Same process, non-loopback reachability (tunnel/LAN/codespace). | T0 is **not inheritable** here (`p1` F10, open question 4): the audience is no longer provably the process owner. Entry requires browser-token auth on the Aspire model (T-6). Actions remain available only after token auth; the token is per-session, never persisted into generated files. `inference`: DT1 is the *only* tier where authentication buys anything — at DT0 the OS user already owns the process. |
| **DT-none — production** | There is no production tier. | DevTools is absent by INV-4's two mechanisms. Production operator needs are Surface 1's mandate, not DevTools' (#1446 decision sentence, `research.md` F3); production telemetry reading is Aspire's dashboard behind its own auth (`m4` F17-20). Declining a production mode is itself the security control — the upstream failure mode is shipping it with auth disabled (`m1` D4/F11). |

**Escalation rule (read → write).** The read-only default is escalated per-contribution, never
per-tier: an action must be (a) declared in the plugin's DevTools manifest block (statically
auditable, Grafana's double-declaration pattern `m2` F12), (b) classified `mutate` in `ToolKind`
vocabulary, (c) implemented as a call into the same contract route or CLI scaffolder the terminal
uses, rendering its CLI-equivalent line (#400 lines 1-2, `research.md` F8), and (d) served only on
non-GET endpoints protected by INV-5. A contribution with no declared actions gets no mutating
endpoint generated at all — deny-by-default, generated from contract metadata, no wildcard
forwarding (the reusable *principle* of #890's gateway, `p1` F14 item 5, without importing its
app-family prefix or its #934 coupling — whether DevTools may share the #934 gateway itself is
owner fork 6, `SYNTHESIS-NOTES.md` fork list).

**Auth propagation caveat.** A DevTools panel that must present a credential to a NetScript
service is blocked on RFC-A/#1348: `createServiceClient` cannot send `Authorization` or `x-api-key`
today, and bypassing the SDK is the duplication the charter forbids (`research.md` F15). Any
credential-bearing action therefore sequences after #1352 (`SYNTHESIS-NOTES.md` S-14). This is a
hard dependency, recorded in the risk register, not designed around.

## Normative invariants

Each invariant names its test. Per the charter's bar, an invariant without its gate landed is
**not claimable** — the gates are slice deliverables that must land with (or before) the code
paths they protect, and `deno.json`'s `arch:check` root list must gain the new roots or the gate
claim is decorative (`research.md` F12).

| # | Invariant | Test / gate |
| - | --------- | ----------- |
| **INV-1** | **Containment.** Every filesystem target named by any DevTools contribution (and, generalized, by any contribution kind of any family) MUST resolve — after alias expansion and lexical normalization — to a path strictly contained in the project root. Absolute targets and `..`-escaping relatives are structured errors *before any write*. Enforcement is a single shared resolver helper with the assertion inside it, not a convention at call sites. | **G-1**: unit tests feeding `/etc/x`, `../../x`, `a/../../x`, `@ui/../../x`, and a symlink-escape case where representable, asserting rejection with no write performed; plus a fitness check asserting every write in the install pipeline flows through the helper (grep-style fitness test in `.llm/tools/fitness/`, same shape as the existing DS gates, `r2` F9). |
| **INV-2** | **Scoped subprocess permissions.** Any plugin-owned generator subprocess is spawned with path-scoped `--allow-read`/`--allow-write` derived from project root + the manifest's declared `requiredPermissions`; `--allow-net`/`--allow-env`/`--allow-run` remain absent unless declared and justified. Declared permissions become enforced, not advisory (fixes `r3` F10/D-7). | **G-2**: unit test asserting the composed spawn argv contains scoped values and no bare allow flags; e2e test in which a generator attempting a write outside its scope fails with a Deno permission error and the host reports it as that generator's failure. |
| **INV-3** | **Declared-actions-only mutation.** The host generates mutating endpoints only for manifest-declared, `mutate`-classified actions; runtime registration is cross-checked against the manifest field-by-field; undeclared mutation registration is a registration-time error. | **G-3**: registration test — an action present at runtime but absent from the manifest (and vice versa) is rejected with a structured diagnostic; route-table test asserting no mutating route exists for a contribution without declared actions. |
| **INV-4** | **Production absence, twice over.** (a) The DevTools registration seam is never invoked outside dev mode; (b) DevTools packages/routes are excluded from production build output. The two mechanisms MUST NOT share a single signal. | **G-5**: production-build e2e asserting the DevTools mount 404s and no devtools module specifier appears in the build output; unit test asserting the registration seam no-ops when dev conditions are absent. (Two assertions, one per mechanism — a single passing assertion is not a pass.) |
| **INV-5** | **Mutating-endpoint origin discipline.** Every non-GET DevTools endpoint verifies `Origin`/`Host` against the bound address and requires a per-process token in a custom header; cookies alone never authorize a mutation. | **G-4**: handler tests — cross-origin POST without token → 403; same-origin with token → 200; GET never requires the token (read paths stay friction-free). |
| **INV-6** | **Per-contribution failure containment.** Every contributed panel renders inside an error boundary; a throw logs `plugin/<id> panel failed` with the component stack and renders a visible error card (dev polarity); host resolution failures degrade to empty-list + logged error, never a throw; a data-resolution failure never fails the page response. | **G-8**: mount a deliberately-throwing panel in a browser-level test (SCOPE-frontend overlay gates, `research.md` F12 corollary); assert sibling panels render, the shell survives, and the error card is present. |
| **INV-7** | **Redaction absolutes.** Anything DevTools records, streams, or renders from request/response machinery excludes header values, inputs, context objects, credentials, and source error causes (RFC-A's rule adopted verbatim); no debug flag relaxes it. Secrets (Aspire API key, browser tokens) never enter generated files, registries, or client-delivered payloads. | **G-7**: serializer unit test — a request carrying `Authorization`/`x-api-key` produces panel payloads with those values absent; grep-style fitness check that generated DevTools registries contain no token/key material patterns. |
| **INV-8** | **Identity is collision-checked and versioned.** Contribution ids are namespaced `<plugin>/<name>/v<major>`; duplicate id within a family is a generate-time error; version-major lives in the id string (`m2` F16). | **G-9**: registry test — two contributions with the same id fail generation naming both providers; id-format validation test. |

## Deliberately declined, with cited antecedents

Each decline is recommended **explicitly** for owner ratification (fork 23,
`SYNTHESIS-NOTES.md`), because each is easy to re-request later and the antecedent evidence is the
durable part of the decision.

| Declined | Antecedent that licenses the decline |
| -------- | ------------------------------------ |
| **Frontend sandboxing (VM / near-membrane / ShadowRealm)** | Grafana shipped its sandbox ~a decade into the plugin ecosystem, opt-in per plugin id, public preview at 11.5, excluded for Angular and Grafana-signed plugins — retrofitted, and being retrofitted it could not be made mandatory; it costs web-worker performance and layered stacktraces (`m2` F24). Directus's sandbox exists for untrusted marketplace code and even there **default is full trust** (`m3` D-5/D-6). The antecedent — untrusted third-party code — is absent: DevTools contributions are workspace packages already imported by the dev process. |
| **Plugin signing / signature levels / unsigned-load gates** | Grafana's actual capability gate is signing at load, which presupposes a marketplace and untrusted distribution (`m2` F25). NetScript has neither. |
| **Per-contribution RBAC** | RBAC-on-contribution correlates with "the console reads and mutates production business data", not with "is an admin UI" — only the two data-owning consoles carry it (Strapi `permissions` arrays, Directus App-Access policy flags; `m3` X-4, S-6, D-7). DevTools has no role model to gate against; DT1's single browser token is the whole audience model. |
| **A capability/permission grammar per extension** | Grafana does not have one — the dial is load/no-load plus `limitPerPlugin` (`m2` F25, inference from exhaustive schema listings). Inventing one before an untrusted contributor exists is speculative design. NetScript keeps only the pre-existing two-value `ToolKind` read/mutate classification (`r5` F17-18). |
| **Manifest host semver range as a load gate** | Directus requires `host` because extensions install out-of-tree (`m3` D-3); in-workspace contributions version-lock through one lockfile, so a gating range is ceremony (`m3` separation table). Record a `netscriptDevtoolsApi` range as manifest *data* for future out-of-tree use; do not gate on it (`m2` adapt table). |
| **Runtime module federation / dynamic plugin loading** | Backstage's build-time model was expensive enough that Red Hat bolted on Scalprum/module-federation runtime loading (`m3` B-4/B-5/B-6) — but the property that made it expensive (plugin install = redeploy of a long-lived production app) does not exist for a dev process where restart is free (`m3` separation table, Lifetime row). |
| **#890's parked T1/T2 iframe sandbox tiers — closed, not inherited** | iframe ≠ sandbox in shipped practice: Nuxt injects live app access into same-origin contributed iframes; no `sandbox` attribute, only an `allow` allowlist; `custom-render` skips isolation outright (`m1` D3/F13/F14). An iframe is retained only as an *embedding* device for foreign-origin, self-authenticated surfaces (Aspire dashboard), where what it buys is origin separation + the upstream's own auth — never as a containment story for contributed code, and the host never injects a live app handle into a contributed frame (the `__NUXT_DEVTOOLS__` anti-precedent). |
| **Production static-dump / build-mode DevTools output** | Vite DevTools' build mode pre-computes RPC dumps into the app build and **disables client auth by construction** (`DTK0008`; `m1` F10/F11/D4). The default must be absence (INV-4); if an offline dump is ever wanted, the `dump` design is the prior art, but it is out of scope here. |
| **A fat contributor-visible privileged RPC surface** | Nuxt's legacy `ServerFunctions`: ~40 methods spanning filesystem mutation, npm execution, and process restart on one interface (`m1` F22) — deprecated along with the rest of Nuxt's bespoke stack. Privileged operations stay behind enumerated declared actions (INV-3), never a shared god-interface. |

## Open questions for the owner

1. **Ratify the declines** (table above) as recorded decisions, not omissions — each is cheap to
   re-request and the RFC should be able to point at the ratification.
2. **DT1 scope for v1**: implement browser-token auth on the Aspire model now, or hard-refuse
   non-loopback binds in v1 and defer DT1 entirely (cheaper, strictly safer, less useful for
   codespace/tunnel users)? The invariant either way: never serve remote without auth.
3. **INV-2 retrofit scope**: the unscoped `--allow-read --allow-write` spawn is a *shipped* defect
   on the existing generator path (verified in-session). Fix it framework-wide in this RFC's wave,
   or scope INV-2 to the new DevTools family only and file the retrofit as debt?
4. **Auditability depth for actions**: is structured logging with `netscript.correlation.id`
   (`r5` F12) plus the rendered CLI-equivalent line sufficient, or must DevTools action invocations
   also write to #1446's audit/history stores (`research.md` F3) — noting #1446 is unmerged and
   Surface-1-scoped?
5. **`/design` retro-gating**: `/design` ships in scaffolded apps with no dev-only gating found
   (`research.md` open question 3, *unverified* whether it reaches production users). Does it get
   the same INV-4 two-mechanism treatment in this wave, or a separate issue?
6. **Credential-bearing actions**: accept the hard sequencing dependency on RFC-A #1352
   (`research.md` F15) — i.e. v1 actions are limited to endpoints not requiring auth propagation —
   or pull #1348/#1352 forward?

## Sources

- `research/m3-admin-consoles.md` — separation verdict; Directus sandbox D-5/D-6; RBAC X-4/S-6;
  host-range D-3; Backstage cost B-4/B-6 (fetch log under `research/sources/`).
- `research/m2-tanstack-grafana.md` — error boundary F23/F11; two-mechanism exclusion F6/F7;
  `install-devtools` F10; sandbox history F24; signing/capability absence F25; validation F12/F19/
  F20; ids F13/F16; failure modes F18; collision F22 (saved artifacts under
  `research/sources/{tanstack,grafana}/`).
- `research/m1-nuxt-vite.md` — prod-with-auth-disabled D4/F10/F11; iframe non-isolation D3/F13/F14;
  remote token + fragment transport F12; `setup(ctx)` dev-only seam F2; god-interface F22.
- `research/m4-aspire-scalar.md` — BrowserToken default, `login?t=` automation path, anonymous-off
  default, telemetry API key F17-F20; open questions OQ2/OQ4.
- `research/r2-fresh-ui-pipeline.md` — `resolveTarget` D3; collision flip F11.
- `research/r3-plugin-contribution-axes.md` — unenforced permissions F10; identity collapse F9;
  non-transactional writes F8; `isSafeExportPath` precedent.
- `research/r5-observability-boundary.md` — `TelemetryQueryPort` F10-11; `ToolKind` F17-18;
  correlation id F12.
- `research/p1-rfc-890-frontend-contrib.md` — T0 rationale + T1/T2 parking C9/F10; gateway
  principle F14; SSR containment C9.
- `research.md` + `research/SYNTHESIS-NOTES.md` — F3 (#1446 decision sentence), F8 (#400 acceptance
  lines), F12 (`arch:check` coverage), F15 (SDK auth block), S-14 (RFC-A redaction, rfc:1091-1119),
  S-16, forks 5/6/23.
- **Verified in-session** at baseline `2256a67bf`:
  `packages/cli/src/kernel/application/ui/registry.ts:277-284` (`resolveTarget` pass-through);
  `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:412-426`
  (bare `--allow-read --allow-write`, no `--allow-net`/`--allow-env`/`--allow-run`, error-capture
  and `finally` cleanup at `:427-444`).
