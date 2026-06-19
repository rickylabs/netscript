# Phase 0b — docs-site engine config (Codex slice brief)

**Lane:** docs/site infrastructure only. Touches `docs/site/_config.ts` (+ a small
markdown-it shim module under `docs/site/`). **Do NOT touch `packages/`, `plugins/`,
version pins, `scaffold-versions.ts`, the catalog, or lock files.** One commit slice;
commit + push + PR #59 comment when done.

**Goal.** Make prose front-door pages render fully (markdown prose + marketing
components + callouts), unblocking wave-1b (`_drafts/why.vto`, `_drafts/quickstart.vto`).

## Verified facts (supervisor prototyped these in an isolated Lume build — rely on them)

- Lume `@v2.5.4` registers a `comp` Vento tag. Correct syntax:
  - body: `{{ comp NAME { args } }}` … body … `{{ /comp }}` (body injected as `content`)
  - self-close: `{{ comp NAME { args } /}}`
  - no-body string form: `{{ comp.NAME({...}) }}`
- Markdown does NOT render inside a `.vto` page by default.
- **`templateEngine: [vento, md]` in page front matter renders the page through Vento
  THEN markdown** — so `{{ comp ... }}` tags expand first, then page-level markdown
  (`##`, `**bold**`, lists, links, fenced code) renders. VERIFIED working.
- markdown-it does NOT process markdown inside the HTML a component emits (block-level
  HTML is opaque). So **callouts inside prose pages must use a markdown blockquote shim**
  (`> [!NOTE]` / `> [!TIP]` / `> [!IMPORTANT]` / `> [!WARNING]`), NOT the `comp callout`
  tag — the shim runs in the markdown engine so its body markdown renders. Marketing
  components that take structured args (hero, tabbedCode, featureGrid, apiTable,
  learningPath) stay as `comp` tags and are unaffected.

## Tasks (in priority order; #1–#2 unblock wave-1b)

1. **GitHub-callout shim (markdown-it plugin).** Add a small markdown-it plugin
   (`docs/site/_callout-shim.ts` or inline in `_config.ts`) that converts GitHub-style
   alert blockquotes into the same `.ns-callout` markup the `comp.callout` component
   emits (reuse the classes in `docs/site/_components/callout.vto`:
   `ns-callout ns-callout--{note|tip|important|warning}`, `__icon`, `__title`, `__body`).
   Wire it into the existing `markdown.plugins` array in `_config.ts` (which already
   loads `markdown-it-anchor`). Acceptance: a `.md`/chained page containing
   `> [!TIP]\n> body **bold**` emits a `.ns-callout--tip` with rendered bold.
2. **Confirm the chain engine path for prose pages.** Ensure pages can opt into
   `templateEngine: [vento, md]` (front matter) — this already works with default Lume;
   add a one-line doc comment in `_config.ts` noting prose pages use it. No code needed
   beyond confirming markdown + vento are both active (they are).
3. **Shiki code highlighting (plan TD-6 upgrade).** The repo currently uses Lume's
   `code_highlight` plugin. If the locked plan calls for Shiki, swap per `09 §3` D-E2
   (Shiki Phase-0b compat acceptance). If `code_highlight` already satisfies the bar,
   record that and skip. Do not regress the current green build.
4. **Sitemap + base_path acceptance (D-E4).** Add the Lume `sitemap` plugin; verify URLs
   carry the `/netscript/` base (the `base_path` plugin must still run LAST). Acceptance:
   `_site/sitemap.xml` exists with base-prefixed locs.
5. **`api-cite.ts` accuracy gate (plan Global Acceptance Bar #1, two-tier).** Implement
   the gate script described in `docs/site/_plan/briefs/00-INDEX.md` /
   `09 §8`: it checks that each page's cited `@netscript/*` symbols exist in the public
   surface (worklog floor + deno-doc cite). This is the Phase-0b gate SCRIPT the plan
   specified concretely; wire it as a `deno task` under `docs/site` or `.llm/tools/`.

## Validation
- `deno task --cwd docs/site build` stays GREEN (currently 80 files, 0 errors).
- A scratch prose page with `templateEngine: [vento, md]` + a `> [!TIP]` shim callout +
  a `{{ comp hero {...} /}}` renders all three correctly.

## After this slice
Supervisor (or a docs workflow) runs **wave-1b**: re-home `_drafts/why.vto` +
`_drafts/quickstart.vto` → live prose pages using `templateEngine: [vento, md]`, the
`comp` tag syntax for marketing components, and `> [!...]` shim callouts. The prose
CONTENT and the B2 worklogs (`_plan/worklog/{why,quickstart}.md`) are already good.
Then Stage-5 IMPL-EVAL (OpenHands minimax-m3) benchmarks the full front door.
