import { assertEquals, assertThrows } from '@std/assert';
import {
  type AgentEnvironment,
  type AgentProjectMarker,
  describeAgentInitResolution,
  resolveAgentInit,
} from './agent-host-resolution.ts';
import type {
  AgentHost,
  AgentResolutionSignal,
  AgentResolutionSource,
  InitAgentInput,
} from '../init-agent-input.ts';

function resolve(
  input: Pick<InitAgentInput, 'host' | 'editor'> = {},
  markers: readonly AgentProjectMarker[] = [],
  environment: AgentEnvironment = {},
) {
  return resolveAgentInit(input, new Set(markers), environment);
}

function signals(
  source: AgentResolutionSource,
  ...names: readonly string[]
): AgentResolutionSignal[] {
  return names.map((name) => ({ source, name }));
}

Deno.test('host resolution: --host flag outranks project markers and environment', () => {
  const resolution = resolve({ host: 'opencode' }, ['.claude', '.vscode'], {
    CLAUDECODE: '1',
    TERM_PROGRAM: 'vscode',
  });
  assertEquals(resolution.hosts, {
    value: ['opencode'],
    source: 'flag',
    signals: signals('flag', '--host opencode'),
  });
});

Deno.test('host resolution: --host all selects claude, vscode, and opencode', () => {
  const resolution = resolve({ host: 'all' });
  assertEquals(resolution.hosts.value, ['claude', 'vscode', 'opencode']);
  assertEquals(resolution.editor, {
    value: 'vscode',
    source: 'flag',
    signals: signals('flag', '--host all'),
  });
});

Deno.test('host resolution: project markers outrank environment signals', () => {
  const resolution = resolve({}, ['.claude'], { OPENCODE: '1', TERM_PROGRAM: 'vscode' });
  assertEquals(resolution.hosts, {
    value: ['claude'],
    source: 'project',
    signals: signals('project', '.claude'),
  });
  assertEquals(resolution.editor, {
    value: 'vscode',
    source: 'environment',
    signals: signals('environment', 'TERM_PROGRAM=vscode'),
  });
});

Deno.test('host resolution: OpenCode project markers select the opencode host', () => {
  for (const marker of ['opencode.json', 'opencode.jsonc', '.opencode'] as const) {
    assertEquals(resolve({}, [marker]).hosts, {
      value: ['opencode'],
      source: 'project',
      signals: signals('project', marker),
    });
  }
  assertEquals(resolve({}, ['.vscode', '.claude', 'opencode.json']).hosts, {
    value: ['claude', 'vscode', 'opencode'],
    source: 'project',
    signals: signals('project', '.claude', '.vscode', 'opencode.json'),
  });
});

Deno.test('host resolution: an --editor flag keeps flag provenance when it selects the VS Code host', () => {
  const alone = resolve({ editor: 'vscode' });
  assertEquals(alone.hosts, {
    value: ['vscode'],
    source: 'flag',
    signals: signals('flag', '--editor vscode'),
  });
  assertEquals(describeAgentInitResolution(alone), [
    'Agent hosts: vscode (from flag: --editor vscode).',
    'Editor: vscode (from flag: --editor vscode).',
  ]);

  const mixed = resolve({ editor: 'vscode' }, ['.claude']);
  assertEquals(mixed.hosts, {
    value: ['claude', 'vscode'],
    source: 'flag',
    signals: [
      { source: 'project', name: '.claude' },
      { source: 'flag', name: '--editor vscode' },
    ],
  });
  assertEquals(
    describeAgentInitResolution(mixed)[0],
    'Agent hosts: claude, vscode (from flag: --editor vscode; project: .claude).',
  );
});

Deno.test('host resolution: each environment signal selects its host when project markers are absent', () => {
  const cases: readonly [AgentEnvironment, readonly AgentHost[], string, string][] = [
    [{ CLAUDECODE: '1' }, ['claude'], 'CLAUDECODE', 'none'],
    [{ OPENCODE: '1' }, ['opencode'], 'OPENCODE', 'none'],
    [{ OPENCODE_CONFIG_DIR: 'x' }, ['opencode'], 'OPENCODE_CONFIG_DIR', 'none'],
    [{ TERM_PROGRAM: 'vscode' }, ['vscode'], 'TERM_PROGRAM=vscode', 'vscode'],
    [{ VSCODE_PID: '42' }, ['vscode'], 'VSCODE_PID', 'vscode'],
    [{ CURSOR_TRACE_ID: 'abc' }, ['vscode'], 'CURSOR_TRACE_ID', 'vscode'],
  ];
  for (const [environment, hosts, signal, editor] of cases) {
    const resolution = resolve({}, [], environment);
    assertEquals(resolution.hosts, {
      value: hosts,
      source: 'environment',
      signals: signals('environment', signal),
    });
    assertEquals(resolution.editor.value, editor);
  }
});

Deno.test('host resolution: Zed terminal selects the Zed editor and the default host', () => {
  for (const environment of [{ ZED_TERM: 'true' }, { TERM_PROGRAM: 'zed' }]) {
    const resolution = resolve({}, [], environment);
    assertEquals(resolution.editor.value, 'zed');
    assertEquals(resolution.editor.source, 'environment');
    assertEquals(resolution.hosts, { value: ['claude'], source: 'default', signals: [] });
  }
});

Deno.test('host resolution: TERM_PROGRAM outranks variables inherited from an outer editor', () => {
  const resolution = resolve({}, [], { TERM_PROGRAM: 'zed', VSCODE_PID: '42' });
  assertEquals(resolution.editor, {
    value: 'zed',
    source: 'environment',
    signals: signals('environment', 'TERM_PROGRAM=zed'),
  });
});

Deno.test('host resolution: combined environment signals keep canonical host order', () => {
  const resolution = resolve({}, [], {
    OPENCODE: '1',
    TERM_PROGRAM: 'vscode',
    CLAUDECODE: '1',
  });
  assertEquals(resolution.hosts, {
    value: ['claude', 'vscode', 'opencode'],
    source: 'environment',
    signals: signals('environment', 'CLAUDECODE', 'TERM_PROGRAM=vscode', 'OPENCODE'),
  });
});

Deno.test('host resolution: empty and zero environment values are not signals', () => {
  const resolution = resolve({}, [], { CLAUDECODE: '0', OPENCODE: '', VSCODE_PID: '' });
  assertEquals(resolution.hosts, { value: ['claude'], source: 'default', signals: [] });
  assertEquals(resolution.editor, { value: 'none', source: 'default', signals: [] });
});

Deno.test('host resolution: an ambiguous project editor is still rejected', () => {
  assertThrows(
    () => resolve({}, ['.zed', '.vscode'], { TERM_PROGRAM: 'vscode' }),
    Error,
    'pass --editor zed, --editor vscode, or --editor none',
  );
});

Deno.test('host resolution: printed lines name the deciding source and never env values', () => {
  assertEquals(
    describeAgentInitResolution(
      resolve({}, [], { VSCODE_IPC_HOOK_CLI: '/private/socket', CLAUDECODE: '1' }),
    ),
    [
      'Agent hosts: claude, vscode (from environment: CLAUDECODE, VSCODE_IPC_HOOK_CLI).',
      'Editor: vscode (from environment: VSCODE_IPC_HOOK_CLI).',
    ],
  );
  assertEquals(describeAgentInitResolution(resolve()), [
    'Agent hosts: claude (default: no flag, project marker, or environment signal).',
    'Editor: none (default: no flag, project marker, or environment signal).',
  ]);
  assertEquals(describeAgentInitResolution(resolve({ host: 'claude' }, ['.zed'])), [
    'Agent hosts: claude (from flag: --host claude).',
    'Editor: zed (from project: .zed).',
  ]);
});
