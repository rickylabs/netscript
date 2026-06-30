import type { DoctorReport } from '../../cli/mod.ts';
import type { NetScriptPlugin, PluginCommandContext } from '../contract.ts';
import { DEFAULT_PLUGIN_HEALTH_ENDPOINT } from '../defaults.ts';

/** Input consumed by the mandatory doctor command. */
export interface RunDoctorCommandOptions {
  /** Plugin contract supplying doctor seams. */
  readonly plugin: NetScriptPlugin;
  /** Shared command context. */
  readonly context: PluginCommandContext;
}

/**
 * Run the core-owned plugin doctor algorithm.
 *
 * @param options Plugin contract and command context.
 * @returns Aggregate doctor report.
 *
 * @example
 * ```ts
 * const report = await runDoctorCommand({ plugin, context });
 * console.log(report.plugin);
 * ```
 */
export async function runDoctorCommand(
  options: RunDoctorCommandOptions,
): Promise<DoctorReport> {
  const spec = options.plugin.doctor;
  const checks: DoctorReport['checks'][number][] = [{
    name: 'health-endpoint',
    ok: true,
    message: spec?.healthEndpoint ?? DEFAULT_PLUGIN_HEALTH_ENDPOINT,
  }];

  for (const key of spec?.requiredConfigKeys ?? []) {
    checks.push({
      name: `config:${key}`,
      ok: options.context.config[key] !== undefined,
      message: options.context.config[key] === undefined ? `Missing config key ${key}` : undefined,
    });
  }

  for (const check of spec?.extraChecks ?? []) {
    checks.push(await check.run(options.context));
  }

  return { plugin: options.plugin.name, checks };
}
