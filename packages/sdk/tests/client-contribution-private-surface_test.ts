import { assert, assertEquals, assertFalse } from '@std/assert';

const PRIVATE_ADAPTER_NAMES = [
  'createHttpClientLink',
  'ClientLinkPort',
  'ClientLinkCallOptions',
  'SdkClientLogicalCall',
  'PreparedOutboundHeaders',
  'PreparedSdkClientCall',
  'PreparedOutboundHeadersPort',
  'ProcedureMetadataPort',
  'ClientTransportPolicyPort',
  'stableV1PreparedCall',
] as const;

const CONTRIBUTION_PUBLIC_SYMBOLS = [
  'SdkClientContributionProtocol',
  'SdkClientContributionId',
  'SdkClientProcedureDescriptor',
  'SdkClientTransportDescriptor',
  'SdkClientPrepareOptions',
  'SdkClientRequestPatch',
  'SdkClientContextDeclaration',
  'SdkClientCachePartitionOptions',
  'SdkClientResponseCache',
  'SdkClientContribution',
  'SdkClientContributionContext',
  'ValidateSdkClientContributions',
  'SdkClientServerKeySuffix',
  'SdkClientContributionError',
  'SdkClientContributionErrorCode',
  'SdkClientContributionDiagnostic',
  'defineSdkClientContribution',
] as const;

const REJECTED_PACKED_IMPORTS = [
  '@netscript/sdk/internal/client-contributions',
  '@netscript/sdk/internal/client-contributions/adapter-ports',
  '@netscript/sdk/client-contributions',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function findNamedNode(value: unknown, name: string): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findNamedNode(entry, name);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  if (value.name === name) return value;
  for (const entry of Object.values(value)) {
    const found = findNamedNode(entry, name);
    if (found !== undefined) return found;
  }
  return undefined;
}

async function runCommand(
  command: string,
  args: readonly string[],
  cwd?: string,
): Promise<Deno.CommandOutput> {
  return await new Deno.Command(command, {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

function runDeno(args: readonly string[], cwd?: string): Promise<Deno.CommandOutput> {
  return runCommand(Deno.execPath(), args, cwd);
}

function outputText(output: Deno.CommandOutput): string {
  return new TextDecoder().decode(output.stderr);
}

Deno.test('public SDK entrypoints omit every prohibited link and private adapter identity', async () => {
  const entrypoints = [
    new URL('../mod.ts', import.meta.url).href,
    new URL('../src/client/mod.ts', import.meta.url).href,
    new URL('../src/ports/mod.ts', import.meta.url).href,
    new URL('../src/desktop/mod.ts', import.meta.url).href,
  ];

  for (const entrypoint of entrypoints) {
    const output = await runDeno(['doc', '--json', entrypoint]);
    assertEquals(output.code, 0, outputText(output));
    const documentation = new TextDecoder().decode(output.stdout);
    for (const privateName of PRIVATE_ADAPTER_NAMES) {
      assertFalse(
        documentation.includes(privateName),
        `${entrypoint} leaks private adapter identity ${privateName}`,
      );
    }
  }
});

Deno.test('new SDK client-contribution declarations contain zero oRPC identity', async () => {
  const output = await runDeno([
    'doc',
    '--json',
    new URL('../mod.ts', import.meta.url).href,
  ]);
  assertEquals(output.code, 0, outputText(output));
  const documentation: unknown = JSON.parse(new TextDecoder().decode(output.stdout));

  for (const symbol of CONTRIBUTION_PUBLIC_SYMBOLS) {
    const node = findNamedNode(documentation, symbol);
    assert(node !== undefined, `deno doc --json omitted ${symbol}`);
    const declaration = JSON.stringify(node);
    assertFalse(declaration.includes('@orpc'), `${symbol} leaks an @orpc identity`);
    assertFalse(declaration.includes('npm:'), `${symbol} leaks an npm identity`);
  }
});

Deno.test('packed SDK rejects all client-contribution private subpaths', async () => {
  const packageRoot = new URL('..', import.meta.url).pathname;
  const temporaryRoot = await Deno.makeTempDir({ prefix: 'netscript-sdk-packed-' });
  const tarball = `${temporaryRoot}/netscript-sdk.tgz`;
  const consumer = `${temporaryRoot}/consumer`;
  await Deno.mkdir(consumer);

  try {
    const packed = await runDeno(
      ['pack', '--allow-dirty', '--output', tarball],
      packageRoot,
    );
    assertEquals(packed.code, 0, outputText(packed));
    await Deno.writeTextFile(
      `${consumer}/package.json`,
      JSON.stringify({
        private: true,
        type: 'module',
        dependencies: {
          '@netscript/sdk': 'file:../netscript-sdk.tgz',
        },
      }),
    );
    await Deno.writeTextFile(
      `${consumer}/deno.json`,
      JSON.stringify({ nodeModulesDir: 'manual' }),
    );

    const installed = await runCommand(
      'npm',
      ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
      consumer,
    );
    assertEquals(installed.code, 0, outputText(installed));

    await Deno.writeTextFile(
      `${consumer}/probe.ts`,
      "import { createServiceClient } from '@netscript/sdk/client';\nvoid createServiceClient;\n",
    );
    const positive = await runDeno(['check', 'probe.ts'], consumer);
    assertEquals(positive.code, 0, outputText(positive));

    for (const specifier of REJECTED_PACKED_IMPORTS) {
      await Deno.writeTextFile(
        `${consumer}/probe.ts`,
        `import '${specifier}';\n`,
      );
      const negative = await runDeno(['check', 'probe.ts'], consumer);
      assert(negative.code !== 0, `${specifier} unexpectedly imported from the packed SDK`);
    }
  } finally {
    await Deno.remove(temporaryRoot, { recursive: true });
  }
});
