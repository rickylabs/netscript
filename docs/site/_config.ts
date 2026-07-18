import lume from "lume/mod.ts";
import basePath from "lume/plugins/base_path.ts";
import nav from "lume/plugins/nav.ts";
import redirects from "lume/plugins/redirects.ts";
import pagefind from "lume/plugins/pagefind.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import anchor from "npm:markdown-it-anchor@9.2.0";
import langBash from "npm:highlight.js@11.11.1/lib/languages/bash";
import langJson from "npm:highlight.js@11.11.1/lib/languages/json";
import langTypescript from "npm:highlight.js@11.11.1/lib/languages/typescript";
import { resolveXref } from "./_data/xref.ts";
import { assertDiagramAssetsExist } from "./_diagrams/validate.ts";
import { aiTooling } from "./_plugins/ai-tooling.ts";

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
 *
 * xref (OD2): the `xref` filter + `comp.xref` resolve stable keys from
 * `_data/xref.ts` to hrefs and THROW on an unknown key, so the build is the link
 * checker (it exits non-zero on a dead reference). `resolveXref` is also exposed
 * as global data so `comp.xref` can resolve without importing inside Vento.
 */
function slugify(str: string): string {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

const plaintextLanguage = () => ({
  name: "Plain text",
  contains: [],
});

const site: ReturnType<typeof lume> = lume({
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

// Committed static diagram SVGs (OD1) + other site assets; base_path prefixes hrefs.
site.copy("assets");

site.addEventListener("beforeBuild", async () => {
  await assertDiagramAssetsExist();
});

// xref (OD2/OD3): resolve a stable key -> href. Throws on an unknown key so the
// Lume build exits non-zero (build = link checker). Filter form returns the href:
//   {{ "cap:services" |> xref }}
site.filter("xref", (key: string) => resolveXref(key).href);

// Inline-code (ic): comp string args are emitted raw and are NOT markdown-
// processed, so `code` spans authored with backticks render as literal backtick
// characters. This filter converts backtick pairs to real <code> in component
// fields that emit author text (apiTable caption/cells/desc), matching how the
// markdown body already renders inline code. Leaves existing HTML untouched.
site.filter(
  "ic",
  (s: unknown) =>
    typeof s === "string"
      ? s.replace(/`([^`]+)`/g, "<code>$1</code>")
      : (s ?? ""),
);

// Expose the resolver + raw map as global data for `comp.xref` (so the component
// resolves without an in-template import). Throws on unknown key inside the build.
site.data("resolveXref", resolveXref);

// Multilevel sidebar (docs-v5 IA): nav.menu()/nav.breadcrumb() derive the tree
// from page URLs; the sidebar lanes are curated in `_data.ts` `navLanes`.
site.use(nav());

// Moved-URL shims: pages declare `oldUrl` front matter and the plugin emits a
// meta-refresh page at the old URL (GitHub Pages cannot 301). Registered before
// base_path so the generated pages get base-prefixed hrefs like everything else.
site.use(redirects());

// Syntax highlighting for fenced code blocks (TD-6).
site.use(codeHighlight({
  languages: {
    bash: langBash,
    sh: langBash,
    shell: langBash,
    json: langJson,
    ts: langTypescript,
    tsx: langTypescript,
    typescript: langTypescript,
    text: plaintextLanguage,
    plaintext: plaintextLanguage,
    "no-highlight": plaintextLanguage,
    prisma: plaintextLanguage,
  },
}));

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

// AI-affordance tooling (SOTA rec #1): per-page Markdown twins + tiered llms.txt.
// Registered last so its `afterRender` pass runs after pagefind's indexing but
// before the `base_path` processor — body hrefs are still root-relative and are
// absolutised inside the plugin; the emitted `.md`/`.txt` pages skip base_path.
site.use(aiTooling());

export default site;
