import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import {
  coordinateVersionBump,
  discoverVersionFiles,
  findVersionResidue,
  rewriteNetScriptVersion,
} from './bump-version.ts';
import { discoverPreparedReleaseFiles } from '../release/prepare-release.ts';

const REGISTRY_PATH = 'packages/fresh-ui/registry.json';
const REGISTRY_EMBEDDED_PATH = 'packages/fresh-ui/src/registry/assets/registry.generated.ts';

for (const version of ['1.2.4', '1.2.4-canary.1']) {
  Deno.test(`coordinated release discovers and bumps registry dependencies to ${version}`, async () => {
    const root = await Deno.makeTempDir({ prefix: 'netscript-registry-release-' });
    try {
      await Deno.mkdir(`${root}/packages/fresh-ui/tests/registry`, { recursive: true });
      await Deno.writeTextFile(
        `${root}/deno.json`,
        JSON.stringify({ version: '1.2.3', workspace: ['packages/*'] }),
      );
      await Deno.writeTextFile(
        `${root}/packages/fresh-ui/deno.json`,
        JSON.stringify({ name: '@netscript/fresh-ui', version: '1.2.3' }),
      );
      const manifest = JSON.parse(
        await Deno.readTextFile(new URL('../../../packages/fresh-ui/deno.json', import.meta.url)),
      );
      const source = await Deno.readTextFile(
        new URL('../../../packages/fresh-ui/registry.json', import.meta.url),
      );
      const registry = rewriteNetScriptVersion(source, manifest.version, '1.2.3');
      await Deno.writeTextFile(`${root}/${REGISTRY_PATH}`, registry);
      await Deno.writeTextFile(
        `${root}/packages/fresh-ui/tests/registry/legacy-v1.json`,
        await Deno.readTextFile(
          new URL('../../../packages/fresh-ui/tests/registry/legacy-v1.json', import.meta.url),
        ),
      );
      // Use the tracked-file path used by real stable/canary preparation, not just fixture discovery.
      for (const args of [['init', '-q'], ['add', '.']]) {
        const result = await new Deno.Command('git', { args, cwd: root }).output();
        assertEquals(result.code, 0);
      }

      assertEquals((await discoverVersionFiles(root)).includes(`${root}/${REGISTRY_PATH}`), true);
      assertEquals(
        (await discoverPreparedReleaseFiles(root)).includes(`${root}/${REGISTRY_PATH}`),
        true,
      );
      assertEquals(
        (await discoverPreparedReleaseFiles(root)).includes(`${root}/${REGISTRY_EMBEDDED_PATH}`),
        true,
        'release commits must stage the regenerated registry consumed by ui:add',
      );
      const bump = await coordinateVersionBump(
        root,
        version,
        version.includes('-') ? 'canary' : 'stable',
      );
      assertEquals(bump.files.includes(`${root}/${REGISTRY_PATH}`), true);
      const bumped = await Deno.readTextFile(`${root}/${REGISTRY_PATH}`);
      assertEquals(bumped, rewriteNetScriptVersion(registry, '1.2.3', version));
      assertStringIncludes(bumped, `jsr:@netscript/sdk@${version}/auto-update`);
      assertStringIncludes(bumped, `jsr:@netscript/sdk@${version}/desktop`);
      assertStringIncludes(bumped, `jsr:@netscript/ai@${version}`);
      assertStringIncludes(bumped, 'npm:preact@^10.29.2');
      assertEquals(await findVersionResidue(root, '1.2.3'), []);
      assertEquals(await findVersionResidue(root, manifest.version), []);

      // Exercise the production embedding rather than looking for pins inside its compressed text.
      for (
        const path of [
          'scripts/embed-registry-assets.ts',
          'src/registry/schemas/registry.json',
          'src/registry/schemas/registry-item.json',
        ]
      ) {
        const target = `${root}/packages/fresh-ui/${path}`;
        await Deno.mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
        await Deno.copyFile(
          new URL(`../../../packages/fresh-ui/${path}`, import.meta.url),
          target,
        );
      }
      const embedded = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-read',
          '--allow-write',
          '--allow-run=deno',
          `${root}/packages/fresh-ui/scripts/embed-registry-assets.ts`,
        ],
        cwd: root,
      }).output();
      assertEquals(embedded.code, 0, new TextDecoder().decode(embedded.stderr));
      const carrier = await Deno.readTextFile(`${root}/${REGISTRY_EMBEDDED_PATH}`);
      const encoded =
        /export const registryJson[\s\S]*?atob\(\s*['"]([^'"]+)['"]/.exec(carrier)![1];
      const decoded = await new Response(
        new Blob([Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))])
          .stream().pipeThrough(new DecompressionStream('gzip')),
      ).json();
      assertEquals(decoded, JSON.parse(bumped));

      await Deno.writeTextFile(`${root}/${REGISTRY_PATH}`, registry);
      const staleCarrier = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-read',
          '--allow-run=deno',
          `${root}/packages/fresh-ui/scripts/embed-registry-assets.ts`,
          '--check',
        ],
        cwd: root,
      }).output();
      assertEquals(staleCarrier.code, 1);
      assertStringIncludes(
        new TextDecoder().decode(staleCarrier.stderr),
        'Stale embedded registry assets',
      );
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}
