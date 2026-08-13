import { assertEquals } from 'jsr:@std/assert@^1';
import { failureCount, scanNetscriptJsrSpecifiers } from './check-netscript-jsr-specifiers.ts';
import {
  createNetscriptJsrSpecifierRegExp,
  parseNetscriptJsrSpecifier,
} from '../netscript-jsr-specifier.ts';

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
    // Without a declared workspace there is nothing to compare a version against.
    assertEquals(result.staleVersions, []);
    assertEquals(result.unknownExports, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

/** A temp workspace shipping `@netscript/sdk@0.0.1-beta.11` with a `./desktop` export. */
async function workspaceWithSdk(source: string): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-jsr-specifier-guard-' });
  await Deno.writeTextFile(
    `${root}/deno.json`,
    JSON.stringify({ version: '0.0.1-beta.11', workspace: ['packages/*'] }),
  );
  await Deno.mkdir(`${root}/packages/sdk`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/packages/sdk/deno.json`,
    JSON.stringify({
      name: '@netscript/sdk',
      version: '0.0.1-beta.11',
      exports: { '.': './mod.ts', './desktop': './src/desktop/mod.ts' },
    }),
  );
  await Deno.mkdir(`${root}/packages/fresh-ui`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/packages/fresh-ui/deno.json`,
    JSON.stringify({ name: '@netscript/fresh-ui', version: '0.0.1-beta.11' }),
  );
  await Deno.writeTextFile(`${root}/packages/fresh-ui/registry.manifest.ts`, source);
  return root;
}

Deno.test('a pin from a previous release fails, naming the version the workspace ships', async () => {
  const root = await workspaceWithSdk(
    `export const deps = ['jsr:@netscript/sdk@0.0.1-beta.10/desktop'];\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.staleVersions.length, 1);
    assertEquals(result.staleVersions[0].path, 'packages/fresh-ui/registry.manifest.ts');
    assertEquals(result.staleVersions[0].pinned, '0.0.1-beta.10');
    assertEquals(result.staleVersions[0].current, '0.0.1-beta.11');
    assertEquals(failureCount(result), 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a current pin naming a real export passes', async () => {
  const root = await workspaceWithSdk(
    `export const deps = ['jsr:@netscript/sdk@0.0.1-beta.11/desktop'];\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);
    assertEquals(failureCount(result), 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('sentence punctuation terminates an exact prerelease specifier', async () => {
  for (
    const prose of [
      'install jsr:@netscript/sdk@0.0.1-beta.11.',
      'install jsr:@netscript/sdk@0.0.1-beta.11, continue',
      '(jsr:@netscript/sdk@0.0.1-beta.11)',
      'install jsr:@netscript/sdk@0.0.1-beta.11\nnext',
    ]
  ) {
    const matched = createNetscriptJsrSpecifierRegExp().exec(prose)?.[0];
    assertEquals(matched, 'jsr:@netscript/sdk@0.0.1-beta.11');
    assertEquals(parseNetscriptJsrSpecifier(matched!), {
      name: '@netscript/sdk',
      version: '0.0.1-beta.11',
      rangeOperator: '',
      subpath: '',
    });
  }

  const root = await workspaceWithSdk(
    `export const period = 'install jsr:@netscript/sdk@0.0.1-beta.11.';\n` +
      `export const comma = 'install jsr:@netscript/sdk@0.0.1-beta.11,';\n` +
      `export const parenthesis = '(jsr:@netscript/sdk@0.0.1-beta.11)';\n` +
      'export const newline = `install jsr:@netscript/sdk@0.0.1-beta.11\nnext`;\n',
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.staleVersions, []);
    assertEquals(result.ranges, []);
    assertEquals(failureCount(result), 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a genuinely versionless specifier remains release-blocking', async () => {
  const root = await workspaceWithSdk(
    `export const deps = ['jsr:@netscript/sdk'];\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.findings.length, 1);
    assertEquals(result.findings[0].specifier, 'jsr:@netscript/sdk');
    assertEquals(failureCount(result), 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('stale exact and range pins remain release-blocking', async () => {
  for (const pin of ['0.0.1-beta.10', '^0.0.1-beta.11', '~0.0.1-beta.11', '>=0.0.1-beta.11']) {
    const root = await workspaceWithSdk(
      `export const deps = ['jsr:@netscript/sdk@${pin}'];\n`,
    );
    try {
      const result = await scanNetscriptJsrSpecifiers(['packages'], root);
      assertEquals(failureCount(result), 1, pin);
      if (pin === '0.0.1-beta.10') assertEquals(result.staleVersions.length, 1, pin);
      else assertEquals(result.ranges.length, 1, pin);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  }
});

Deno.test('a subpath the package does not export fails even when the version is current', async () => {
  const root = await workspaceWithSdk(
    `export const deps = ['jsr:@netscript/sdk@0.0.1-beta.11/auto-update'];\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.staleVersions, []);
    assertEquals(result.unknownExports.length, 1);
    assertEquals(result.unknownExports[0].subpath, 'auto-update');
    assertEquals(result.unknownExports[0].exports, ['.', './desktop']);
    assertEquals(failureCount(result), 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('range pins fail while template placeholders remain version-neutral', async () => {
  const root = await workspaceWithSdk(
    `export const range = ['jsr:@netscript/sdk@^0.0.1-beta.5'];\n` +
      `export const doc = 'deno add jsr:@netscript/sdk@<version>/desktop';\n` +
      `export const template = 'jsr:@netscript/sdk@{{netscriptReleaseVersion}}';\n` +
      `export const prefix = 'jsr:@netscript/sdk@';\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);

    assertEquals(result.ranges.length, 1);
    assertEquals(result.ranges[0].specifier, 'jsr:@netscript/sdk@^0.0.1-beta.5');
    assertEquals(failureCount(result), 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('an allowance marker exempts a versioned specifier from every rule', async () => {
  const root = await workspaceWithSdk(
    `export const pinned = ['jsr:@netscript/sdk@0.0.1-beta.10/nope']; ` +
      `// jsr-versionless-ok: reproduces a historical specifier\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);
    assertEquals(failureCount(result), 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a package outside the workspace is skipped rather than guessed at', async () => {
  const root = await workspaceWithSdk(
    `export const deps = ['jsr:@netscript/not-a-member@0.0.1-beta.3/anything'];\n`,
  );
  try {
    const result = await scanNetscriptJsrSpecifiers(['packages'], root);
    assertEquals(failureCount(result), 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
