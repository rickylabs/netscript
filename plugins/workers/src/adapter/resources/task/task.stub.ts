/** Type-checked source stubs for generated workers task definitions.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** TypeScript workers task stub with named substitution tokens. */
export const denoTaskStub: StubSource<'TASK_ID' | 'TASK_EXPORT'> = defineStub({
  source: `import { defineTask, type TaskDefinition } from '@netscript/plugin-workers-core';

/**
 * Starter workers task definition for %%TASK_ID%%.
 */
export const %%TASK_EXPORT%%: TaskDefinition<'%%TASK_ID%%'> = defineTask('%%TASK_ID%%')
  .handler((context) => {
    return { payload: context.payload, valid: true };
  })
  .build();
`,
  tokens: ['TASK_ID', 'TASK_EXPORT'] as const,
});

/** Python workers task script stub with named substitution tokens. */
export const pythonTaskStub: StubSource<'TASK_ID'> = defineStub({
  source: `import json
import sys

payload = json.loads(sys.stdin.read() or "{}")
print(json.dumps({"taskId": "%%TASK_ID%%", "payload": payload}))
`,
  tokens: ['TASK_ID'] as const,
});

/** POSIX shell workers task script stub with named substitution tokens. */
export const shellTaskStub: StubSource<'TASK_ID'> = defineStub({
  source: `#!/usr/bin/env sh
set -eu

printf '%s\\n' '{"taskId":"%%TASK_ID%%"}'
`,
  tokens: ['TASK_ID'] as const,
});

/** PowerShell workers task script stub with named substitution tokens. */
export const powershellTaskStub: StubSource<'TASK_ID'> = defineStub({
  source: `$ErrorActionPreference = "Stop"

[Console]::Out.WriteLine('{"taskId":"%%TASK_ID%%"}')
`,
  tokens: ['TASK_ID'] as const,
});
