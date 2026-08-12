import { assert, assertEquals } from '@std/assert';
import { toFileUrl } from '@std/path';
import { coordinateVersionBump, findVersionResidue } from './deps/bump-version.ts';
import { readAgentDocsEmbeddedBundle } from './generate-cli-assets-barrel.ts';
import {
  buildMcpEmbeddedDocs,
  generateMcpAssets,
  generatePublishAssets,
  MCP_EMBEDDED_DOC_PATHS,
  MCP_EMBEDDED_DOCS_MAX_BYTES,
  refreshAgentDocsProvenance,
} from './generate-publish-assets.ts';

const NOOP_GENERATOR = async (): Promise<void> => {};

Deno.test('CLI corpus integrity follows canonical content across gzip transport variance', async () => {
  const root = await Deno.makeTempDir();
  const rootUrl = toFileUrl(`${root}/`);
  try {
    await Promise.all([
      Deno.mkdir(`${root}/packages/cli`, { recursive: true }),
      Deno.mkdir(`${root}/.llm/assets/agent-docs`, { recursive: true }),
    ]);
    const payload = { schemaVersion: 1, files: { 'llms.txt': '## Task router\n' } } as const;
    const canonical = new TextEncoder().encode(JSON.stringify(payload));
    const alternateTransport = await gzip(canonical);
    alternateTransport[4] = alternateTransport[4] === 0 ? 1 : 0;
    await Promise.all([
      Deno.writeTextFile(`${root}/packages/cli/deno.json`, JSON.stringify({ version: '0.0.5' })),
      Deno.writeFile(`${root}/.llm/assets/agent-docs/prose.json.gz`, alternateTransport),
      Deno.writeTextFile(
        `${root}/.llm/assets/agent-docs/provenance.json`,
        JSON.stringify({
          schemaVersion: 1,
          version: '0.0.5',
          sourceCommit: 'fixture',
          extractionTimestamp: '2026-08-12T00:00:00Z',
          files: ['llms.txt'],
          uncompressedBytes: canonical.byteLength,
          compressedBytes: alternateTransport.byteLength,
          sha256: await digest(canonical),
        }),
      ),
    ]);

    const bundle = await readAgentDocsEmbeddedBundle(rootUrl);
    assertEquals(bundle.compressed, alternateTransport);
    assertEquals(bundle.provenance.sha256, await digest(canonical));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('MCP fallback is generated from the locked release prose within 256 KiB', async () => {
  const generated = await buildMcpEmbeddedDocs();
  assertEquals(generated.provenance.paths, MCP_EMBEDDED_DOC_PATHS);
  assertEquals(generated.provenance.documentCount, 12);
  assertEquals(generated.provenance.documentCount, MCP_EMBEDDED_DOC_PATHS.length);
  assertEquals(generated.documents.map((document) => document.path), [...MCP_EMBEDDED_DOC_PATHS]);
  assertEquals(generated.documents[0]?.path, 'llms.txt');
  assertEquals(generated.documents[0]?.slug, 'llms');
  assert(generated.documents.every((document) => document.source.length > 0));
  assert(generated.provenance.sourceBytes <= MCP_EMBEDDED_DOCS_MAX_BYTES);
  assertEquals(generated.provenance.sha256.length, 64);
});

Deno.test('release asset regeneration removes prior-version provenance residue', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/packages/cli`, { recursive: true });
    await Deno.mkdir(`${root}/.llm/assets/agent-docs`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/packages/cli/deno.json`,
      JSON.stringify({ version: '0.0.4-canary.1' }),
    );
    await Deno.writeTextFile(
      `${root}/.llm/assets/agent-docs/provenance.json`,
      `${
        JSON.stringify(
          {
            schemaVersion: 1,
            version: '0.0.3',
            sourceCommit: 'd6265fa52',
            extractionTimestamp: '2026-08-03T10:09:58Z',
            files: [],
            uncompressedBytes: 1,
            compressedBytes: 1,
            sha256: 'fixture',
          },
          null,
          2,
        )
      }\n`,
    );
    assertEquals(await findVersionResidue(root, '0.0.3'), [
      `${root}/.llm/assets/agent-docs/provenance.json`,
    ]);
    await refreshAgentDocsProvenance(toFileUrl(`${root}/`), false);
    assertEquals(await findVersionResidue(root, '0.0.3'), []);
    const regenerated = JSON.parse(
      await Deno.readTextFile(`${root}/.llm/assets/agent-docs/provenance.json`),
    );
    assertEquals(regenerated.version, '0.0.4-canary.1');
    assertEquals(regenerated.sourceCommit, 'd6265fa52');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('top-level generation refreshes provenance before MCP reads it', async () => {
  const root = await Deno.makeTempDir();
  const rootUrl = toFileUrl(`${root}/`);
  try {
    const checkedInProvenance = JSON.parse(
      await Deno.readTextFile(new URL('../assets/agent-docs/provenance.json', import.meta.url)),
    );
    await Promise.all([
      Deno.mkdir(`${root}/packages/cli`, { recursive: true }),
      Deno.mkdir(`${root}/packages/mcp/src`, { recursive: true }),
      Deno.mkdir(`${root}/.llm/assets/agent-docs`, { recursive: true }),
    ]);
    await Promise.all([
      Deno.writeTextFile(
        `${root}/packages/cli/deno.json`,
        JSON.stringify({ version: '0.0.5-canary.18' }),
      ),
      Deno.writeTextFile(
        `${root}/packages/mcp/deno.json`,
        JSON.stringify({ version: '0.0.5-canary.18' }),
      ),
      Deno.copyFile(
        new URL('../../packages/mcp/README.md', import.meta.url),
        `${root}/packages/mcp/README.md`,
      ),
      Deno.copyFile(
        new URL('../assets/agent-docs/prose.json.gz', import.meta.url),
        `${root}/.llm/assets/agent-docs/prose.json.gz`,
      ),
      Deno.writeTextFile(
        `${root}/.llm/assets/agent-docs/provenance.json`,
        `${
          JSON.stringify(
            {
              ...checkedInProvenance,
              schemaVersion: 1,
              version: '0.0.4',
              sourceCommit: 'stale-fixture',
            },
            null,
            2,
          )
        }\n`,
      ),
    ]);

    let provenanceRefreshed = false;
    await generatePublishAssets({
      refreshProvenance: async () => {
        await refreshAgentDocsProvenance(rootUrl, false);
        provenanceRefreshed = true;
      },
      generateMcp: async () => {
        assert(provenanceRefreshed, 'MCP generation started before provenance refresh completed');
        await generateMcpAssets(rootUrl, false, []);
      },
      generateCli: NOOP_GENERATOR,
      generateFreshUi: NOOP_GENERATOR,
      generateCorePackages: NOOP_GENERATOR,
      generatePlugins: NOOP_GENERATOR,
    });

    const generated = await Deno.readTextFile(
      `${root}/packages/mcp/src/publish-assets.generated.ts`,
    );
    assert(generated.includes("MCP_PACKAGE_VERSION: string = '0.0.5-canary.18'"));
    assert(!generated.includes("MCP_PACKAGE_VERSION: string = '0.0.4'"));
    assert(generated.includes("'frameworkVersion': '0.0.5-canary.18'"));
    assert(generated.includes("'sourceCommit': 'stale-fixture'"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publish assets consume the genuinely rendered shared corpus without rebasing it', async () => {
  const root = await Deno.makeTempDir();
  const rootUrl = toFileUrl(`${root}/`);
  const oldVersion = '0.0.4';
  const nextVersion = '0.0.5-canary.99';
  try {
    await Promise.all([
      Deno.mkdir(`${root}/packages/cli`, { recursive: true }),
      Deno.mkdir(`${root}/packages/mcp/src`, { recursive: true }),
      Deno.mkdir(`${root}/.llm/assets/agent-docs`, { recursive: true }),
    ]);
    await Promise.all([
      Deno.writeTextFile(
        `${root}/deno.json`,
        JSON.stringify({ version: oldVersion, workspace: ['packages/*'], publish: false }),
      ),
      Deno.writeTextFile(
        `${root}/packages/cli/deno.json`,
        JSON.stringify({ name: '@netscript/cli', version: oldVersion }),
      ),
      Deno.writeTextFile(
        `${root}/packages/mcp/deno.json`,
        JSON.stringify({ name: '@netscript/mcp', version: oldVersion }),
      ),
      Deno.copyFile(
        new URL('../../packages/mcp/README.md', import.meta.url),
        `${root}/packages/mcp/README.md`,
      ),
    ]);

    const bump = await coordinateVersionBump(root, nextVersion, 'canary');
    const files = Object.fromEntries(
      MCP_EMBEDDED_DOC_PATHS.map((path, index) => [
        path,
        index === 0
          ? `Shipped in ${nextVersion}. Install \`jsr:@netscript/plugin@${nextVersion}\`. ` +
            `Historical: \`jsr:@netscript/cli@0.0.2\`.\n`
          : `# ${path}\nRelease-current guidance.\n`,
      ]),
    );
    const uncompressed = new TextEncoder().encode(JSON.stringify({ schemaVersion: 1, files }));
    const compressed = await gzip(uncompressed);
    const sha256 = await digest(uncompressed);
    await Promise.all([
      Deno.writeFile(`${root}/.llm/assets/agent-docs/prose.json.gz`, compressed),
      Deno.writeTextFile(
        `${root}/.llm/assets/agent-docs/provenance.json`,
        `${
          JSON.stringify(
            {
              schemaVersion: 1,
              version: nextVersion,
              sourceCommit: 'release-fixture',
              extractionTimestamp: '2026-08-09T00:00:00Z',
              files: Object.keys(files),
              uncompressedBytes: uncompressed.byteLength,
              compressedBytes: compressed.byteLength,
              sha256,
            },
            null,
            2,
          )
        }\n`,
      ),
    ]);

    await generatePublishAssets({
      refreshProvenance: () => refreshAgentDocsProvenance(rootUrl, false),
      generateMcp: () => generateMcpAssets(rootUrl, false, []),
      generateCli: NOOP_GENERATOR,
      generateFreshUi: NOOP_GENERATOR,
      generateCorePackages: NOOP_GENERATOR,
      generatePlugins: NOOP_GENERATOR,
    });

    assertEquals(await findVersionResidue(root, bump.oldVersion), []);
    const cli = await readAgentDocsEmbeddedBundle(rootUrl);
    const cliPayload = await gunzipPayload(cli.compressed);
    const mcp = await buildMcpEmbeddedDocs(rootUrl);
    for (const document of mcp.documents) {
      assertEquals(
        new TextEncoder().encode(document.source),
        new TextEncoder().encode(cliPayload.files[document.path]),
      );
    }
    assert(cliPayload.files['llms.txt'].includes(`Shipped in ${nextVersion}.`));
    assert(cliPayload.files['llms.txt'].includes(`jsr:@netscript/plugin@${nextVersion}`));
    assert(!cliPayload.files['llms.txt'].includes(`jsr:@netscript/plugin@${oldVersion}`));
    assert(cliPayload.files['llms.txt'].includes('jsr:@netscript/cli@0.0.2'));
    assertEquals(cli.provenance.version, nextVersion);
    assertEquals(
      cli.provenance.uncompressedBytes,
      new TextEncoder().encode(
        JSON.stringify(cliPayload),
      ).byteLength,
    );
    assertEquals(cli.provenance.compressedBytes, cli.compressed.byteLength);
    assertEquals(
      cli.provenance.sha256,
      await digest(new TextEncoder().encode(JSON.stringify(cliPayload))),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([copiedBuffer(bytes)]).stream().pipeThrough(
    new CompressionStream('gzip'),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipPayload(
  bytes: Uint8Array,
): Promise<{ readonly schemaVersion: 1; readonly files: Readonly<Record<string, string>> }> {
  const stream = new Blob([copiedBuffer(bytes)]).stream().pipeThrough(
    new DecompressionStream('gzip'),
  );
  return JSON.parse(await new Response(stream).text());
}

async function digest(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', copiedBuffer(bytes));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function copiedBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
