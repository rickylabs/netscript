# Context Pack — plan-frontend-contrib--seed

Resumable summary. Read with `supervisor.md` (identity + pipeline) and `drift.md`.

## What this run is

Planning-only seed (Fable 5 high) designing the **frontend contribution layer** for NetScript
plugins — the missing axis blocking dev dashboard, auth UI, ai surfaces, and the new deploy
plugin. Drafts only: no PRs/issues, no product code. Custom pipeline: this generator → Codex
GPT-5.6 Sol high adversarial pass → generator integrates → Kimi K3 public docs/API pass. All
downstream stages are supervisor-dispatched.

## State: GENERATOR STAGE COMPLETE

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
