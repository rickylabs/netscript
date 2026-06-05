import { assertStringIncludes } from '@std/assert';
import { withRepoRootOption } from '../../../src/application/builders/workspace/workspace-options.ts';
import { defaultRunOptions } from '../../../src/create-default-runner.ts';

Deno.test('defaultRunOptions targets the maintainer binary entrypoint', () => {
  const options = defaultRunOptions();
  assertStringIncludes(
    options.cliEntrypoint.replaceAll('\\', '/'),
    '/packages/cli/bin/netscript-dev.ts',
  );
});

Deno.test('withRepoRootOption derives the maintainer binary entrypoint from the repo root', () => {
  const options = withRepoRootOption({
    ...defaultRunOptions(),
    repoRoot: '/repo',
    cliEntrypoint: '/repo/override.ts',
    smokeRoot: '/repo/.llm/tmp/cli-e2e',
  }, '/repo');

  assertStringIncludes(
    options.cliEntrypoint.replaceAll('\\', '/'),
    '/packages/cli/bin/netscript-dev.ts',
  );
  assertStringIncludes(options.smokeRoot.replaceAll('\\', '/'), '/.llm/tmp/cli-e2e');
});
