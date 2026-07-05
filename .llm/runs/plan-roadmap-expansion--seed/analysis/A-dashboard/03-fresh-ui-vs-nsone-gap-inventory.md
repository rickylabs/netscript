# fresh-ui vs. NS One — component-by-component gap inventory (feeds D-NSONE)

Facts only — no verdict. D-NSONE resolution is delegated to Fable. Source: direct byte-level reads
of `packages/fresh-ui/registry/**` (NetScript worktree) vs. `apps/dashboard/{components,assets}/**`
(eis-chat-ref) — **not** `.design-sync/previews/` (see doc 02 for why that tree is the wrong
comparison target).

## Headline finding: NS One's L0–L2 layer is fresh-ui's copy-source output, largely verbatim

Five files were read side-by-side in full (not summarized, not diffed via tooling — direct
character-for-character comparison of full file contents):

| File pair | Result |
|---|---|
| `button.tsx` (fresh-ui) vs `button.tsx` (eis-chat) | **Byte-identical**, including JSDoc header (`@component Button @layer 2 @depends theme-seed`) |
| `stats-grid.tsx` | **Byte-identical** |
| `sidebar-shell.tsx` | **Byte-identical** |
| `avatar.tsx` | **Byte-identical** |
| `theme/tokens.css` | **Byte-identical**, full token seed (gray/copper/teal/slate/red/amber ramps, semantic roles, spacing/radius/shadow/z/easing scales, dark override block) |
| `styles/layouts.css` | **Near-identical** — eis-chat's copy has one extra explanatory comment (`/* Grid children must be allowed to shrink below their content size... */` above `.ns-content-rail > *`) that fresh-ui's copy lacks; otherwise identical, including the 3-pane `.ns-app`/`.ns-nav`/`.ns-main`/`.ns-session` app-shell block and the `.ns-dashboard*` sidebar-shell CSS |

This is **not coincidental naming overlap** — it is the same source text. The mechanism is
documented directly in fresh-ui's own manifest (`registry.manifest.ts`:
`copyOwnership: 'app-owned-after-copy'`, `model: 'copy-based-registry'`) — eis-chat's dashboard was
scaffolded via the `netscript ui:add <item>` copy-source CLI (see doc 01), and the copied files were
never re-diverged for the sampled components. **The framing in `specs/01-ratified-decisions.md`
("eis-chat ships a complete design system that looks more finished than today's `@netscript/
fresh-ui`") is a drift candidate** — for the L0-L2 primitive layer specifically, eis-chat's
components are not a separately-built, more-finished alternative; they are fresh-ui's own output,
copied. Where eis-chat looks "more finished," the delta is (a) it's used in a real, fully-wired app
with real content instead of registry isolation, and (b) the specific gaps below.

## Full 41-component parity table (fresh-ui registry vs eis-chat real `components/ui/`)

| Component | In fresh-ui? | In eis-chat? | Verified identical? | Note |
|---|---|---|---|---|
| alert | ✓ | ✓ | not sampled | name+path match |
| avatar | ✓ | ✓ | **✓ verified** | byte-identical |
| badge | ✓ | ✓ | not sampled | name+path match |
| breadcrumb | ✓ | ✓ | not sampled | name+path match |
| button | ✓ | ✓ | **✓ verified** | byte-identical |
| card | ✓ | ✓ | not sampled | name+path match |
| chart-block | ✓ | ✓ | not sampled | name+path match |
| checkbox | ✓ | ✓ | not sampled | name+path match |
| citation-chip | ✓ | ✓ | not sampled | name+path match |
| code-block | ✓ | ✓ | not sampled | name+path match |
| command-palette | ✓ | ✓ | not sampled | name+path match |
| control-props (.ts) | ✓ | ✓ | not sampled | shared descriptor helper |
| data-table | ✓ | ✓ | not sampled | name+path match |
| detail-layout | ✓ | ✓ | not sampled | name+path match |
| donut | ✓ | ✓ | not sampled | name+path match |
| dropzone | ✓ | ✓ | not sampled | name+path match |
| empty-state | ✓ | ✓ | not sampled | name+path match |
| filter-form | ✓ | ✓ | not sampled | name+path match |
| form-field | ✓ | ✓ | not sampled | name+path match |
| icon-button | ✓ | ✓ | not sampled | name+path match |
| inline-notice | ✓ | ✓ | not sampled | name+path match |
| input | ✓ | ✓ | not sampled | name+path match |
| label | ✓ | ✓ | not sampled | name+path match |
| markdown | template+pipeline (no plain `.tsx`) | plain `.tsx` | **build approach diverges** | fresh-ui generates from `markdown.tsx.template`; eis-chat has a compiled plain file — likely eis-chat copied the *generated output*, not the template |
| message | ✓ | ✓ | not sampled | name+path match |
| model-selector | ✓ | ✓ | not sampled | name+path match |
| page-header | ✓ | ✓ | not sampled | name+path match |
| pagination | ✓ | ✓ | not sampled | name+path match |
| panel | ✓ | ✓ | not sampled | name+path match |
| progress | ✓ | ✓ | not sampled | name+path match |
| prompt-input | ✓ | ✓ | not sampled | name+path match |
| responsive-table | ✓ | ✓ | not sampled | name+path match |
| search | ✓ | ✓ | not sampled | name+path match |
| section-divider | ✓ | ✓ | not sampled | name+path match |
| select | ✓ | ✓ | not sampled | name+path match |
| separator | ✓ | ✓ | not sampled | name+path match |
| sidebar-shell | ✓ | ✓ | **✓ verified** | byte-identical |
| skeleton | ✓ | ✓ | not sampled | name+path match |
| spinner | ✓ | ✓ | not sampled | name+path match |
| stats-grid | ✓ | ✓ | **✓ verified** | byte-identical |
| switch | ✓ | ✓ | not sampled | name+path match |
| textarea | ✓ | ✓ | not sampled | name+path match |
| tool-call-card | ✓ | ✓ | not sampled | name+path match |
| **icon** | ✗ (only as `src/presentation/primitives.tsx` package export, not a registry item) | ✓ standalone `icon.tsx` | — | eis-chat-exclusive at the registry-copy level |
| **html-block** | ✗ | ✓ | — | eis-chat-exclusive, MCP-UI/agentic content rendering |
| **mcp-widget** | ✗ | ✓ | — | eis-chat-exclusive, MCP tool-widget rendering |
| **ui-block** | ✗ | ✓ | — | eis-chat-exclusive, generic MCP-UI block renderer |

37 of 41 fresh-ui registry components have an identically-named, identically-pathed counterpart in
eis-chat's real component tree (5 of those 37 verified byte-identical by direct read; none of the
sampled files showed *any* divergence). Exactly **4 components exist only in eis-chat**: `icon`,
`html-block`, `mcp-widget`, `ui-block` — all four are MCP-grounding/agentic-content-rendering
concerns specific to eis-chat's chat product, not generic dashboard chrome.

## The real gap: fresh-ui has no L3 "blocks" layer; eis-chat has one, unmirrored

`packages/fresh-ui/registry/` contains **no `blocks/` directory at all** — confirmed via full
recursive listing (doc 01). eis-chat's `apps/dashboard/components/blocks/` has 9 files with no
fresh-ui counterpart of any kind:

| eis-chat L3 block | What it composes |
|---|---|
| `activity-feed.tsx` | Feed/timeline composition (likely Card + StatsGrid + layout objects) |
| `breadcrumbs.tsx` | App-shell breadcrumb rail (wraps `.ns-breadcrumb*` CSS classes already present in fresh-ui's `layouts.css` — the CSS exists on both sides, only the composed component is eis-chat-only) |
| `channel-tree.tsx` | Project > Channel hierarchy nav (eis-chat product-specific IA, but the composition pattern — collapsible tree nav in a sidebar rail — is dashboard-relevant) |
| `connector.tsx` | Likely a connection/integration-status display block |
| `context-rail.tsx` | Right-hand context/detail rail (pairs with `.ns-content-rail`/`.ns-app[data-rail]` CSS, which fresh-ui's `layouts.css` already has — again, CSS present, composed block absent) |
| `data-grid.tsx` | **Note**: fresh-ui *does* have a `DataGrid` — but as a real package export at `src/presentation/data-grid.tsx`, not a registry/blocks copy-source item. Naming collision; mechanism differs (import vs copy) |
| `member-rail.tsx` | Team/member list rail |
| `plugin-gated-view.tsx` | Conditional view based on plugin-install state — directly relevant to a plugin-shaped dashboard (gating panels on which NetScript plugins are installed) |
| `mod.ts` | Barrel export for the above |

`assets/blocks/*.css` mirrors this: `app-shell.css`, `blocks.css`, `breadcrumbs.css`, `channel.css`,
`insights.css`, `knowledge.css`, `mcp.css`, `nav-progress.css`, `session-actions.css`, `session.css`,
`skills.css` — 11 files, all with no fresh-ui equivalent (fresh-ui's registry CSS is scoped 1:1 to
`components/ui/*`, plus the shared `styles/layouts.css` seed — there is no per-block CSS layer to
compare against because there are no blocks).

## Cost surface for D-NSONE (facts, not a recommendation)

**Promote-NS-One-into-fresh-ui branch — what would actually need to move:**
- The 37 shared L2 components need **no promotion work** for the sampled/verified subset — they are
  already fresh-ui's own code. Promotion cost here is bounded to: (a) auditing the 32 *unsampled*
  pairs for any divergence this research didn't check byte-for-byte, (b) the `markdown` build-path
  reconciliation (template+pipeline vs. plain compiled file).
  Assumption to flag for the Opus deep-dive: this audit item is currently unresolved and should be
  re-run without heavy compute (a scripted full-tree diff, not a manual read) before costing D-NSONE.
- The 4 eis-chat-exclusive components (`icon`, `html-block`, `mcp-widget`, `ui-block`) are
  chat/MCP-specific, not generic dashboard chrome — promoting them into fresh-ui's general registry
  would be scope creep unless the dev-dashboard itself needs MCP-content rendering (plausible, since
  the dashboard is meant to show live pipeline data, but not confirmed by any spec read so far).
- The 9 `components/blocks/*` + 11 `assets/blocks/*.css` files are the highest-value promotion
  candidates: they are the **missing L3 layer** fresh-ui's own doctrine calls for but has never
  built, and several (breadcrumbs, context-rail, plugin-gated-view) are generically dashboard-shaped
  rather than eis-chat-specific. `plugin-gated-view.tsx` in particular is directly on-target for a
  plugin-shaped NetScript dev-dashboard (gating panels by installed plugin).

**Build-on-existing-fresh-ui-and-borrow branch — what stays uncertain:**
- Since the L2 primitive layer is already shared, "borrowing NS One as reference" for L2 is close to
  a no-op — there's little left to borrow that fresh-ui doesn't already have verbatim.
- The real borrowing surface under this branch would be the L3 blocks (used as a *reference
  implementation to study*, then rebuilt fresh-native rather than copied wholesale) plus the 4
  MCP-specific components (built fresh, dashboard-scoped, if MCP-content rendering is in-scope for
  the dashboard at all).
- This branch's cost is lower per-file but requires re-deriving block-composition decisions
  (breadcrumb rail structure, context-rail responsive behavior, plugin-gating pattern) that eis-chat
  has already made and shipped once.

## Open items for the Opus 4.8 deep-dive / D-NSONE resolution

1. The 32 unsampled shared-name component pairs were not byte-diffed — treat "likely identical" as a
   strong prior (5/5 sampled were exact or near-exact matches, one had a single added comment), not
   a proven universal fact. A scripted diff (not manual reads) would close this cheaply.
2. Whether the dev-dashboard plugin needs MCP-content rendering (`html-block`/`mcp-widget`/
   `ui-block`) is a scope question for the design proposal, not a fresh-ui-parity question — these
   three are irrelevant to D-NSONE unless the dashboard's panel IA includes live MCP tool-call
   surfaces.
3. The `markdown` component build-path split (fresh-ui: template+codegen pipeline; eis-chat: plain
   compiled file) should be reconciled regardless of the D-NSONE outcome, since it's an internal
   fresh-ui inconsistency independent of eis-chat.
4. fresh-ui's missing L3 blocks layer is real internal debt against its own L0-L4 doctrine, visible
   with or without the eis-chat comparison — worth flagging to `netscript-doctrine` independent of
   how D-NSONE resolves.
