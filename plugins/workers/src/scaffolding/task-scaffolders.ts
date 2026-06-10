import { WorkersItemScaffolder } from '@netscript/plugin-workers-core/abstracts';
import {
  createWorkerEntrypoint,
  isWorkersScaffoldInput,
  type WorkersScaffoldInput,
} from './input.ts';

/** Scaffold a Deno task definition module. */
export class DenoTaskScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  /** Stable scaffolder identifier for Deno task files. */
  readonly id = 'task-deno';
  /** Workers item kind produced by this scaffolder. */
  readonly kind = 'task';
  /** Template path associated with Deno task scaffolds. */
  readonly templatePath = './templates/task-deno.ts.template';

  /** Generate TypeScript source for a Deno task. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    return Promise.resolve(renderTaskDefinition(input, 'deno', '.ts'));
  }

  /** Validate Deno task scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

/** Scaffold a Python task script. */
export class PythonTaskScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  /** Stable scaffolder identifier for Python task files. */
  readonly id = 'task-python';
  /** Workers item kind produced by this scaffolder. */
  readonly kind = 'task';
  /** Template path associated with Python task scaffolds. */
  readonly templatePath = './templates/task-python.py.template';

  /** Generate Python source for a worker task. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    const source = [
      'import json',
      'import sys',
      '',
      'payload = json.loads(sys.stdin.read() or "{}")',
      'print(json.dumps({"taskId": ' + JSON.stringify(input.id) + ', "payload": payload}))',
      '',
    ].join('\n');
    return Promise.resolve(source);
  }

  /** Validate Python task scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

/** Scaffold a POSIX shell task script. */
export class ShellTaskScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  /** Stable scaffolder identifier for shell task files. */
  readonly id = 'task-shell';
  /** Workers item kind produced by this scaffolder. */
  readonly kind = 'task';
  /** Template path associated with shell task scaffolds. */
  readonly templatePath = './templates/task-shell.sh.template';

  /** Generate shell source for a worker task. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    const source = [
      '#!/usr/bin/env sh',
      'set -eu',
      `printf '%s\\n' ${JSON.stringify(`{"taskId":${JSON.stringify(input.id)}}`)}`,
      '',
    ].join('\n');
    return Promise.resolve(source);
  }

  /** Validate shell task scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

/** Scaffold a PowerShell task script. */
export class PsTaskScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  /** Stable scaffolder identifier for PowerShell task files. */
  readonly id = 'task-powershell';
  /** Workers item kind produced by this scaffolder. */
  readonly kind = 'task';
  /** Template path associated with PowerShell task scaffolds. */
  readonly templatePath = './templates/task-ps1.ps1.template';

  /** Generate PowerShell source for a worker task. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    const source = [
      '$ErrorActionPreference = "Stop"',
      `[Console]::Out.WriteLine(${JSON.stringify(`{"taskId":${JSON.stringify(input.id)}}`)})`,
      '',
    ].join('\n');
    return Promise.resolve(source);
  }

  /** Validate PowerShell task scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

function renderTaskDefinition(
  input: WorkersScaffoldInput,
  runtime: string,
  extension: string,
): string {
  const entrypoint = createWorkerEntrypoint(input, 'tasks', extension);
  const lines = [
    "import { defineTask } from '@netscript/plugin-workers-core';",
    '',
    `export const ${toTaskExportName(input.id)} = defineTask(${JSON.stringify(input.id)})`,
    `  .runtime(${JSON.stringify(runtime)})`,
    `  .entrypoint(${JSON.stringify(entrypoint)})`,
  ];

  if (input.timeoutMs !== undefined) {
    lines.push(`  .timeout(${input.timeoutMs})`);
  }
  if (input.maxRetries !== undefined) {
    lines.push(`  .retry(${input.maxRetries})`);
  }

  lines.push('  .build();', '');
  return lines.join('\n');
}

function toTaskExportName(id: string): string {
  return `${
    id.replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
  }Task`;
}
