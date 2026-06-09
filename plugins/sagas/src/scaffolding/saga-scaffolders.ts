import {
  createSagaEntrypoint,
  isSagasScaffoldInput,
  renderStringArray,
  resolveCompletedStatus,
  resolveInitialStatus,
  resolveMessageType,
  type SagasScaffoldInput,
  toSagaExportName,
} from './input.ts';
import { SagasItemScaffolder } from './sagas-item-scaffolder.ts';

/** Scaffold a fluent saga definition module. */
export class SagaDefinitionScaffolder extends SagasItemScaffolder<SagasScaffoldInput> {
  /** Stable scaffolder identifier. */
  readonly id = 'saga-definition';
  /** Scaffolded item kind. */
  readonly kind = 'saga';
  /** Template path used by template-aware hosts. */
  readonly templatePath = './templates/saga-definition.ts.template';

  /** Generate TypeScript source for a saga definition. */
  generate(input: SagasScaffoldInput): Promise<string> {
    const exportName = `${toSagaExportName(input.id)}Saga`;
    const messageType = resolveMessageType(input);
    const initialStatus = resolveInitialStatus(input);
    const completedStatus = resolveCompletedStatus(input);
    const durability = input.durability ?? 't1';
    const source = [
      "import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';",
      '',
      'type State = Readonly<{',
      '  status: string;',
      '  processedAt?: string;',
      '}>;',
      '',
      `type Message = Readonly<{ type: ${JSON.stringify(messageType)}; payload: unknown }>;`,
      '',
      `export const ${exportName} = defineSaga(${JSON.stringify(input.id)})`,
      `  .durability(${JSON.stringify(durability)})`,
      `  .state<State>({ status: ${JSON.stringify(initialStatus)} })`,
      `  .on<Message['type'], Message['payload']>(${
        JSON.stringify(messageType)
      }, (saga, message, context) => {`,
      '    saga.state = {',
      '      ...saga.state,',
      `      status: ${JSON.stringify(completedStatus)},`,
      '      processedAt: context.now.toISOString(),',
      '    };',
      '',
      '    return [',
      '      sagaComplete({',
      '        messageType: message.type,',
      '        processedAt: context.now.toISOString(),',
      '      }),',
      '    ];',
      '  })',
      '  .build();',
      '',
      `export default ${exportName};`,
      '',
    ].join('\n');
    return Promise.resolve(source);
  }

  /** Validate saga definition scaffold input. */
  validateInput(input: unknown): input is SagasScaffoldInput {
    return isSagasScaffoldInput(input);
  }
}

/** Scaffold a config-time saga entry module. */
export class SagaConfigScaffolder extends SagasItemScaffolder<SagasScaffoldInput> {
  /** Stable scaffolder identifier. */
  readonly id = 'saga-config';
  /** Scaffolded item kind. */
  readonly kind = 'saga-config';
  /** Template path used by template-aware hosts. */
  readonly templatePath = './templates/saga-config.ts.template';

  /** Generate TypeScript source for a config-time saga entry. */
  generate(input: SagasScaffoldInput): Promise<string> {
    const exportName = `${toSagaExportName(input.id)}SagaConfig`;
    const lines = [
      "import { defineSagaConfig } from '@netscript/plugin-sagas-core/config';",
      '',
      `export const ${exportName} = defineSagaConfig(${JSON.stringify(input.id)}, ${
        JSON.stringify(createSagaEntrypoint(input))
      })`,
      `  .name(${JSON.stringify(toDisplayName(input.id))})`,
    ];

    if (input.description) {
      lines.push(`  .description(${JSON.stringify(input.description)})`);
    }
    if (input.topic) {
      lines.push(`  .topic(${JSON.stringify(input.topic)})`);
    }
    if (input.tags?.length) {
      lines.push(`  .tags(...${renderStringArray(input.tags)})`);
    }

    lines.push('  .build();', '', `export default ${exportName};`, '');
    return Promise.resolve(lines.join('\n'));
  }

  /** Validate saga config scaffold input. */
  validateInput(input: unknown): input is SagasScaffoldInput {
    return isSagasScaffoldInput(input);
  }
}

function toDisplayName(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
