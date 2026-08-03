# Context Pack — plan-frontend-contrib--seed

Resumable summary. Read with `supervisor.md` (identity + pipeline) and `drift.md`.

## What this run is

Planning-only seed (Fable 5 high) designing the **frontend contribution layer** for NetScript
plugins — the missing axis blocking dev dashboard, auth UI, ai surfaces, and the new deploy
plugin. Drafts only: no PRs/issues, no product code. Custom pipeline: this generator → Codex
GPT-5.6 Sol high adversarial pass → generator integrates → Kimi K3 public docs/API pass. All
downstream stages are supervisor-dispatched.

## State: PIPELINE COMPLETE (rev 3) — awaiting owner review

All three kickoff stages done: generator → Sol high adversarial (20/20 findings integrated,
rev 2) → Kimi K3 docs story (`design/docs-story/`, 17/17 K-notes integrated, rev 3:
FrontendDefinition, MessageRef shorthand, contract default, ModuleRef, PluginPageContext +
redirect, pinned pluginApi/GATEWAY_PREFIX, budgets + defineFrontendTestSuite, pointer
de-duplication, doctor taxonomy). Triage records: `adversarial-triage.md`,
`docs-story-triage.md`. Next: owner reviews plan.md forks (F1/F2/F3/F5/F7/F8/F9); board filing
is a separate owner-gated step (nothing filed by this run).

## Stage 2 state (superseded)

Sol high review (thread `019f7883-ccf0-7820-aa36-3bd90b82ac05`) produced 20 findings
(`adversarial-sol.md`); all accepted and integrated as **rev 2** of plan + canonical docs +
examples (`adversarial-triage.md` has per-finding dispositions). Headline rev-2 changes:
envelope+family versioning (no widened unions), identity quartet, request/client context split,
HostSurfaceDescriptor, literal route loaders + post-fsRoutes composition, islands proof-gated
[P3], honest SSR containment, deny-by-default procedure gateway (no wildcard proxy), Wave-0
five-proof phasing, forks re-triaged (F9 new). Examples now compose only real backend surfaces.

## Original generator state (stage 1)

All deliverables written and committed on `plan/frontend-contrib`:

- `research.md` — cited corpus (4-way Opus fan-out + supervisor verification).
- `plan.md` — D1–D14 locked decisions, F1–F8 owner forks, 3 implementation waves, gates, risks.
- `design/canonical/00-overview.md … 06-doctrine-fit.md` — the design.
- `design/examples/{dashboard,auth,ai,deploy}.md` — four worked consumers with author code.

## The design in five lines

1. `@netscript/plugin-frontend-core/contracts/v1`: FrontendManifest + route/island/zone/nav/theme
   kinds; `defineFrontend()`; `definePluginPage()`; `PluginHostState`.
2. Core `@netscript/plugin` gains a pointer only (`.withFrontend({export,framework,contract})` +
   manifest block).
3. Discovery = `netscript generate plugins` emitting `.netscript/generated/frontend.*`
   (registry, islandSpecifiers, typed route refs, css); install-time `deno check` is the gate.
4. Hosts mount via `@netscript/fresh/plugins`: upstream `App.mountApp` sub-apps (plugin base +
   host remap), `islandSpecifiers`/`registerIsland` builds, `/api/plugins/<id>/*` proxy,
   `PluginZone`, nav→SidebarShell feed. `defineFreshApp({ frontend: registry })` is the one-liner.
5. Two delivery models: live (default) vs scaffolded starter via `AppTarget` (sign-in pages,
   cloud-first seams). Dashboard's 7-kind family becomes an extension of this base.

## Key verified facts (don't re-derive)

- Upstream Fresh 2.3.3: `App.mountApp` (app.ts:357), `Builder.registerIsland`
  (dev/builder.ts:157), `fresh({ islandSpecifiers })` (@fresh/plugin-vite 1.0.8 mod.ts:211-214).
- No `.tsx` under `plugins/`; no frontend axis in `PluginContributions`; fresh-ui is
  copy-registry + `--ns-*` tokens; nav is hardcoded arrays; scaffolded apps have generated typed
  route refs (`router.ts` + `createRouteReference`).
- Prior art: `dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` (the
  437-line ratified dashboard design this generalizes); ai chat-route scaffolder is the one
  existing plugin→app frontend precedent.

## Next actions (supervisor)

1. Dispatch Codex GPT-5.6 Sol high adversarial/collaborative pass over the run dir (enhance, not
   ruin; findings file, generator integrates).
2. Resume this session (or a fresh Fable session with this pack) to integrate findings.
3. Dispatch Kimi K3 public-facing API + documentation story pass.
4. Owner review of F1–F8; then board filing is a separate decision (this run files nothing).
