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

Deno.test('project-root-qualified job uses the configured jobs directory without special cases', () => {
  const projectRoot = resolve('fixture-project');
  const resolved = resolveLocalJobEntrypoint(
    projectRoot,
    './background/inventory-jobs',
    './background/inventory-jobs/sync-catalog.ts',
  );

  assertEquals(
    resolved,
    toFileUrl(resolve(projectRoot, 'background/inventory-jobs/sync-catalog.ts')).href,
  );
});
