import type { CommandExecutorPort } from '../domain/command-executor-port.ts';
import type { PluginRegistryInventory } from '../domain/plugin-registry-inventory.ts';
import type { DoctorCheck } from '../domain/tool-contracts.ts';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function entry(value: unknown, ownership: string): boolean {
  return record(value) && typeof value.generator === 'string' &&
    typeof value.path === 'string' && value.ownership === ownership &&
    typeof value.digest === 'string';
}

function inventory(value: unknown): value is PluginRegistryInventory {
  return record(value) && value.version === 1 && value.generator === 'public.generate.plugins' &&
    ['current', 'drift', 'inspection-failure'].includes(String(value.status)) &&
    value.exitCode === (value.status === 'current' ? 0 : 1) &&
    Array.isArray(value.producers) &&
    value.producers.every((producer) =>
      record(producer) && typeof producer.generator === 'string' &&
      typeof producer.version === 'string' && strings(producer.outputs)
    ) && Array.isArray(value.outputs) &&
    value.outputs.every((output) => entry(output, 'generated')) &&
    Array.isArray(value.inputs) && value.inputs.every((input) => entry(input, 'authored')) &&
    Array.isArray(value.drift) &&
    value.drift.every((finding) =>
      record(finding) && typeof finding.path === 'string' &&
      ['missing', 'extra', 'ownership', 'bytes', 'inspection-failure'].includes(
        String(finding.kind),
      ) &&
      (finding.message === undefined || typeof finding.message === 'string')
    ) && (value.status === 'current' ? value.drift.length === 0 : value.drift.length > 0);
}

function warning(reason: string): DoctorCheck {
  return {
    name: 'plugin_registry',
    status: 'warn',
    summary: `Plugin registry expectations could not be determined: ${reason.slice(0, 1024)}`,
  };
}

/** Diagnose the authoritative check inventory; never invoke normal generation. */
export async function diagnosePluginRegistryInventory(
  executor: CommandExecutorPort,
  projectRoot: string,
): Promise<DoctorCheck> {
  try {
    const result = await executor.execute({
      path: ['generate', 'plugins'],
      args: ['--check', '--format', 'json', '--project-root', projectRoot],
    });
    if (result.timedOut || result.truncated) {
      return warning(
        result.timedOut ? 'inventory inspection timed out.' : 'inventory was truncated.',
      );
    }
    // The CLI emits one JSON report and may append a nonzero-exit diagnostic to stderr.
    const start = result.outputTail.indexOf('{');
    const end = result.outputTail.lastIndexOf('}');
    const value: unknown = JSON.parse(result.outputTail.slice(start, end + 1));
    if (!inventory(value) || value.exitCode !== result.exitCode) {
      return warning('unsupported or inconsistent generator inventory.');
    }
    if (value.status === 'inspection-failure') {
      return warning(value.drift.map((finding) => finding.message ?? finding.kind).join('; '));
    }
    if (value.status === 'current') {
      return {
        name: 'plugin_registry',
        status: 'pass',
        summary: value.outputs.length
          ? `Selected generated plugin registries are current (${value.outputs.length} module(s)).`
          : `No plugin registries are selected (${value.producers.length} installed producer(s)); generation has nothing to register.`,
      };
    }
    const selected = new Set(value.outputs.map((output) => output.path));
    const regenerable = value.drift.every((finding) =>
      selected.has(finding.path) && ['missing', 'bytes', 'ownership'].includes(finding.kind)
    );
    const findings = value.drift.slice(0, 8).map((finding) => `${finding.kind}: ${finding.path}`);
    return {
      name: 'plugin_registry',
      status: 'fail',
      summary: `Generated plugin registry drift: ${findings.join('; ')}${
        value.drift.length > 8 ? `; ${value.drift.length - 8} more finding(s)` : ''
      }.`,
      ...(regenerable
        ? {
          fix:
            'Run `netscript generate plugins` from the project root to regenerate selected plugin outputs.',
        }
        : {
          fix:
            'Review extra or unselected registry files against the generator inventory; preserve authored inputs. Regeneration alone is not a complete remedy.',
        }),
    };
  } catch (error) {
    return warning(error instanceof Error ? error.message : String(error));
  }
}
