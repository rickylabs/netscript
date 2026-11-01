import type { ComponentCatalog } from '../../../tools/docs-site/fresh-ui/catalog.ts';
import { PREVIEW_ROOT } from '../../../tools/docs-site/fresh-ui/catalog.ts';
import { builderPage, referencePages } from '../../../tools/docs-site/fresh-ui/render.ts';
import { transform } from 'lume/deps/lightningcss.ts';
import { defaults } from 'lume/plugins/lightningcss.ts';

interface CssAsset {
  path: string;
  sources: readonly string[];
  sourceSha256: string;
  sha256: string;
}

/** Generated references and browser assets share the registry's build-time catalog. */
export default async function* () {
  const output = new URL('../../../.llm/tmp/fresh-ui-docs/', import.meta.url);
  const catalog: ComponentCatalog = JSON.parse(
    await Deno.readTextFile(new URL('catalog.json', output)),
  );
  yield builderPage(catalog);
  yield* referencePages(catalog);
  const manifest: CssAsset[] = [];
  const hash = async (bytes: Uint8Array): Promise<string> =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer)).toHex();
  // Use Lume's actual transformer/defaults so canonical source and published bytes are both attested.
  const css = async (
    path: string,
    content: string,
    sources: readonly string[],
  ): Promise<{ url: string; content: string }> => {
    const bytes = new TextEncoder().encode(content);
    const compiled = transform({ filename: path, code: bytes, ...defaults.options }).code;
    manifest.push({ path, sources, sourceSha256: await hash(bytes), sha256: await hash(compiled) });
    return { url: PREVIEW_ROOT + path, content };
  };
  for (const file of ['catalog.json', 'presets.json']) {
    yield { url: PREVIEW_ROOT + file, content: await Deno.readTextFile(new URL(file, output)) };
  }
  const bundles: string[] = JSON.parse(
    await Deno.readTextFile(new URL('bundle-files.json', output)),
  );
  for (const file of bundles) {
    yield {
      url: PREVIEW_ROOT + 'js/' + file,
      content: await Deno.readTextFile(new URL('js/' + file, output)),
    };
  }
  yield await css(
    'components.css',
    await Deno.readTextFile(new URL('components.css', output)),
    catalog.componentCssSources,
  );
  for (const [file, source] of [['docs.css', 'styles.css'], ['preview.css', 'preview.css']]) {
    yield await css(
      file,
      await Deno.readTextFile(
        new URL('../../../tools/docs-site/fresh-ui/' + source, import.meta.url),
      ),
      ['tools/docs-site/fresh-ui/' + source],
    );
  }
  for (const preset of catalog.presets) {
    const source = 'packages/fresh-ui/registry/theme/presets/' + preset.id + '.css';
    yield await css(
      'presets/' + preset.id + '.css',
      await Deno.readTextFile(new URL('../../../' + source, import.meta.url)),
      [source],
    );
  }
  yield { url: PREVIEW_ROOT + 'css-manifest.json', content: JSON.stringify(manifest) };
  yield {
    url: `${PREVIEW_ROOT}preview/widget/`,
    internal: true,
    nav_hide: true,
    content:
      '<!doctype html><html lang="en"><title>Static widget example</title><body><p>A resolved host widget renders inside this sandbox.</p></body></html>',
  };
  yield {
    url: `${PREVIEW_ROOT}preview/`,
    internal: true,
    nav_hide: true,
    content:
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fresh UI live preview</title><link rel="stylesheet" href="/styles/fonts.css"><link id="preview-tokens" rel="stylesheet" href="${PREVIEW_ROOT}presets/studio-utility.css"><link rel="stylesheet" href="${PREVIEW_ROOT}components.css"><link rel="stylesheet" href="${PREVIEW_ROOT}preview.css"></head><body><main id="preview"><p>Loading Fresh UI preview…</p></main><script type="module" src="${PREVIEW_ROOT}js/preview.js"></script></body></html>`,
  };
}
