import { assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';

interface WorkflowEventConfig {
  paths?: string[];
}

interface ParsedWorkflow {
  on: Record<string, WorkflowEventConfig>;
}

function parseYamlScalar(source: string): string {
  const value = source.trim();
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value) as string;
  }
  return value;
}

/** Read the workflow's indentation-delimited YAML event mapping for structural assertions. */
function readWorkflowEventPaths(source: string): ParsedWorkflow {
  const document: ParsedWorkflow = { on: {} };
  let inEvents = false;
  let eventName: string | undefined;
  let sequenceName: string | undefined;

  for (const line of source.split(/\r?\n/)) {
    if (line.trim().length === 0 || line.trimStart().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    const content = line.trim();

    if (indent === 0) {
      if (content === 'on:') {
        inEvents = true;
        continue;
      }
      if (inEvents) break;
      continue;
    }
    if (!inEvents) continue;

    if (indent === 2 && content.endsWith(':')) {
      eventName = content.slice(0, -1);
      document.on[eventName] = {};
      sequenceName = undefined;
      continue;
    }

    if (indent === 4 && eventName) {
      const separator = content.indexOf(':');
      if (separator < 0) throw new Error(`Invalid workflow event property: ${content}`);
      sequenceName = content.slice(0, separator);
      if (sequenceName === 'paths') document.on[eventName].paths = [];
      continue;
    }

    if (indent === 6 && eventName && sequenceName === 'paths' && content.startsWith('- ')) {
      document.on[eventName].paths?.push(parseYamlScalar(content.slice(2)));
    }
  }

  return document;
}

Deno.test('Fresh UI workflow trigger paths cover every private-lock input on both event arms', async () => {
  const workflow = readWorkflowEventPaths(
    await Deno.readTextFile('.github/workflows/fresh-ui-quality.yml'),
  );
  const pullRequestPaths = workflow.on.pull_request?.paths;
  const pushPaths = workflow.on.push?.paths;
  const requiredPrivateLockInputs = [
    'packages/*/deno.json',
    'packages/*/deno.jsonc',
    'packages/cli/e2e/deno.json',
    'packages/cli/e2e/deno.jsonc',
    'plugins/*/deno.json',
    'plugins/*/deno.jsonc',
    'deno.lock',
  ];

  assertEquals(pullRequestPaths, pushPaths, 'pull_request and push paths must stay synchronized');
  for (const path of requiredPrivateLockInputs) {
    assertEquals(pullRequestPaths?.includes(path), true, `pull_request paths missing ${path}`);
    assertEquals(pushPaths?.includes(path), true, `push paths missing ${path}`);
  }

  const positiveIndex = pullRequestPaths?.indexOf('packages/fresh-ui/**') ?? -1;
  assertEquals(positiveIndex >= 0, true);
  assertEquals(
    (pullRequestPaths?.indexOf('!packages/fresh-ui/**/*.md') ?? -1) > positiveIndex,
    true,
    'Markdown negation must follow the positive Fresh UI path',
  );
  assertEquals(
    (pullRequestPaths?.indexOf('!packages/fresh-ui/**/*.mdx') ?? -1) > positiveIndex,
    true,
    'MDX negation must follow the positive Fresh UI path',
  );
});

Deno.test('frozen Fresh UI check rejects lock drift without rewriting the lock', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-frozen-lock-' });
  try {
    await Deno.writeTextFile(
      `${root}/deno.json`,
      `${JSON.stringify({ imports: { '@std/assert': 'jsr:@std/assert@1' } }, null, 2)}\n`,
    );
    await Deno.writeTextFile(
      `${root}/mod.ts`,
      "import { assert } from '@std/assert';\nassert(true);\n",
    );
    const staleLock = `${
      JSON.stringify({ version: '5', specifiers: {}, jsr: {}, npm: {} }, null, 2)
    }\n`;
    await Deno.writeTextFile(`${root}/deno.lock`, staleLock);

    const result = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--lock=deno.lock', '--frozen', 'mod.ts'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    assertNotEquals(result.code, 0);
    assertStringIncludes(new TextDecoder().decode(result.stderr), 'The lockfile is out of date');
    assertEquals(await Deno.readTextFile(`${root}/deno.lock`), staleLock);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
