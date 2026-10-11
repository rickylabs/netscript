import { assertInstanceOf } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../scaffold/memory-fs.ts';
import { DbOperationRunner } from './operation-runner.ts';
import { selectDbOperationExecutor } from './select-operation-executor.ts';
import { DbWorkspaceTaskRunner } from './workspace-task-runner.ts';

Deno.test('selectDbOperationExecutor drives the AppHost when the project has one', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/aspire/apphost.mts', '// apphost');

  assertInstanceOf(await selectDbOperationExecutor('/project', fs), DbOperationRunner);
});

// #1996: a --no-aspire project must never try to start an AppHost that does not exist.
Deno.test('selectDbOperationExecutor uses the workspace tasks without an AppHost', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/appsettings.json', '{}');

  assertInstanceOf(await selectDbOperationExecutor('/project', fs), DbWorkspaceTaskRunner);
});
