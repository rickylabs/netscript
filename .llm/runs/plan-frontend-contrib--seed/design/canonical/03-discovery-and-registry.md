# Discovery & Registry — manifest to generated code (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial findings S-2, S-3, S-10, S-11,
> S-12 (`../../adversarial-sol.md`; dispositions in `../../adversarial-triage.md`).

## 1. Discovery chain (all additive to existing machinery)

```
scaffold.plugin.json "frontend" block          ← parse-only pointer (no plugin code executed)
        │  netscript plugin install / generate plugins
        ▼
import plugin's './frontend' export            ← FrontendManifestEnvelope(s) (validated data)
        ▼
STAGE .netscript/generated/frontend.* set      ← full replace-set, staged out-of-place
        ▼
deno check staged set incl. frontend.check.ts  ← imports EVERY referenced module (routes,
                                                 islands, css) — a bad deep export fails HERE,
                                                 not at first vite build (S-11)
        ▼
atomic swap into .netscript/generated/         ← or rollback; never a half-updated host
```

Manifest block, runtime-manifest pointer, and `CONTRIBUTION_AXES` addition are unchanged from
rev 1 (`packages/plugin/src/protocol/manifest.ts:204-216`,
`packages/plugin/src/config/domain/plugin-contributions.ts:12-38`).

## 2. Generated files — the complete replace-set (S-11)

Every generation emits **all** of these, deterministically, even when empty (an empty registry
is a file that exports empty structures — so removal can never leave stale imports):

| File | Contents |
| --- | --- |
| `frontend.registry.ts` | typed registry: identities, resolved bases, contributions, **literal lazy route loaders** |
| `frontend.islands.ts` | `pluginIslandSpecifiers: readonly string[]` for the vite feed |
| `frontend.routes.ts` | `createRouteReference` entries per plugin route (typed hrefs) |
| `frontend.css` | host layer-order prelude (`@layer ns-app, ns-plugins;`) + plugin css imports |
| `frontend.gateway.ts` | deny-by-default gateway route table from `requires.procedures` × contract metadata (04 §4) |
| `frontend.check.ts` | static import module referencing every route/island/css module — the type-check gate's teeth |

Route loaders are **literal** (S-2):

```ts
// frontend.registry.ts (excerpt) — AUTO-GENERATED, DO NOT EDIT
import { normalizeFreshRouteModule } from '@netscript/fresh/plugins';
export const routes_crons = [
  {
    id: 'calendar',
    path: '/calendar',
    load: () => import('@acme/plugin-crons/frontend/routes/calendar').then(normalizeFreshRouteModule),
  },
] as const;
```

CSS: dependency `@import` is the primary mechanism; the copy fallback must rewrite relative
`url()` assets (S-12) — copied CSS is a transformed artifact, not equivalent bytes.

## 3. Resolution rules (generate-time, structured errors)

Deterministic order everywhere (plugins by mountId, contributions by (`order`, mountId, id)).

| Check | Failure mode |
| --- | --- |
| pluginKind ≠ owning plugin / packageName mismatch | error naming both |
| **Base/route collisions — full rules (S-20)**: route-*pattern* overlap across plugins (not string equality), reserved host paths (`/_fresh`, `/api`, gateway prefix, host `config.basePath` composition), nested/dynamic precedence conflicts | error with the colliding patterns + remap hint |
| nav `target.routeId` unknown | error |
| zone id not in the target host's `HostSurfaceDescriptor` | **unknown zone** → error (typo) |
| zone known to the contract family but absent from this host | **known-but-unmounted** → info diagnostic; contribution skipped, NOT quarantined (S-10) |
| zone capacity exceeded | deterministic overflow report naming winners/losers |
| duplicate contribution id within (plugin, family) | error |
| `(family, major)` outside the host's declared window | **quarantine** entry (fix-CLI render state), never a host crash |
| module ref absent from the package export map | error + `plugin dev`/`generate frontend` hint |
| route `path` params ≠ module filename params (`:id` vs `[id].tsx` — K-11) | error naming both syntaxes |

## 4. Install / update / remove lifecycle (S-11)

- **`netscript plugin install`** — post-scaffold wiring gains: regenerate the full replace-set →
  staged `deno check` (incl. `frontend.check.ts`) → atomic swap. A type-broken contribution
  fails install with the real diagnostic.
- **`netscript plugin update`** — same regeneration; contract drift surfaces via doctor + the
  quarantine state, remediation CLI printed.
- **`netscript plugin remove`** (the actual verb —
  `packages/cli/src/public/features/plugins/remove/remove-plugin-command.ts:39-69`; rev 1 said
  "uninstall") — regeneration emits the deterministic empty set for departed plugins, so
  registry/css/island imports can never dangle. Scaffolded **starter** files are app-owned and
  survive removal by design; each starter lands with a provenance header comment naming the
  generating plugin+resource so `plugin doctor` can report orphaned starters without ever
  deleting them.
- **`netscript plugin doctor`** — `frontend` check: envelope/window handshake, zone validity vs
  the host descriptor, export-map presence, **orphan/stale generated-output detection** (a
  registry entry with no installed plugin, a css import with no file, a starter whose plugin is
  gone). The doctor prints the **five-state diagnosis taxonomy verbatim** (unknown zone /
  known-but-unmounted / capacity-rejected / window-mismatch quarantine / load-failure
  quarantine), and every quarantine render card deep-links the doctor command — the taxonomy is
  product surface, not internal vocabulary (K-17).
- Generation is idempotent (byte-identical skip) and **transactional**: stage → check → swap or
  rollback; a failed generation leaves the previous set untouched.

## 5. Gates carried from the ratified dashboard design (unchanged)

Install-time type-check, doctor re-validation, render-time quarantine-not-crash
(`dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` §4, items 2a–2c) —
now with the check module giving the install gate real coverage of deep module edges (S-3/S-11).
