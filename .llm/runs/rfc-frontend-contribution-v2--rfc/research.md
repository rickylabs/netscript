# Research — rfc-frontend-contribution-v2--rfc

## Re-baseline

- Carried-in source: [`.llm/runs/plan-frontend-contrib--seed/rfc.md`](../plan-frontend-contrib--seed/rfc.md) (PR `#890` seed, merged `2026-08-03`) unified with accepted [`rfcs/0005-devtools-contribution.md`](../../../rfcs/0005-devtools-contribution.md) (accepted `2026-08-11`), [`rfcs/0007-gpuix-native-desktop-renderer.md`](../../../rfcs/0007-gpuix-native-desktop-renderer.md), [`rfcs/0009-authorizing-stream-proxy.md`](../../../rfcs/0009-authorizing-stream-proxy.md), Nov 2026 scaffold templates, `#2582`, PR `#2670` (open), and `rickylabs/eis-etl` consumer issues (`#63`, `#421`, `#422`, `#425`, `#426`, `#438`, `#448`, `#450`, `#453`).
- Re-derived against initial worktree `main` @ `af5107b8d` and rebased/re-verified against live `origin/main` @ `f54542169` on `2026-11-25` via live file inspection, live GraphQL board reads, and three executable Wave-0 probes (`probe-a`, `probe-b`, `probe-c`).
- What changed vs the carried-in version:
  - Unified `#890` and `RFC 0005` onto a single neutral `ContributionEnvelope`, `ContributionIdentity` quartet (forbidding `resolvePluginLocalName`), 6-state diagnosis taxonomy, `#1473` containment, and `#1474` `.passthrough()` manifest precondition (`schemaVersion: 1`).
  - Quarantined Fresh 2.3.3 mechanics into `@netscript/fresh/plugins` + `@netscript/fresh/vite`, enforced Fresh-3-aligned `middleware -> handler({ data }) -> pure page` separation (`Probe A P2c`), and kept `@netscript/plugin-frontend-core` Archetype 1 pure & zero-Fresh/Preact/Vite/DOM.
  - Added `descriptor` (schema + `x-ns-ui` + typed dock tabs aligned with PR `#2670`), server-side secret redaction (`Probe C 3.1`–`3.2`), `<Partial name="main">`-inside-shell `isPartial` guidance (`Probe A P1b-aware`), corrected `@layer ns-plugins, ns-app;` cascade prelude (`Probe B C2`), and `FrontendPluginCatalog` health read model.
  - Re-cut `0.0.10` into acyclic clusters W1/W2/W3 breaking `#933` <-> `#940`.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `preactOptions.errorBoundaries` is `undefined` in Fresh `2.3.3`; sync `renderToString` does not await nested async child components (renders empty `<div></div>` with `200` + leaks `unhandledrejection`). Pre-render `Promise.all` + `try/catch` renders HTTP `200` with sibling + quarantine card. | `deno run --no-lock -A .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-a-fresh-mount.ts` ([`probe-a.log`](./probes/probe-a.log)) |
| 2 | `defineFreshApp` executes `options.configure?.(app)` *before* `registerFsRoutes()` (`define-fresh-app.ts:114-115`); pre-`fsRoutes` `mountApp` misses `_app`/`_layout`/`_middleware`. | [`packages/fresh/src/runtime/server/define-fresh-app.ts#L114-L115`](../../../packages/fresh/src/runtime/server/define-fresh-app.ts#L114-L115), `Probe A P1.0` |
| 3 | `App.#commands` is ES `#private`; raw `App.mountApp` leaks `.notFound()`/`.appWrapper()` globally unless wrapped by `GuardedPluginApp`. | `Probe A P1g` in [`probe-a-fresh-mount.ts`](./probes/probe-a-fresh-mount.ts) |
| 4 | `_layout.tsx.template` wraps `<SidebarShell>` *inside* `<Partial name="page">`; placing `<Partial name="main">` inside shell requires `ctx.isPartial` checks in `_layout`/`_app` so `rawBodyHasShellChrome===false`. | [`packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51`](../../../packages/cli/src/kernel/assets/app/routes/_layout.tsx.template#L39-L51), `Probe A P1b-aware` |
| 5 | PR `#890`'s `@layer ns-app, ns-plugins;` is inverted (plugin red beats app); corrected `@layer ns-plugins, ns-app;` restores app precedence (`rgb(22, 163, 74)`) while route splitting cuts cold `/` CSS from `84,788 B` to `169 B` (`26 B` bare prelude). | `deno run --no-lock --check -A .llm/runs/rfc-frontend-contribution-v2--rfc/probes/probe-b-vite-islands-css.ts` ([`probe-b.log`](./probes/probe-b.log)) |
| 6 | `@fresh/plugin-vite@1.1.2` strips `?url` CSS queries (`C3`), races parallel `Deno.rename` on shared SSR CSS (`C4`), clears `islandSpecByName` on `fsRoute` edits in dev (`D4`), ignores `--cached-only` online (`M3`), and splits `@preact/signals` to 2 chunks on `^2.11.0` mismatch (`M6`). | [`probe-b.log`](./probes/probe-b.log) matrix cells `C3`, `C4`, `M3`, `M6`, `D4` |
| 7 | `PluginInstallerManifestSchema` uses `.strict()` at `manifest.ts:311`; `ui/registry.ts:310-317` `resolveTarget` lacks path containment; `installed-runtime-registry-generator.ts:390-391` passes bare `--allow-read`/`--allow-write`; `AstExtractor` still scrapes regexes. | [`packages/plugin/src/protocol/manifest.ts#L297-L311`](../../../packages/plugin/src/protocol/manifest.ts#L297-L311), [`packages/cli/src/kernel/application/ui/registry.ts#L310-L317`](../../../packages/cli/src/kernel/application/ui/registry.ts#L310-L317), [`probe-c.log`](./probes/probe-c.log) |
| 8 | `createStableV1ProcedureMetadataPort()` (`stable-v1-adapter.ts:64-91`) drops `access.authorization` & `access.audience`. Gateway composition keeps `RFC 0009` Durable Streams outside oRPC `compileProcedures`. | [`packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts#L64-L91`](../../../packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts#L64-L91), `Probe C 2.1–2.5` |
| 9 | `packages/fresh/src/runtime/server/sse.ts` exists on disk but is unexported from `packages/fresh/src/runtime/server/mod.ts`; `dashboard-view.tsx.template` still hardcodes `'streams'` & `'workers'`; `vite.config.ts.template` hardcodes 3 plugin aliases. | [`packages/fresh/src/runtime/server/mod.ts`](../../../packages/fresh/src/runtime/server/mod.ts), [`packages/cli/src/kernel/assets/app/vite.config.ts.template`](../../../packages/cli/src/kernel/assets/app/vite.config.ts.template) |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: Docs & RFC run only — zero edits under `packages/`, `plugins/`, `apps/`, `examples/`, or `deno.lock`. `jsr-audit` (`deno doc --lint` + `audit-jsr-package.ts`) applies at `0.0.10` W1 when `@netscript/plugin-frontend-core` is created.

## Open questions

- Recorded in [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions) as compact forks `F-1` through `F-5` for Friday 23:30 `Fable 5.2` evaluation.
