/** Pure contracts and classifiers for the native WSL agentic foundation. */

export const FOUNDATION_SCHEMA_VERSION = '1.0';
export const NODE_VERSION = '26.5.0';

export const RUNTIME_COMPONENT_IDS = [
  'node',
  'npm',
  'deno',
  'git',
  'codex',
  'codex-app-server',
  'claude',
  'gemini',
  'gemini-auth-policy',
  'dotnet',
  'aspire',
  'docker',
  'state-claude',
  'state-codex',
  'state-gemini',
  'state-netscript-agentic',
] as const;

export type RuntimeComponentId = typeof RUNTIME_COMPONENT_IDS[number];

export const PROBE_STATUSES = [
  'ready',
  'missing',
  'outdated',
  'version_skew',
  'auth_required',
  'auth_conflict',
  'unavailable',
] as const;

export type ProbeStatus = typeof PROBE_STATUSES[number];

export interface RuntimeProbe {
  component: RuntimeComponentId;
  detectedVersion: string | null;
  expected: string | null;
  status: ProbeStatus;
  detail: string;
}

export interface AuthBoundaryProbe {
  provider: 'claude' | 'gemini';
  status: 'ready' | 'auth_required' | 'auth_conflict';
  route: 'provider-native' | 'google-subscription';
  conflicts: string[];
  detail: string;
}

export interface MobileControlProbe {
  provider: 'codex';
  status: 'ready' | 'unavailable' | 'version_skew';
  managed: boolean;
  cliVersion: string | null;
  appServerVersion: string | null;
  detail: string;
}

export interface RuntimeDoctorReport {
  schemaVersion: typeof FOUNDATION_SCHEMA_VERSION;
  generatedAt: string;
  nativePath: { cwd: string; nativeExt4: boolean };
  components: RuntimeProbe[];
  auth: AuthBoundaryProbe[];
  mobileControl: MobileControlProbe;
  overall: 'ready' | 'degraded' | 'invalid_configuration';
}

export interface DesiredCliVersions {
  claude: string;
  gemini: string;
}

export type InstallAction =
  | { kind: 'create_directory'; relativePath: string }
  | { kind: 'install_node'; version: string; archive: string }
  | { kind: 'install_npm_clis'; packages: string[] }
  | { kind: 'configure_gemini_auth'; selectedType: 'oauth-personal' }
  | { kind: 'ensure_symlinks'; names: string[] }
  | { kind: 'write_state'; relativePath: string };

export interface BootstrapPlan {
  schemaVersion: typeof FOUNDATION_SCHEMA_VERSION;
  desired: { node: string; claude: string; gemini: string };
  actions: InstallAction[];
  changed: boolean;
}

export interface RollbackPlan {
  schemaVersion: typeof FOUNDATION_SCHEMA_VERSION;
  destructive: false;
  ownedRoots: string[];
  steps: string[];
  windowsClaude: 'preserved';
}

export const FORBIDDEN_GEMINI_AUTH_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_CLOUD_LOCATION',
  'GOOGLE_GENAI_USE_VERTEXAI',
] as const;

export const CLAUDE_AUTH_KEYS = ['ANTHROPIC_API_KEY'] as const;

export const LOCAL_STATE_DIRS: Readonly<Record<RuntimeComponentId, string | null>> = {
  node: null,
  npm: null,
  deno: null,
  git: null,
  codex: null,
  'codex-app-server': null,
  claude: null,
  gemini: null,
  'gemini-auth-policy': null,
  dotnet: null,
  aspire: null,
  docker: null,
  'state-claude': '.claude',
  'state-codex': '.codex',
  'state-gemini': '.gemini',
  'state-netscript-agentic': '.config/netscript-agentic',
};

export const EXIT_CODES = {
  ready: 0,
  degraded: 2,
  invalidConfiguration: 3,
  executionFailure: 4,
} as const;

export interface RawComponentProbe {
  component: RuntimeComponentId;
  output: string;
  exitCode: number;
  expected?: string | null;
}

/** Extracts a bounded semantic version without retaining arbitrary command output. */
export function parseVersion(output: string): string | null {
  return output.match(/(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/)?.[1] ?? null;
}

/** Classifies one fixed tool probe into the stable doctor vocabulary. */
export function classifyComponent(raw: RawComponentProbe): RuntimeProbe {
  const detectedVersion = parseVersion(raw.output);
  if (raw.exitCode !== 0) {
    return {
      component: raw.component,
      detectedVersion: null,
      expected: raw.expected ?? null,
      status: raw.exitCode === 127 ? 'missing' : 'unavailable',
      detail: raw.exitCode === 127 ? 'executable not found' : `probe exited ${raw.exitCode}`,
    };
  }
  if (raw.expected && detectedVersion && detectedVersion !== raw.expected) {
    return {
      component: raw.component,
      detectedVersion,
      expected: raw.expected,
      status: 'outdated',
      detail: `expected ${raw.expected}`,
    };
  }
  return {
    component: raw.component,
    detectedVersion,
    expected: raw.expected ?? null,
    status: 'ready',
    detail: detectedVersion ? 'version detected' : 'probe succeeded',
  };
}

/** Classifies a required local state directory without exposing its absolute home path. */
export function classifyStateDirectory(
  component: RuntimeComponentId,
  relativePath: string,
  exists: boolean,
): RuntimeProbe {
  return {
    component,
    detectedVersion: null,
    expected: relativePath,
    status: exists ? 'ready' : 'missing',
    detail: exists ? 'local state directory present' : 'local state directory absent',
  };
}

/** Requires the owner-approved Google subscription route without reading credential material. */
export function classifyGeminiAuthPolicy(
  exists: boolean,
  selectedType: string | null,
  enforcedType: string | null,
): RuntimeProbe {
  const required = 'oauth-personal';
  if (!exists) {
    return {
      component: 'gemini-auth-policy',
      detectedVersion: null,
      expected: required,
      status: 'missing',
      detail: 'Google subscription auth policy not configured',
    };
  }
  const compatible = selectedType === required && enforcedType === required;
  return {
    component: 'gemini-auth-policy',
    detectedVersion: null,
    expected: required,
    status: compatible ? 'ready' : 'auth_conflict',
    detail: compatible
      ? 'Google subscription auth policy enforced'
      : 'Gemini settings do not enforce Google subscription auth',
  };
}

/** Enforces subscription-only Gemini auth and reports environment key names, never values. */
export function classifyAuth(
  presentKeys: ReadonlySet<string>,
  claudeSessionPresent: boolean,
  geminiSessionPresent: boolean,
): AuthBoundaryProbe[] {
  const claudeConflicts = CLAUDE_AUTH_KEYS.filter((key) => presentKeys.has(key));
  const geminiConflicts = FORBIDDEN_GEMINI_AUTH_KEYS.filter((key) => presentKeys.has(key));
  return [
    {
      provider: 'claude',
      route: 'provider-native',
      conflicts: [...claudeConflicts],
      status: claudeConflicts.length > 0
        ? 'auth_conflict'
        : claudeSessionPresent
        ? 'ready'
        : 'auth_required',
      detail: claudeConflicts.length > 0
        ? 'API-key environment route is not part of this foundation'
        : claudeSessionPresent
        ? 'provider-native session metadata present'
        : 'provider-native browser sign-in required',
    },
    {
      provider: 'gemini',
      route: 'google-subscription',
      conflicts: [...geminiConflicts],
      status: geminiConflicts.length > 0
        ? 'auth_conflict'
        : geminiSessionPresent
        ? 'ready'
        : 'auth_required',
      detail: geminiConflicts.length > 0
        ? 'API-key or Vertex environment route is forbidden'
        : geminiSessionPresent
        ? 'Google subscription session metadata present'
        : 'Google subscription browser sign-in required',
    },
  ];
}

/** Builds the Codex managed-control probe and reports version skew explicitly. */
export function classifyMobileControl(
  managed: boolean,
  cliVersion: string | null,
  appServerVersion: string | null,
): MobileControlProbe {
  const skew = Boolean(cliVersion && appServerVersion && cliVersion !== appServerVersion);
  return {
    provider: 'codex',
    managed,
    cliVersion,
    appServerVersion,
    status: !managed ? 'unavailable' : skew ? 'version_skew' : 'ready',
    detail: !managed
      ? 'managed app-server not detected'
      : skew
      ? 'CLI and app-server versions differ'
      : 'managed app-server detected',
  };
}

/** Assembles a deterministic report and derives its process-level health. */
export function buildDoctorReport(
  input: Omit<RuntimeDoctorReport, 'schemaVersion' | 'overall'>,
): RuntimeDoctorReport {
  const authConflict = input.auth.some((probe) => probe.status === 'auth_conflict') ||
    input.components.some((probe) => probe.status === 'auth_conflict');
  const degraded = input.components.some((probe) => probe.status !== 'ready') ||
    input.auth.some((probe) => probe.status !== 'ready') ||
    input.mobileControl.status !== 'ready' ||
    !input.nativePath.nativeExt4;
  return {
    schemaVersion: FOUNDATION_SCHEMA_VERSION,
    ...input,
    overall: authConflict ? 'invalid_configuration' : degraded ? 'degraded' : 'ready',
  };
}

/** Plans only missing/outdated user-local state; execution remains at the CLI edge. */
export function planBootstrap(
  report: RuntimeDoctorReport,
  desired: DesiredCliVersions,
): BootstrapPlan {
  const actions: InstallAction[] = [];
  const missingDirs = report.components
    .filter((probe) => probe.component.startsWith('state-') && probe.status === 'missing')
    .map((probe) => probe.expected)
    .filter((path): path is string => Boolean(path));
  for (const relativePath of missingDirs) actions.push({ kind: 'create_directory', relativePath });

  const byId = new Map(report.components.map((probe) => [probe.component, probe]));
  if (byId.get('node')?.detectedVersion !== NODE_VERSION) {
    actions.push({
      kind: 'install_node',
      version: NODE_VERSION,
      archive: `node-v${NODE_VERSION}-linux-x64.tar.xz`,
    });
  }
  const packages: string[] = [];
  if (byId.get('claude')?.detectedVersion !== desired.claude) {
    packages.push(`@anthropic-ai/claude-code@${desired.claude}`);
  }
  if (byId.get('gemini')?.detectedVersion !== desired.gemini) {
    packages.push(`@google/gemini-cli@${desired.gemini}`);
  }
  if (packages.length > 0) actions.push({ kind: 'install_npm_clis', packages });
  if (byId.get('gemini-auth-policy')?.status === 'missing') {
    actions.push({ kind: 'configure_gemini_auth', selectedType: 'oauth-personal' });
  }
  if (
    actions.some((action) => action.kind === 'install_node' || action.kind === 'install_npm_clis')
  ) {
    actions.push({
      kind: 'ensure_symlinks',
      names: ['node', 'npm', 'npx', 'claude', 'gemini'],
    });
  }
  if (actions.length > 0) {
    actions.push({
      kind: 'write_state',
      relativePath: '.config/netscript-agentic/foundation-state.json',
    });
  }
  return {
    schemaVersion: FOUNDATION_SCHEMA_VERSION,
    desired: { node: NODE_VERSION, ...desired },
    actions,
    changed: actions.length > 0,
  };
}

/** Returns non-executing reversal guidance scoped to files owned by this bootstrap. */
export function buildRollbackPlan(): RollbackPlan {
  return {
    schemaVersion: FOUNDATION_SCHEMA_VERSION,
    destructive: false,
    ownedRoots: [
      '$HOME/.local/share/netscript-agentic',
      '$HOME/.config/netscript-agentic',
      '$HOME/.local/bin/{node,npm,npx,claude,gemini}',
      '$HOME/.gemini/settings.json (only when foundation-state.json records it as created)',
    ],
    steps: [
      'Stop native WSL Claude/Gemini sessions before rollback.',
      'Inspect foundation-state.json; detach only owned symlinks and restore each non-null previous target.',
      'Remove the user-local npm and Node roots after the symlinks are detached.',
      'Remove Gemini settings only when createdFiles records it and its auth policy is still oauth-personal.',
      'Leave ~/.codex and all provider auth/session directories intact.',
      'Open native Windows Claude and run claude --version as the break-glass verification.',
    ],
    windowsClaude: 'preserved',
  };
}
