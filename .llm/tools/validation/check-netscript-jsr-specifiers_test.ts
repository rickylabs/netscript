import { assertEquals } from 'jsr:@std/assert@^1';
import { scanNetscriptJsrSpecifiers } from './check-netscript-jsr-specifiers.ts';

Deno.test('embedded MCP documentation is allowed without weakening MCP source checks', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-jsr-specifier-guard-' });
  try {
    await Deno.mkdir(`${root}/packages/mcp/src`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/packages/mcp/src/publish-assets.generated.ts`,
      `export const MCP_PACKAGE_README: string = 'deno add jsr:@netscript/mcp';\n` +
        `export const EXECUTED = 'deno run jsr:@netscript/cli';\n`,
    );
    await Deno.writeTextFile(
      `${root}/packages/mcp/src/runtime.ts`,
      `export const command = 'deno run jsr:@netscript/mcp';\n`,
    );

    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.allowances, []);
    assertEquals(result.findings.length, 2);
    assertEquals(result.findings[0].path, 'packages/mcp/src/publish-assets.generated.ts');
    assertEquals(result.findings[0].specifier, 'jsr:@netscript/cli');
    assertEquals(result.findings[1].path, 'packages/mcp/src/runtime.ts');
    assertEquals(result.findings[1].specifier, 'jsr:@netscript/mcp');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
