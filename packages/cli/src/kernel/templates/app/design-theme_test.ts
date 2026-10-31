import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, join } from '@std/path';
import { createServer, type ViteDevServer } from 'vite';
import { readTemplateAsset } from '../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';

const TEMPLATES = new URL('../../assets/app/', import.meta.url);
const DESIGN_THEME = 'routes/(design)/design/(_shared)/theme.ts';
const PRESETS = {
  'ns-one': { id: 'ns-one', language: 'ns-one', density: 'comfortable', flavor: null },
  'studio-utility': {
    id: 'studio-utility',
    language: 'studio',
    density: 'compact',
    flavor: 'utility',
  },
};

interface PreviewTheme {
  readonly id: string;
  readonly fontImports: readonly string[];
  readonly previewStylesheet?: string;
}

for (
  const scenario of [
    { name: 'without preview styles', installed: [], requested: 'studio-utility', id: 'ns-one' },
    {
      name: 'with the requested preview installed',
      installed: ['studio-utility'],
      requested: 'studio-utility',
      id: 'studio-utility',
    },
    {
      name: 'with only a different preview installed',
      installed: ['ns-one'],
      requested: 'studio-utility',
      id: 'ns-one',
    },
    {
      name: 'with an unregistered preview filename',
      installed: ['unknown'],
      requested: 'unknown',
      id: 'ns-one',
    },
    {
      name: 'with the configured preset requested',
      installed: [],
      requested: 'ns-one',
      id: 'ns-one',
    },
    {
      name: 'with a prototype property requested',
      installed: ['__proto__'],
      requested: '__proto__',
      id: 'ns-one',
    },
  ].flatMap((scenario) =>
    (['authoring', 'shipped'] as const).map((surface) => ({ ...scenario, surface }))
  )
) {
  Deno.test(`${scenario.surface} design preset query ${scenario.name} never links missing CSS`, async () => {
    const root = await Deno.makeTempDir({ prefix: 'netscript-design-preview-' });
    let server: ViteDevServer | undefined;
    try {
      for (
        const [path, key] of [
          ['lib/theme.ts', TEMPLATE_KEYS.appTheme],
          [DESIGN_THEME, TEMPLATE_KEYS.appRoutesDesignSharedTheme],
        ] as const
      ) {
        const target = join(root, path);
        await Deno.mkdir(dirname(target), { recursive: true });
        await Deno.writeTextFile(
          target,
          scenario.surface === 'shipped'
            ? await readTemplateAsset(key)
            : await Deno.readTextFile(new URL(`${path}.template`, TEMPLATES)),
        );
      }
      await Deno.mkdir(join(root, 'assets'));
      for (
        const [name, value] of Object.entries({
          'tokens.json': { presets: PRESETS },
          'theme-preset.json': PRESETS['ns-one'],
          'fonts.json': {
            imports: { 'ns-one': ['/ns-one-font.css'], 'studio-utility': ['/utility-font.css'] },
          },
        })
      ) {
        await Deno.writeTextFile(join(root, 'assets', name), JSON.stringify(value));
      }
      await Deno.mkdir(join(root, 'static/presets'), { recursive: true });
      for (const id of scenario.installed) {
        await Deno.writeTextFile(
          join(root, 'static/presets', `${id}.css`),
          `:root { --preview: ${id}; }`,
        );
      }
      server = await createServer({
        root,
        configFile: false,
        publicDir: 'static',
        cacheDir: join(root, '.vite'),
        appType: 'custom',
        logLevel: 'silent',
        resolve: { alias: { '@app': root } },
        server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true },
      });
      await server.listen();
      const module = await server.ssrLoadModule(`/${DESIGN_THEME}`);
      const designTheme: (url: URL) => PreviewTheme = module.designTheme;
      const theme = designTheme(
        new URL(`http://app.test/design/tokens?preset=${scenario.requested}`),
      );
      assertEquals(theme.id, scenario.id);
      assertEquals(
        theme.fontImports,
        scenario.id === 'ns-one' ? ['/ns-one-font.css'] : ['/utility-font.css'],
      );
      if (scenario.id === 'ns-one') {
        assertEquals(theme.previewStylesheet, undefined);
      } else {
        assertEquals(theme.previewStylesheet, `/presets/${scenario.id}.css`);
        const address = server.httpServer!.address();
        assert(address && typeof address !== 'string');
        const response = await fetch(`http://127.0.0.1:${address.port}${theme.previewStylesheet}`);
        assertEquals(response.status, 200);
        assertStringIncludes(await response.text(), `--preview: ${scenario.id}`);
      }
    } finally {
      await server?.close();
      await Deno.remove(root, { recursive: true });
    }
  });
}
