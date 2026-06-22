# Engine & Component Plan (Lume + Vento)

## The key finding: no migration needed — extend, don't replace

The site **already uses Vento** for its layout (`_includes/layouts/base.vto`) and already runs Lume.
The previous build simply never used Lume's **component system** or any reusable doc components — it
authored everything as bare Markdown inside one `.vto` shell. So the "Vento that this project did not
use" gap is really the **component layer**, and closing it is **incremental and cheap**: no engine
swap, no layout rewrite.

### How Lume components work (confirmed from lume.land/docs/core/components)

- Components live in `_components/` and are called as `comp.name({ ...props })` from any `.vto`
  template — **no manual import**, the `comp` object is global.
- A component is a `.vto` file (or a folder `name/comp.vto` + `style.css` + `script.js`).
- **CSS/JS are auto-collected and emitted only if the component is used** (via component front
  matter `css:` / `js:`, gathered into the page's bundle). This means callout/card styles ship only
  on pages that use them — clean and token-friendly.
- Components can be invoked from Markdown via Vento too, but Markdown bodies don't run `comp.*`
  directly; the practical pattern is either (a) author content pages in `.vto` where rich components
  are needed, or (b) keep Markdown for prose and use a small set of **markdown-it conventions** for
  inline callouts. Recommendation below.

### Vento capability (confirmed from vento.js.org)

`{{ }}` for tags + interpolation, `{{ if }}`/`{{ for }}`, pipeline filters `|>`, native async,
`{{ layout }}` for wrapping, `{{ include }}` for partials. This is enough to express every component
we need with props.

## Components to introduce (priority order)

All keyed off the existing `--ns-*` fresh-ui tokens so they match the chrome automatically.

| Component | Props | Used by | Priority |
| --- | --- | --- | --- |
| `comp.callout` | `type` (note/tip/important/warning), `title?`, body slot | every lane | **P0** |
| `comp.tabbedCode` | `tabs: [{label, lang, code}]` | quickstart, capability hubs, tutorials | **P0** |
| `comp.hero` | `tagline`, `ctas: [{label, href, primary?}]` | landing, why | **P0** |
| `comp.featureGrid` + `comp.card` | `items: [{title, body, href, icon?}]` | landing, hubs, zone indexes | **P0** |
| `comp.apiTable` | `rows: [{name, type, desc}]` / adapter matrix | capability hubs, concepts | P1 |
| `comp.learningPath` | ordered `steps: [{label, href}]` | landing, tutorial index | P1 |
| `comp.breadcrumb` | derived from page url + nav | base layout (all pages) | P1 |
| `comp.nextPrev` | `prev?`, `next?` | tutorials, capability lane | P1 |
| `comp.versionBadge` / JSR badge | static | hero/footer | P2 |

## Authoring-format recommendation

Two viable models; recommend a **hybrid**:

- **Prose-heavy pages (concepts, how-to, tutorials)** stay **Markdown** for low-friction authoring and
  to keep `markdown-it-anchor` heading IDs + pagefind working. Add **GitHub-style callout syntax**
  (`> [!NOTE]`, `> [!WARNING]`) rendered by a tiny markdown-it plugin into the `comp.callout` markup,
  so authors get callouts without leaving Markdown. Fenced code already highlights.
- **Marketing/hub pages (landing, why, capability hubs, zone indexes)** become **`.vto`** so they can
  call `comp.hero`, `comp.featureGrid`, `comp.tabbedCode`, `comp.card` directly. These are the pages
  that must "spark"; `.vto` gives full component access.

This keeps the writing cost low where volume is high (prose) and reserves component-rich `.vto` for
the ~15 pages where production polish matters most.

### Tabbed code without islands

The site is static (no Fresh runtime on the docs). `comp.tabbedCode` ships a tiny vanilla
`script.js` (same pattern as the existing theme/sidebar toggles in `base.vto`) that toggles
`.is-active` on tab buttons/panels. No framework, CSP-safe, progressive-enhancement (all tabs visible
if JS fails). Lume auto-collects that script only on pages using the component.

## Cost of migrating layouts to Vento

**Near zero** — the layout is already `.vto`. The only real work is:
1. Create `docs/site/_includes/` is fine; add a `docs/site/_components/` dir (Lume auto-discovers it).
2. Build the P0 components (~1 short file each).
3. Add the markdown-it callout shim (one small `_config.ts` plugin) — optional but high-value.
4. Convert ~15 marketing/hub pages from `.md` to `.vto` (mechanical).

No risk to pagefind, base_path, code-highlight, anchors, or the theme — components reuse the same
tokens and the same build pipeline. Recommend **not** introducing MDX/JSX or any non-Lume engine;
it would fight the existing toolchain for no gain.

## Explicit recommendation

1. **Keep Lume + Vento + the current chrome.** Do not migrate engines.
2. **Add a `_components/` library** (P0 set first) styled on `--ns-*` tokens.
3. **Hybrid authoring:** Markdown + GitHub-callout shim for prose; `.vto` for hero/hub/marketing pages.
4. Treat the components as the visual vocabulary that lifts content from "competent prose" to the
   Laravel/Astro bar.
