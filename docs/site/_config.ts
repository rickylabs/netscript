import lume from "lume/mod.ts";
import basePath from "lume/plugins/base_path.ts";
import pagefind from "lume/plugins/pagefind.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import anchor from "npm:markdown-it-anchor@9.2.0";

/**
 * NetScript external user documentation site (Diátaxis IA).
 *
 * US-3: Lume static-site generator, deploy target GitHub Pages.
 * US-7: GitHub project Pages live at a subpath (`/netscript/`), so `location`
 *       MUST be set to the exact base URL or every asset/link breaks. The
 *       `base_path` plugin rewrites every root-relative `href`/`src` in built
 *       HTML to include `location.pathname`, fixing body links + assets globally
 *       (TD-1) without hand-editing markdown links.
 *
 * Theme (TD-1..TD-11): the SidebarShell chrome lives in
 * `_includes/layouts/base.vto`; CSS keyed off the fresh-ui `--ns-*` tokens lives
 * in `styles/` and is copied to `_site` as a site asset (so base_path prefixes
 * the stylesheet href). Search = pagefind; code highlighting = code_highlight.
 *
 * Heading IDs: markdown-it-anchor adds GitHub-style slug ids to h1–h4 on every
 * page so in-page `#anchor` links (per-page TOC, Internals sections) resolve.
 */
function slugify(str: string): string {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

const site = lume({
  location: new URL("https://rickylabs.github.io/netscript/"),
  src: ".",
  dest: "_site",
}, {
  markdown: {
    plugins: [[anchor, { slugify, level: [1, 2, 3, 4] }]],
  },
});

// Copy CSS + favicon to _site verbatim; base_path prefixes their hrefs at build.
site.copy("styles");
site.copy("favicon.svg");

// Syntax highlighting for fenced code blocks (TD-6).
site.use(codeHighlight());

// Static client-side search; mounts the pagefind UI into #search (TD-5).
site.use(pagefind({
  ui: {
    containerId: "search",
    showImages: false,
    showEmptyFilters: false,
    resetStyles: false,
  },
}));

// MUST run last: rewrite every root-relative href/src to the /netscript/ base (TD-1).
site.use(basePath());

export default site;
