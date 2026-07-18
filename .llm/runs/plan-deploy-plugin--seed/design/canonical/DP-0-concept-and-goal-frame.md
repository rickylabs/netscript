# DP-0 — Concept & goal frame: deploy as a plugin family

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`. Downstream
> passes (Sol adversarial, Kimi doc-story) amend in place; GitHub wins after any future filing.

## 1. The ratified concept (owner, 2026-07-18, verbatim basis)

The deploy story is rebuilt as a **plugin family** — `plugin-deploy` with a `deploy-core` and
per-cloud adapters — composed **the exact way the auth plugin composes** (core + provider
adapters). The owner's four ratified points (kickoff `plan-deploy-plugin--seed/kickoff.md:13-34`):

1. **Goal reframed: "Deno native first, then Node compat where needed."** Full Deno-nativity is
   unreachable whether we choose Nitro, existing Deno adapters, or our own implementation.
2. **No giant new deploy package.** The auth lesson: use NetScript at what it's best at —
   composability. A deploy plugin with a plugin core and adapters, exactly like auth.
3. **The plugin route redefines the whole deploy story** — including what already shipped — and
   solves the layer problem: the plugin contributes to every layer (CLI, services, scaffolding,
   soon frontend). We can scaffold a *cloudflare-optimized* project shipping cloudflare-first
   seams (workers, durable objects, KV), same for AWS, Vercel. This "defeats" cloud-agnosticism
   in one sense while making it actually credible — true agnosticism is nearly impossible since
   each cloud has its own standards and adapters have limits (proven in the prior run's
   analysis).
4. **The family** — `plugin-deploy`, `deploy-core`, `deploy-aws`, `deploy-cloudflare`,
   `deploy-vercel`, … — mirrors how major frameworks proceed, with the plugin system
   (contribution, scaffolding, CLI, services) making it more powerful.

Selective wrapping stays in force: sprinkle Nitro integration where it makes sense, Aspire-native
where it matters, implement ourselves enterprise-grade elsewhere — unless a well-written standard
package is worth wrapping per doctrine (A7 wrap-don't-reinvent).

## 2. What this run supersedes and what it keeps

The prior seed run (`plan-unified-runtime--seed`, issue #824 context) designed a Nitro-hosted
unified-runtime board (UR-0…UR-12). It was **never filed**; its adversarial rounds produced the
evidence this design is built on (`research/prior-run-distillation.md`).

**Dead (not carried):** Nitro as host/listener (UR-2); Nitro-preset cell columns (UR-6);
unproven "owned AWS/CF family" claims; the `@netscript/deploy` god-object sketch (adversarial F5).

**Carried forward as design law:**

| # | Law | Origin |
| --- | --- | --- |
| L-1 | **Owner conformance rule**: per target, a provider-native wrapper wins over any generic emitter iff it passes the same conformance suite, exposes every required native binding/event/config surface, and costs less to maintain. Nothing third-party ever enters the composition contract or leaf ports; whatever emits, emits behind a NetScript-owned port. | `nitro-vs-own-synthesis.md:9-13` |
| L-2 | **Leaf ports stay authoritative.** `KvStore`, `MessageQueue`, `DatabaseAdapter`, saga/worker/trigger/stream ports are defined by their leaf packages; provider primitives are capability-scoped backings at most, each a feasibility question, not a mapping exercise. | `nitro-vs-own-synthesis.md:15-17` |
| L-3 | **Capability manifest + build-time rejection.** Every target ships a machine-readable manifest (`lossless | partial | unsupported` per capability; `sagas: supported | externalized | rejected`); a composition compiler fails the build on `unsupported` — never at runtime, never silently downgraded. | UR-5 (`prior-run-distillation.md` §1) |
| L-4 | **One logical composition root; no application-created loopback.** Physical single-process is a per-target capability; cross-target invariant is in-process Fetch delegation, never a socket back to the host listener. | UR-1/UR-4 |
| L-5 | **Hostable lifecycle.** Deploy artifacts drive services through the shipped `ServiceShutdownCoordinator` semantics (`build`/`start`/`stop`, drain, LIFO teardown) — no bypass of `.onStartup()`/`.onShutdown()`. | UR-0 (prior Stage-F F5) |
| L-6 | **Docker-image long tail = thin adapters** on one shared container path (fly/koyeb/sevalla/coolify/dokploy + CF Containers). | `nitro-vs-own-synthesis.md:18-19`, `provider-deploy-surfaces.md` §6 |
| L-7 | **Probe before ownership claims.** AWS event semantics and CF Workers fidelity are proven by probes (AWS-PROBE, CF-PROBE) before their adapters graduate past HTTP/emit scope. | adversarial F1–F4 |

## 3. The goal frame, made operational

**"Deno native first, then Node compat where needed"** decomposes into three tiers, applied per
target — not a single global stance:

| Tier | Meaning | Targets |
| --- | --- | --- |
| **T1 — Deno-native process** | The artifact is a Deno process (`deno run`/`deno compile`/`Deno.serve`) or a `denoland/deno` container image. No Node toolchain in the app's runtime path. | Deno Deploy (new), bare-metal (Servy/systemd), Aspire lanes (`addExecutable` deno run), container path (Fly, koyeb, sevalla, coolify, dokploy, CF Containers), AWS via LWA container |
| **T2 — Web-standard portable** | App code is written against Web Platform APIs (Fetch handler, Request/Response, Web Streams, crypto) so the same code runs on Deno *and* V8-isolate runtimes. NetScript emits an isolate entry that adapts `ServiceApp.fetch`. | Cloudflare Workers (workerd) |
| **T3 — Node compat where needed** | The provider's first-class runtime is Node; NetScript emits Node-compatible output and declares the compat cost honestly. Deno realization stays available as opt-in (community runtime) or via containers. | Vercel functions (Node default, `vercel-deno` opt-in), `nodejs_compat` gaps on Workers |

The invariant across tiers: **the application model never changes.** One logical composition
graph, NetScript-owned ports, Web-standard handler boundary. Tiers describe the *realization*,
selected and validated per target through the capability manifest (L-3).

## 4. Why a plugin makes agnosticism credible (the positioning argument)

True cloud-agnosticism fails empirically: KV consistency models, queue consumer models
(push-invocation vs owned `listen()` loop), and saga storage differ per provider in ways no
universal adapter can flatten (`research/prior-run-distillation.md` §3). Frameworks that claim
otherwise ship lowest-common-denominator adapters.

The plugin family takes the opposite position:

- **The core is honestly agnostic** — a small set of NetScript-owned ports, a target registry,
  shared conventions, and a capability compiler that *refuses* to pretend (build-time rejection,
  backend-truthful capability discovery — the auth board's S1 lesson applied to deploy).
- **The adapters are honestly provider-first** — each wraps the provider's own first-class
  tooling (wrangler, Build Output API, `deno deploy`, Machines API) and declares exactly what it
  can and cannot do.
- **The scaffold makes provider-first real** — a cloudflare-optimized scaffold ships seams that
  are cloudflare-first from day one (DO/KV/Queues backings selected for the leaf ports, wrangler
  config emitted, CI wired), instead of a generic project the user must bend. Same for AWS
  product suites and Vercel's marketplace primitives (`scaffold-stories.md`).

That combination — strict ports + honest capabilities + optimized scaffolds — is the
"capability-checked composition graph" differentiator the market research identified
(`research/prior-run-distillation.md` §5), and it is exactly what the plugin contribution system
makes possible: the deploy plugin contributes CLI, scaffolding, streams/telemetry, and (when the
frontend axis lands) UI, at every layer, per provider.

## 5. Design principles (bind all DP docs)

1. **Auth parity by default.** Package topology, naming, manifest triad, adapter thinness,
   contract/versioning, install path — copy the auth pattern unless a deploy-specific inversion
   is named in `research/auth-composition-anatomy.md` §9 (multi-target registry, user-visible
   leaf config, no v1 HTTP service).
2. **Extraction before invention.** The shipped CLI kernel already contains the 7-op port, the
   registry, and the conventions (debt `DEPLOY-ARCHETYPE-7-CORE-SEED`). Wave 1 moves them; new
   capability lands in later waves.
3. **No board mutation from this run.** Draft texts only; the filing manifest is produced for a
   future owner-ratified stage H.
4. **Doctrine gates are the acceptance language.** F-DEPLOY-1/2 flip `reviewed`→`gated` when the
   core lands; every adapter card carries its archetype gate set; issue drafts phrase acceptance
   as `- [ ] gate:` predicates (board-parity lesson).
5. **Honest tiers.** Every adapter card states its tier (T1/T2/T3), its wrap target, and its
   capability manifest sketch — no "supports X" without the manifest row that proves it.
