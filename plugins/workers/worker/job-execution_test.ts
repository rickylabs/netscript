import { assertEquals } from '@std/assert';
import { resolve, toFileUrl } from '@std/path';
import { resolveLocalJobEntrypoint } from './job-execution.ts';

Deno.test('local job entrypoint already rooted under jobsDir is not prefixed twice', () => {
  const projectRoot = resolve('fixture-project');
  const resolved = resolveLocalJobEntrypoint(
    projectRoot,
    './workers/jobs',
    './workers/jobs/health-check.ts',
  );

  assertEquals(resolved, toFileUrl(resolve(projectRoot, 'workers/jobs/health-check.ts')).href);
});

Deno.test('jobs-dir-relative local job entrypoint keeps the generated registry convention', () => {
  const projectRoot = resolve('fixture-project');
  const resolved = resolveLocalJobEntrypoint(
    projectRoot,
    './workers/jobs',
    './health-check.ts',
  );

  assertEquals(resolved, toFileUrl(resolve(projectRoot, 'workers/jobs/health-check.ts')).href);
});
