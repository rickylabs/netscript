import { join } from '@std/path';

import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { cli, commandGate, denoCommand } from './gate-factory.ts';

/** Create gates for the configured-module and service-less plugin contracts. */
export function createPluginContractGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.SCAFFOLD_PLUGIN_AI_APPSETTINGS,
      'Reject synthesized service configuration for the AI plugin',
      GATE_PHASE.SCAFFOLD,
      (context) => denoCommand(context, 'eval', appsettingsAssertionScript()),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_RUNTIME_SCHEMAS,
      'Generate runtime schemas from all configured plugin modules',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(context, 'generate', 'runtime-schemas', '--project-root', context.project.projectRoot),
      (context) => context.project.repoRoot,
    ),
    commandGate(
      GATE.GENERATED_AI_NAMESPACE_CHECK,
      'Type-check the complete generated AI namespace',
      GATE_PHASE.DATABASE,
      (context) => denoCommand(context, 'check', '--unstable-kv', './ai'),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.BEHAVIOR_PLUGIN_DOCTOR_MISSING_MODULE,
      'Reject a configured plugin whose module has been removed',
      GATE_PHASE.BEHAVIOR,
      (context) =>
        denoCommand(
          context,
          'eval',
          doctorMissingModuleScript(
            cli(context, 'plugin', 'doctor', '--project-root', context.project.projectRoot),
            context.project.projectRoot,
            join(context.project.projectRoot, 'ai', 'plugin.ts'),
          ),
        ),
      (context) => context.project.repoRoot,
    ),
  ];
}

function appsettingsAssertionScript(): string {
  return [
    'const config = JSON.parse(await Deno.readTextFile("appsettings.json"));',
    'const plugins = config.NetScript?.Plugins ?? {};',
    'if (Object.hasOwn(plugins, "ai")) {',
    '  throw new Error("service-less AI plugin unexpectedly created NetScript.Plugins.ai");',
    '}',
    'const serialized = JSON.stringify(config);',
    'if (/plugin-ai[^"\\s]*\\/services/.test(serialized)) {',
    '  throw new Error("service-less AI plugin unexpectedly synthesized a /services specifier");',
    '}',
    'console.info("AI service-less appsettings contract verified");',
  ].join('\n');
}

function doctorMissingModuleScript(
  doctorCommand: readonly string[],
  projectRoot: string,
  modulePath: string,
): string {
  return [
    `const command = ${JSON.stringify(doctorCommand)};`,
    `const projectRoot = ${JSON.stringify(projectRoot)};`,
    `const modulePath = ${JSON.stringify(modulePath)};`,
    'const backupPath = `${modulePath}.doctor-negative`;',
    'const decoder = new TextDecoder();',
    'const runDoctor = () => new Deno.Command(command[0], {',
    '  args: command.slice(1),',
    '  cwd: projectRoot,',
    '  stdout: "piped",',
    '  stderr: "piped",',
    '}).output();',
    'const healthy = await runDoctor();',
    'if (!healthy.success) {',
    '  throw new Error(`plugin doctor was not healthy before the negative probe:\n${decoder.decode(healthy.stdout)}\n${decoder.decode(healthy.stderr)}`);',
    '}',
    'await Deno.rename(modulePath, backupPath);',
    'try {',
    '  const missing = await runDoctor();',
    '  if (missing.success) {',
    '    throw new Error("plugin doctor exited zero after a configured module was removed");',
    '  }',
    '  console.info("plugin doctor rejected the removed configured module");',
    '} finally {',
    '  await Deno.rename(backupPath, modulePath);',
    '}',
  ].join('\n');
}
