import { escapeHtml } from '../../../docs/site/_plugins/escape-html.ts';
import {
  COMPONENT_ROOT,
  type ComponentCatalog,
  type ComponentPage,
  DEFAULT_PRESET,
  PREVIEW_ROOT,
} from './catalog.ts';

export interface ReferencePage {
  url: string;
  title: string;
  layout: string;
  content: string;
  order: number;
  edit_source: string;
}

const e = escapeHtml;
const code = (value: string): string => `<code>${e(value)}</code>`;
const fence = (value: string, language: string): string =>
  `<pre><code class="language-${language}">${e(value)}</code></pre>`;
const heading = (title: string): string =>
  `<h2 id="${title.toLowerCase().replaceAll(' ', '-')}">${title}</h2>`;
const assets =
  `<link rel="stylesheet" href="${PREVIEW_ROOT}docs.css"><script type="module" src="${PREVIEW_ROOT}js/builder.js"></script>`;

function preview(name: string): string {
  return `<p><a href="${PREVIEW_ROOT}preview/?component=${
    e(name)
  }&amp;theme=${DEFAULT_PRESET}">Open live ${
    e(name)
  } preview</a></p><iframe class="ns-component-preview" title="Live ${
    e(name)
  } preview" data-component-preview data-component="${
    e(name)
  }" data-preview-url="${PREVIEW_ROOT}preview/" src="${PREVIEW_ROOT}preview/?component=${
    e(name)
  }&amp;theme=${DEFAULT_PRESET}"></iframe>`;
}

function propTable(page: ComponentPage): string {
  if (!page.props.length) {
    return '<p>No locally declared props; see the implementation source for native pass-through attributes.</p>';
  }
  return '<div class="ns-api-table-wrap"><table><thead><tr><th>Owner</th><th>Prop</th><th>Type</th><th>Optional</th><th>Description</th></tr></thead><tbody>' +
    page.props.map((prop) =>
      `<tr><td>${code(prop.owner)}</td><td>${code(prop.name)}</td><td>${code(prop.type)}</td><td>${
        prop.optional ? 'Yes' : 'No'
      }</td><td>${e(prop.description)}</td></tr>`
    ).join('') + '</tbody></table></div>';
}

function componentContent(page: ComponentPage, catalog: ComponentCatalog): string {
  const contract = page.contract;
  const context =
    `const [value, setValue] = useState('standard');\nconst [open, setOpen] = useState(false);\nconst [notice, report] = useState('');\n`;
  const imports = catalog.components.filter((candidate) =>
    new RegExp(`<${candidate.symbol}(?:[.\\s/>])`).test(page.example)
  ).map((p) => p.importStatement).filter(Boolean).join('\n');
  const usage =
    `import { useState } from 'preact/hooks';\n${imports}\n\nexport function Example() {\n${
      context.split('\n').filter(Boolean).map((line) => `  ${line}`).join('\n')
    }\n  return (<><div>${page.example}</div><p role="status">{notice}</p></>);\n}`;
  return assets + `<h1>${e(page.symbol)}</h1><p>${e(page.description)}</p>` +
    `<p><a href="${COMPONENT_ROOT}">All components</a> · <a href="/create/">Theme builder</a> · <a href="https://github.com/rickylabs/netscript/blob/main/${page.source}">Implementation source</a></p>` +
    heading('Live preview') + preview(page.name) +
    (page.name.startsWith('desktop-')
      ? '<p>Native actions require a desktop host. This browser preview shows the shipped surface with host actions disabled.</p>'
      : '') +
    (page.name === 'mcp-ui-widget'
      ? '<p>The example frame is static. Connect a resolved host widget URL in your application.</p>'
      : '') +
    heading('Install') + fence(`netscript ui:add ${page.name}`, 'bash') +
    heading('Usage and examples') +
    '<p>The preview runs this JSX with the installed components. Import any composed primitives from your UI directory.</p>' +
    fence(usage, 'tsx') +
    heading('Props') +
    '<p>Generated from native <code>deno doc --json --private</code> over the shipped implementation. Compound component props retain their owning interface; native attributes pass through where declared.</p>' +
    propTable(page) +
    (page.signatures.length ? fence(page.signatures.join('\n'), 'typescript') : '') +
    heading('Keyboard') +
    (contract?.keyboard.length
      ? '<div class="ns-api-table-wrap"><table><thead><tr><th>Key</th><th>Action</th></tr></thead><tbody>' +
        contract.keyboard.map((key) =>
          `<tr><td>${code(key.key)}</td><td>${e(key.action)}</td></tr>`
        ).join('') + '</tbody></table></div>'
      : `<p>${
        contract
          ? 'Presentation component; no component-specific keyboard interactions.'
          : 'No S3 keyboard contract is registered for this item. Native controls retain browser keyboard behavior.'
      }</p>`) +
    heading('Tokens') +
    (contract
      ? `<p>Semantic contract roles: ${contract.tokenRoles.map(code).join(', ')}.</p>`
      : '<p>No S3 token contract is registered for this item.</p>') +
    `<p>CSS custom properties referenced directly: ${
      page.cssTokens.map(code).join(', ') || 'Composed primitives supply their own tokens'
    }.</p>` +
    heading('Contract and compatibility') +
    (contract
      ? `<p>Accessibility pattern: ${(contract.apg.startsWith('https:')
        ? '<a href="' + e(contract.apg) + '">WAI-ARIA guidance</a>'
        : e(contract.apg))}</p><ul>${
        contract.notes.map((note) => `<li>${e(note)}</li>`).join('')
      }</ul>` +
        '<p>Design contract values marked planned are not implementation props. The props above describe what ships today.</p>'
      : '<p>This registry item ships without an S3 entry. Implementation prop documentation is authoritative.</p>');
}

/** All references are discovered from the catalog; no manual component page inventory. */
export function referencePages(catalog: ComponentCatalog): ReferencePage[] {
  const pages: ReferencePage[] = [{
    url: COMPONENT_ROOT,
    title: 'Components',
    layout: 'layouts/base.vto',
    order: 3,
    edit_source: '/design-system/components.page.ts',
    content:
      `<h1>Components</h1><p>Live Fresh UI references generated from the registry, implementation types and S3 contracts. <a href="/create/">Build a theme</a> to preview a complete workspace.</p><ul class="ns-component-index">` +
      catalog.components.map((page) =>
        `<li><a href="${COMPONENT_ROOT}${page.name}/">${e(page.symbol)}</a></li>`
      ).join('') + '</ul>',
  }];
  for (const page of catalog.components) {
    pages.push({
      url: `${COMPONENT_ROOT}${page.name}/`,
      title: page.symbol,
      layout: 'layouts/base.vto',
      order: 0,
      edit_source: '/design-system/components.page.ts',
      content: componentContent(page, catalog),
    });
  }
  return pages;
}

export function builderPage(catalog: ComponentCatalog): ReferencePage {
  const preset = catalog.presets.find((preset) => preset.id === DEFAULT_PRESET)!;
  const options = catalog.presets.map((p) =>
    `<option value="${e(p.id)}"${p.id === DEFAULT_PRESET ? ' selected' : ''}>${e(p.id)}</option>`
  ).join('');
  const flavors = catalog.presets.filter((p) => p.flavor).map((p) =>
    `<option value="${e(p.flavor!)}">${e(p.flavor!)}</option>`
  ).join('');
  return {
    url: '/create/',
    title: 'Theme builder',
    layout: 'layouts/base.vto',
    order: 2,
    edit_source: '/design-system/components.page.ts',
    content: assets +
      '<h1>Build your theme</h1><p>Choose a starting point. See it on real Fresh UI components, then take the same preset into your app.</p>' +
      '<div class="ns-builder"><div class="ns-builder__controls">' +
      `<label>Base theme or preset<select data-preset-choice disabled>${options}</select></label>` +
      `<label>Studio flavor<select data-flavor-choice disabled><option value="">Preset-specific</option>${flavors}</select></label>` +
      '<label>Component style<select aria-describedby="style-help" disabled><option>Utility</option></select></label>' +
      '<label>Preview scheme<select data-preview-scheme disabled><option value="system">Follow docs</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>' +
      '<p id="style-help">Utility is the available component style. Each theme preset supplies its accent, geometry, fonts, density and menu treatment.</p>' +
      heading('Remaining pickers') +
      '<p>Only Utility component anatomy is implemented. Styles beyond Utility will become independent choices after S6b ships their registry implementations. Icon library and font family are not independent builder choices yet; the builder uses shipped glyphs and preset fonts. Menu style has no independent field in the current preset resolver. Accent, radius and density also follow the selected fixed preset. Add these pickers only when the resolver can reproduce them; no selection is silently discarded.</p>' +
      '<p>Preview fonts available on this site are self-hosted. Other declared font families use their platform fallback stacks.</p>' +
      '<dl class="ns-builder__values">' +
      ['accent', 'radius', 'fonts', 'density', 'icons', 'menu'].map((key) =>
        `<dt>${key[0].toUpperCase() + key.slice(1)}</dt><dd data-effective="${key}">${
          e(
            key === 'accent'
              ? preset.accent
              : key === 'density'
              ? preset.density
              : 'From selected preset',
          )
        }</dd>`
      ).join('') + '</dl>' +
      heading('Live workspace') + preview('workspace') +
      '<noscript><p>Enable JavaScript to change the preview and generate a different preset. The default code below installs Studio Utility.</p></noscript>' +
      heading('Use this preset') +
      `<label>Preset code<textarea data-preset-code readonly rows="3">${
        e(preset.code)
      }</textarea></label>` +
      '<div class="ns-builder__actions"><button type="button" data-copy-preset="code">Copy code</button><button type="button" data-copy-preset="link">Copy share link</button></div>' +
      fence(`netscript init my-app --preset ${preset.code}`, 'bash').replace(
        '<code class="language-bash">',
        '<code class="language-bash" data-preset-command="init">',
      ) +
      fence(`netscript ui:apply --preset ${preset.code}`, 'bash').replace(
        '<code class="language-bash">',
        '<code class="language-bash" data-preset-command="ui:apply">',
      ) +
      '<form data-preset-import><label>Open a preset code or shared link<input name="preset" autocomplete="off" spellcheck="false" required /></label><button type="submit">Apply preset code</button></form>' +
      '<p role="status" data-builder-status></p><p><a href="/design-system/components/">Explore component references</a> · <a href="/design-system/token-contract/">Read the token contract</a></p></div>',
  };
}
