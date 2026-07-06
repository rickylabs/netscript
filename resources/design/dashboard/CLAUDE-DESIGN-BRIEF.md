# NetScript Dev Dashboard — Claude Design Brief

> Canvas project: **NetScript — NS One** (`ec262e10-d4ad-451f-9aeb-e51955db3634`).
> Design system: `@netscript/ns-one` — the full `@netscript/fresh-ui` registry synced at 100%
> parity by `tools/design-sync/` (44 preview cards + 8 interactive primitives on the `NSOne`
> global). Read the seeded `README.md` (conventions) before designing anything.

## 1. What this is

NetScript is a Deno-native full-stack framework: apps are composed from plugins (workers, sagas,
triggers, streams, auth, …), orchestrated locally by an Aspire apphost, and driven by one CLI. The
**Dev Dashboard** is its local-first dev console — auto-launched with the stack, live-updating,
derived from the developer's own code and scaffold output.

The thesis to design for: **the dashboard is how you drive the framework, and the tool that
controls your plugins is itself a plugin.** It is not a monitoring afterthought; it is the manage
surface. Encore's Flow and API Explorer, Temporal's event history, Inngest's two-panel run view,
and Appwrite's per-capability console are the reference class — NetScript's twist is that every
capability section is *contributed by the plugin it manages*, through the same seam third parties
will use.

## 2. Information architecture (locked — do not re-derive)

Three tiers, one shell:

1. **Cross-cutting panels** (framework-wide):
   - **Stack Map** — live infrastructure graph of every Aspire resource (services, workers,
     containers, databases, caches). Node → health, endpoints, quick actions; clicking a node
     filters the other panels. Precedent: Encore Flow.
   - **Service Catalog + API Explorer** — every plugin's oRPC contract, introspected. Endpoint
     list → call form with params pre-filled from the schema → typed live response. Precedent:
     Encore's catalog/explorer.
   - **Flow / Trace Waterfall** — trace list → two-panel waterfall (timeline left, span detail
     right) with inline logs. This panel renders the flagship cross-service trace (HTTP enqueue →
     workers API → worker execution → callback write → stream fan-out); it is the run's hero
     surface.
   - **Run Inspector** — all runs across plugins: filterable run list (status/type/time, live) →
     run detail (inputs/results) → step timeline with attempt badges. All/Compact/JSON view
     toggle. Precedent: Temporal + Inngest.
   - **Logs** — live structured logs + captured browser console logs; filter by resource and
     severity; follow mode.
   - **Resource Control** — start/stop/restart per resource; composite "reset stack" action; every
     action is also a CLI command (design the affordance to say so). Confirmation and parameter
     prompts are one standard dialog generated from the command's typed arguments +
     confirmation message — never bespoke per-action modals.
2. **Per-capability sections** — one per installed plugin category: **workers · sagas · triggers ·
   streams** in this prototype. Each follows Appwrite's loop: **create** (fastest-path action) →
   **configure** (tabbed settings, distinct from create) → **monitor** (its own status vocabulary,
   deep-linking into Run Inspector / Flow filtered to that capability — never a duplicated trace
   renderer).
3. **Plugin Control** — the host: installed-vs-available plugins, health/doctor verdicts, and the
   mount point where contributed sections appear. Sections a plugin contributes render here; the
   dashboard's own four first-party sections use the same mechanism.

Shell: persistent sidebar nav (cross-cutting panels + one entry per installed capability),
breadcrumbs, topbar with environment/stack identity, theme toggle, command palette (`⌘K` — the DS
ships `CommandPalette`). A detail rail (context-rail block) carries selection detail on wide
viewports.

## 3. Design system rules (hard)

- **Tokens only.** Every color, space, radius, and type size is a `--ns-*` token. Never raw hex —
  including chart and graph colors (derive series colors from intent tokens via `color-mix()`).
- **Light is the default brand look** (warm cream); dark is `[data-theme='dark']`. Every screen
  ships in both themes and must be designed theme-blind.
- **Compose before inventing.** L2 components and L3 blocks in the seeded system are the palette.
  A new component is proposed only when composition genuinely fails, and then it follows the
  `ns-<block>__<part>` class contract with `data-state`/`data-part` state — it will be synced back
  to source (see PROPOSED-COMPONENTS.md).
- **Native-first interactions.** The DS's interactive primitives (Dialog, Tabs, Popover, Drawer,
  Sheet, Combobox, Accordion, Tooltip) are real and on the `NSOne` global — use them rather than
  inventing overlay/disclosure behavior.
- Components take `class`, not `className`.

## 4. Content and voice

- Real, plausible dev-stack content: services named like `api`, `workers`, `eis-chat`; queue
  depths, span durations, attempt counts. Numbers must look measured, not marketed — no invented
  benchmark claims, no superlatives.
- Status vocabulary is factual and consistent: `running · completed · failed · retrying · queued ·
  degraded`. One word per state, used identically across panels.
- UI copy is terse and instrumental. No marketing tone anywhere in the console; no
  candor-announcing phrasing ("honestly", "to be transparent") in any copy.
- Empty states teach the loop: what this panel shows, the one command or action that produces the
  first data, nothing else.

## 5. Prototype scope

**Pass 1 (this brief):** shell + Stack Map + Flow/Trace Waterfall + Service Catalog/API Explorer +
Run Inspector — each ×light/dark. Success = the promote-set blocks (see PROPOSED-COMPONENTS.md §2)
prove themselves in real composition, and the flagship trace reads clearly in the waterfall.

**Pass 2 (after re-sync):** Plugin Control, Logs, Resource Control + the four per-capability
sections (workers/sagas/triggers/streams), each showing the create → configure → monitor loop.

Every screen is a full-page composition, not an isolated component shot. Prefer information-dense,
calm layouts: the audience is a developer with the stack running, glancing between editor and
console.
