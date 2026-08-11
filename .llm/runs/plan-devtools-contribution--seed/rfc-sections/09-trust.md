## Trust, security, and the threat model

**Charter Q7.** This section is the RFC's strictest evidence surface. Every mitigation below is
labelled either *proven by `<gate>`* or **UNPROVEN**. **No gate named in this section exists at
baseline `2256a67bf`** — each is a slice deliverable. Therefore every security property asserted
here is, today, a **design commitment and an open risk**, not a claim of the system's current
behaviour. Nothing in this RFC may be quoted as "DevTools is isolated/safe/production-ready".

### D-1. Trust is graded by exposure, not by contributor

Every surveyed system that grades *contributors* — sandboxing, signing, per-contribution RBAC,
capability grammars — pays that cost for one antecedent: **untrusted third-party code in a
long-lived, RBAC-governed, production-data surface** (`research/m3-admin-consoles.md` separation
verdict; `research.md` F23). NetScript DevTools does not satisfy it. A DevTools contribution is a
workspace package whose *server* code the developer already runs with full permissions
(`research/p1-rfc-890-frontend-contrib.md` C9 — #890's T0 rationale), and whose scaffolder already
receives whole-filesystem write (T-2 below). A panel cannot gain what its own package already has.

So the contribution trust model stays a **single class — "installed workspace code"** — and the
entire security budget goes to boundaries that are real *regardless* of contributor trust:
filesystem containment, read-only default, browser-origin discipline, and production absence.

| Tier | Boundary | Posture |
| ---- | -------- | ------- |
| **DT0 — local dev (default)** | DevTools served only by the dev process, bound to loopback. | All contributions read-only; declared actions available. T0 inheritance holds for the *contribution* side (`p1` C9). What DT0 still defends is the **browser** boundary (INV-5) and the **filesystem** invariants (INV-1/INV-2) — those defend against mistakes and supply-chain drift, not only malice, and hold at every tier. |
| **DT1 — remote-exposed dev** (tunnel / LAN / codespace forward) | Same process, non-loopback reachability. | T0 is **not** inheritable: the audience is no longer provably the process owner (`p1` F10). Entry **requires** browser-token auth on Aspire's shipped model — frontend defaults to `BrowserToken`, `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=false` by default, with a sanctioned `{PublicUrl}/login?t={token}` automation path (`research/m4-aspire-scalar.md` F17-F19). If a token ever travels in a URL it uses the **fragment**, which does not reach servers, access logs, or `Referer` (`research/m1-nuxt-vite.md` F12). `inference`: DT1 is the only tier where authentication buys anything — at DT0 the OS user already owns the process. |
| **DT-none — production** | **There is no production tier.** | Absence is the control. Production operator needs belong to Surface 1 per #1446's decision sentence — "two distinct hosts and two distinct contribution surfaces" (`research.md` F3); production telemetry reading is Aspire's own dashboard behind its own auth (`m4` F17-F20). The upstream failure mode being declined is shipping devtools into production builds **with client auth disabled** (`m1` D4, F11 — `DTK0008`). |

**Read-only default and what escalates it.** Every host data-plane endpoint and every contribution
kind is read-only. Mutation is escalated **per contribution, never per tier**, and only when all
four hold:

1. the action is **declared** in the plugin's DevTools manifest block (statically auditable —
   Grafana's double-declaration pattern, `research/m2-tanstack-grafana.md` F12);
2. it is classified with the pre-existing in-repo vocabulary
   `ToolKind = 'read' | 'mutate' | 'meta'` (`packages/mcp/src/domain/tool-types.ts:3-26`;
   `research/r5-observability-boundary.md` F17-F18) — no new grammar is invented;
3. it is implemented as a call into **the same contract route or CLI generator the terminal uses**
   (#400's "one generator, two callers", `research.md` F8) and renders its CLI-equivalent line;
4. it is served only on a non-GET endpoint protected by INV-5.

A contribution declaring no actions gets **no mutating endpoint generated at all** — deny by
default, generated from contract metadata, with no wildcard forwarding.

**There is no generic command channel.** The named anti-precedent is TanStack's dev-server plugin,
which accepts an `install-devtools` event *from the panel* and installs an npm package on the
developer's machine, gated only on "dev server only" with no per-plugin permission concept
(`m2` F10; `research.md` F25). A diagnostics event bus becomes a privileged command channel the
first time anyone finds it convenient. Enumerated declared actions are the only escalation path.

```mermaid
flowchart LR
  P["contributed panel<br/>(workspace package)"] -->|GET, always allowed| R["host read endpoints"]
  P -.->|"non-GET: only if declared + ToolKind='mutate'"| A["enumerated action"]
  A -->|INV-5 origin + token| H["host handler"]
  H -->|"same generator/contract route as CLI"| G["CLI generator / oRPC route"]
  P -x|"no generic event->effect channel<br/>(TanStack install-devtools anti-precedent)"| G
```

### D-2. The two invariants that are non-negotiable

**Containment (INV-1).** Every filesystem target a contribution names MUST resolve strictly inside
the project root. The live primitive does not do this. Verified in-session at baseline,
`packages/cli/src/kernel/application/ui/registry.ts:277-284`:

```ts
function resolveTarget(projectRoot: string, target: string): string {
  for (const [prefix, directory] of TARGET_PREFIXES) {
    if (target.startsWith(prefix)) {
      return resolve(projectRoot, directory, target.slice(prefix.length));
    }
  }
  return isAbsolute(target) ? target : resolve(projectRoot, target);
}
```

There is **no containment assertion**: an absolute target passes straight through, and a relative
`../../x` resolves outside the root. Inert while every registry item is first-party; an
**arbitrary-write primitive** the moment any third party contributes one (`research.md` F19;
`research/r2-fresh-ui-pipeline.md` D3). INV-1 makes containment normative for *every* contribution
kind of *every* family that names a filesystem target — registry items, `scaffold.runtime.json`
`dir`/`registryPath`, scaffold outputs — enforced inside **one shared resolver helper**, never as a
call-site convention.

**Generator scoping (INV-2).** The plugin-authored registry-generator subprocess is spawned with
**bare** permission flags — `'--allow-read'` and `'--allow-write'` with no `=<path>` value — at
`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:416-417`.
In Deno a valueless permission flag grants the permission **globally**, so the subprocess receives
**whole-filesystem** read and write, not project-root scope. This corrects the stage-B corpus, which
said "project root": see **drift D-7**, which supersedes `research/r3-plugin-contribution-axes.md`
F10's scope wording. Mitigating fact, verified in the same argument list: **no `--allow-net`, no
`--allow-env`, no `--allow-run`** — so Deno's default-deny already blocks network exfiltration, env
reads, and sub-spawning on this path. Manifest `scaffolder.requiredPermissions` is advisory metadata
today and is never translated into spawn flags; INV-2 makes it enforced. In-repo precedent for
validating declared paths exists — `isSafeExportPath`,
`packages/plugin/src/protocol/manifest.ts:340-349` (`r3` F10).

### D-3. Threat model

Every row's mitigation is UNPROVEN at baseline; the column states the gate that would prove it.

| # | Threat | Mitigation | Status |
| - | ------ | ---------- | ------ |
| **T-1** | Arbitrary file write via a contribution's `target` (`registry.ts:283`; `r2` D3). | INV-1 containment in a shared resolver. | Threat evidence-backed. **UNPROVEN** until **G-1**; must land in the same slice as any contribution-install code path. |
| **T-2** | Whole-filesystem generator subprocess (`installed-runtime-registry-generator.ts:416-417`; **drift D-7**). | INV-2 scoped `--allow-read=`/`--allow-write=`; net/env/run stay denied. | Threat verified in-session. **UNPROVEN** until **G-2**. |
| **T-3** | Diagnostics channel becomes a privileged command channel (`m2` F10 `install-devtools`). | INV-3 declared-actions-only; manifest↔runtime field-by-field cross-check at registration (`m2` F20). | Threat evidence-backed upstream. **UNPROVEN** until **G-3**. |
| **T-4** | Cross-origin POST / DNS-rebinding against the loopback dev host. **The threat class is `inference`** — no corpus citation establishes it for this stack; carried as a recognized risk, not an evidenced attack. | INV-5 origin + per-process token header. | **UNPROVEN** until **G-4**. |
| **T-5** | DevTools reaches production. Upstream ships it with client auth disabled (`m1` D4, F11); in-repo, `/design` ships in scaffolded apps with **no dev-only gating found** — `unverified` whether it reaches production users (`research.md` open question 3; `r1` F13). One exclusion signal is untrustworthy: hosting providers set build command/mode inconsistently (`m2` F6-F7). | INV-4 two independent mechanisms. | Evidence-backed upstream, `unverified` in-repo. **UNPROVEN** until **G-5**. |
| **T-6** | Remote exposure without authentication (tunnel/LAN/codespace). | DT1 tier: refuse non-loopback bind unless browser-token auth is on (`m4` F17-F19); fragment transport for any URL-borne token (`m1` F12). | Design-only. **UNPROVEN** until **G-6**. Owner fork 2 below may replace it with a hard refusal. |
| **T-7** | Secret leakage through display or recording — request headers, credentials, the Aspire `Dashboard:Api:PrimaryApiKey` reaching the browser. | INV-7 redaction absolutes; the telemetry key stays server-side behind `TelemetryQueryPort` (`r5` F10-F11) — the browser never holds it. | **UNPROVEN** until **G-7**. *How the host obtains the auto-generated key at runtime is unresolved (`m4` OQ2) — `unverified`.* |
| **T-8** | One bad panel takes down the shell or the app being debugged. TanStack has no error boundary anywhere on its mount path (`m2` F11, marked inference there); #890 documents that an SSR render-time throw in a zone component fails the page response (`p1` C9 guarantee 4). | INV-6 per-contribution error boundary with **dev polarity** — loud error card, never silent `null` (`m2` F23 mechanism, inverted); host failure degrades to empty-list + logged error (`m2` F18). | Threat evidence-backed. **UNPROVEN** until **G-8**. |
| **T-9** | Identity collision silently swaps a contribution. Baseline: duplicate plugin identity collapses last-writer-wins on a lossy local name (`r3` F9); registry-item collision is silent last-wins at three layers and the winner **flips** under `--force` (`r2` F11). | INV-8 namespaced, version-suffixed ids; duplicate id within a family is a generate-time error (`m2` F13/F16/F22). | Shipped defect. **UNPROVEN** until **G-9**. |
| **T-10** | Half-written generated state misrepresents the system (integrity): per-target `Deno.writeTextFile` with no temp+rename, existence-only post-checks, walker registries leaking on `plugin remove` (`r3` F8; `research.md` F17). | Transactional staged → check → atomic swap. **Owned by the build-and-dev-loop section.** T6 records only the trust consequence: a diagnostics surface whose own registry can be half-written cannot be trusted to report drift. | Gate owned elsewhere. **UNPROVEN**. |

### D-4. Normative invariants and their gates

An invariant without its gate landed is **not claimable**. Note the meta-risk: `deno task
arch:check` gates 16 hand-listed roots of 36 live units and `arch:check:repo` has been
`DEBT_ACCEPTED` red since 2026-06-21 (`research.md` F12) — so any new root must be **added to
`deno.json`'s list** or the gate claim is decorative.

| # | Invariant | Gate |
| - | --------- | ---- |
| **INV-1** | **Containment.** Every filesystem target named by any contribution MUST resolve — after alias expansion and lexical normalization — strictly inside the project root. Absolute targets and `..`-escaping relatives are structured errors **before any write**. Enforced inside one shared resolver helper. | **G-1**: unit tests feeding `/etc/x`, `../../x`, `a/../../x`, `@ui/../../x`, and a symlink-escape case where representable, asserting rejection **with no write performed**; plus a fitness check (`.llm/tools/fitness/`, same shape as the existing DS gates, `r2` F9) asserting every write in the install pipeline flows through the helper. |
| **INV-2** | **Scoped subprocess permissions.** Plugin-owned generator subprocesses are spawned with path-scoped `--allow-read=`/`--allow-write=` derived from project root plus declared `requiredPermissions`; `--allow-net`/`--allow-env`/`--allow-run` stay absent unless declared and justified. Declared permissions become **enforced**, not advisory. | **G-2**: argv unit test asserting scoped values and **no bare allow flags**; e2e in which a generator writing outside its scope fails with a Deno permission error surfaced as that generator's failure. |
| **INV-3** | **Declared-actions-only mutation.** Mutating endpoints are generated only for manifest-declared, `mutate`-classified actions; runtime registration is cross-checked against the manifest field-by-field; undeclared mutation registration is a registration-time error. | **G-3**: registration test (runtime-without-manifest and manifest-without-runtime both rejected with a structured diagnostic); route-table test asserting no mutating route exists for an action-less contribution. |
| **INV-4** | **Production absence, twice over.** (a) the registration seam is never invoked outside dev; (b) DevTools packages/routes are excluded from build output. The two mechanisms MUST NOT share a signal. | **G-5**: production-build e2e asserting the mount 404s **and** no devtools module specifier appears in build output; unit test asserting the seam no-ops without dev conditions. Two assertions, one per mechanism — a single passing assertion is not a pass. |
| **INV-5** | **Mutating-endpoint origin discipline.** Every non-GET DevTools endpoint verifies `Origin`/`Host` against the bound address and requires a per-process token (generated at startup) in a custom header. **Cookies alone never authorize a mutation.** | **G-4**: handler tests — cross-origin POST without token → 403; same-origin with token → 200; GET never requires the token, so read paths stay friction-free. |
| **INV-6** | **Per-contribution failure containment.** Every panel renders inside an error boundary; a throw logs `plugin/<id> panel failed` with the component stack and renders a visible error card; host resolution failures degrade to empty-list + logged error, never a throw; a data-resolution failure never fails the page response. | **G-8**: browser-level test mounting a deliberately-throwing panel; assert siblings render, shell survives, error card present. |
| **INV-7** | **Redaction absolutes.** Anything DevTools records, streams, or renders from request/response machinery excludes header values, inputs, context objects, credentials, and source error causes — adopted verbatim from RFC-A (`research.md` S-14, rfc:1091-1110); **no debug flag relaxes it**. Cache partitions remain the one quotable green light ("intentionally visible in … developer tools", rfc:1117-1119). Secrets (Aspire API key, browser tokens) never enter generated files, registries, or client-delivered payloads. | **G-7**: serializer unit test — a request carrying `Authorization`/`x-api-key` yields panel payloads with those values absent; fitness check that generated DevTools registries contain no token/key material. |
| **INV-8** | **Identity is collision-checked and versioned.** Ids are namespaced `<plugin>/<name>/v<major>`; duplicate id within a family is a generate-time error naming both providers. | **G-9**: registry test on duplicate id; id-format validation test. |

**Auditability.** Action invocations log structured events joined by `netscript.correlation.id`
(`r5` F12) and render their CLI-equivalent line, so every mutation performed through DevTools is
reproducible in the terminal (#400 acceptance line 2, `research.md` F8). Whether that is sufficient,
or whether invocations must also reach #1446's audit/history stores, is **owner fork 4** below.

**Auth propagation is blocked, not designed around.** `createServiceClient` cannot send
`Authorization` or `x-api-key` today, even though `@netscript/service/auth` accepts both
(`research.md` F15), and bypassing the SDK is the duplication the charter forbids. Any
credential-bearing action therefore **sequences after RFC-A #1352/#1348**. This is a hard dependency
in the risk register.

### D-5. Declined, each with its cited antecedent

These are **closed decisions recorded for ratification**, not omissions. The antecedent is the
durable part — each is cheap to re-request if its antecedent ever becomes true.

| Declined | Antecedent that licenses the decline |
| -------- | ------------------------------------ |
| **Frontend sandboxing (VM / near-membrane / ShadowRealm)** | Grafana shipped its sandbox roughly a decade into its plugin ecosystem, opt-in per plugin id, public preview at 11.5, excluded for Angular and Grafana-signed plugins — retrofitted, and therefore never mandatory; it costs web-worker performance and layered stacktraces (`m2` F24). Directus's sandbox exists for untrusted marketplace code and even there **the default is full trust** (`m3` D-5/D-6). The antecedent — untrusted third-party code — is absent. |
| **Plugin signing / signature levels / unsigned-load gates** | Grafana's real capability gate is signing at load, which presupposes a marketplace and untrusted distribution (`m2` F25). NetScript has neither. |
| **Per-contribution RBAC** | RBAC-on-contribution correlates with "the console reads and mutates production business data", not with "is an admin UI" — only the two data-owning consoles carry it (Strapi `permissions` arrays, Directus App-Access policy flags; `m3` X-4, S-6, D-7). DevTools has no role model to gate against; DT1's single browser token is the entire audience model. |
| **A capability/permission grammar per extension** | Grafana — the most mature system surveyed — has none; its dial is load/no-load plus `limitPerPlugin` (`m2` F25, marked inference there from exhaustive schema listings). Inventing a grammar before an untrusted contributor exists is speculative design. NetScript keeps only the pre-existing two-value `ToolKind` classification (`r5` F17-F18). |
| **Manifest host-semver range as a load gate** | Directus requires `host` because extensions install out-of-tree (`m3` D-3); in-workspace contributions version-lock through one lockfile, so a gating range is ceremony. Record a `netscriptDevtoolsApi` range as manifest **data** for future out-of-tree use; do not gate on it. |
| **Runtime module federation / dynamic plugin loading** | Backstage's build-time model was expensive enough that Red Hat bolted on Scalprum/module-federation runtime loading (`m3` B-4/B-6) — but the property that made it expensive (plugin install = redeploy of a long-lived production app) does not exist for a dev process where restart is free (`m3` separation table, Lifetime row). |
| **#890's parked T1/T2 iframe sandbox trust tiers — closed here, not inherited** | #890 parked iframe trust tiers in the dashboard epic, i.e. handed the question here (`p1` F10). The answer is no, because **iframe ≠ sandbox** in shipped practice: Nuxt deliberately injects `__NUXT_DEVTOOLS__` into same-origin contributed iframes, granting live access to the running app, with no `sandbox` attribute — only an `allow` allowlist — and Vite DevTools' `custom-render` skips iframe isolation outright (`m1` D3, F13, F14; `research.md` F21). An iframe is retained **only** as an embedding device for a foreign-origin, self-authenticated surface (the Aspire dashboard behind its own BrowserToken), where what it buys is origin separation plus the upstream's own auth — never as a containment story for contributed code, and the host **never** injects a live app handle into a contributed frame. |
| **Production static-dump / build-mode DevTools output** | Vite DevTools' build mode pre-computes RPC dumps into the app build and disables client auth by construction (`DTK0008`; `m1` F10/F11/D4). The default must be **absence** (INV-4). |
| **A fat contributor-visible privileged RPC surface** | Nuxt's legacy `ServerFunctions`: ~40 methods spanning filesystem mutation, npm execution, and process restart on one interface (`m1` F22), since deprecated. Privileged operations stay behind enumerated declared actions (INV-3), never a god interface — which is also doctrine AP-3 (`research.md` F13). |

### D-6. Owner forks raised by this section

1. **Ratify the declines in D-5** as recorded decisions rather than omissions.
2. **DT1 in v1**: implement browser-token auth on the Aspire model now, or **hard-refuse
   non-loopback binds** in v1 and defer DT1 entirely (cheaper, strictly safer, less useful for
   codespace/tunnel users)? The invariant either way: never serve remote without auth.
3. **INV-2 retrofit scope**: the unscoped spawn is a **shipped** defect on the existing generator
   path (verified in-session, drift D-7). Fix it framework-wide in this RFC's wave, or scope INV-2 to
   the new DevTools family and file the retrofit as architecture debt?
4. **Auditability depth**: is correlation-id structured logging plus the rendered CLI-equivalent line
   sufficient for action invocations, or must they also write to #1446's audit/history stores —
   noting #1446 is unmerged and Surface-1-scoped (`research.md` F3)?
5. **`/design` retro-gating**: `/design` ships in scaffolded apps with no dev-only gating found and
   it is `unverified` whether it reaches production users (`research.md` open question 3). Does it
   get the same INV-4 two-mechanism treatment in this wave, or a separate issue?
6. **Credential-bearing actions**: accept the hard sequencing dependency on RFC-A #1352 (v1 actions
   limited to endpoints not requiring auth propagation), or pull #1348/#1352 forward?
