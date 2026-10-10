import type { EditorChoice } from '../../../../../kernel/domain/scaffold/workspace-config.ts';
import {
  AGENT_HOSTS,
  type AgentHost,
  type AgentInitResolution,
  type AgentResolution,
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

interface Signal<T> {
  readonly value: T;
  readonly signal: string;
}

/**
 * Resolve the agent hosts and editor for one installation.
 *
 * Precedence is `--host`/`--editor` flag, then existing project markers, then the invoking
 * environment, then the default (`claude` host, no editor). Each result records which source
 * decided it so the command can print the decision.
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
  return resolution.source === 'default'
    ? 'default: no flag, project marker, or environment signal'
    : `from ${resolution.source}: ${resolution.signals.join(', ')}`;
}

function resolveEditor(
  input: Pick<InitAgentInput, 'host' | 'editor'>,
  markers: ReadonlySet<AgentProjectMarker>,
  environment: AgentEnvironment,
): AgentResolution<EditorChoice> {
  if (input.editor) return resolved(input.editor, 'flag', [`--editor ${input.editor}`]);
  if (input.host === 'vscode' || input.host === 'all') {
    return resolved('vscode', 'flag', [`--host ${input.host}`]);
  }
  const hasZed = markers.has('.zed');
  const hasVsCode = markers.has('.vscode');
  if (hasZed && hasVsCode) {
    throw new Error(
      'Both .zed and .vscode exist; pass --editor zed, --editor vscode, or --editor none.',
    );
  }
  if (hasZed) return resolved('zed', 'project', ['.zed']);
  if (hasVsCode) return resolved('vscode', 'project', ['.vscode']);
  const detected = editorFromEnvironment(environment);
  if (detected) return resolved(detected.value, 'environment', [detected.signal]);
  return resolved('none', 'default', []);
}

function resolveHosts(
  input: Pick<InitAgentInput, 'host'>,
  markers: ReadonlySet<AgentProjectMarker>,
  environment: AgentEnvironment,
  editor: AgentResolution<EditorChoice>,
): AgentResolution<readonly AgentHost[]> {
  if (input.host === 'all') return resolved(AGENT_HOSTS, 'flag', ['--host all']);
  if (input.host) return resolved([input.host], 'flag', [`--host ${input.host}`]);

  const fromProject: Signal<AgentHost>[] = [];
  if (markers.has('.claude')) fromProject.push({ value: 'claude', signal: '.claude' });
  if (editor.value === 'vscode' && (editor.source === 'flag' || editor.source === 'project')) {
    fromProject.push({ value: 'vscode', signal: editor.signals[0] });
  }
  const opencodeMarker = OPENCODE_MARKERS.find((marker) => markers.has(marker));
  if (opencodeMarker) fromProject.push({ value: 'opencode', signal: opencodeMarker });
  if (fromProject.length > 0) return fromSignals(fromProject, 'project');

  const fromEnvironment: Signal<AgentHost>[] = [];
  if (isSet(environment.CLAUDECODE)) {
    fromEnvironment.push({ value: 'claude', signal: 'CLAUDECODE' });
  }
  if (editor.value === 'vscode' && editor.source === 'environment') {
    fromEnvironment.push({ value: 'vscode', signal: editor.signals[0] });
  }
  const opencodeVariable = isSet(environment.OPENCODE)
    ? 'OPENCODE'
    : firstSetVariable(environment, 'OPENCODE_');
  if (opencodeVariable) fromEnvironment.push({ value: 'opencode', signal: opencodeVariable });
  if (fromEnvironment.length > 0) return fromSignals(fromEnvironment, 'environment');

  return resolved(['claude'], 'default', []);
}

/**
 * Detect the editor whose integrated terminal launched the command. `TERM_PROGRAM` is rewritten
 * by each terminal, so it outranks variables a nested terminal may have inherited.
 */
function editorFromEnvironment(environment: AgentEnvironment): Signal<EditorChoice> | undefined {
  const termProgram = environment.TERM_PROGRAM?.toLowerCase();
  if (termProgram === 'vscode') return { value: 'vscode', signal: 'TERM_PROGRAM=vscode' };
  if (termProgram === 'zed') return { value: 'zed', signal: 'TERM_PROGRAM=zed' };
  if (isSet(environment.ZED_TERM)) return { value: 'zed', signal: 'ZED_TERM' };
  const vsCodeFamily = firstSetVariable(environment, 'VSCODE_') ??
    firstSetVariable(environment, 'CURSOR_');
  return vsCodeFamily ? { value: 'vscode', signal: vsCodeFamily } : undefined;
}

function fromSignals(
  signals: readonly Signal<AgentHost>[],
  source: 'project' | 'environment',
): AgentResolution<readonly AgentHost[]> {
  const ordered = [...signals].sort((left, right) =>
    AGENT_HOSTS.indexOf(left.value) - AGENT_HOSTS.indexOf(right.value)
  );
  return resolved(
    ordered.map((entry) => entry.value),
    source,
    ordered.map((entry) => entry.signal),
  );
}

function resolved<T>(
  value: T,
  source: AgentResolution<T>['source'],
  signals: readonly string[],
): AgentResolution<T> {
  return { value, source, signals };
}

function isSet(value: string | undefined): boolean {
  return value !== undefined && value !== '' && value !== '0';
}

function firstSetVariable(environment: AgentEnvironment, prefix: string): string | undefined {
  return Object.keys(environment)
    .filter((name) => name.startsWith(prefix) && isSet(environment[name]))
    .sort()[0];
}
