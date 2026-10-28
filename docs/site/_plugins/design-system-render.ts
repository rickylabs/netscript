import {
  ASSET_ROOT,
  DESIGN_ROOT,
  type DesignSources,
  guidelineSection,
  type Preview,
  SCHEMES,
  SOURCE_ROOT,
  type Theme,
  themeUrl,
  valueRows,
} from './design-system.ts';
import type { MarkdownRenderer } from './design-system-markdown.ts';

export interface DesignPage {
  url: string;
  title: string;
  layout: string;
  content: string;
  order: number;
}

const GROUP_LABELS: Record<string, string> = {
  colors: 'Colours',
  typography: 'Typography',
  rounded: 'Radii',
  spacing: 'Spacing',
  components: 'Component recipes',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character;
  });
}

/** Rewrite source-relative links after Markdown rendering, including reference-style links. */
export function sourceLinks(html: string, sourcePath: string): string {
  return html.replace(/\b(href|src)="([^"#][^"]*)"/g, (original, attribute, target: string) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(target)) return original;
    const resolved = new URL(target.replaceAll('&amp;', '&'), `${SOURCE_ROOT}${sourcePath}`);
    const theme = resolved.pathname.match(/\/docs\/design-system\/themes\/([^/]+)\/DESIGN\.md$/);
    let url = resolved.href;
    if (attribute === 'href' && theme && theme[1] !== '_template') {
      url = `${themeUrl(theme[1])}${resolved.hash}`;
    } else if (attribute === 'href' && resolved.pathname.endsWith('/design-system/GUIDELINES.md')) {
      url = `${DESIGN_ROOT}guidelines/${resolved.hash}`;
    }
    return `${attribute}="${escapeHtml(url)}"`;
  });
}

function rawLinks(path: string): string {
  return `<p class="ns-design__sources"><a href="${SOURCE_ROOT}${path}DESIGN.md">DESIGN.md</a>
    <a href="${SOURCE_ROOT}${path}SKILL.md">SKILL.md</a></p>`;
}

function sectionNav(themes: Theme[], current: string): string {
  const entries = [
    [DESIGN_ROOT, 'Overview'],
    [`${DESIGN_ROOT}guidelines/`, 'Guidelines'],
    [`${DESIGN_ROOT}token-contract/`, 'Token contract'],
    [`${DESIGN_ROOT}create-your-own-theme/`, 'Create your own theme'],
    ...themes.map((theme) => [themeUrl(theme.id), theme.name]),
  ];
  return `<nav class="ns-design__nav" aria-label="Design system">${
    entries.map(([url, title]) =>
      `<a href="${url}"${url === current ? ' aria-current="page"' : ''}>${escapeHtml(title)}</a>`
    ).join('')
  }</nav>`;
}

function image(
  preview: Preview,
  scheme: typeof SCHEMES[number],
  sizes: DesignSources['imageSizes'],
): string {
  const file = `${preview.id}--${scheme}.webp`;
  const size = sizes[file];
  if (!size) throw new Error(`Missing image dimensions: ${file}`);
  return `<img src="${ASSET_ROOT}${file}" alt="${
    escapeHtml(preview.name)
  } Orders specimen, ${scheme} scheme"
    width="${size.width}" height="${size.height}" loading="lazy" decoding="async">`;
}

function compare(preview: Preview, sizes: DesignSources['imageSizes']): string {
  return `<div class="ns-design__compare">${
    SCHEMES.map((scheme) =>
      `<figure><a href="${ASSET_ROOT}${preview.id}--${scheme}.webp">${
        image(preview, scheme, sizes)
      }</a><figcaption>${scheme === 'light' ? 'Light' : 'Dark'}</figcaption></figure>`
    ).join('')
  }</div>`;
}

function galleryCard(preview: Preview, sizes: DesignSources['imageSizes']): string {
  const url = themeUrl(preview.theme.id) +
    (preview.flavor ? `#design-flavor-${preview.flavor}` : '');
  const isDefault = preview.id === 'studio-utility';
  return `<article class="ns-design__preset${
    isDefault ? ' ns-design__preset--default' : ''
  }" data-preset="${preview.id}">
    <a class="ns-design__preview" href="${url}" aria-label="Explore ${escapeHtml(preview.name)}">
      <span class="ns-design__scheme-light">${image(preview, 'light', sizes)}</span>
      <span class="ns-design__scheme-dark">${image(preview, 'dark', sizes)}</span>
    </a>
    <div class="ns-design__preset-heading"><h3><a href="${url}">${
    escapeHtml(preview.name)
  }</a></h3>${isDefault ? '<span class="ns-design__label">NetScript default</span>' : ''}</div>
    <p>${escapeHtml(preview.theme.description)}</p>
    <details><summary>Compare light and dark</summary>${compare(preview, sizes)}</details>
    ${rawLinks(`themes/${preview.theme.id}/`)}
  </article>`;
}

/** Recursively render every authored group; YAML remains available with all comments intact. */
export function valueTables(theme: Theme): string {
  const groups = Object.entries(theme.values).filter(([key]) =>
    !['name', 'description', 'version'].includes(key)
  );
  return `<section aria-label="Theme values"><p class="ns-design__eyebrow">Specification values · ${
    escapeHtml(theme.version)
  }</p>${
    groups.map(([group, values]) => {
      const label = GROUP_LABELS[group] ?? group;
      return `<h2 id="values-${escapeHtml(group)}">${escapeHtml(label)}</h2>
      <div class="ns-design__table" role="region" aria-label="${
        escapeHtml(label)
      } values" tabindex="0"><table>
      <caption>${escapeHtml(theme.name)} · ${escapeHtml(label)}${
        theme.id === 'studio' ? ' · Utility flavor' : ''
      }</caption>
      <thead><tr><th scope="col">Property</th><th scope="col">Value</th></tr></thead><tbody>${
        valueRows(values).map(({ path, value }) => {
          // Swatches are data samples, never an alternative theme applied to the site chrome.
          const swatch =
            group === 'colors' && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
              ? `<svg class="ns-design__swatch" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" fill="${value}"/></svg>`
              : '';
          return `<tr><th scope="row"><code>${escapeHtml(path)}</code></th><td>${swatch}<code>${
            escapeHtml(value)
          }</code></td></tr>`;
        }).join('')
      }</tbody></table></div>`;
    }).join('')
  }<details class="ns-design__yaml"><summary>Read YAML values and notes</summary><pre><code class="language-text">${
    escapeHtml(theme.yaml)
  }</code></pre></details></section>`;
}

function contents(html: string): string {
  const headings = [...html.matchAll(/<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)];
  return `<details class="ns-design__contents"><summary>On this page</summary><ul>${
    headings.map(([, , id, title]) =>
      `<li><a href="#${escapeHtml(id)}">${title.replace(/<[^>]*>/g, '')}</a></li>`
    ).join('')
  }</ul></details>`;
}

export function renderTheme(
  theme: Theme,
  previews: Preview[],
  sources: DesignSources,
  md: MarkdownRenderer,
): string {
  const prose = sourceLinks(
    md(theme.body.replace(/^# [^\n]*\n/, '')),
    `themes/${theme.id}/DESIGN.md`,
  );
  const specimens = previews.map((preview) =>
    `<article${preview.flavor ? ` id="design-flavor-${preview.flavor}"` : ''}>
    <h3>${escapeHtml(preview.name)}${
      preview.id === 'studio-utility' ? ' · NetScript default' : ''
    }</h3>${compare(preview, sources.imageSizes)}
  </article>`
  ).join('');
  return `<header><p class="ns-design__eyebrow">Design system · Theme</p><h1>${
    escapeHtml(theme.name)
  }</h1>
    <p class="ns-design__lede">${escapeHtml(theme.description)}</p>${
    rawLinks(`themes/${theme.id}/`)
  }</header>
    ${contents(prose)}<section aria-label="Theme specimens"><h2 id="design-specimens">${
    theme.id === 'studio' ? 'Studio flavors' : 'Light and dark'
  }</h2>${specimens}</section>
    ${valueTables(theme)}<section aria-label="Design specification">${prose}</section>`;
}

/** All routes are projections of canonical sources, so a spec edit reaches the next docs build. */
export function renderDesignPages(
  sources: DesignSources,
  md: MarkdownRenderer,
  styles: string,
): DesignPage[] {
  const { guidelines, themes, previews, templates } = sources;
  const renderGuidelines = (source: string) => sourceLinks(md(source), 'GUIDELINES.md');
  const intro = guidelines.slice(0, guidelines.indexOf('\n## ')).replace(/^# [^\n]*\n/, '');
  const content = [
    {
      url: DESIGN_ROOT,
      title: 'Design system',
      content:
        `<header><p class="ns-design__eyebrow">Design system · Fresh UI</p><h1>NetScript Custom Design Guidelines</h1>${
          renderGuidelines(intro)
        }</header>
      <p class="ns-design__default"><span class="ns-design__label">NetScript default</span> <a href="${
          themeUrl('studio')
        }#design-flavor-utility">Studio · Utility</a> <code>neutral × ink</code></p>
      <div class="ns-design__rules">${renderGuidelines(guidelineSection(guidelines, 1))}</div>
      <h2 id="design-catalogue">Theme catalogue</h2><p>${themes.length} languages · ${
          previews.filter((preview) => preview.flavor).length
        } Studio flavors · light and dark</p>
      <div class="ns-design__gallery">${
          previews.filter((preview) => !preview.flavor || preview.flavor === 'utility').map((
            preview,
          ) => galleryCard(preview, sources.imageSizes)).join('')
        }</div>
      <h2 id="design-studio-flavors">More Studio flavors</h2><p>One component anatomy, seven product personalities. <a href="${
          themeUrl('studio')
        }">Explore Studio</a>.</p>
      <div class="ns-design__gallery">${
          previews.filter((preview) => preview.flavor && preview.flavor !== 'utility').map((
            preview,
          ) => galleryCard(preview, sources.imageSizes)).join('')
        }</div>
      <p><a href="${DESIGN_ROOT}guidelines/">Read the complete guidelines</a> · <a href="${DESIGN_ROOT}create-your-own-theme/">Create your own theme</a> · <a href="/reference/fresh-ui/">Fresh UI API reference</a></p>`,
    },
    {
      url: `${DESIGN_ROOT}guidelines/`,
      title: 'Design guidelines',
      content:
        `<p class="ns-design__eyebrow">Design system · Guidelines</p><p><a href="${SOURCE_ROOT}GUIDELINES.md">Read GUIDELINES.md</a></p>${
          contents(renderGuidelines(guidelines))
        }${renderGuidelines(guidelines)}`,
    },
    {
      url: `${DESIGN_ROOT}token-contract/`,
      title: 'Token contract',
      content:
        `<header><p class="ns-design__eyebrow">Design system · Tokens</p><h1>Token contract</h1>
      <p>Theme architecture from the design guidelines. Read it with the <a href="${DESIGN_ROOT}guidelines/#1-two-rules-that-override-everything">two governing rules</a> and the <a href="${DESIGN_ROOT}guidelines/#3-compatibility-contract-must">compatibility contract</a>.</p></header>
      ${
          renderGuidelines(guidelineSection(guidelines, 2))
        }<p><a href="${SOURCE_ROOT}GUIDELINES.md">Read GUIDELINES.md</a></p>`,
    },
    {
      url: `${DESIGN_ROOT}create-your-own-theme/`,
      title: 'Create your own theme',
      content:
        `<header><p class="ns-design__eyebrow">Design system · Authoring</p><h1>Create your own theme</h1>
      <p>Start with the <a href="${DESIGN_ROOT}guidelines/#4-the-quality-method">quality method</a> and <a href="${DESIGN_ROOT}guidelines/#3-compatibility-contract-must">compatibility contract</a>.</p></header>
      ${renderGuidelines(guidelineSection(guidelines, 7))}
      <h2 id="design-template">DESIGN.md template</h2><p><a href="${SOURCE_ROOT}themes/_template/DESIGN.md">Open DESIGN.md template</a></p>
      <details><summary>Read the specification template</summary><pre><code class="language-text">${
          escapeHtml(templates.design)
        }</code></pre></details>
      <h2 id="design-skill-template">SKILL.md template</h2><p><a href="${SOURCE_ROOT}themes/_template/SKILL.md">Open SKILL.md template</a></p>
      <details><summary>Read the agent skill template</summary><pre><code class="language-text">${
          escapeHtml(templates.skill)
        }</code></pre></details>`,
    },
    ...themes.map((theme) => ({
      url: themeUrl(theme.id),
      title: theme.name,
      content: renderTheme(
        theme,
        previews.filter((preview) => preview.theme.id === theme.id),
        sources,
        md,
      ),
    })),
  ];
  return content.map((page, index) => ({
    ...page,
    layout: 'layouts/base.vto',
    order: index,
    content: `<style>${styles}</style><div class="ns-design">${
      sectionNav(themes, page.url)
    }${page.content}</div>`,
  }));
}
