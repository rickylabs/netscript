# Research — 2026-11-01

Baseline `0af8fd9e7904ee2c848d0a4213c7853edec3ad21`; live #2570 body/comments read.
No existing PR covers the assignment. #2488 remains open; current main already
ships SidebarShell, PageHeader, StatsGrid, EmptyState and CommandPalette, with
older contracts. Compose those APIs now; adopt additions only after main merges.

## Verified source facts

- `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts`
  installs the foundation and renders manifest-owned template assets. It supplies
  service names even when no service is emitted. New template assets need manifest,
  loader and embedded carrier registration.
- `app/routes/dashboard.tsx.template` fabricates three service rows and its view
  invents health, queue and latency figures. Home hardcodes six routes and NS One.
- `app/lib/theme.ts.template` already reads the configured theme-preset JSON and
  exposes `appTheme().label`; reuse this instead of adding theme metadata.
- `app/router.ts.template` is the stable typed entrypoint over generated routes.
  `navigation.ts` is the supported extension point for ui:add / ui:remove.
- The service writer already generates contract-derived clients and query factories
  in `routes/examples/<service>/(_lib)/service-query.ts`. New record pages must reuse
  that contract, not invent a business schema or a demo transport.
- Browser auth reconciliation writes `routes/auth/[action].ts` and root
  `auth/bff.ts`. Supported actions are session, signin, callback, signout. Signin
  is provider redirect via same-origin POST; a password form would be fake.
- Registry SidebarShell supplies desktop/mobile regions and topbar slots;
  CommandPalette supplies Dialog/Combobox behavior. Do not reimplement them.
- `--preset` is applied after base generation, so the theme must be read at runtime.
- Existing CLI browser-session source detection debt remains scoped to its own
  reconciler. Do not extend its heuristic to arbitrary authored contracts.

## Visual sources inspected

Utility dashboard-light, orders-dark, settings-light, sign-in-dark and command-light
PNGs plus component-spec sections B7 and L1–L3. The dashboard uses a narrow sidebar,
48px topbar, large restrained heading, four ruled KPIs and a 2:1 table/activity split.
Orders use a dense table and right detail pane. Settings use a local section rail
and two form columns. Sign-in is chromeless with a narrow auth column and supporting
setup column. Command is a centered dialog over the shell. Empty data must preserve
this geometry without inventing commerce rows, deltas, people or notifications.

## Publication risk

Archetype 6, doctrine verdict Keep. No new package exports or dependencies planned.
Template-generated exports receive explicit contracts. Apply JSR audit to CLI;
embedded template and publish carriers must be regenerated and verified. No new
slow-type exemption or suppression is permitted.
