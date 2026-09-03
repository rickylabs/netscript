import { assert, assertEquals, assertFalse } from '@std/assert';

const PROCEDURE_METADATA_SYMBOLS = [
  'NetScriptAuthenticationRequirement',
  'NetScriptProcedureMeta',
  'BaseContractMeta',
  'ProcedureMetaFromNode',
  'ProcedureMeta',
  'SdkClientHttpMethod',
  'SdkClientTransportPolicyMethodOptions',
  'SdkClientTransportPolicy',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  if (value.name === name && Array.isArray(value.declarations)) return value;

  for (const entry of Object.values(value)) {
    const found = findNamedNode(entry, name);
    if (found !== undefined) return found;
  }
  return undefined;
}

Deno.test('procedure metadata declarations are independent of upstream public types', async () => {
  const contractsEntrypoint = new URL('../../contracts/mod.ts', import.meta.url).href;
  const sdkClientEntrypoint = new URL('../src/client/mod.ts', import.meta.url).href;
  const sdkDesktopEntrypoint = new URL('../src/desktop/mod.ts', import.meta.url).href;
  const sdkPortsEntrypoint = new URL('../src/ports/mod.ts', import.meta.url).href;
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'doc',
      '--json',
      contractsEntrypoint,
      sdkClientEntrypoint,
      sdkDesktopEntrypoint,
      sdkPortsEntrypoint,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = new TextDecoder().decode(output.stderr);
  assertEquals(output.code, 0, stderr);

  const documentation: unknown = JSON.parse(new TextDecoder().decode(output.stdout));
  for (const symbol of PROCEDURE_METADATA_SYMBOLS) {
    const node = findNamedNode(documentation, symbol);
    assert(node !== undefined, `deno doc --json omitted ${symbol}`);
    const declaration = JSON.stringify(node);
    assertFalse(declaration.includes('@orpc'), `${symbol} leaks an @orpc public type`);
    assertFalse(declaration.includes('npm:'), `${symbol} leaks an npm public type`);
  }

  const procedureMeta = findNamedNode(documentation, 'NetScriptProcedureMeta');
  assert(procedureMeta !== undefined, 'deno doc --json omitted NetScriptProcedureMeta');
  const declaration = JSON.stringify(procedureMeta);
  for (const field of ['authorization', 'scopes', 'roles', 'policy', 'cache', 'force-cache']) {
    assert(declaration.includes(field), `NetScriptProcedureMeta omits ${field}`);
  }
  assertEquals(findNamedNode(documentation, 'resolveTransportPolicy'), undefined);
});
