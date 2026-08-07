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
