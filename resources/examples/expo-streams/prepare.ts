// Prepare focused checkout sources as local packages before npm install.
// Metro compiles TypeScript and the host resolves one TanStack DB and React instance.
import { copy } from '@std/fs/copy';

const sdk = new URL('../../../packages/sdk/', import.meta.url);
const core = new URL('../../../packages/plugin-streams-core/', import.meta.url);
const output = new URL('./.generated/', import.meta.url);
const entries = {
  consumer: 'stream-source',
  collections: 'stream-collection',
  react: 'stream-react',
};
for (const folder of Object.values(entries)) {
  await copy(new URL(`src/client/${folder}`, sdk), new URL(`sdk/src/client/${folder}`, output), {
    overwrite: true,
  });
}
for (
  const file of [
    'src/sse/mod.ts',
    'src/application/stream-sse-v1.ts',
    'src/domain/sse-contract-v1.ts',
    'src/domain/stream-schema.ts',
    'src/domain/stream-event.ts',
  ]
) {
  const target = new URL(`stream-core/${file}`, output);
  await Deno.mkdir(new URL('./', target), { recursive: true });
  await Deno.copyFile(new URL(file, core), target);
}
await Deno.writeTextFile(
  new URL('sdk/package.json', output),
  JSON.stringify(
    {
      name: '@netscript/sdk',
      version: '0.0.0',
      type: 'module',
      exports: Object.fromEntries(
        Object.entries(entries).map((
          [name, folder],
        ) => [`./streams/${name}`, `./src/client/${folder}/mod.ts`]),
      ),
      dependencies: { '@tanstack/db': '0.6.17', '@tanstack/react-db': '0.1.95' },
      peerDependencies: { react: '^19.2.3' },
    },
    null,
    2,
  ),
);
await Deno.writeTextFile(
  new URL('stream-core/package.json', output),
  JSON.stringify(
    {
      name: '@netscript/plugin-streams-core',
      version: '0.0.0',
      type: 'module',
      exports: { './sse': './src/sse/mod.ts' },
    },
    null,
    2,
  ),
);
