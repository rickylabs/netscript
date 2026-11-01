import { fromFileUrl } from 'jsr:@std/path@1/from-file-url';
import { defaultLibraryInput } from './src/default-sources.ts';
import {
  itemSchema,
  registryJson,
  registrySchema,
} from '../../packages/fresh-ui/src/registry/assets/registry.generated.ts';

const root = new URL('../../', import.meta.url);
/** Build a separate native entry with synchronous copies of the existing code-owned carriers. */
export async function buildComponentLibraryPlugin(
  output: URL = new URL('.llm/tmp/figma-component-library/', root),
): Promise<void> {
  await Deno.mkdir(output, { recursive: true });
  // Existing compressed carriers use top-level await/Blob/DecompressionStream, absent in the sandbox.
  const synchronous = new URL('registry-assets.ts', output);
  await Deno.writeTextFile(
    synchronous,
    Object.entries({ registryJson, itemSchema, registrySchema }).map(([name, value]) =>
      `export const ${name} = ${JSON.stringify(value)};`
    ).join('\n'),
  );
  const map = new URL('import-map.json', output);
  await Deno.writeTextFile(
    map,
    JSON.stringify({
      imports: {
        [new URL('packages/fresh-ui/src/registry/assets/registry.generated.ts', root).href]:
          synchronous.href,
      },
    }),
  );
  const entry = new URL('entry.ts', output);
  const main = new URL('plugin/main.ts', import.meta.url);
  await Deno.writeTextFile(
    entry,
    [
      `import { startComponentLibraryPlugin, type ComponentPluginHost } from ${
        JSON.stringify(main.href)
      };`,
      'declare const figma: ComponentPluginHost;',
      'declare const __html__: string;',
      `startComponentLibraryPlugin(figma, ${JSON.stringify(defaultLibraryInput())}, __html__);`,
    ].join('\n'),
  );
  for (const [name, input] of [['main', entry], ['ui', new URL('plugin/ui.ts', import.meta.url)]]) {
    const result = await new Deno.Command(Deno.execPath(), {
      cwd: root,
      args: [
        'bundle',
        '--frozen',
        '--platform',
        'browser',
        '--format',
        name === 'main' ? 'iife' : 'esm',
        '--import-map',
        fromFileUrl(map),
        '--output',
        fromFileUrl(new URL(`${name}.js`, output)),
        fromFileUrl(input),
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
  }
  const html = await Deno.readTextFile(new URL('plugin/ui.html', import.meta.url));
  const ui = (await Deno.readTextFile(new URL('ui.js', output))).replaceAll(
    '</script',
    '<\\/script',
  );
  await Deno.writeTextFile(
    new URL('ui.html', output),
    html.replace('<!-- SCRIPT -->', () => `<script type="module">${ui}</script>`),
  );
  await Deno.copyFile(new URL('manifest.json', import.meta.url), new URL('manifest.json', output));
}

if (import.meta.main) {
  await buildComponentLibraryPlugin();
  console.log('Component-library development plugin built in .llm/tmp/figma-component-library/');
}
