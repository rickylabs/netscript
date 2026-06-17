import { WorkersItemScaffolder } from '@netscript/plugin-workers-core/abstracts';
import {
  createWorkerEntrypoint,
  isWorkersScaffoldInput,
  renderStringArray,
  type WorkersScaffoldInput,
} from './input.ts';

/** Scaffold a standalone worker job handler module. */
export class JobHandlerScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  /** Stable scaffolder identifier for job handler files. */
  readonly id = 'job-handler';
  /** Workers item kind produced by this scaffolder. */
  readonly kind = 'job';
  /** Template path associated with job handler scaffolds. */
  readonly templatePath = './templates/job-handler.ts.template';

  /** Generate TypeScript source for a job handler. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    const source = [
      "import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';",
      '',
      `export const ${toJobExportName(input.id)} = defineJobHandler(async (context) => {`,
      '  const payload = (context as { readonly payload?: unknown }).payload;',
      '',
      '  return createSuccessResult({',
      `    jobId: ${JSON.stringify(input.id)},`,
      '    payload,',
      '  });',
      '});',
      '',
    ].join('\n');
    return Promise.resolve(source);
  }

  /** Validate job handler scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

/** Scaffold a worker job builder module. */
export class JobBuilderScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  /** Stable scaffolder identifier for job builder files. */
  readonly id = 'job-builder';
  /** Workers item kind produced by this scaffolder. */
  readonly kind = 'job';
  /** Template path associated with job builder scaffolds. */
  readonly templatePath = './templates/job-builder.ts.template';

  /** Generate TypeScript source for a job definition. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    const entrypoint = createWorkerEntrypoint(input, 'jobs', '.ts');
    const lines = [
      "import { defineJob } from '@netscript/plugin-workers-core';",
      '',
      `export const ${toJobExportName(input.id)} = defineJob(${JSON.stringify(input.id)})`,
      `  .entrypoint(${JSON.stringify(entrypoint)})`,
    ];

    if (input.topic) {
      lines.push(`  .topic(${JSON.stringify(input.topic)})`);
    }
    if (input.schedule) {
      lines.push(`  .schedule(${JSON.stringify(input.schedule)})`);
    }
    if (input.timeoutMs !== undefined) {
      lines.push(`  .timeout(${input.timeoutMs})`);
    }
    if (input.maxRetries !== undefined) {
      lines.push(`  .retry(${input.maxRetries})`);
    }
    if (input.tags?.length) {
      lines.push(`  .tags(...${renderStringArray(input.tags)})`);
    }

    lines.push('  .build();', '');
    return Promise.resolve(lines.join('\n'));
  }

  /** Validate job builder scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

function toJobExportName(id: string): string {
  return `${
    id.replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
  }Job`;
}
