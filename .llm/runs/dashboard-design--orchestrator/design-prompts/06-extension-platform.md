# P6 — Extension Platform: Plugin Registry + Contribution Lifecycle + Scaffold-from-UI

**Revamp the plugin/extension surfaces of the NetScript Dev Dashboard using the published
"NS One" design system**, inside the P1 shell and locked routes. This prompt makes the
long-awaited frontend-contribution story VISIBLE: a contributor writes a NetScript plugin and
wires it into the dashboard (panels, routes, ⌘K actions, AI tools, nav items, entity tabs,
home cards) — and a plugin can contribute into the user's own apps (generate files, wire
config, add deps). FINAL product: the whole lifecycle renders shipped and operable.

Screens: `/plugins` (?tab=installed|available|contributions) → `/plugins/:pluginId`
(?tab=overview|axes|doctor|config) and `/extensions` (?tab=panels|actions|available) →
`/extensions/:extensionId`.

## `/plugins` — the registry/host (dogfood centerpiece)

- **Installed tab:** plugin table — status, version with drift indicator (three-fact drift:
  package version · contract version · peer compatibility), doctor summary, and a
  **contribution footprint** column (mini axis glyph row: routes/db/workers/streams/triggers/
  telemetry/config/CLI/dashboard). The dashboard plugin itself appears in the list.
- **Available tab:** installable plugins (registry cards) with an **Install write**: confirm
  shows what will be generated/wired into the project (file list, config diff, deps) + the CLI
  (`netscript plugin install crons` — the shipped verb; naming canonicalized per #711/#712), Execute → progress → success with "what got wired" summary
  and links. This is the Axis-3 scaffold-from-UI showcase — design the file-diff preview.
- **Contributions tab:** flat list of every UI contribution in the app (panel/action/tool/tab/
  card), each row: kind icon, title, contributing plugin, mount target, status.

## `/plugins/:pluginId` — plugin detail

- **Overview:** identity card (version, publisher, JSR link), health, update write
  (`netscript plugin update auth` confirm with changelog diff).
- **Axes tab — the contribution-axis map as NAVIGATION:** the axis grid where every wired
  axis is a live deep-link (Routes → `/catalog?plugin=…`, Workers → `/workers?plugin=…`,
  Dashboard → `/extensions?plugin=…`, …). Unwired axes render quiet. This map is the
  architecture made tangible — give it hero treatment.
- **Doctor tab:** check rows (ok/degraded/failed) with per-check remediation writes ("Fix:
  bind contract route…" confirm+CLI) and the raw `netscript plugin doctor triggers` line.
- **Config tab:** the plugin's runtime-config topics, linking into `/runtime/overrides/:key`.
- **Create-from-template:** a first-class "New plugin…" flow (from `/plugins` header and ⌘K):
  pick archetype template → name/options typed form → generated-file tree preview + config
  diff → confirm+CLI (`netscript plugin new --template capability my-plugin` — shipped verb; project registration pending #711) → success
  state with "develop your panel" pointers.

## `/extensions` — the extension manager (Axis-6 flagship, NEW surface)

- **Panels tab:** every contributed dashboard panel: preview thumbnail, name, contributing
  plugin (provenance chip), mount target (which route/zone), trust tier badge (first-party /
  verified / sandboxed), enable/disable switch (confirm-gated), version-compat state. A
  quarantined panel state: incompatible contract version → the panel card renders a
  quarantine chrome ("held: built for contract v1, host at v2") with an update write.
- **Actions tab:** contributed ⌘K commands and per-entity contextual actions + contributed AI
  tools (ties to P5's tool registry), each with provenance + permission summary ("reads:
  executions · writes: via confirm only").
- **Available tab:** discoverable third-party extensions (marketplace-lite cards) with the
  same install-write pattern.
- **Injection-zone inspector** (the DX loveletter): an overlay toggle ("Show zones") that,
  when on, renders every extension mount point in the CURRENT app chrome as an annotated
  outline (zone id, accepted contribution kinds, current occupant). Design the overlay state
  on the Home screen as the demo.
- **Permission prompt:** the dialog shown when a newly installed extension first activates —
  what it can read, which zones it mounts, what it may propose to write; allow/deny per
  capability. Sandboxed (third-party) panels render inside a visibly framed container with
  the provenance chip persistent.

## `/extensions/:extensionId` — extension detail

Manifest view (kinds contributed, zones, contract version, permissions), provenance +
signature, per-contribution status, changelog, disable/remove writes, and a **"Develop"
panel**: the local dev loop — hot-reload status dot, "open source", contract-version
handshake state — designed as a real DX surface (the "write a panel in an afternoon" story).

**Dogfood proof everywhere:** first-party capability consoles (P3) show tiny provenance
chips ("contributed by workers plugin") in their headers; the Home contributed-panels row
links here; the ⌘K palette marks contributed commands. The platform is not a settings page —
it is visible throughout the product.

**States:** empty (no third-party extensions — teaching state with the create-from-template
CTA), install in-flight, quarantined, permission-pending, disabled, drifted, healthy-full.

**Reach for:** `data-table`, `ns-axismap` (as nav), `plugin-gated-view` (repurposed as
quarantine chrome), `ns-confirm`, `ns-diff` (file/config previews), `badge`, `ns-chip`,
`switch`, `code-block`, `ns-kv`, `empty-state`, `Card` grid for marketplace.

**Market bar:** the best extension ecosystems (Directus's typed extension taxonomy, Nuxt
DevTools' contributed tabs, Medusa's admin widgets/zones, VS Code's provenance+permission
model) each own a piece; none render the contribution system inside the product with zone
inspection, trust tiers, AND scaffold-into-your-app writes. Combining those into one visible
platform surface is the category move.

**Non-goals:** no code editor; no npm-style browsing beyond the curated cards; extension
sandboxing chrome must never look like an error state.

**Theme:** NS One tokens; light+dark; provenance chips use muted tone (never compete with
status); reduced-motion.

## CLI dependency map (epic #701 — beta.9 foundation; verbs marked pending do not exist yet)

| Surface | CLI verb | Status | Issue |
|---|---|---|---|
| Available-tab Install write | `plugin install` | exists (prompt strings use the shipped verb) | #711/#712 naming |
| Plugin update w/ changelog diff | `plugin update <installed-name>` re-pin semantics | pending (today: pass-through, no installed-vs-latest fact) | #711 |
| Create-from-template | `plugin new --template` (+ `--register`) | partial (registration pending) | #711 |
| Extension quarantine "built for v1, host at v2" | `contract version add` (v2) | pending (ContractVersion hard-locked to v1) | #706 |
| Contribution seam (7-member family) framework precondition | dashboard-panel contribution axis | pending | #711 item 4 / #427 |
| Doctor per-check remediation writes | backend set / bind route / … | pending (spread) | #709/#711/#706 |
| Scaffold-from-UI web layer ("New page/island…") | `ui:add page\|island`, `ui:list --json`, `ui:update\|remove` | pending | #707 |
