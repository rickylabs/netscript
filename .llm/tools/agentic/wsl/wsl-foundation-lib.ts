/** Pure contracts and classifiers for the native WSL agentic foundation. */

import { ANTIGRAVITY_INSTALLER_URL } from '../config/endpoints.ts';
import { ANTIGRAVITY_INSTALL_MARKER, NODE_TARGET_VERSION } from '../config/versions.ts';

export const FOUNDATION_SCHEMA_VERSION = '1.0';
/** Re-exported from the central config; the single source is `config/versions.ts`. */
export const NODE_VERSION: string = NODE_TARGET_VERSION;

export const RUNTIME_COMPONENT_IDS = [
  'node',
  'npm',
  'deno',
  'git',
  'codex',
  'codex-app-server',
  'claude',
  'antigravity',
  'antigravity-auth',
  'antigravity-install-ownership',
  'legacy-gemini-ownership',
  'dotnet',
  'aspire',
  'docker',
  'state-claude',
  'state-codex',
  'state-antigravity',
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
  provider: 'claude' | 'antigravity';
  status: 'ready' | 'auth_required' | 'auth_conflict';
  route: 'provider-native' | 'google-sign-in';
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
}

export type InstallAction =
  | { kind: 'create_directory'; relativePath: string }
  | { kind: 'install_node'; version: string; archive: string }
  | { kind: 'install_npm_clis'; packages: string[] }
  | { kind: 'install_antigravity'; installer: typeof ANTIGRAVITY_INSTALLER_URL }
  | { kind: 'recover_antigravity_ownership' }
  | { kind: 'migrate_legacy_gemini_ownership' }
  | { kind: 'ensure_symlinks'; names: string[] }
  | { kind: 'write_state'; relativePath: string };

export interface BootstrapPlan {
  schemaVersion: typeof FOUNDATION_SCHEMA_VERSION;
  desired: { node: string; claude: string; antigravity: typeof ANTIGRAVITY_INSTALL_MARKER };
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

export const CLAUDE_AUTH_KEYS = ['ANTHROPIC_API_KEY'] as const;

export const LOCAL_STATE_DIRS: Readonly<Record<RuntimeComponentId, string | null>> = {
  node: null,
  npm: null,
  deno: null,
  git: null,
  codex: null,
  'codex-app-server': null,
  claude: null,
  antigravity: null,
  'antigravity-auth': null,
  'antigravity-install-ownership': null,
  'legacy-gemini-ownership': null,
  dotnet: null,
  aspire: null,
  docker: null,
  'state-claude': '.claude',
  'state-codex': '.codex',
  'state-antigravity': '.gemini',
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

function boundedProbeDiagnostic(output: string): string {
  const normalized = output.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 80) : '<empty>';
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
  if (!detectedVersion) {
    return {
      component: raw.component,
      detectedVersion: null,
      expected: raw.expected ?? null,
      status: 'unavailable',
      detail: `unparseable version output: ${boundedProbeDiagnostic(raw.output)}`,
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
    detail: 'version detected',
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

/** Classifies Antigravity's documented keyring/Google Sign-In markers without reading credentials. */
export function classifyAntigravityAuth(
  accountMarkerPresent: boolean,
  credentialMarkerPresent: boolean,
): RuntimeProbe {
  const ready = accountMarkerPresent && credentialMarkerPresent;
  return {
    component: 'antigravity-auth',
    detectedVersion: null,
    expected: 'system-keyring-or-google-sign-in',
    status: ready ? 'ready' : 'auth_required',
    detail: ready
      ? 'Google Sign-In account and credential markers present'
      : 'official keyring/Google Sign-In session required',
  };
}

/** Classifies whether legacy NetScript-owned Gemini state can be migrated safely. */
export function classifyLegacyGeminiOwnership(
  manifestStatus: 'missing' | 'valid' | 'invalid',
  ownedLinkRecorded: boolean,
  ownedLinkMatches: boolean,
): RuntimeProbe {
  const status = manifestStatus === 'invalid'
    ? 'auth_conflict'
    : manifestStatus === 'missing' || !ownedLinkRecorded
    ? 'ready'
    : ownedLinkMatches
    ? 'outdated'
    : 'auth_conflict';
  return {
    component: 'legacy-gemini-ownership',
    detectedVersion: null,
    expected: 'no NetScript-owned gemini executable',
    status,
    detail: manifestStatus === 'invalid'
      ? 'ownership manifest is malformed or unreadable; refusing migration'
      : status === 'ready'
      ? 'no legacy NetScript-owned Gemini executable recorded'
      : status === 'outdated'
      ? 'legacy NetScript-owned Gemini state requires explicit migration'
      : 'legacy Gemini ownership does not match the manifest; refusing migration',
  };
}

/** Classifies a recoverable Antigravity install journal without claiming external agy ownership. */
export function classifyAntigravityInstallOwnership(
  pendingStatus: 'missing' | 'valid' | 'invalid',
  canonicalAgyPresent: boolean,
): RuntimeProbe {
  const status = pendingStatus === 'invalid'
    ? 'auth_conflict'
    : pendingStatus === 'valid' && canonicalAgyPresent
    ? 'outdated'
    : pendingStatus === 'valid'
    ? 'auth_conflict'
    : 'ready';
  return {
    component: 'antigravity-install-ownership',
    detectedVersion: null,
    expected: 'no unfinished NetScript Antigravity install',
    status,
    detail: status === 'ready'
      ? 'no unfinished NetScript Antigravity install'
      : status === 'outdated'
      ? 'installed agy ownership requires journal recovery'
      : 'Antigravity ownership journal is invalid or its executable is missing',
  };
}

/** Validates canonical agy metadata before NetScript records or recovers its ownership. */
export function classifyCanonicalAgyOwnership(
  isFile: boolean,
  executable: boolean,
  currentUserOwned: boolean,
): { ready: boolean; detail: string } {
  const ready = isFile && executable && currentUserOwned;
  return {
    ready,
    detail: ready
      ? 'canonical executable is current-user owned and executable'
      : !isFile
      ? 'canonical agy path is not a regular file'
      : !currentUserOwned
      ? 'canonical agy executable is not owned by the current user'
      : 'canonical agy file is not owner-executable',
  };
}

/** Reports provider-native session readiness without inferring Antigravity key policy. */
export function classifyAuth(
  presentKeys: ReadonlySet<string>,
  claudeSessionPresent: boolean,
  antigravitySessionPresent: boolean,
): AuthBoundaryProbe[] {
  const claudeConflicts = CLAUDE_AUTH_KEYS.filter((key) => presentKeys.has(key));
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
      provider: 'antigravity',
      route: 'google-sign-in',
      conflicts: [],
      status: antigravitySessionPresent ? 'ready' : 'auth_required',
      detail: antigravitySessionPresent
        ? 'official keyring/Google Sign-In session markers present'
        : 'official keyring/Google Sign-In required',
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
  if (packages.length > 0) actions.push({ kind: 'install_npm_clis', packages });
  if (byId.get('antigravity')?.status === 'missing') {
    if (
      !actions.some((action) =>
        action.kind === 'create_directory' &&
        action.relativePath === '.local/share/netscript-agentic'
      )
    ) {
      actions.push({ kind: 'create_directory', relativePath: '.local/share/netscript-agentic' });
    }
    actions.push({
      kind: 'install_antigravity',
      installer: ANTIGRAVITY_INSTALLER_URL,
    });
  }
  if (byId.get('antigravity-install-ownership')?.status === 'outdated') {
    actions.push({ kind: 'recover_antigravity_ownership' });
  }
  if (byId.get('legacy-gemini-ownership')?.status === 'outdated') {
    actions.push({ kind: 'migrate_legacy_gemini_ownership' });
  }
  if (
    actions.some((action) => action.kind === 'install_node' || action.kind === 'install_npm_clis')
  ) {
    actions.push({
      kind: 'ensure_symlinks',
      names: ['node', 'npm', 'npx', 'claude'],
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
    desired: { node: NODE_VERSION, ...desired, antigravity: ANTIGRAVITY_INSTALL_MARKER },
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
      '$HOME/.local/bin/{node,npm,npx,claude}',
      '$HOME/.local/bin/agy (only when foundation-state.json or agy-install-pending.json records it)',
    ],
    steps: [
      'Stop native WSL Claude/Antigravity sessions before rollback.',
      'Inspect foundation-state.json; detach only owned symlinks and restore each non-null previous target.',
      'Remove the user-local npm and Node roots after the symlinks are detached.',
      'Remove agy only when the final manifest or pending-install journal records that exact canonical-user executable.',
      'Preserve ~/.gemini, ~/.codex, and all provider auth/session material.',
      'Open native Windows Claude and run claude --version as the break-glass verification.',
    ],
    windowsClaude: 'preserved',
  };
}
