import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../scaffold/memory-fs.ts';
import { ConfigNotFoundError, ExitCode } from '../../../domain/errors.ts';
import { DbWorkspaceResolver } from '../../database/workspace-resolver.ts';
import { ServiceWorkspaceResolver } from '../../service/workspace-resolver.ts';
import { requireAppsettingsPath } from './appsettings-file.ts';

Deno.test('requireAppsettingsPath returns the project-root appsettings.json path', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/appsettings.json', '{"NetScript":{"Name":"app"}}');

  assertEquals(await requireAppsettingsPath(fs, '/project'), '/project/appsettings.json');
});

Deno.test('requireAppsettingsPath fails closed with the named config-not-found error', async () => {
  const error = await assertRejects(
    () => requireAppsettingsPath(new MemoryFileSystemAdapter(), '/project'),
    ConfigNotFoundError,
  );
  assertEquals(error.exitCode, ExitCode.CONFIG_NOT_FOUND);
  assertStringIncludes(error.message, '/project/appsettings.json');
  assertStringIncludes(error.message, "'netscript init' writes it with or without --no-aspire");
});

// #1996: `service list` printed "No services configured." and exited 0 when it
// could not read any configuration at all.
Deno.test('service discovery refuses instead of reporting an empty service list', async () => {
  const resolver = new ServiceWorkspaceResolver(new MemoryFileSystemAdapter());

  await assertRejects(() => resolver.discoverServices('/project'), ConfigNotFoundError);
  await assertRejects(() => resolver.serviceExists('/project', 'users'), ConfigNotFoundError);
});

Deno.test('service discovery still returns an empty list for a readable config without services', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/appsettings.json', '{"NetScript":{"Name":"app","Services":{}}}');

  assertEquals(await new ServiceWorkspaceResolver(fs).discoverServices('/project'), []);
});

Deno.test('database discovery reports a missing appsettings.json as config-not-found', async () => {
  const resolver = new DbWorkspaceResolver(new MemoryFileSystemAdapter());

  await assertRejects(() => resolver.discoverDatabases('/project'), ConfigNotFoundError);
});
