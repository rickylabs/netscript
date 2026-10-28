import { DOCS_SITE_LOCATION } from './_plugins/llms-policy.ts';
import lume from 'lume/mod.ts';
import basePath from 'lume/plugins/base_path.ts';
import nav from 'lume/plugins/nav.ts';
import redirects from 'lume/plugins/redirects.ts';
import pagefind from 'lume/plugins/pagefind.ts';
import codeHighlight from 'lume/plugins/code_highlight.ts';
import anchor from 'markdown-it-anchor';
import langBash from 'highlight.js/bash';
import langJson from 'highlight.js/json';
import langTypescript from 'highlight.js/typescript';
import langPython from 'highlight.js/python';
import langPowershell from 'highlight.js/powershell';
import langMarkdown from 'highlight.js/markdown';
import langIni from 'highlight.js/ini';
import langYaml from 'highlight.js/yaml';
import langCss from 'highlight.js/css';
import langDiff from 'highlight.js/diff';
import langSql from 'highlight.js/sql';
import langXml from 'highlight.js/xml';
import langJavascript from 'highlight.js/javascript';
import {
  assertCodeLanguage,
  codeFilename,
  LANGUAGE_LABELS,
} from '../../tools/docs-site/code-languages.ts';
import { resolveXref } from './_data/xref.ts';
import { assertDiagramAssetsExist } from './_diagrams/validate.ts';
import { aiTooling } from './_plugins/ai-tooling.ts';
import { getDocsLane } from './_data.ts';
import { apiKind } from '../../tools/docs-site/api-kinds.ts';
import { inlineUtilityDiagram } from '../../tools/docs-site/inline-diagram.ts';

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
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

const plaintextLanguage = () => ({
  name: 'Plain text',
  contains: [],
});

const site: ReturnType<typeof lume> = lume({
  location: new URL(DOCS_SITE_LOCATION),
  src: '.',
  dest: '_site',
}, {
  markdown: {
    plugins: [[anchor, { slugify, level: [1, 2, 3, 4] }]],
  },
});

// Copy CSS + favicon to _site verbatim; base_path prefixes their hrefs at build.
site.copy('styles');
site.copy('favicon.svg');

// Committed static diagram SVGs (OD1) + other site assets; base_path prefixes hrefs.
site.copy('assets');

site.addEventListener('beforeBuild', async () => {
  await assertDiagramAssetsExist();
});

// xref (OD2/OD3): resolve a stable key -> href. Throws on an unknown key so the
// Lume build exits non-zero (build = link checker). Filter form returns the href:
//   {{ "cap:services" |> xref }}
site.filter('xref', (key: string) => resolveXref(key).href);
site.filter('slugify', slugify);
site.filter('apiKind', apiKind);
site.filter('languageLabel', (language: string) => LANGUAGE_LABELS[language] ?? language);
site.filter('codeFilename', codeFilename);
// Inline presentation inherits the page scheme; the original SVG remains available to twins.
site.filter('utilityDiagram', (src: string, alt: string) => {
  if (!/^\/assets\/diagrams\/[a-z0-9-]+\.svg$/.test(src)) {
    throw new Error(`Unsupported diagram source: ${src}`);
  }
  const source = Deno.readTextFileSync(new URL(`.${src}`, import.meta.url));
  return inlineUtilityDiagram(source, alt, `diagram-${crypto.randomUUID()}`);
});

// Inline-code (ic): comp string args are emitted raw and are NOT markdown-
// processed, so `code` spans authored with backticks render as literal backtick
// characters. This filter converts backtick pairs to real <code> in component
// fields that emit author text (apiTable caption/cells/desc), matching how the
// markdown body already renders inline code. Leaves existing HTML untouched.
site.filter(
  'ic',
  (s: unknown) => typeof s === 'string' ? s.replace(/`([^`]+)`/g, '<code>$1</code>') : (s ?? ''),
);

// Expose the resolver + raw map as global data for `comp.xref` (so the component
// resolves without an in-template import). Throws on unknown key inside the build.
site.data('resolveXref', resolveXref);
site.data('getDocsLane', getDocsLane);

// Multilevel sidebar (docs-v5 IA): nav.menu()/nav.breadcrumb() derive the tree
// from page URLs; the sidebar lanes are curated in `_data.ts` `navLanes`.
site.use(nav());

// Moved-URL shims: pages declare `oldUrl` front matter and the plugin emits a
// meta-refresh page at the old URL (GitHub Pages cannot 301). Registered before
// base_path so the generated pages get base-prefixed hrefs like everything else.
site.use(redirects());

// Registration and labels are checked together; no fence silently falls back to plain text.
const codeLanguages = {
  bash: langBash,
  sh: langBash,
  shell: langBash,
  json: langJson,
  jsonc: langJson,
  ts: langTypescript,
  tsx: langTypescript,
  typescript: langTypescript,
  js: langJavascript,
  javascript: langJavascript,
  jsx: langJavascript,
  python: langPython,
  py: langPython,
  powershell: langPowershell,
  ps1: langPowershell,
  md: langMarkdown,
  markdown: langMarkdown,
  dotenv: langIni,
  yaml: langYaml,
  yml: langYaml,
  css: langCss,
  diff: langDiff,
  sql: langSql,
  xml: langXml,
  html: langXml,
  text: plaintextLanguage,
  plaintext: plaintextLanguage,
  'no-highlight': plaintextLanguage,
  prisma: plaintextLanguage,
};
for (const language of Object.keys(LANGUAGE_LABELS)) {
  assertCodeLanguage(language, Object.keys(codeLanguages));
}
site.use(codeHighlight({ languages: codeLanguages }));

// Build the static index; custom and fallback UIs load only when requested.
site.use(pagefind({ ui: false }));

// These states belong in rendered HTML as well as in the browser enhancement path.
site.addEventListener('afterRender', () => {
  for (const page of site.pages) {
    const document = page.document;
    if (!document) continue;
    const cue = document.querySelector('[data-owned-source]');
    const lede = document.querySelector('.ns-prose > h1 + p');
    if (cue && lede?.parentNode) {
      cue.removeAttribute('hidden');
      lede.parentNode.insertBefore(cue, lede.nextSibling);
    }
    const sourceUrl = String(page.data.url ?? '');
    const currentUrl = site.options.location.pathname.replace(/\/$/, '') + sourceUrl;
    for (const link of document.querySelectorAll('.ns-learning-path__link')) {
      const href = link.getAttribute('href');
      if (href === currentUrl || href === sourceUrl) link.setAttribute('aria-current', 'step');
    }
    for (const region of document.querySelectorAll('.ns-prose pre, .ns-prose table')) {
      region.setAttribute('tabindex', '0');
    }
    for (const tree of document.querySelectorAll('.ns-file-tree--root')) {
      if (!tree.querySelector('li')) throw new Error(`Empty file tree on ${sourceUrl}`);
    }
    for (const figure of document.querySelectorAll('.ns-diagram')) {
      const image = figure.querySelector('img');
      const svg = figure.querySelector('svg[role="img"]');
      if (
        !image?.hasAttribute('hidden') || image.getAttribute('loading') !== 'lazy' ||
        !svg || svg.getAttribute('aria-label') !== image.getAttribute('alt')
      ) {
        throw new Error(`Diagram source or accessible name missing on ${sourceUrl}`);
      }
    }
    // Reference Markdown tables and the component share one visible kind-tag anatomy.
    for (const table of document.querySelectorAll('.ns-prose table')) {
      if (table.classList.contains('ns-api-table')) continue;
      const headings = [...table.querySelectorAll('thead th')];
      const kindColumn = headings.findIndex((head) => head.textContent?.trim() === 'Kind');
      if (kindColumn < 0) continue;
      const rows = [...table.querySelectorAll('tbody tr')];
      if (!rows.some((row) => apiKind(row.querySelectorAll('td')[kindColumn]?.textContent))) {
        continue;
      }
      table.classList.add('ns-api-table');
      table.setAttribute('data-variant', 'symbols');
      for (const row of rows) {
        const cells = [...row.querySelectorAll('td')];
        for (const [index, cell] of cells.entries()) {
          const column = headings[index]?.textContent?.trim();
          if (column === 'Symbol' || column === 'Name') cell.classList.add('ns-api-table__name');
          if (column === 'Signature' || column === 'Type') cell.classList.add('ns-api-table__type');
        }
        const cell = cells[kindColumn];
        const label = cell?.textContent?.trim();
        const kind = apiKind(label);
        if (!cell || !kind) continue;
        const tag = document.createElement('span');
        tag.className = 'ns-api-kind';
        tag.setAttribute('data-kind', kind);
        tag.textContent = label ?? kind;
        cell.textContent = '';
        cell.appendChild(tag);
      }
    }
    // Frame Markdown fences at build time so labels and filenames also work without JavaScript.
    for (const pre of document.querySelectorAll('.ns-prose pre')) {
      const code = pre.querySelector('code');
      if (!code) continue;
      const language = code.className.match(/language-([\w-]+)/)?.[1] ?? 'text';
      assertCodeLanguage(language, Object.keys(codeLanguages));
      if (pre.closest('[data-code-block]')) continue;
      const frame = document.createElement('div');
      frame.className = 'ns-code-block';
      frame.setAttribute('data-code-block', '');
      const header = document.createElement('div');
      header.className = 'ns-code-header';
      header.setAttribute('data-twin-ignore', '');
      header.setAttribute('data-pagefind-ignore', '');
      const filename = codeFilename(code.textContent ?? '');
      if (filename) {
        const path = document.createElement('span');
        path.className = 'ns-code-path';
        path.textContent = filename;
        path.setAttribute('title', filename);
        header.appendChild(path);
      }
      const label = document.createElement('span');
      label.className = 'ns-code-language';
      label.textContent = LANGUAGE_LABELS[language];
      header.appendChild(label);
      const button = document.createElement('button');
      button.className = 'ns-copy-btn js-only';
      button.setAttribute('type', 'button');
      button.setAttribute('data-code-copy', '');
      button.setAttribute('aria-label', `Copy ${filename ?? LANGUAGE_LABELS[language]} code`);
      button.textContent = 'Copy';
      header.appendChild(button);
      const body = document.createElement('div');
      body.className = 'ns-code-body';
      const gutter = document.createElement('div');
      gutter.className = 'ns-code-gutter';
      gutter.setAttribute('aria-hidden', 'true');
      gutter.setAttribute('data-pagefind-ignore', '');
      gutter.textContent = (code.textContent ?? '').replace(/\n$/, '').split('\n')
        .map((_, index) => index + 1).join('\n');
      pre.parentNode!.insertBefore(frame, pre);
      body.appendChild(gutter);
      body.appendChild(pre);
      frame.appendChild(header);
      frame.appendChild(body);
    }
    const headingIds = new Set(
      [...document.querySelectorAll('.ns-prose :is(h1,h2,h3,h4)[id]')].map((h) => h.id),
    );
    for (const row of document.querySelectorAll('.ns-api-table__identity[id]')) {
      if (headingIds.has(row.id)) row.removeAttribute('id');
      else headingIds.add(row.id);
    }
  }
});

// MUST run last: rewrite every root-relative href/src to the /netscript/ base (TD-1).
site.use(basePath());

// AI-affordance tooling (SOTA rec #1): per-page Markdown twins + tiered llms.txt.
// Registered last so its `afterRender` pass runs after pagefind's indexing but
// before the `base_path` processor — body hrefs are still root-relative and are
// absolutised inside the plugin; the emitted `.md`/`.txt` pages skip base_path.
site.use(aiTooling());

// Permalinks are presentation: add them after Markdown twins have captured clean headings.
site.addEventListener('afterRender', () => {
  for (const page of site.pages) {
    const document = page.document;
    if (!document) continue;
    for (const heading of document.querySelectorAll('.ns-prose :is(h2,h3,h4)[id]')) {
      const anchor = document.createElement('a');
      anchor.className = 'ns-heading-anchor';
      anchor.setAttribute('data-pagefind-ignore', '');
      anchor.setAttribute('href', `#${heading.id}`);
      anchor.setAttribute('aria-label', 'Permalink');
      heading.appendChild(anchor);
    }
  }
});

export default site;
