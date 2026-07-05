# Topic E — Deno-desktop + unified single-process deployment — DESIGN PROPOSAL

**Author:** Opus 4.8 deep-dive agent (Stage D). **Effort:** high. **Status:** design proposal for
Fable Stage-E lock → F1 adversarial → G PLAN-EVAL. Planning only; no framework code, no mutations.

**Locked design headline:** the true-single-process desktop tier is unblocked and much smaller than
the topic-E spec framed it, because the load-bearing server half already ships. The whole feature
reduces to **one additive SDK adapter** (`createInProcessClientLink` over the shipped
`ServiceApp.fetch()` seam) + a **link-mode switch** in `createServiceClient` + a **composition-root
relocation** of the tursodb single writer into the desktop process + the **#375 desktop generator
app-type** + **`deno desktop` packaging/update-server**. The "172a-2 service-base-seam" precursor in
the spec is a **misattribution** (drift E1, confirmed below); strike it.

---

## 0. Evidence base (what this design is grounded in)

- `analysis/E-desktop/sdk-link-mode-and-service-seam.md` — the decision-critical file; verified
  against source below.
- Source (read in full this pass): `packages/sdk/src/client/service-client.ts`,
  `packages/sdk/src/client/http-client-link.ts`, `packages/sdk/src/ports/client-link-factory.ts`,
  `packages/sdk/src/ports/service-client.ts`, `packages/service/mod.ts`,
  `packages/service/src/types.ts` (`ServiceApp.fetch(request)` confirmed at line 14–20),
  `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` (app-type
  generator: `app`/`tauri`/`task` branches — desktop is a 4th branch), `.../helpers/types.ts`.
- `analysis/E-desktop/eis-chat-desktop-shell-options.md`, `offline-first-surface.md`,
  `issue-graph-deployment-epic.md`; `research/E-desktop/{deno-desktop-full-surface,
  turso-sync-offline-first,rfc14-nitro-packaging-prior-art}.md`; `context/E-desktop/*`.
- eis-chat `docs/DESKTOP-SHELL.md` (the completed spike; option (b) shipped in prod, PR #125/#136).
- `drift.md` E1 (172a-2 misattribution), E2 (#327 WATCH placement).

I **confirm** the Stage-C E scope correction and drift E1/E2 with direct source evidence, and add
four concrete refinements Stage C did not have: (1) the in-process link should *reuse oRPC's
`RPCLink`* rather than hand-roll `ClientLinkPort.call`; (2) option (c) **does not** need the
native-addon-in-VFS spike (that risk is option (a)-only); (3) an **in-process service registry**
gives HTTP↔in-process discovery symmetry so generated call-sites are byte-identical across web and
desktop builds; (4) push-back on folding **#349** scope into the desktop tier (three distinct
"unified" senses — keep it a co-located WATCH sibling, do not merge its serverless scope).

---

## 1. The single-process seam design

### 1.1 What already ships (server half — confirmed)

`@netscript/service` `build()` returns a non-listening `ServiceApp`:

```ts
// packages/service/src/types.ts (verbatim)
export interface ServiceApp {
  fetch(request: Request): Response | Promise<Response>;      // <- the in-process mount point
  request(input: Request | string | URL, init?: RequestInit): Response | Promise<Response>;
}
```

`mod.ts` docstring states this is the **"RFC 14 unified-platform seam … for callers that mount
service apps into another host."** `serve()` wraps the same app in a `Deno.serve()` listener; that
listener path is the only one used in production today. **Every byte left of "call `app.fetch()`"
already exists.** This is the finding that collapses option (c)'s cost.

### 1.2 What is missing (client half — one file)

`createServiceClient` is hardwired to `createHttpClientLink`, which builds an oRPC
`RPCLink` (`@orpc/client/fetch`) whose `fetch:` closure calls `globalThis.fetch` — always a real
loopback round-trip even to `127.0.0.1`. The abstraction `createORPCClient(link)` consumes is
`ClientLinkPort` (`packages/sdk/src/ports/client-link-factory.ts`) — **any** conforming link works.

**Key design refinement over Stage C:** do **not** hand-implement `ClientLinkPort.call(path, input,
options)`. That would mean re-implementing oRPC's RPC codec (path→method inference, body encoding,
response decoding) — a reinvention that violates wrap-don't-reinvent (A7) and would drift from the
HTTP wire format. Instead, **reuse the exact same `RPCLink` as the HTTP link, substituting only its
`fetch` transport closure.** The HTTP link already proves `RPCLink` returns a `ClientLinkPort`-shaped
object (it is cast to one at `http-client-link.ts:115`). One knob changes: `globalThis.fetch(url)` →
`app.fetch(request)`.

### 1.3 New file: `packages/sdk/src/client/in-process-client-link.ts`

```ts
/** In-process transport adapter for service clients (RFC-14 unified single-process mount). */
import { RPCLink } from '@orpc/client/fetch';
import { /* same plugins as http-client-link */ } from '@orpc/client/plugins';
import { inferRPCMethodFromContractRouter } from '@orpc/contract';
import type { ServiceApp } from '@netscript/service';
import type { ClientLinkPort } from '../ports/client-link-factory.ts';
import type { ContractLike, ServiceClientContext } from '../ports/service-client.ts';

export interface InProcessClientLinkOptions<TContract extends ContractLike> {
  contract: TContract;
  app: ServiceApp;                 // the built (non-listening) service app
  pathSegment: string;
  apiPath: string;                 // '/api/rpc'
  apiVersion: string;              // 'v1'
  propagateTraceContext: boolean;
  getTraceHeaders: () => Record<string, string>;
}

/** Synthetic loopback origin. Hono routes on pathname only; the authority is irrelevant. */
const IN_PROCESS_ORIGIN = 'http://netscript.in-process';

export function createInProcessClientLink<TContract extends ContractLike>(
  { contract, app, pathSegment, apiPath, apiVersion, propagateTraceContext, getTraceHeaders }:
    InProcessClientLinkOptions<TContract>,
): ClientLinkPort<ServiceClientContext> {
  const link: unknown = new RPCLink({
    // IDENTICAL pathname to the HTTP link → the ServiceApp's mounted RPC route matches.
    url: () => `${IN_PROCESS_ORIGIN}${apiPath}/${apiVersion}/${pathSegment}`,
    method: inferRPCMethodFromContractRouter(contract as never),
    headers: (/* same trace-propagation logic as http-client-link */) => ({ /* … */ }),
    plugins: [ /* retry:0 + dedupe, same as HTTP for parity */ ],
    // THE ONLY SUBSTANTIVE DIFFERENCE: route into the mounted app, no network hop.
    fetch: (request, init) => app.fetch(new Request(request, init)),
  });
  return link as ClientLinkPort<ServiceClientContext>;
}
```

Why this is correct and safe:
- **Wire parity:** identical serialization path as HTTP (same `RPCLink`, same `apiPath/version/
  segment` pathname) → in-process and HTTP behave identically; no divergent code path to test twice.
- **Trace propagation still works:** the same `getTraceHeaders()`/`traceHeaders` context logic runs;
  the mounted app reads W3C headers off the `Request` exactly as it does over HTTP. Telemetry is
  preserved in single-process mode (important for the dashboard/telemetry dev story).
- **No new upstream dependency:** `RPCLink`, plugins, and `inferRPCMethodFromContractRouter` are
  already imported by the HTTP link.
- **`new Request(request, init)`** normalizes the oRPC-provided request+init into one Web `Request`
  that Hono's `.fetch` accepts; body/method/headers are preserved.

### 1.4 Link-mode selection in `createServiceClient`

Add a **discriminated `transport`** to `CreateServiceClientOptions` (back-compat: default is HTTP,
so every existing caller is untouched):

```ts
// packages/sdk/src/ports/service-client.ts — add
export type ServiceClientTransport =
  | { readonly mode?: 'http' }                                  // default; existing behavior
  | { readonly mode: 'in-process'; readonly app?: ServiceApp }; // app optional → registry-resolved

export interface CreateServiceClientOptions<TContract extends ContractLike> {
  /* …existing… */
  readonly transport?: ServiceClientTransport;
}
```

```ts
// packages/sdk/src/client/service-client.ts — branch on transport
const pathSegment = routerName ?? serviceName;
const link = transport?.mode === 'in-process'
  ? createInProcessClientLink({
      contract, pathSegment, apiPath, apiVersion, propagateTraceContext, getTraceHeaders,
      app: transport.app ?? resolveInProcessService(serviceName),   // registry fallback (§1.5)
    })
  : createHttpClientLink({ contract, serviceName, pathSegment, protocol, apiPath, apiVersion,
      propagateTraceContext, getTraceHeaders });
return createORPCClient(link) as ServiceClient<TContract>;
```

### 1.5 Discovery symmetry — the in-process service registry (design refinement)

HTTP mode resolves `serviceName → URL` via Aspire env discovery (`getServiceUrl`). Give in-process
mode the **mirror**: `serviceName → ServiceApp` via a tiny process-global registry, so a caller that
only knows a `serviceName` (as all generated dashboard clients do) can flip to in-process by config
**without threading the `ServiceApp` handle through every call-site**.

New file `packages/sdk/src/client/in-process-registry.ts`:

```ts
const REGISTRY = new Map<string, ServiceApp>();
export function registerInProcessService(name: string, app: ServiceApp): void { REGISTRY.set(name, app); }
export function resolveInProcessService(name: string): ServiceApp {
  const app = REGISTRY.get(name);
  if (!app) throw new Error(`No in-process service registered for '${name}'. …`);
  return app;
}
export function clearInProcessServices(): void { REGISTRY.clear(); } // tests
```

Consequence: the **generated dashboard client code is identical** between the web build and the
desktop build. Only a single config-driven flag changes (`transport.mode`), which can itself be
defaulted from an env/runtime signal (`NETSCRIPT_LINK_MODE=in-process`, or auto: "a service is
registered in-process ⇒ prefer it"). Recommend explicit config default = `http`, generated
single-process host sets the flag — no surprising auto-magic, but auto-detect is a documented option.

### 1.6 Convenience export (optional, ergonomic)

```ts
export function createInProcessServiceClient<T extends ContractLike>(
  app: ServiceApp, options: Omit<CreateServiceClientOptions<T>, 'transport'>,
): ServiceClient<T> {
  return createServiceClient({ ...options, transport: { mode: 'in-process', app } });
}
```

### 1.7 Public-surface / doctrine notes (A1, A7)

- New public exports on `@netscript/sdk`: `createInProcessClientLink`, `createInProcessServiceClient`,
  `registerInProcessService`, `resolveInProcessService`, `clearInProcessServices`, type
  `ServiceClientTransport`. All go through `deno doc --lint` (A1 public-types-first) and the JSR
  export map.
- `@netscript/sdk` already depends on `@netscript/service` types? **Verify** at implementation: the
  in-process link imports `type { ServiceApp }` from `@netscript/service`. If sdk must not depend on
  service, mirror `ServiceApp`'s two-method structural shape locally in sdk (`{ fetch(req): …}`) — a
  1-interface structural mirror, consistent with how service mirrors Hono/oRPC. **Open item O-1.**

---

## 2. tursodb single-writer relocation

### 2.1 The constraint (hard, driver-level)

tursodb's native driver holds an **exclusive OS file lock per DB file** (`os error 33` on
double-open — `DESKTOP-SHELL.md` S1, `offline-first-surface.md`). At most **one OS process** may
hold a given local db file open at any moment, regardless of packaging strategy. This is not a design
choice; it is why eis-chat is single-writer (only `eischat` opens `data/channels/<id>.db` + the
catalog; everyone else reaches the data plane through it over HTTP).

### 2.2 Where the single writer lives per topology

| Topology | Writer process | Lock holders | Status |
|---|---|---|---|
| Dev (Aspire multi-process) | external `service` process (`serve()`) | 1 (the service) | ships today |
| Option (b) desktop shell | external `service` process | 1 (the service) | **shipped in eis-chat prod** |
| Option (c) true single-process | **the desktop process itself** (`build()` + in-process link) | 1 (the desktop app) | this design |

The single-writer invariant is **satisfied by construction** in option (c): collapsing to one OS
process means there is exactly one holder of the file lock. The relocation work is therefore not
"solve concurrency" — it is **move where the db handle is constructed**, from the service entrypoint
process to the desktop host process, and **guarantee no second opener**.

### 2.3 What actually moves (composition-root work, not a database-package rewrite)

Today the db connection factory runs in the service entrypoint (the process that `serve()`s). In
single-process, the desktop host must:

1. **Resolve the per-user data dir itself** (there is no `Deno.desktopDataDir()`; the packaged
   binary's cwd is the unreliable launch cwd — `DESKTOP-SHELL.md` S5). Resolve
   `%APPDATA%\<app>` / `~/Library/Application Support/<app>` / `$XDG_DATA_HOME/<app>` and set the
   tursodb `DATABASE_URL` / data-dir env **before** constructing the service.
2. **`build()` the service in-process** (get a `ServiceApp`), which constructs the db context in the
   desktop process — this becomes the sole lock holder.
3. **`registerInProcessService(name, app)`** so the dashboard's `createServiceClient({ …, transport:
   { mode:'in-process' } })` resolves it (§1.5).
4. **Never also spawn/connect an external service against the same file.** The b→c cutover must
   ensure the external `service` process is not running against that data dir when the in-process
   one opens it (else `os error 33`). The single-process host owns db lifecycle exclusively.

### 2.4 The VFS red herring — option (c) sidesteps it

The native-addon-in-VFS risk (does the tursodb native driver + Prisma engine work when
self-extracted from `deno desktop`'s embedded VFS?) is an **option (a)-only** risk (bundle+spawn all
services inside the binary). **Option (c) does not hit it:** the desktop binary's VFS holds only the
Fresh `_fresh/` static output; the **db file lives at a normal filesystem path** (the per-user data
dir) and the Prisma/tursodb native engine runs against the real FS, not the VFS. So option (c)'s
tursodb story needs **no native-addon-in-VFS spike** — one of the two scary risks the spec flagged
evaporates for the path we are actually taking. (The VFS spike stays parked as an option-(a)-only
research item, not on the beta.8 critical path.)

### 2.5 Residual risks (real, must be sized)

- **Prisma query engine in-process.** eis-chat's data plane is native (tursodb driver + Prisma
  engine). Running the Prisma engine inside the desktop process against a real-FS path is expected to
  work (it is a normal Deno process), but is **unproven in a `deno desktop`-packaged binary** — needs
  a bounded validation, not a spike. **Open item O-2.**
- **Turso Sync maturity** for the offline-first claim (§3) — cloud reconcile is the sync layer, not
  the lock story; see `turso-sync-offline-first.md`.

---

## 3. The option (b)→(c) ladder as a sequenced tier plan

### 3.1 Reconciling "ships FULLY, do not split" with the b/c reality

Owner law (D4): E ships **fully** — single-process **and** desktop **and** offline-first as ONE
tier; do **not** ship single-process-early / desktop-later. Evidence reality: (b) is proven/shipped,
(c) is a genuine (now-small) arch change.

**Resolution — the "no-split" applies to user-visible half-ships, not to internal enabler
sequencing.** Shipping "a desktop shell that isn't single-process" or "single-process without the
desktop package" would be a split — forbidden. But landing the **headless SDK enabler**
(`ClientLinkPort` adapter + link-mode switch) as an earlier slice is **not** a half-ship: it is
invisible plumbing with independent value (in-process service composition + listener-free service
testing). So the feature ships whole at beta.8; the enabler is sequenced ahead of it. This honors D4
exactly.

### 3.2 Milestone placement (maps to the ratified milestone train)

The milestone train row: **beta.8 / stable = "E desktop + single-process + offline-first, shipped
fully"**; the final **stable** row = "deploy e2e (R4)" + leadership hardening. Natural, D4-compliant
split of *capability* vs *gate/hardening*:

**Precursor (lands before beta.8 — its own small slice, §5):**
- `@netscript/sdk` `createInProcessClientLink` + `ServiceClientTransport` switch + in-process
  registry. Pure SDK, headless, unit-tested by `build()`-ing a service and asserting an in-process
  client round-trips identically to an HTTP client. Zero desktop dependency.

**beta.8 CORE — the "ships fully" tier (all land together, no user-visible split):**
- **S-desktop-gen (#375):** desktop app-type in the Aspire generator (option (b) generalized) —
  build-order gate, `--backend cef`, service-discovery injection with no HTTP endpoint, opt-in
  gating. Ships the desktop **shell**.
- **S-tursodb-reloc:** per-user data-dir resolution + in-process `build()` composition root +
  single-writer ownership (§2).
- **S-single-process:** wire the dashboard through the link-mode adapter in the packaged binary =
  true single-process (option (c)). Depends on the precursor + S-tursodb-reloc.
- **S-offline-first:** Turso Sync (`pull`/`push`, last-push-wins + `transform` hook) in the
  single-process host; offline-capable, opportunistic cloud reconcile.
- **S-packaging:** `deno desktop` 1-click packaging (`--target`/`--all-targets` cross-compile, no
  Rust toolchain; `--compress xz|zstd`) + release/update server (`latest.json` + bsdiff +
  **Ed25519-signed** manifests) + **Windows stages-not-applies** manual-apply fallback
  (Tauri/Electron-style relaunch-installer indirection — documented pattern, not an upstream blocker).

**stable — hardening + gate (leadership bar, not a capability half-ship):**
- **S-deploy-e2e:** desktop/single-process deploy-e2e coverage (extends #394's bare-metal-first
  deploy-e2e mandate to the desktop target). Foundation deps #393 (compose target registration) +
  #394 (deploy-e2e harness).
- **S-signing-automation:** macOS Developer-ID + `notarytool` and Windows `signtool` automation
  (D4: "accept manual/documented for v1, automate at stable").

Rationale the capability is credibly "fully shippable" at beta.8 despite low priority: the server
seam ships; the client adapter is ~1 file reusing `RPCLink`; the tursodb relocation is
composition-root wiring that **avoids** the VFS spike; #375 is a well-evidenced generator branch with
a completed eis-chat POC. The heavy-looking parts were already retired by prior work.

### 3.3 Packaging story specifics (grounded)

- **Backend:** WebView2 default is **broken on Windows bare-metal** (eis-chat POC, #375) — aborts
  before touching user-data folder; env-var workarounds are no-ops. **`--backend cef` CLI flag is
  mandatory** on this host; the `desktop.backend` config field is silently ignored (suspected Deno
  bug → **O-3**, worth an upstream file). CEF first launch downloads ~150MB (~379MB cached). The
  generator must emit `--backend cef`, not rely on config.
- **Build-order gate:** `deno desktop` framework-detects Fresh via built `_fresh/`; absent it falls
  to Vite `dist/` then errors. The generator needs a `predev`/`waitFor` task ordering (build →
  package), never a hand-instruction.
- **Binary:** eis-chat verified ~88MB Windows binary (`eis-chat.dll` + `laufey_webview.exe` +
  `AppIcon.ico`); `--no-check` required (desktop synthetic entry imports Vite chunks `deno check`
  can't resolve; the real graph is still checked by `deno task check`). `-o <explicit path>` required
  (`desktop.output` not honored in 2.9.0).
- **Auto-update:** bsdiff deltas, polls `<baseUrl>/latest.json`, Ed25519-signed manifests verified
  before staging. **Windows STAGES but does not APPLY** (macOS/Linux apply in place) — ship the
  manual relaunch-installer fallback; this is an OS-level constraint shared by Tauri/Electron, not a
  Deno defect (`rfc14-nitro-packaging-prior-art.md`).
- **Desktop-only globals** (`Deno.BrowserWindow`/`Tray`/`autoUpdate`/`desktopVersion`) are not in the
  stable Deno type lib → use a **local structural type** layer (A7/A1), exactly as
  `apps/dashboard/lib/desktop-chrome.ts` does — no `any`, no ambient augmentation, lint-clean no-op
  in the web build.

---

## 4. Aspire relationship (dev = multi-process; ship = single-process)

**One service codebase, two run modes, selected by the link-mode switch — nothing about the Aspire
dev/telemetry story breaks.**

- **Dev (unchanged):** Aspire orchestrates the multi-process topology — dashboard + services +
  workers + streams, each `serve()`-ing, OTLP → the Aspire dashboard for traces/logs/telemetry. This
  is the dev-dashboard + telemetry-revamp (Topics A/B) home and is **untouched** by E.
- **#375 adds a desktop *dev resource* to Aspire** — a task-backed `addExecutable` (4th branch beside
  `app`/`tauri`/`task` in `generate-register-apps.ts`) with service-discovery env injection and **no
  bound HTTP endpoint** (the window binds its own internal `Deno.serve` port), `Enabled:false` opt-in
  so headless/CI `aspire start` is unaffected. This is **option (b)** — the desktop window is just
  another Aspire resource talking to external services over `127.0.0.1`. It is a **dev-testing
  affordance**, not the ship artifact.
- **Ship (new):** the single-process desktop **binary** is produced by **`deno desktop` packaging**,
  **not** Aspire. It runs the service in-process via the link-mode adapter (option (c)). Aspire is
  not present at runtime in the shipped binary.
- **Telemetry in single-process:** OTEL still emits (the in-process link preserves W3C trace
  propagation, §1.3); spans flow to whatever collector the packaged app configures (or a
  locally-bundled view). The dev telemetry/dashboard story is **not** a dependency of the ship story
  and is not degraded by it. **Cross-topic check with Topic-B: O-4** (does single-process telemetry
  need a local exporter, given no Aspire collector at runtime?).

Crisp statement: **Aspire = dev orchestrator + multi-process production deploy orchestrator; `deno
desktop` single-process = a distinct SHIP target that reuses the same service code via link-mode.**
The two are complementary, never mutually exclusive.

---

## 5. #327 rescope resolution

### 5.1 Drift E1 — strike the "172a-2" precursor (CONFIRMED)

PR #172 is **MERGED** and is CLI plugin-contract/service **type-soundness** (workers/sagas/auth
sound; triggers contract-sound/connector-deferred; streams no oRPC contract) — **unrelated** to sdk
link-mode or in-process mounting (`sdk-link-mode-and-service-seam.md` §4, verified against source).
The real precursor is **`@netscript/sdk` `createInProcessClientLink`** (server half already ships).
**Action:** strike "172a-2 service-base-seam" from topic-E's dependency list; replace with the
ClientLinkPort adapter precursor. Surface to owner (done in `epic-and-issues.md`).

### 5.2 Precursor: own small issue, not a buried sub-slice (answers spec §4)

The delegated question: is the sdk link-mode work its own precursor epic/slice or a sub-slice of
#327? **Verdict: its own small precursor ISSUE under #327 (not an epic — it is a single slice; not
buried — it is a hard dependency).** Justification:
- It has **independent value** beyond desktop: listener-free in-process service composition and
  the ability to unit-test a service by calling `app.fetch()` with no port — useful to every service
  author, not just desktop.
- It is **separately evaluable** (headless SDK unit tests) and must land **before beta.8** as a
  dependency edge into S-single-process.
- It is too small to be an epic and too load-bearing to hide inside another slice.

### 5.3 Desktop WATCH → scheduled Tier-4 (drift E2)

#327 currently has 3 buckets (beta tier-1, stable tier-2, WATCH) with `deno desktop` in **WATCH/
reference-only** and #375 in **Backlog/Triage, p3**. The rescope:
- Add a new **Tier-4: Desktop / single-process / offline-first** to #327 (beta.8 core +
  stable-hardening, per §3.2).
- **Promote #375** out of Backlog/Triage `p3` → **beta.8, p2**, into Tier-4 as S-desktop-gen.
- Move `deno desktop` from WATCH into Tier-4 as the packaging line (S-packaging).

### 5.4 #349 — PUSH-BACK: co-locate, do not merge scope

Spec §2 says "fold in #349." **Evidence-based push-back:** #349 is **RFC-14 tier-3 serverless**
(Nitro `deno_server`, Vercel/Cloudflare/Netlify, still `--unstable`, excludes sagas) — a **different
mechanism and audience** than desktop single-process. `offline-first-surface.md` documents a
**three-way "unified" naming collision**: (i) desktop single-process hosting, (ii) local-vs-shared KV
topology (#371/#372, already solved), (iii) tier-3 serverless bundling (#349). Merging #349's scope
into the desktop slice would re-conflate them. **Recommendation:** interpret "fold in #349" as *bring
#349 under the reorganized #327 as a co-located WATCH sibling with a naming-hygiene cross-link*, NOT
*merge its serverless scope into Tier-4 desktop work*. #349 stays WATCH/`wave:defer`. Surface to
owner as a confirmation item (O-5).

### 5.5 Foundation dependencies

#393 (Aspire compose target not registered — false-closed #343) and #394 (no deploy-target e2e
coverage; bare-metal-first per R4) are **beta.3, p1** foundation. They gate **S-deploy-e2e** (stable)
— the desktop deploy-e2e extends #394's harness. Also heed the false-closed-checkbox pattern
(#393/#394/#260/#388): do not trust #327 tier-1 "done" checkboxes without spot-checking e2e coverage
before locking any dependency on them (`sequencing-notes.md` item 6).

---

## 6. Design summary (one screen)

```
PRECURSOR (pre-beta.8, own issue):
  @netscript/sdk: createInProcessClientLink  ──┐  (reuse RPCLink; fetch → app.fetch)
                  ServiceClientTransport switch │  in-process registry (discovery symmetry)
                                                │
beta.8 CORE (ships FULLY, one tier):            ▼
  #375 desktop generator (option b shell) ── S-single-process ── depends on precursor
  S-tursodb-reloc (writer → desktop proc,    (link-mode in packaged binary = option c)
    per-user data dir, avoids VFS spike) ─────┘
  S-offline-first (Turso Sync in-process)
  S-packaging (deno desktop cross-compile + release server + Win manual-apply)

stable (hardening + gate):
  S-deploy-e2e (extends #394; deps #393/#394)      S-signing-automation (macOS notarytool / Win signtool)

Aspire = dev + multi-process deploy orchestrator.  deno desktop single-process = distinct SHIP target,
same service code via link-mode.  #349 (tier-3 serverless) = co-located WATCH sibling, scope NOT merged.
```

See `epic-and-issues.md` for the #327 rescope body + sub-issues (acceptance criteria, milestones,
labels, DAG), `agent-briefs.md` for per-slice WSL Codex briefs, `open-questions.md` for O-1…O-6.
