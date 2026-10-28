import site from '../_config.ts';
import sharp from 'lume/deps/sharp.ts';
import {
  ASSET_ROOT,
  loadDesignSources,
  SCHEMES,
  SECTION_STYLESHEET,
  THUMBNAIL_WIDTH,
} from '../_plugins/design-system.ts';
import { designMarkdown } from '../_plugins/design-system-markdown.ts';
import { renderDesignPages } from '../_plugins/design-system-render.ts';

/** Lume discovers this generator without changing the shared site configuration. */
export default async function* () {
  const sources = await loadDesignSources();
  yield* renderDesignPages(sources, designMarkdown(site));
  yield {
    url: SECTION_STYLESHEET,
    content: await Deno.readTextFile(new URL('../_components/design/styles.css', import.meta.url)),
  };
  // Resize one image at a time to bound build memory. Originals remain linked for inspection.
  for (const preview of sources.previews) {
    for (const scheme of SCHEMES) {
      const file = `${preview.id}--${scheme}.webp`;
      const source = await Deno.readFile(
        new URL(`../assets/design-system/${file}`, import.meta.url),
      );
      const original = sources.imageSizes[file];
      const width = Math.min(THUMBNAIL_WIDTH, original.width);
      const height = Math.round(original.height * width / original.width);
      const thumbnail = await sharp(source)
        .resize({ width, height, fit: 'fill', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      yield { url: `${ASSET_ROOT}thumbnails/${file}`, content: new Uint8Array(thumbnail) };
    }
  }
}
