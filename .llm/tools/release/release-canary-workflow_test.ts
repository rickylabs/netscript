import { assert, assertEquals, assertStringIncludes } from '@std/assert';

const root = new URL('../../../', import.meta.url);

Deno.test('canary workflow reuses the publisher and records only an awaited green pair', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/release-canary.yml', root));
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
