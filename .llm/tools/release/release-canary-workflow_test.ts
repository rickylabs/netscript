import { assert, assertEquals, assertStringIncludes } from '@std/assert';

const root = new URL('../../../', import.meta.url);

type YamlScalar = boolean | null | string;

interface ParsedYamlDocument {
  mappings: Set<string>;
  scalars: Map<string, YamlScalar>;
}

interface ConcurrencyBlock {
  workflow: string;
  scope: string;
  group: string;
  classification: string;
  cancelInProgress: boolean;
  queue?: string;
}

/** Parses the mapping/scalar subset used by GitHub workflow concurrency declarations. */
function parseWorkflowYaml(source: string, label: string): ParsedYamlDocument {
  const mappings = new Set<string>();
  const scalars = new Map<string, YamlScalar>();
  const parents: Array<{ indent: number; key: string }> = [];
  let blockScalarIndent: number | undefined;

  for (const [index, raw] of source.split('\n').entries()) {
    if (raw.includes('\t')) {
      throw new Error(`${label}:${index + 1}: tabs are not valid indentation`);
    }
    const text = raw.trim();
    if (text === '' || text.startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;

    if (blockScalarIndent !== undefined) {
      if (indent > blockScalarIndent) continue;
      blockScalarIndent = undefined;
    }

    const entry = text.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!entry) continue;
    while (parents.at(-1)?.indent !== undefined && parents.at(-1)!.indent >= indent) {
      parents.pop();
    }

    const key = entry[1];
    const rawValue = entry[2] ?? '';
    const path = [...parents.map((parent) => parent.key), key].join('.');
    if (rawValue === '') {
      mappings.add(path);
      parents.push({ indent, key });
      continue;
    }
    if (/^[>|][+-]?$/.test(rawValue)) {
      blockScalarIndent = indent;
      continue;
    }

    let value: YamlScalar = rawValue;
    if (rawValue === 'true') value = true;
    else if (rawValue === 'false') value = false;
    else if (rawValue === 'null' || rawValue === '~') value = null;
    else if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) value = rawValue.slice(1, -1);
    scalars.set(path, value);
  }

  return { mappings, scalars };
}

function classifyConcurrencyGroup(group: string): string {
  if (group === "pages-${{ github.event_name == 'pull_request' && github.ref || 'deploy' }}") {
    return 'ref-templated / repo-wide literal';
  }
  if (
    group === 'e2e-scaffold-runtime-global-v2' ||
    group === 'e2e-scaffold-runtime-sqlite-global-v2'
  ) {
    return 'repo-wide literal';
  }
  if (group.startsWith('openhands-${{') && group.includes('github.ref')) {
    return 'entity-keyed / ref fallback';
  }
  if (
    group.includes('inputs.republish-version') ||
    group.includes('github.event.pull_request.number')
  ) {
    return 'entity-keyed';
  }
  if (group.includes('github.ref')) return 'ref-templated';
  throw new Error(`unclassified concurrency group: ${group}`);
}

function readConcurrencyBlocks(
  workflow: string,
  document: ParsedYamlDocument,
): ConcurrencyBlock[] {
  const scalarConcurrency = [...document.scalars.keys()].filter((path) =>
    path === 'concurrency' || path.endsWith('.concurrency')
  );
  assertEquals(
    scalarConcurrency,
    [],
    `${workflow}: scalar concurrency declarations must be added to the parsed contract`,
  );

  return [...document.mappings]
    .filter((path) => path === 'concurrency' || path.endsWith('.concurrency'))
    .map((path) => {
      const group = document.scalars.get(`${path}.group`);
      const cancelInProgress = document.scalars.get(`${path}.cancel-in-progress`);
      const queue = document.scalars.get(`${path}.queue`);
      assert(typeof group === 'string', `${workflow}:${path} must declare a scalar group`);
      assert(
        typeof cancelInProgress === 'boolean',
        `${workflow}:${path} must declare boolean cancel-in-progress`,
      );
      assert(
        queue === undefined || typeof queue === 'string',
        `${workflow}:${path} queue must be a scalar string`,
      );
      const block: ConcurrencyBlock = {
        workflow,
        scope: path === 'concurrency' ? 'workflow' : path.slice(0, -'.concurrency'.length),
        group,
        classification: classifyConcurrencyGroup(group),
        cancelInProgress,
      };
      if (queue !== undefined) block.queue = queue;
      return block;
    });
}

Deno.test('canary workflow reuses the publisher and records only an awaited green pair', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/release-canary.yml', root));
  const concurrency = readConcurrencyBlocks(
    'release-canary.yml',
    parseWorkflowYaml(source, 'release-canary.yml'),
  );
  assertEquals(concurrency, [{
    workflow: 'release-canary.yml',
    scope: 'workflow',
    group: 'release-canary-${{ inputs.republish-version || inputs.target-version }}',
    classification: 'entity-keyed',
    cancelInProgress: false,
    queue: 'max',
  }]);
  const ordered = [
    'check-jsr-publish-budget.ts',
    'deno task release:canary -- "$TARGET_VERSION"',
    'deno task publish:readiness',
    '.llm/tools/release/jsr-provision-packages.ts',
    '.llm/tools/release/run-publish.ts --dry-run',
    '.llm/tools/release/run-publish.ts --preflight',
    '.llm/tools/release/run-publish.ts\n',
    'deno task release:canary-label',
    'return_run_details=true',
    'gh run watch "$E2E_RUN_ID" --exit-status',
    '-f state=success',
  ];
  let previous = -1;
  for (const needle of ordered) {
    const index = source.indexOf(needle, previous + 1);
    assert(index > previous, `${needle} must appear in mandatory execution order`);
    previous = index;
  }

  for (
    const permission of [
      'actions: write',
      'contents: write',
      'id-token: write',
      'issues: write',
      'pull-requests: write',
      'statuses: write',
    ]
  ) {
    assertStringIncludes(source, permission);
  }
  assertStringIncludes(source, 'inputs[published-version]=$CANARY_VERSION');
  assertStringIncludes(source, 'context=release/canary-pair');
  assertStringIncludes(source, "if: inputs.republish-version == ''");
  assertStringIncludes(source, 'Canary partial publish:');
  assertStringIncludes(source, 'Canary publish complete; pinned production E2E failed');
  assertStringIncludes(source, 'report-jsr-publish-outcome.ts');
  assertStringIncludes(source, 'git push origin --delete "$CANARY_BRANCH"');
  assertStringIncludes(source, 'republish-version:');
  assertStringIncludes(source, "if: inputs.republish-version == ''");
  assertStringIncludes(source, "if: inputs.republish-version != ''");
  assertStringIncludes(
    source,
    'deno task release:canary -- "$TARGET_VERSION" --republish-version "$REPUBLISH_VERSION"',
  );
  assertStringIncludes(
    source,
    'deno task release:canary -- "$TARGET_VERSION" --output "$CANARY_RESULT"',
  );
  assertStringIncludes(source, 'version="$(jq -er \'.version\' "$CANARY_RESULT")"');
  assertStringIncludes(source, 'test "$version" != "null"');
  assertStringIncludes(source, '--published-version "$CANARY_VERSION"');
  assertStringIncludes(source, '--head "$SOURCE_SHA"');
  const cutStep = source.slice(
    source.indexOf('- name: Cut ephemeral canary branch and tag'),
    source.indexOf('- name: Verify same-semver canary republish'),
  );
  assertEquals(cutStep.includes('deno.json'), false);
  assertStringIncludes(source, 'echo "version=$version" >> "$GITHUB_OUTPUT"');
  assertStringIncludes(source, 'echo "tag=$tag" >> "$GITHUB_OUTPUT"');
  assertStringIncludes(source, 'echo "branch=${CUT_BRANCH:-}" >> "$GITHUB_OUTPUT"');
  assertStringIncludes(
    source,
    "if: always() && inputs.republish-version == '' && steps.canary.outputs.branch != ''",
  );
  const guard = source.indexOf('Verify same-semver canary republish');
  const readiness = source.indexOf('deno task publish:readiness');
  assert(
    guard >= 0 && guard < readiness,
    'republish identity guard must precede every publish step',
  );
  assertEquals(source.includes('make_latest'), false);
  assertEquals(source.includes('gh release'), false);
});

Deno.test('all workflow concurrency mappings are classified and repo-wide literals are bounded', async () => {
  const workflowDirectory = new URL('.github/workflows/', root);
  const workflowNames: string[] = [];
  for await (const entry of Deno.readDir(workflowDirectory)) {
    if (entry.isFile && entry.name.endsWith('.yml')) workflowNames.push(entry.name);
  }
  workflowNames.sort();
  assertEquals(workflowNames, [
    'ci.yml',
    'code-quality.yml',
    'e2e-cli-prod-local.yml',
    'e2e-cli-prod.yml',
    'e2e-cli.yml',
    'fresh-ui-quality.yml',
    'jsr-settings.yml',
    'openhands-agent.yml',
    'openhands-phase-eval.yml',
    'pages.yml',
    'publish.yml',
    'release-canary.yml',
    'surface-diff.yml',
  ]);

  const blocks: ConcurrencyBlock[] = [];
  for (const workflow of workflowNames) {
    const source = await Deno.readTextFile(new URL(workflow, workflowDirectory));
    blocks.push(...readConcurrencyBlocks(workflow, parseWorkflowYaml(source, workflow)));
  }
  blocks.sort((left, right) =>
    `${left.workflow}:${left.scope}`.localeCompare(`${right.workflow}:${right.scope}`)
  );

  assertEquals(blocks, [
    {
      workflow: 'ci.yml',
      scope: 'workflow',
      group: 'ci-${{ github.workflow }}-${{ github.ref }}',
      classification: 'ref-templated',
      cancelInProgress: true,
    },
    {
      workflow: 'e2e-cli-prod-local.yml',
      scope: 'workflow',
      group: 'e2e-cli-prod-local-${{ github.workflow }}-${{ github.ref }}',
      classification: 'ref-templated',
      cancelInProgress: false,
    },
    {
      workflow: 'e2e-cli-prod.yml',
      scope: 'workflow',
      group: 'e2e-cli-prod-${{ github.workflow }}-${{ github.ref }}',
      classification: 'ref-templated',
      cancelInProgress: false,
    },
    {
      workflow: 'e2e-cli.yml',
      scope: 'jobs.scaffold-runtime',
      group: 'e2e-scaffold-runtime-global-v2',
      classification: 'repo-wide literal',
      cancelInProgress: false,
      queue: 'max',
    },
    {
      workflow: 'e2e-cli.yml',
      scope: 'jobs.scaffold-runtime-sqlite',
      group: 'e2e-scaffold-runtime-sqlite-global-v2',
      classification: 'repo-wide literal',
      cancelInProgress: false,
      queue: 'max',
    },
    {
      workflow: 'e2e-cli.yml',
      scope: 'workflow',
      group: 'e2e-cli-${{ github.workflow }}-${{ github.ref }}',
      classification: 'ref-templated',
      cancelInProgress: true,
    },
    {
      workflow: 'openhands-agent.yml',
      scope: 'workflow',
      group:
        'openhands-${{ github.event_name }}-${{ github.event.issue.number || github.event.pull_request.number || github.ref }}',
      classification: 'entity-keyed / ref fallback',
      cancelInProgress: false,
    },
    {
      workflow: 'openhands-phase-eval.yml',
      scope: 'workflow',
      group: 'openhands-phase-eval-${{ github.event.pull_request.number }}',
      classification: 'entity-keyed',
      cancelInProgress: false,
    },
    {
      workflow: 'pages.yml',
      scope: 'workflow',
      group: "pages-${{ github.event_name == 'pull_request' && github.ref || 'deploy' }}",
      classification: 'ref-templated / repo-wide literal',
      cancelInProgress: false,
      queue: 'max',
    },
    {
      workflow: 'release-canary.yml',
      scope: 'workflow',
      group: 'release-canary-${{ inputs.republish-version || inputs.target-version }}',
      classification: 'entity-keyed',
      cancelInProgress: false,
      queue: 'max',
    },
  ]);

  for (const block of blocks) {
    if (block.classification.includes('repo-wide literal')) {
      assertEquals(
        block.queue,
        'max',
        `${block.workflow}:${block.scope} leaves a repo-wide literal group unbounded`,
      );
    }
  }
});

Deno.test('stable publisher uses composed readiness before provisioning and real publish', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/publish.yml', root));
  const readiness = source.indexOf('deno task publish:readiness');
  const canaryPair = source.indexOf('.llm/tools/release/verify-canary-pair.ts');
  const provisioning = source.indexOf('.llm/tools/release/jsr-provision-packages.ts');
  const preflight = source.indexOf('.llm/tools/release/run-publish.ts --preflight');
  const publish = source.indexOf('.llm/tools/release/run-publish.ts\n', preflight + 1);
  const versionGuard = source.indexOf('.llm/tools/release/assert-release-version.ts');
  const registryGuard = source.indexOf(
    '.llm/tools/release/report-jsr-publish-outcome.ts',
    publish + 1,
  );
  assert(canaryPair >= 0 && canaryPair < readiness);
  assertStringIncludes(source, 'fetch-depth: 0');
  assert(versionGuard >= 0 && versionGuard < canaryPair);
  const versionGuardStep = source.slice(
    source.lastIndexOf('- name:', versionGuard),
    source.indexOf('- name:', versionGuard),
  );
  assertStringIncludes(versionGuardStep, "if: steps.release.outputs.dry_run != 'true'");
  assert(readiness < provisioning);
  assert(provisioning < preflight && preflight < publish);
  assert(publish < registryGuard);
  const registryGuardStep = source.slice(
    source.lastIndexOf('- name:', registryGuard),
    source.indexOf('- name: Write published version'),
  );
  assertStringIncludes(registryGuardStep, '--require-complete');
  assertStringIncludes(registryGuardStep, "if: steps.release.outputs.dry_run != 'true'");
  assertEquals(registryGuardStep.includes('failure()'), false);
});

Deno.test('stable canary-pair verifier has one exact executable grant', async () => {
  const denoConfig = JSON.parse(await Deno.readTextFile(new URL('deno.json', root))) as {
    tasks: Record<string, string>;
  };
  const workflow = await Deno.readTextFile(new URL('.github/workflows/publish.yml', root));
  const taskCommand = denoConfig.tasks['release:verify-canary-pair'];
  const workflowCommand = workflow.match(
    /^\s*run: (deno run .*verify-canary-pair\.ts.*)$/m,
  )?.[1];
  const taskGrant = taskCommand.match(/--allow-run=([^\s]+)/)?.[1]?.split(',').sort();
  const workflowGrant = workflowCommand?.match(/--allow-run=([^\s]+)/)?.[1]?.split(',').sort();

  assertEquals(taskGrant, ['deno', 'git']);
  assertEquals(workflowGrant, ['deno', 'git']);
  assertStringIncludes(workflowCommand ?? '', '--repo "$GITHUB_REPOSITORY"');
  assertEquals(workflow.includes('deno task release:verify-canary-pair'), false);
});

Deno.test('stable workflow recovery bypasses an immutable tag task and reaches a content verdict', async () => {
  const workflow = await Deno.readTextFile(new URL('.github/workflows/publish.yml', root));
  const workflowCommand = workflow.match(
    /^\s*run: (deno run .*verify-canary-pair\.ts.*)$/m,
  )?.[1];
  assert(workflowCommand, 'trusted workflow verifier command must exist');

  const fixture = await Deno.makeTempDir({ prefix: 'netscript-publish-recovery-' });
  try {
    await Deno.mkdir(`${fixture}/.llm/tools/release`, { recursive: true });
    const tagConfig = JSON.parse(await Deno.readTextFile(new URL('deno.json', root))) as {
      tasks: Record<string, string>;
      imports?: Record<string, string>;
    };
    tagConfig.tasks['release:verify-canary-pair'] =
      'deno run --allow-net=api.github.com --allow-env=GH_TOKEN ' +
      '--allow-run=git --allow-read .llm/tools/release/verify-canary-pair.ts';
    await Deno.writeTextFile(
      `${fixture}/deno.json`,
      JSON.stringify({ tasks: tagConfig.tasks, imports: tagConfig.imports }),
    );
    const verifierModule = new URL('./verify-canary-pair.ts', import.meta.url).href;
    const releaseModule = new URL('./github-release.ts', import.meta.url).href;
    await Deno.writeTextFile(
      `${fixture}/.llm/tools/release/verify-canary-pair.ts`,
      `import { parseRepo } from ${JSON.stringify(verifierModule)};
import { verifyGreenCanaryPair } from ${JSON.stringify(releaseModule)};
for (const [command, args] of [['git', ['--version']], ['deno', ['eval', '']]]) {
  const result = await new Deno.Command(command, { args }).output();
  if (!result.success) throw new Error(command + ' subprocess failed');
}
const repo = parseRepo(Deno.args);
await verifyGreenCanaryPair(repo, 'fixture-token', Deno.cwd(), {
  revParse: () => Promise.resolve('immutable-tag-sha'),
  changedFiles: () => Promise.resolve(['source.ts']),
  releaseFiles: () => Promise.resolve(['deno.json']),
  fileAtRevision: () => Promise.resolve(''),
  request: () => Promise.resolve({ status: 200, ok: true, body: { statuses: [] } }),
});
`,
    );

    const oldConfig = JSON.parse(await Deno.readTextFile(`${fixture}/deno.json`)) as {
      tasks: Record<string, string>;
    };
    const oldTaskArgv = oldConfig.tasks['release:verify-canary-pair'].split(/\s+/);
    const oldTaskResult = await new Deno.Command(oldTaskArgv[0], {
      args: [...oldTaskArgv.slice(1), '--repo', 'rickylabs/netscript'],
      cwd: fixture,
      env: { GH_TOKEN: 'immutable-tag-recovery-fixture' },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const oldTaskStderr = new TextDecoder().decode(oldTaskResult.stderr);
    assertEquals(oldTaskResult.success, false, 'the immutable tag task must reproduce the defect');
    assertStringIncludes(oldTaskStderr, 'Requires run access to "deno"');

    const workflowArgv = workflowCommand.split(/\s+/).map((arg) =>
      arg === '"$GITHUB_REPOSITORY"' ? 'rickylabs/netscript' : arg
    );
    const result = await new Deno.Command(workflowArgv[0], {
      args: workflowArgv.slice(1),
      cwd: fixture,
      env: { GH_TOKEN: 'immutable-tag-recovery-fixture' },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(result.stderr);

    assertEquals(result.success, false, 'the simulated content verdict must fail closed');
    assertStringIncludes(
      stderr,
      'Stable publication blocked: immutable-tag-sha has no green release/canary-pair status',
    );
    assertStringIncludes(stderr, 'current commit contains non-version changes');
    assertEquals(stderr.includes('Requires run access'), false);
  } finally {
    await Deno.remove(fixture, { recursive: true });
  }
});

Deno.test('production E2E waits for JSR propagation for explicit canary dispatches', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/e2e-cli-prod.yml', root));
  const waitStep = source.slice(
    source.indexOf('- name: Wait for JSR propagation'),
    source.indexOf('- name: Install published CLI from JSR'),
  );
  assertStringIncludes(waitStep, 'sleep 120');
  assertEquals(waitStep.includes('if:'), false);
});

Deno.test('production README E2E uploads both durable cleanup receipts', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/e2e-cli-prod.yml', root));
  assertStringIncludes(
    source,
    '.llm/tmp/gate-receipts/readme.quickstart/cleanup.aspire-stop.receipt.json',
  );
  assertStringIncludes(
    source,
    '.llm/tmp/gate-receipts/readme.quickstart/cleanup.aspire-stop.json',
  );
});
