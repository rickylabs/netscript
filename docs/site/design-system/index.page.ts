import site from '../_config.ts';
import { loadDesignSources } from '../_plugins/design-system.ts';
import { designMarkdown } from '../_plugins/design-system-markdown.ts';
import { renderDesignPages } from '../_plugins/design-system-render.ts';

/** Lume discovers this generator without changing the shared site configuration. */
export default async function* () {
  const sources = await loadDesignSources();
  const styles = await Deno.readTextFile(
    new URL('../_components/design/styles.css', import.meta.url),
  );
  yield* renderDesignPages(sources, designMarkdown(site), styles);
}
