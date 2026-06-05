import { WorkersItemScaffolder } from '@netscript/plugin-workers-core/abstracts';
import { isWorkersScaffoldInput, type WorkersScaffoldInput } from './input.ts';

/** Scaffold a worker workflow definition module. */
export class WorkflowScaffolder extends WorkersItemScaffolder<WorkersScaffoldInput> {
  readonly id = 'workflow';
  readonly kind = 'workflow';
  readonly templatePath = './templates/workflow.ts.template';

  /** Generate TypeScript source for a workflow definition. */
  generate(input: WorkersScaffoldInput): Promise<string> {
    const source = [
      "import { defineWorkflow } from '@netscript/plugin-workers-core';",
      '',
      `export const ${toWorkflowExportName(input.id)} = defineWorkflow(${
        JSON.stringify(input.id)
      })`,
      `  .sleep(${JSON.stringify(`${input.id}-start`)}, 1000)`,
      '  .build();',
      '',
    ].join('\n');
    return Promise.resolve(source);
  }

  /** Validate workflow scaffold input. */
  validateInput(input: unknown): input is WorkersScaffoldInput {
    return isWorkersScaffoldInput(input);
  }
}

function toWorkflowExportName(id: string): string {
  return `${
    id.replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
  }Workflow`;
}
