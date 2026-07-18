# Discovery & Registry — manifest to generated code (draft)

> **Draft — design document only.** Mechanism follows the existing axis pipeline exactly;
> file names and shapes are sketches pending the adversarial pass.

## 1. Discovery chain (all additive to existing machinery)

```
scaffold.plugin.json "frontend" block          ← parse-only pointer (no plugin code executed)
        │  netscript plugin install / generate plugins
        ▼
import plugin's './frontend' export            ← FrontendManifest (validated data)
        ▼
emit .netscript/generated/frontend.*           ← typed registry + islands + route refs + css
        ▼
deno check generated workspace                 ← EXISTING install gate; type-broken contribution
                                                 fails install with a real diagnostic
```

1. **Manifest block** — `PluginInstallerManifestSchema` gains an optional `frontend` object
   (`packages/plugin/src/protocol/manifest.ts:204-216`); `parsePluginManifest` stays
   execution-free. `capabilities` gains nothing: the block's presence IS the capability.
2. **Runtime manifest** — `PluginContributions.frontend?: FrontendContributionRef` +
   `PluginBuilder.withFrontend()`
   (`packages/plugin/src/config/domain/plugin-contributions.ts:12-38`,
   `.../builders/plugin-builder.ts`). `CONTRIBUTION_AXES` gains `'frontend'`
   (`packages/plugin/src/domain/constants.ts:16-40`) — the previously inert `PluginType
   'frontend'` value finally has machinery behind it.
3. **Emission** — `netscript generate plugins`
   (`packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts`)
   gains a frontend emitter alongside the per-axis registry emitter
   (`packages/plugin/src/sdk/discovery/registry-emitter.ts`). Same AUTO-GENERATED / DO NOT EDIT
   marker, same idempotency-by-construction, plus the byte-identical write skip
   (`generate-runtime-schemas.ts:107-135` precedent).

## 2. Generated files (the complete set)

```ts
// .netscript/generated/frontend.registry.ts  — AUTO-GENERATED, DO NOT EDIT
import cronsFrontend from '@acme/plugin-crons/frontend';
import authFrontend from '@netscript/plugin-auth/frontend';
import { buildFrontendRegistry } from '@netscript/plugin-frontend-core/contracts/v1';

export const frontendRegistry = buildFrontendRegistry([
  { manifest: cronsFrontend, specifierBase: '@acme/plugin-crons/frontend' },
  { manifest: authFrontend, specifierBase: '@netscript/plugin-auth/frontend' },
], {
  // host overrides from netscript.config (base remaps, disabled contributions)
  overrides: hostOverrides,
});
```

```ts
// .netscript/generated/frontend.islands.ts — consumed by vite.config.ts
export const pluginIslandSpecifiers: readonly string[] = [
  '@acme/plugin-crons/frontend/islands/CronCalendar',
  '@netscript/plugin-auth/frontend/islands/SessionMenu',
];
```

```ts
// .netscript/generated/frontend.routes.ts — typed route references (createRouteReference idiom,
// packages/cli/src/kernel/assets/app/router.ts.template precedent)
export const pluginRoutes = {
  crons: {
    calendar: createRouteReference('/crons/calendar', { id: 'plugins.crons.calendar', kind: 'page' }),
    scheduleDetail: createRouteReference('/crons/schedules/:id', { id: 'plugins.crons.scheduleDetail', kind: 'page' }),
  },
  auth: { /* … */ },
} as const;
```

```css
/* .netscript/generated/frontend.css — aggregated theme overlays, imported by assets/design.css */
@import '@acme/plugin-crons/frontend/theme.css' layer(ns-plugins);
```

(If dep-CSS imports prove brittle under vite, fallback: generate-time copy into
`.netscript/generated/frontend/<plugin>.css` — decision deferred to implementation, both
mechanically equivalent. The fresh-ui CSS aggregator precedent is
`packages/cli/src/kernel/application/ui/registry.ts:110`.)

Route-ref merging into the app's `router.ts` is **import-based, not file-mutation**: the
scaffolded `router.ts` template adds `...pluginRoutes` under a `plugins` key
(`05-scaffolding-and-cli.md §2`). Existing apps adopt via an idempotent `netscript generate
frontend-wiring` (same doc).

## 3. Resolution rules (generate-time, structured errors)

Deterministic order everywhere: plugins sorted by id, contributions by (`order`, plugin id, id) —
doctrine 07's deterministic-load-order law.

| Check | Failure mode |
| --- | --- |
| plugin id in manifest ≠ owning plugin | error naming both |
| base collision (two plugins → same resolvedBase, after overrides) | error naming both + remap hint (`netscript.config` override) |
| nav.route references unknown route id | error |
| unknown zone id for a targeted surface | error listing published zones |
| duplicate contribution id within plugin | error |
| `contract` outside host window | **quarantine**: contribution excluded, registry carries a `quarantined` entry rendered as the fix-CLI panel state (prior design §4), never a host crash |
| module ref missing from plugin's deno.json exports | error + `netscript generate frontend` hint |

## 4. Install / uninstall / update lifecycle

- `netscript plugin install` — existing post-scaffold wiring
  (`packages/cli/src/public/features/plugins/install/install-plugin.ts:145-192`) gains one step:
  regenerate frontend emissions. Works identically for local-source and JSR modes (the registry
  imports by package specifier either way; local-source resolves through the workspace).
- `netscript plugin uninstall` — regeneration drops the plugin's contributions (registry is
  derived state). Scaffolded **starter** files remain, app-owned, per the copy-model contract.
- `netscript plugin update` — package version bump + regeneration; contract drift surfaces via
  doctor + the quarantine state, remediation CLI printed.
- `netscript plugin doctor` — new `frontend` check via the existing `DoctorCheckSpec` seam
  (`packages/plugin/src/adapter/contract.ts`): handshake, zones, refs, exports.

## 5. Gates carried from the ratified dashboard design (unchanged)

Install-time type-check (registry regeneration + `deno check`), doctor re-validation, render-time
quarantine-not-crash: `dashboard-design--orchestrator/analysis/plugin-extension-architecture.md`
§4 items 2a–2c apply verbatim to this layer.
