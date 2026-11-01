import type { ComponentCatalog } from '../../../tools/docs-site/fresh-ui/catalog.ts';
import { PREVIEW_ROOT } from '../../../tools/docs-site/fresh-ui/catalog.ts';
import { builderPage, referencePages } from '../../../tools/docs-site/fresh-ui/render.ts';

/** Generated references and browser assets share the registry's build-time catalog. */
export default async function* () {
  const output = new URL('../../../.llm/tmp/fresh-ui-docs/', import.meta.url);
  const catalog: ComponentCatalog = JSON.parse(
    await Deno.readTextFile(new URL('catalog.json', output)),
  );
  yield builderPage(catalog);
  yield* referencePages(catalog);
  for (const file of ['catalog.json', 'builder.js', 'preview.js', 'components.css']) {
    yield {
      url: `${PREVIEW_ROOT}${file}`,
      content: await Deno.readTextFile(new URL(file, output)),
    };
  }
  for (const [file, source] of [['docs.css', 'styles.css'], ['preview.css', 'preview.css']]) {
    yield {
      url: `${PREVIEW_ROOT}${file}`,
      content: await Deno.readTextFile(
        new URL(`../../../tools/docs-site/fresh-ui/${source}`, import.meta.url),
      ),
    };
  }
  for (const preset of catalog.presets) {
    yield {
      url: `${PREVIEW_ROOT}presets/${preset.id}.css`,
      content: await Deno.readTextFile(
        new URL(
          `../../../packages/fresh-ui/registry/theme/presets/${preset.id}.css`,
          import.meta.url,
        ),
      ),
    };
  }
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
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fresh UI live preview</title><link rel="stylesheet" href="/styles/fonts.css"><link id="preview-tokens" rel="stylesheet" href="${PREVIEW_ROOT}presets/studio-utility.css"><link rel="stylesheet" href="${PREVIEW_ROOT}components.css"><link rel="stylesheet" href="${PREVIEW_ROOT}preview.css"></head><body><main id="preview"><p>Loading Fresh UI preview…</p></main><script type="module" src="${PREVIEW_ROOT}preview.js"></script></body></html>`,
  };
}
