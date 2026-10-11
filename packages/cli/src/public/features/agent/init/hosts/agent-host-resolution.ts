import type { EditorChoice } from '../../../../../kernel/domain/scaffold/workspace-config.ts';
import {
  AGENT_HOSTS,
  type AgentHost,
  type AgentInitResolution,
  type AgentResolution,
  type AgentResolutionSignal,
  type AgentResolutionSource,
  type InitAgentInput,
} from '../init-agent-input.ts';

/** Snapshot of the invoking process environment consumed by host resolution. */
export type AgentEnvironment = Readonly<Record<string, string | undefined>>;

/** Project-root entries whose presence identifies an already configured agent host or editor. */
export const AGENT_PROJECT_MARKERS = [
  '.claude',
  '.vscode',
  '.zed',
  'opencode.json',
  'opencode.jsonc',
  '.opencode',
] as const;
/** One project-root agent host or editor marker. */
export type AgentProjectMarker = typeof AGENT_PROJECT_MARKERS[number];

const OPENCODE_MARKERS: readonly AgentProjectMarker[] = [
  'opencode.json',
  'opencode.jsonc',
  '.opencode',
];

interface Candidate<T> {
  readonly value: T;
  readonly signal: AgentResolutionSignal;
}

const SOURCE_ORDER: readonly AgentResolutionSource[] = [
  'flag',
  'project',
  'environment',
  'default',
];

/**
 * Resolve the agent hosts and editor for one installation.
 *
 * Precedence is `--host`/`--editor` flag, then existing project markers, then the invoking
 * environment, then the default (`claude` host, no editor). Each result records the deciding source
 * and the source of every signal it used, so the command can print the decision.
 */
export function resolveAgentInit(
  input: Pick<InitAgentInput, 'host' | 'editor'>,
  markers: ReadonlySet<AgentProjectMarker>,
  environment: AgentEnvironment,
): AgentInitResolution {
  const editor = resolveEditor(input, markers, environment);
  return { editor, hosts: resolveHosts(input, markers, environment, editor) };
}

/** Render the resolution as the lines `netscript agent init` prints. */
export function describeAgentInitResolution(resolution: AgentInitResolution): readonly string[] {
  return [
    `Agent hosts: ${resolution.hosts.value.join(', ')} (${describeSource(resolution.hosts)}).`,
    `Editor: ${resolution.editor.value} (${describeSource(resolution.editor)}).`,
  ];
}

function describeSource(resolution: AgentResolution<unknown>): string {
  if (resolution.source === 'default') {
    return 'default: no flag, project marker, or environment signal';
  }
  const groups = SOURCE_ORDER.flatMap((source) => {
    const names = resolution.signals
      .filter((signal) => signal.source === source)
      .map((signal) => signal.name);
    return names.length > 0 ? [`${source}: ${names.join(', ')}`] : [];
  });
  return `from ${groups.join('; ')}`;
}

function resolveEditor(
  input: Pick<InitAgentInput, 'host' | 'editor'>,
  markers: ReadonlySet<AgentProjectMarker>,
  environment: AgentEnvironment,
): AgentResolution<EditorChoice> {
  if (input.editor) return single(input.editor, 'flag', `--editor ${input.editor}`);
  if (input.host === 'vscode' || input.host === 'all') {
    return single('vscode', 'flag', `--host ${input.host}`);
  }
  const hasZed = markers.has('.zed');
  const hasVsCode = markers.has('.vscode');
  if (hasZed && hasVsCode) {
    throw new Error(
      'Both .zed and .vscode exist; pass --editor zed, --editor vscode, or --editor none.',
    );
  }
  if (hasZed) return single('zed', 'project', '.zed');
  if (hasVsCode) return single('vscode', 'project', '.vscode');
  const detected = editorFromEnvironment(environment);
  if (detected) {
    return { value: detected.value, source: 'environment', signals: [detected.signal] };
  }
  return { value: 'none', source: 'default', signals: [] };
}

function resolveHosts(
  input: Pick<InitAgentInput, 'host'>,
  markers: ReadonlySet<AgentProjectMarker>,
  environment: AgentEnvironment,
  editor: AgentResolution<EditorChoice>,
): AgentResolution<readonly AgentHost[]> {
  if (input.host === 'all') return single(AGENT_HOSTS, 'flag', '--host all');
  if (input.host) return single([input.host], 'flag', `--host ${input.host}`);

  // An editor chosen by flag or project marker selects the VS Code host alongside project markers;
  // the signal keeps the editor's own provenance.
  const editorHost: Candidate<AgentHost>[] =
    editor.value === 'vscode' && editor.source !== 'environment' && editor.source !== 'default'
      ? [{ value: 'vscode', signal: editor.signals[0] }]
      : [];
  const fromProject: Candidate<AgentHost>[] = [...editorHost];
  if (markers.has('.claude')) fromProject.push(candidate('claude', 'project', '.claude'));
  const opencodeMarker = OPENCODE_MARKERS.find((marker) => markers.has(marker));
  if (opencodeMarker) fromProject.push(candidate('opencode', 'project', opencodeMarker));
  if (fromProject.length > 0) return hostResolution(fromProject);

  const fromEnvironment: Candidate<AgentHost>[] = [];
  if (isSet(environment.CLAUDECODE)) {
    fromEnvironment.push(candidate('claude', 'environment', 'CLAUDECODE'));
  }
  if (editor.value === 'vscode' && editor.source === 'environment') {
    fromEnvironment.push({ value: 'vscode', signal: editor.signals[0] });
  }
  const opencodeVariable = isSet(environment.OPENCODE)
    ? 'OPENCODE'
    : firstSetVariable(environment, 'OPENCODE_');
  if (opencodeVariable) {
    fromEnvironment.push(candidate('opencode', 'environment', opencodeVariable));
  }
  if (fromEnvironment.length > 0) return hostResolution(fromEnvironment);

  return { value: ['claude'], source: 'default', signals: [] };
}

/**
 * Detect the editor whose integrated terminal launched the command. `TERM_PROGRAM` is rewritten
 * by each terminal, so it outranks variables a nested terminal may have inherited.
 */
function editorFromEnvironment(environment: AgentEnvironment): Candidate<EditorChoice> | undefined {
  const termProgram = environment.TERM_PROGRAM?.toLowerCase();
  if (termProgram === 'vscode') return candidate('vscode', 'environment', 'TERM_PROGRAM=vscode');
  if (termProgram === 'zed') return candidate('zed', 'environment', 'TERM_PROGRAM=zed');
  if (isSet(environment.ZED_TERM)) return candidate('zed', 'environment', 'ZED_TERM');
  const vsCodeFamily = firstSetVariable(environment, 'VSCODE_') ??
    firstSetVariable(environment, 'CURSOR_');
  return vsCodeFamily ? candidate('vscode', 'environment', vsCodeFamily) : undefined;
}

function hostResolution(
  candidates: readonly Candidate<AgentHost>[],
): AgentResolution<readonly AgentHost[]> {
  const ordered = [...candidates].sort((left, right) =>
    AGENT_HOSTS.indexOf(left.value) - AGENT_HOSTS.indexOf(right.value)
  );
  const signals = ordered.map((entry) => entry.signal);
  return { value: ordered.map((entry) => entry.value), source: highestSource(signals), signals };
}

function highestSource(signals: readonly AgentResolutionSignal[]): AgentResolutionSource {
  return SOURCE_ORDER.find((source) => signals.some((signal) => signal.source === source)) ??
    'default';
}

function candidate<T>(value: T, source: AgentResolutionSource, name: string): Candidate<T> {
  return { value, signal: { source, name } };
}

function single<T>(value: T, source: AgentResolutionSource, name: string): AgentResolution<T> {
  return { value, source, signals: [{ source, name }] };
}

function isSet(value: string | undefined): boolean {
  return value !== undefined && value !== '' && value !== '0';
}

function firstSetVariable(environment: AgentEnvironment, prefix: string): string | undefined {
  return Object.keys(environment)
    .filter((name) => name.startsWith(prefix) && isSet(environment[name]))
    .sort()[0];
}
