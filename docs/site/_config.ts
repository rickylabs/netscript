import lume from "lume/mod.ts";
import anchor from "npm:markdown-it-anchor@9.2.0";

/**
 * NetScript external user documentation site (Diátaxis IA).
 *
 * US-3: Lume static-site generator, deploy target GitHub Pages.
 * US-7: GitHub project Pages live at a subpath, so `location` MUST be set to
 *       the exact base URL or every asset/link breaks.
 *
 * Heading IDs: Lume's default markdown engine emits headings without `id`
 * attributes, so in-page `#anchor` links (the per-page "Sub-path exports" TOC,
 * the "Internals" plugin sections, and the database section TOC) do not resolve.
 * markdown-it-anchor adds GitHub-style slug ids to h1–h4 on every page.
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

export default site;
