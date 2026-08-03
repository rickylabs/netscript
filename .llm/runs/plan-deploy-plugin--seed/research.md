# Research — plan-deploy-plugin--seed

Synthesis over the committed stage-B corpus (`research/`). Every load-bearing claim below is cited
in the corpus files; this document indexes and concludes, it does not re-derive.

## Corpus index

| File | Surface | Method |
| --- | --- | --- |
| `research/prior-run-distillation.md` | Full prior run `plan-unified-runtime--seed` (UR-0…12, nitro/deno-deploy/market/sagas research, both adversarial rounds, evidence extracts) | Direct read of the wt-g8-seed worktree; supervisor additionally read `adversarial-nitro-vs-own.md` + `nitro-vs-own-synthesis.md` first-hand |
| `research/auth-composition-anatomy.md` | `plugins/auth`, `plugin-auth-core`, `auth-{kv-oauth,workos,better-auth}`, `packages/plugin`, CLI install path | Source + `deno doc` |
| `research/deploy-layer-inventory.md` | Shipped deploy layer: CLI verbs/adapters, aspire substrate, config schema, scaffold artifacts, docs promises, gaps | Direct file reads |
| `research/doctrine-constraints.md` | Doctrine 01–11, archetypes (esp. A2/A5/A6/A7), gate matrix, plan-gate, arch-debt, plugin host mechanics | Direct reads + `deno doc` |
| `research/board-parity-871-887.md` | Enterprise-auth board #871–#887 | Read-only GitHub API |
| `research/provider-deploy-surfaces.md` | Live provider surfaces: Cloudflare, Vercel, AWS, Fly, Deno Deploy (new), koyeb/sevalla/coolify/dokploy, Nitro v3, cross-cutting IaC | Primary-source web research, URLs inline |

Re-baseline: this run starts clean at `origin/main = 290c68ef` (2026-07-18). The prior run's board
was drafts-only and never filed; nothing on the live board encodes the UR shape. The owner's
ratification (kickoff, verbatim) supersedes #824's unified-runtime framing.

## Conclusions that drive the design

1. **The plugin decomposition is the structural answer to the prior run's fatal finding.**
   Adversarial F5 killed `@netscript/deploy` as "both a neutral core and a cross-domain
   composition god-object" with a dependency-cycle risk. The auth composition pattern is the
   proven anti-god-object shape in this codebase: a provider-agnostic `-core` owning ports +
   registry + conventions, thin per-provider adapter packages, and a thin A5 plugin that only
   wires and re-exports. The deploy family adopts it 1:1 (`auth-composition-anatomy.md` §1–§5,
   "what generalizes").
2. **Doctrine already reserved the seat.** Archetype 7 models deploy as A2-core + A6-router;
   F-DEPLOY-1/2 gates are seeded `reviewed` awaiting the packages; debt
   `DEPLOY-ARCHETYPE-7-CORE-SEED` states the core extraction verbatim — the 7-op
   `DeployTargetPort`, the closed-on-key registry, and the activation/secrets/otel/rollback/
   health conventions already exist as target-agnostic modules inside the CLI kernel
   (`doctrine-constraints.md` §2/§5, `deploy-layer-inventory.md` §7). The new family is an
   **extraction + pluginization**, not a green-field invention.
3. **What survives from the prior run as doctrine:** the owner conformance rule (provider-native
   wrapper beats a Nitro preset iff same conformance suite + full native surface + cheaper to
   maintain; Nitro never in the composition contract or leaf ports); leaf ports stay
   authoritative with provider primitives as capability-scoped backings; capability manifest +
   build-time rejection compiler (UR-5); the sagas `supported | externalized | rejected`
   tri-state; single-composition-root / no-loopback invariants (UR-1/UR-4); hostable lifecycle
   via `ServiceShutdownCoordinator` (UR-0); Docker-image long tail as thin adapters
   (`prior-run-distillation.md` §7–§8).
4. **What is dead:** Nitro-as-host (UR-2), Nitro-preset cell columns (UR-6), and any un-probed
   "owned AWS/CF family" claim (adversarial F1–F4). AWS Lambda Web Adapter is an HTTP sidecar
   only; Cloudflare tooling is provider-owned Node tooling callable from Deno; Miniflare is not a
   production oracle. These become **probe-gated adapters**, not first-wave commitments.
5. **The wrap map is now concrete** (`provider-deploy-surfaces.md`): wrangler + Build Output API
   + `deno deploy` CLI are the three bespoke framework-defined-infrastructure seams; Fly + the
   four thin PaaS (koyeb/sevalla/coolify/dokploy) + Cloudflare Containers collapse onto **one
   shared container-deploy path**; Pulumi Automation API is the only cross-cutting IaC dependency
   worth taking (AWS lane); Serverless Framework v4 is disqualified on licensing; Nitro presets
   are not programmatically consumable without adopting Nitro's build — study, don't import.
6. **Deno Deploy (new) is the Deno-native-first flagship but is capability-scoped:** no queues,
   KV without queues/replication controls, `Deno.cron()` supported, monorepo git-integration gap —
   the capability manifest must say so honestly (backend-truthful discovery, the auth board's S1
   lesson).
7. **The plugin host needs named, small extensions** for deploy to contribute at every layer:
   `cli.doctorChecks` is a hardcoded `'auth-backend'` union; there is **no CLI-command
   contribution axis** and **no frontend axis** (frontend is a separate parallel seed run). The
   design must name these host changes explicitly rather than smuggle them
   (`doctrine-constraints.md` §3, `auth-composition-anatomy.md` §9).
8. **Auth-specific patterns that invert for deploy:** single-active backend selection becomes a
   **multi-target registry** (a project deploys to several targets/environments concurrently);
   the no-userland-leaf rule inverts (deploy wants user-visible target config); the HTTP-service
   shape is not required for v1 (deploy is CLI/CI-shaped)
   (`auth-composition-anatomy.md` §9).
9. **Board mechanics:** mirror the enterprise-auth board (one umbrella epic, `Part of #N`
   children, `- [ ] gate:` acceptance predicates, `Dependencies:`/`Delivery shape:` metadata,
   core-contract-first DAG, one shared conformance kit) and fix its defects (single ID scheme,
   milestone the p0, consistent waves, GitHub-native sub-issues)
   (`research/board-parity-871-887.md` §4).

## Drift-candidate ledger

- D-C1: docs claim "deliberately minimal about deployment" while the CLI ships 15+ deploy verbs —
  the plugin story must replace the "alpha-minimal" framing (docs refresh scoped in the
  contribution matrix).
- D-C2: `deploy` group description stale ("Windows Service") and legacy flat verbs coexist with
  the target-op router (S12/#348) — resolved by the verb-vocabulary lock in `plan.md`.
- D-C3: `deno_deploy`-related evidence predates Classic sunset (2026-07-20, two days after this
  run) — all new-platform claims cite the new console/CLI docs only.
- D-C4: prior-run evidence extracts live in the wt-g8-seed worktree, not this branch — cited
  transitively via `research/prior-run-distillation.md` §9; copy-forward is deliberate non-goal
  (clean run).
