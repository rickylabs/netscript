/** PR 0A doctor adapter for the schema 1.0 runtime controller. */

import type { RuntimeDoctorReport } from '../../wsl-foundation-lib.ts';
import { FOUNDATION_SCHEMA_VERSION } from '../../wsl-foundation-lib.ts';
import { RUNTIME_SCHEMA_VERSION } from '../contract.ts';
import type {
  AgentKind,
  CapabilityState,
  RuntimeDiagnostic,
  StateDirectoryId,
} from '../contract.ts';
import type { RuntimeInspectorPort } from '../ports.ts';
import type { ObservedRuntimeState } from '../state.ts';
import { translateMobileControl } from './mobile-control-adapter.ts';

const MAX_REPORT_BYTES = 256 * 1024;
const FOUNDATION_DOCTOR_SCRIPT = new URL('../../wsl-foundation.ts', import.meta.url);
const STATE_DIRECTORY_COMPONENTS: Readonly<
  Partial<Record<RuntimeDoctorReport['components'][number]['component'], StateDirectoryId>>
> = {
  'state-claude': 'claude',
  'state-codex': 'codex',
  'state-gemini': 'gemini',
  'state-netscript-agentic': 'netscript-agentic',
};

export interface FoundationReportReader {
  readReport(): Promise<RuntimeDoctorReport>;
}

/** Maps normalized foundation/auth/mobile observations to finite diagnostics. */
export function foundationDiagnostics(
  observed: ObservedRuntimeState,
  agent?: AgentKind,
): RuntimeDiagnostic[] {
  const diagnostics: RuntimeDiagnostic[] = [];
  const mapping = {
    missing: ['component_missing', 'compatibility'],
    outdated: ['component_outdated', 'compatibility'],
    version_skew: ['version_skew', 'compatibility'],
    auth_required: ['auth_required', 'authentication'],
    auth_conflict: ['auth_conflict', 'authentication'],
    unavailable: ['probe_failed', 'execution'],
  } as const;
  for (const entry of observed.components) {
    if (entry.status === 'ready') continue;
    const [code, category] = mapping[entry.status];
    diagnostics.push({
      code,
      category,
      retryable: false,
      message: `foundation component ${entry.component} is ${entry.status}`,
    });
  }
  for (const auth of observed.auth) {
    if ((agent && auth.agent !== agent) || auth.status === 'ready') continue;
    diagnostics.push({
      code: auth.status,
      category: 'authentication',
      retryable: false,
      message: `${auth.agent} authentication is ${auth.status}`,
    });
  }
  if (!observed.nativeExt4) {
    diagnostics.push({
      code: 'non_native_worktree',
      category: 'policy',
      retryable: false,
      message: 'runtime execution is not on native ext4',
    });
  }
  if ((!agent || agent === 'codex') && observed.capabilities.codex === 'blocked') {
    diagnostics.push({
      code: 'mobile_disconnected',
      category: 'transport',
      retryable: false,
      message: 'Codex mobile control is unavailable',
    });
  }
  return diagnostics;
}

/** Returns the fixed value-free argv used to invoke the existing PR 0A doctor. */
export function foundationDoctorArguments(
  script: URL = FOUNDATION_DOCTOR_SCRIPT,
): readonly string[] {
  return [
    'run',
    '--no-lock',
    '--allow-read',
    '--allow-run',
    '--allow-env',
    script.href,
    'doctor',
    '--json',
  ];
}

function parseReport(value: unknown): RuntimeDoctorReport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('foundation doctor returned a non-object report');
  }
  const report = value as Partial<RuntimeDoctorReport>;
  if (
    report.schemaVersion !== FOUNDATION_SCHEMA_VERSION ||
    !report.nativePath ||
    !Array.isArray(report.components) ||
    !Array.isArray(report.auth) ||
    !report.mobileControl
  ) {
    throw new Error('foundation doctor returned an unsupported report schema');
  }
  return report as RuntimeDoctorReport;
}

/** Reads the existing doctor JSON without mutating foundation or controller state. */
export class CommandFoundationReportReader implements FoundationReportReader {
  constructor(private readonly script: URL = FOUNDATION_DOCTOR_SCRIPT) {}

  async readReport(): Promise<RuntimeDoctorReport> {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [...foundationDoctorArguments(this.script)],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (![0, 2, 3].includes(output.code) || output.stdout.byteLength > MAX_REPORT_BYTES) {
      throw new Error('foundation doctor did not return a bounded schema 1.0 report');
    }
    return parseReport(JSON.parse(new TextDecoder().decode(output.stdout)));
  }
}

function authCapability(report: RuntimeDoctorReport, agent: AgentKind): CapabilityState {
  const auth = report.auth.find((entry) => entry.provider === agent);
  if (!auth) return 'blocked';
  return auth.status === 'ready'
    ? 'available'
    : auth.status === 'auth_required'
    ? 'degraded'
    : 'blocked';
}

async function stableStateId(report: RuntimeDoctorReport): Promise<string> {
  const normalized = JSON.stringify({ ...report, generatedAt: undefined });
  const bytes = new TextEncoder().encode(normalized);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return `foundation:${[...digest].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

/** Translates every PR 0A executable/policy probe without widening bootstrap ownership. */
export async function translateFoundationReport(
  report: RuntimeDoctorReport,
): Promise<ObservedRuntimeState> {
  if (report.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new Error('foundation schema is not compatible with runtime schema 1.0');
  }
  const stateDirectories = report.components.flatMap((probe) => {
    const stateDirectory = STATE_DIRECTORY_COMPONENTS[probe.component];
    return probe.status === 'ready' && stateDirectory ? [stateDirectory] : [];
  });
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: await stableStateId(report),
    nativeExt4: report.nativePath.nativeExt4,
    components: report.components.map((probe) => ({
      component: probe.component,
      version: probe.detectedVersion,
      status: probe.status,
    })),
    auth: report.auth.map((probe) => ({
      agent: probe.provider,
      route: probe.route,
      status: probe.status,
      conflictKeys: [...probe.conflicts],
    })),
    stateDirectories,
    capabilities: {
      claude: authCapability(report, 'claude'),
      codex: translateMobileControl(report.mobileControl),
      gemini: 'deferred',
    },
    worktrees: [],
    sessions: [],
    configuredDesiredState: null,
    checkpoints: [],
  };
}

/** Supplies normalized foundation observations through the strict read port. */
export class FoundationRuntimeInspector implements RuntimeInspectorPort {
  constructor(private readonly reader: FoundationReportReader) {}

  async observeRuntime(): Promise<ObservedRuntimeState> {
    return await translateFoundationReport(await this.reader.readReport());
  }
}
