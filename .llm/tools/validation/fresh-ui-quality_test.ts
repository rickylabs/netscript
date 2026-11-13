import { BROWSER_PROJECT } from '../deps/standalone-projects.ts';
import { gateArgv } from '../gates/catalog.ts';
import { checkGeneratedFiles } from '../testing/check-generated-files.ts';
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';

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
    'tools/fresh-ui-browser/**',
    'packages/fresh/**',
    'packages/cli/src/kernel/assets/app/**',
    'packages/cli/src/kernel/assets/embedded.generated.ts',
    'packages/cli/src/kernel/assets/publish-assets.generated.ts',
    '.llm/tools/run-deno-test.ts',
    '.llm/tools/gates/catalog.ts',
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

    const result = await checkGeneratedFiles({
      args: ['check', '--lock=deno.lock', '--frozen', 'mod.ts'],
      cwd: root,
    });

    assertNotEquals(result.code, 0);
    assertStringIncludes(new TextDecoder().decode(result.stderr), 'The lockfile is out of date');
    assertEquals(await Deno.readTextFile(`${root}/deno.lock`), staleLock);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('Fresh UI CI preserves quality gates and captures the real gallery matrix', async () => {
  const workflow = await Deno.readTextFile('.github/workflows/fresh-ui-quality.yml');
  for (
    const gate of [
      'check',
      'lint',
      'fresh-ui-lock-regression',
      'clean-worktree',
      'test',
      'fresh-ui-token-build',
      'fresh-ui-tokens',
      'fresh-ui-browser',
      'fresh-ui-browser-contract',
    ]
  ) {
    assertStringIncludes(workflow, `--gate ${gate} `);
  }
  assertEquals(
    workflow.indexOf('--gate fresh-ui-tokens ') < workflow.indexOf('--gate fresh-ui-token-build '),
    true,
    'freshness must run before a build can repair a tracked hand edit',
  );
  assertStringIncludes(workflow, '--app-name dashboard --db none');
  assertStringIncludes(workflow, '--no-aspire --no-git --editor none --ci --yes');
  assertStringIncludes(workflow, 'npm ci --ignore-scripts');
  assertStringIncludes(workflow, 'npx playwright install --with-deps chromium');
  assertStringIncludes(workflow, '--child-report test-results/results.json');
  assertStringIncludes(workflow, "if: always() && env.RUN == 'true'");
  assertStringIncludes(workflow, 'tools/fresh-ui-browser/test-results/');
  assertStringIncludes(workflow, 'if-no-files-found: error');
});

function browserJob(source: string): string {
  const active = source.split(/\r?\n/).filter((line) => !line.trimStart().startsWith('#')).join(
    '\n',
  );
  const job = active.match(
    /^ {2}fresh-ui-browser:\n([\s\S]*?)(?=^ {2}[a-z][a-z0-9-]*:|$(?![\s\S]))/m,
  )
    ?.[1];
  assert(job, 'missing browser job');
  return job;
}

/** Lock the executable contract step, its policy condition, ordering and uploaded evidence. */
function assertBrowserContract(source: string): void {
  const job = browserJob(source);
  assertStringIncludes(
    job,
    "    if: >-\n      !cancelled() && needs.classify.result != 'skipped'\n",
  );
  assertEquals(/^ {4}continue-on-error:/m.test(job), false);
  const steps = job.match(/^ {6}- [\s\S]*?(?=^ {6}- |$(?![\s\S]))/gm) ?? [];
  const run = (step: string) =>
    step.match(/^ {8}run: >-\n((?: {10}[^\n]*(?:\n|$))*)/m)?.[1].trim().replace(
      /\s+/g,
      ' ',
    ) ?? '';
  const index = steps.findIndex((step) => run(step).includes('--gate fresh-ui-browser-contract '));
  assert(index >= 0, 'missing executable baseline contract');
  const step = steps[index];
  assertEquals(/^ {8}continue-on-error:/m.test(step), false);
  assertStringIncludes(step, "        if: env.RUN == 'true'\n");
  assert(gateArgv('fresh-ui-browser-contract').includes('accessibility.contract.ts'));
  assertEquals(
    run(step),
    [
      'deno run --allow-read --allow-write --allow-run --allow-env',
      '.llm/tools/gates/run-gate.ts --gate fresh-ui-browser-contract --id fresh-ui-browser-contract',
      '--cwd tools/fresh-ui-browser',
      '--output .llm/tmp/gate-receipts/fresh-ui-browser/contract.receipt.json',
      '--child-report ../../.llm/tmp/gate-receipts/fresh-ui-browser/contract.report.json --',
      '--report-output ../../.llm/tmp/gate-receipts/fresh-ui-browser/contract.report.json',
    ].join(' '),
  );
  const installed = steps.findIndex((item) => /^ {8}run: npm ci --ignore-scripts$/m.test(item));
  const matrix = steps.findIndex((item) => run(item).includes('--gate fresh-ui-browser '));
  assert(
    installed >= 0 && installed < index && matrix > index,
    'contract must run after install and before browser matrix',
  );
  const upload = steps.find((item) => /^ {8}uses: actions\/upload-artifact@/m.test(item));
  assert(upload, 'missing uploaded contract evidence');
  assertStringIncludes(upload, '          path: |\n');
  assertStringIncludes(upload, '            .llm/tmp/gate-receipts/fresh-ui-browser/');
}

Deno.test('browser contract step is mandatory, executable, ordered and cannot hide failures', async () => {
  const source = (await Deno.readTextFile('.github/workflows/fresh-ui-quality.yml')).replaceAll(
    '\r\n',
    '\n',
  );
  assertBrowserContract(source);
  const block = source.match(
    /^ {6}- name: Exact axe baseline contract\n[\s\S]*?(?=^ {6}- name:)/m,
  )?.[0];
  assert(block);
  const without = source.replace(block, '');
  const commented = block.split('\n').map((line) => `# ${line}`).join('\n');
  const movedBeforeInstall = without.replace(
    '      - name: Install locked browser tooling',
    `${block}      - name: Install locked browser tooling`,
  );
  const variants = [
    source.replace(
      browserJob(source),
      browserJob(source).replace(
        "    if: >-\n      !cancelled() && needs.classify.result != 'skipped'",
        '    if: false',
      ),
    ),
    without,
    source.replace('--gate fresh-ui-browser-contract ', '--gate unknown-contract '),
    source.replace(block, commented),
    source.replace(
      block,
      '      - name: --gate fresh-ui-browser-contract\n        run: echo skipped\n',
    ),
    source.replace(
      block,
      block.replace('        run:', '        continue-on-error: true\n        run:'),
    ),
    source.replace('  fresh-ui-browser:\n', '  fresh-ui-browser:\n    continue-on-error: true\n'),
    source.replace(block, block.replace("if: env.RUN == 'true'", 'if: false')),
    source.replace(block, block.replace("        if: env.RUN == 'true'\n", '')),
    source.replace(block, block.trimEnd() + ' || true\n'),
    source.replace(block, block.trimEnd() + '; exit 0\n'),
    source.replace(block, block.replace('--cwd tools/fresh-ui-browser', '--cwd .')),
    movedBeforeInstall,
    without + block,
    without.replace(
      '  fresh-ui-quality:\n',
      `  another-job:\n    steps:\n${block}  fresh-ui-quality:\n`,
    ),
    source.replace(
      block,
      block.replace(
        '.llm/tmp/gate-receipts/fresh-ui-browser/contract.receipt.json',
        '.llm/tmp/unuploaded/receipt.json',
      ),
    ),
    source.replace(
      block,
      block.replaceAll(
        '../../.llm/tmp/gate-receipts/fresh-ui-browser/contract.report.json',
        '../../unuploaded/report.json',
      ),
    ),
  ];
  for (const [index, variant] of variants.entries()) {
    assertThrows(
      () => assertBrowserContract(variant),
      Error,
      undefined,
      `negative control ${index}`,
    );
  }
});

function assertBrowserDependabot(source: string): void {
  const active = source.split(/\r?\n/).filter((line) => !line.trimStart().startsWith('#')).join(
    '\n',
  );
  const entries = active.split(/^ {2}- /m).slice(1);
  const entry = entries.find((block) =>
    block.startsWith('package-ecosystem: "npm"\n') &&
    block.includes(`    directory: "/${BROWSER_PROJECT}"\n`)
  );
  assert(entry, 'Dependabot must own the registered browser npm directory');
  for (
    const value of [
      'interval: "weekly"',
      'versioning-strategy: increase',
      'labels: []',
      '      playwright:',
      '      axe:',
      '- "@playwright/test"',
      '- "playwright-core"',
      '- "@axe-core/playwright"',
      '- "axe-core"',
    ]
  ) assertStringIncludes(entry, value);
  for (
    const [group, packages] of [
      ['playwright', ['@playwright/test', 'playwright-core']],
      ['axe', ['@axe-core/playwright', 'axe-core']],
    ] as const
  ) {
    const block = entry.match(
      new RegExp(`^ {6}${group}:\\n([\\s\\S]*?)(?=^ {6}[a-z]|$(?![\\s\\S]))`, 'm'),
    )?.[1];
    assert(block, `missing update group ${group}`);
    for (const name of packages) assertStringIncludes(block, `          - "${name}"`);
  }
}

Deno.test('Dependabot owns exact browser manifest/lock and groups paired engine pins', async () => {
  const source = await Deno.readTextFile('.github/dependabot.yml');
  assertBrowserDependabot(source);
  await Deno.stat(`${BROWSER_PROJECT}/package.json`);
  await Deno.stat(`${BROWSER_PROJECT}/package-lock.json`);
  assertThrows(() =>
    assertBrowserDependabot(source.replace(`/${BROWSER_PROJECT}`, '/wrong-directory'))
  );
  assertThrows(() =>
    assertBrowserDependabot(
      source.replace('          - "playwright-core"', '          - "unpaired-playwright"'),
    )
  );
});
