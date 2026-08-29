import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1';

const CONTRACT_METADATA_SYMBOLS = [
  'NetScriptAuthenticationRequirement',
  'NetScriptProcedureMeta',
  'BaseContractMeta',
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
  if (value.name === name) return value;

  for (const entry of Object.values(value)) {
    const found = findNamedNode(entry, name);
    if (found !== undefined) return found;
  }
  return undefined;
}

Deno.test('contracts procedure metadata declarations are independent of upstream public types', async () => {
  const entrypoint = new URL('../mod.ts', import.meta.url).href;
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', entrypoint],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = new TextDecoder().decode(output.stderr);
  assertEquals(output.code, 0, stderr);

  const documentation: unknown = JSON.parse(new TextDecoder().decode(output.stdout));
  for (const symbol of CONTRACT_METADATA_SYMBOLS) {
    const node = findNamedNode(documentation, symbol);
    assert(node !== undefined, `deno doc --json omitted ${symbol}`);
    const declaration = JSON.stringify(node);
    assertFalse(declaration.includes('@orpc'), `${symbol} leaks an @orpc public type`);
    assertFalse(declaration.includes('npm:'), `${symbol} leaks an npm public type`);
  }
});
