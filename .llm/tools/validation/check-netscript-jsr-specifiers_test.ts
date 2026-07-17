import { assertEquals } from 'jsr:@std/assert@^1';
import { scanNetscriptJsrSpecifiers } from './check-netscript-jsr-specifiers.ts';

Deno.test('embedded MCP documentation is allowed without weakening MCP source checks', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-jsr-specifier-guard-' });
  try {
    await Deno.mkdir(`${root}/packages/mcp/src`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/packages/mcp/src/publish-assets.generated.ts`,
      `export const README = 'deno add jsr:@netscript/mcp';\n`,
    );
    await Deno.writeTextFile(
      `${root}/packages/mcp/src/runtime.ts`,
      `export const command = 'deno run jsr:@netscript/mcp';\n`,
    );

    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.allowances, [{
      path: 'packages/mcp/src/publish-assets.generated.ts',
      line: 1,
      reason:
        'generated embedded documentation strings are never emitted or executed as framework specifiers',
    }]);
    assertEquals(result.findings.length, 1);
    assertEquals(result.findings[0].path, 'packages/mcp/src/runtime.ts');
    assertEquals(result.findings[0].specifier, 'jsr:@netscript/mcp');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
