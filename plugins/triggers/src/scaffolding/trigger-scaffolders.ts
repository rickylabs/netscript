import { renderStringArray, toTriggerExportName, type TriggerScaffoldInput } from './input.ts';

/** Generate handler-first trigger definition modules. */
export interface TriggerDefinitionScaffolder {
  /** Trigger kind this scaffolder creates. */
  readonly kind: TriggerScaffoldInput['kind'];
  /** Generate TypeScript source for a trigger definition. */
  generate(input: TriggerScaffoldInput): Promise<string>;
}

/** Scaffold a webhook trigger definition module. */
export class WebhookTriggerScaffolder implements TriggerDefinitionScaffolder {
  readonly kind = 'webhook';

  generate(input: TriggerScaffoldInput): Promise<string> {
    const exportName = `${toTriggerExportName(input.id)}Trigger`;
    const source = [
      "import { defineWebhook } from '@netscript/plugin-triggers-core/builders';",
      '',
      `export const ${exportName} = defineWebhook(`,
      '  async () => {',
      '    return [];',
      '  },',
      '  {',
      `    id: ${JSON.stringify(input.id)} as const,`,
      `    path: ${JSON.stringify(input.path ?? `/webhooks/${input.id}`)},`,
      "    verifier: 'hmac-sha256',",
      ...(input.secretEnv ? [`    secretEnv: ${JSON.stringify(input.secretEnv)},`] : []),
      '  },',
      ');',
      '',
      `export default ${exportName};`,
      '',
    ].join('\n');
    return Promise.resolve(source);
  }
}

/** Scaffold a file-watch trigger definition module. */
export class FileWatchTriggerScaffolder implements TriggerDefinitionScaffolder {
  readonly kind = 'file-watch';

  generate(input: TriggerScaffoldInput): Promise<string> {
    const exportName = `${toTriggerExportName(input.id)}Trigger`;
    const paths = input.paths?.length ? input.paths : ['./shared/incoming'];
    const patterns = input.patterns?.length ? input.patterns : ['*'];
    const ignored = input.ignored?.length ? input.ignored : ['*.tmp', '.*'];
    const source = [
      "import { defineFileWatch } from '@netscript/plugin-triggers-core/builders';",
      '',
      `export const ${exportName} = defineFileWatch(`,
      '  async () => {',
      '    return [];',
      '  },',
      '  {',
      `    id: ${JSON.stringify(input.id)} as const,`,
      `    paths: ${renderStringArray(paths)},`,
      `    patterns: ${renderStringArray(patterns)},`,
      `    ignored: ${renderStringArray(ignored)},`,
      "    on: ['create'],",
      '    debounceMs: 2_000,',
      '    stabilityThreshold: { checkIntervalMs: 1_000, stableChecks: 3 },',
      '  },',
      ');',
      '',
      `export default ${exportName};`,
      '',
    ].join('\n');
    return Promise.resolve(source);
  }
}

/** Scaffold a scheduled trigger definition module. */
export class ScheduledTriggerScaffolder implements TriggerDefinitionScaffolder {
  readonly kind = 'scheduled';

  generate(input: TriggerScaffoldInput): Promise<string> {
    const exportName = `${toTriggerExportName(input.id)}Trigger`;
    const source = [
      "import { defineScheduledTrigger } from '@netscript/plugin-triggers-core/builders';",
      '',
      `export const ${exportName} = defineScheduledTrigger(`,
      '  async () => {',
      '    return [];',
      '  },',
      '  {',
      `    id: ${JSON.stringify(input.id)} as const,`,
      `    cron: ${JSON.stringify(input.cron ?? '0 9 * * *')},`,
      ...(input.timezone ? [`    timezone: ${JSON.stringify(input.timezone)},`] : []),
      '    persistent: false,',
      "    backfill: { enabled: true, windowMs: 3_600_000, policy: 'fire-once' },",
      '  },',
      ');',
      '',
      `export default ${exportName};`,
      '',
    ].join('\n');
    return Promise.resolve(source);
  }
}

/** Resolve the concrete scaffolder for a trigger kind. */
export function triggerScaffolder(kind: TriggerScaffoldInput['kind']): TriggerDefinitionScaffolder {
  switch (kind) {
    case 'webhook':
      return new WebhookTriggerScaffolder();
    case 'file-watch':
      return new FileWatchTriggerScaffolder();
    case 'scheduled':
      return new ScheduledTriggerScaffolder();
  }
}
