import { assert, assertEquals, assertStringIncludes } from '@std/assert';

const root = new URL('../../../', import.meta.url);

Deno.test('canary workflow reuses the publisher and records only an awaited green pair', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/release-canary.yml', root));
  const ordered = [
    'deno task publish:readiness',
    '.llm/tools/release/jsr-provision-packages.ts',
    '.llm/tools/release/run-publish.ts --dry-run',
    '.llm/tools/release/run-publish.ts --preflight',
    '.llm/tools/release/run-publish.ts\n',
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
    const permission of ['actions: write', 'contents: write', 'id-token: write', 'statuses: write']
  ) {
    assertStringIncludes(source, permission);
  }
  assertStringIncludes(source, 'inputs[published-version]=$CANARY_VERSION');
  assertStringIncludes(source, 'context=release/canary-pair');
  assertStringIncludes(source, 'git push origin --delete "$CANARY_BRANCH"');
  assertEquals(source.includes('make_latest'), false);
  assertEquals(source.includes('gh release'), false);
});

Deno.test('stable publisher uses composed readiness before provisioning and real publish', async () => {
  const source = await Deno.readTextFile(new URL('.github/workflows/publish.yml', root));
  const readiness = source.indexOf('deno task publish:readiness');
  const canaryPair = source.indexOf('deno task release:verify-canary-pair');
  const provisioning = source.indexOf('.llm/tools/release/jsr-provision-packages.ts');
  const preflight = source.indexOf('.llm/tools/release/run-publish.ts --preflight');
  const publish = source.indexOf('.llm/tools/release/run-publish.ts\n', preflight + 1);
  assert(canaryPair >= 0 && canaryPair < readiness);
  assertStringIncludes(source, 'fetch-depth: 0');
  assert(readiness < provisioning);
  assert(provisioning < preflight && preflight < publish);
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
