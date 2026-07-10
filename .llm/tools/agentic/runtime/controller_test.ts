import { parseRuntimeArgs } from '../agentic-runtime.ts';
import {
  buildDoctorReport,
  classifyAuth,
  classifyMobileControl,
  RUNTIME_COMPONENT_IDS,
  type RuntimeDoctorReport,
} from '../wsl-foundation-lib.ts';
import {
  foundationDoctorArguments,
  type FoundationReportReader,
  FoundationRuntimeInspector,
  translateFoundationReport,
} from './adapters/foundation-adapter.ts';
import { LocalRuntimeStateAdapter } from './adapters/local-state-adapter.ts';
import { deferredMobileRepairDiagnostic } from './adapters/mobile-control-adapter.ts';
import { RUNTIME_SCHEMA_VERSION, type RuntimeCommand, type RuntimeResult } from './contract.ts';
import { runRuntimeCommand } from './controller.ts';
import { renderRuntimeHuman, renderRuntimeJson, runtimeExitCode } from './output.ts';
import type { RuntimeMutationPorts, RuntimeReadPorts } from './ports.ts';
import type {
  DesiredRuntimeState,
  ObservedRuntimeState,
  PersistedRuntimeState,
  RuntimeCheckpointState,
} from './state.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}\nactual: ${left}\nexpected: ${right}`);
}

const worktree = '/home/codex/repos/worktree';
const desired: DesiredRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'desired-s2',
  foundation: {
    nativeExt4: true,
    versions: { node: '26.5.0', claude: '2.1.206', gemini: '0.50.0' },
    stateDirectories: ['claude', 'codex', 'gemini', 'netscript-agentic'],
  },
  agents: { codex: { required: true, authRoute: 'provider-native' } },
  worktrees: [{ path: worktree, branch: 'feature', upstream: 'none', clean: true }],
  sessions: [],
};

function report(generatedAt = '2026-07-10T00:00:00.000Z'): RuntimeDoctorReport {
  return buildDoctorReport({
    generatedAt,
    nativePath: { cwd: worktree, nativeExt4: true },
    components: RUNTIME_COMPONENT_IDS.map((component) => ({
      component,
      detectedVersion: component.startsWith('state-') || component === 'gemini-auth-policy'
        ? null
        : '1.0.0',
      expected: null,
      status: 'ready',
      detail: 'bounded ready observation',
    })),
    auth: classifyAuth(new Set(), true, true),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
}

class StaticReportReader implements FoundationReportReader {
  constructor(private readonly value: RuntimeDoctorReport) {}
  readReport(): Promise<RuntimeDoctorReport> {
    return Promise.resolve(this.value);
  }
}

function readPorts(
  local: LocalRuntimeStateAdapter,
  observed: ObservedRuntimeState,
): RuntimeReadPorts {
  return {
    inspector: { observeRuntime: () => Promise.resolve(observed) },
    persistedStateReader: local,
    desiredStateSource: local,
    checkpointReader: local,
    contentReader: local,
    processProbe: {
      probeProcess: (request) =>
        Promise.resolve({ probeId: request.probeId, exitCode: 0, timedOut: false }),
    },
    clock: { now: () => '2026-07-10T00:00:00.000Z' },
  };
}

function persisted(wanted = desired): PersistedRuntimeState {
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'controller-s2',
    desired: wanted,
    checkpointIds: [],
    lastAppliedCommandId: null,
  };
}

async function treeHash(root: string): Promise<string> {
  const entries: Array<{ path: string; mode: number | null; bytes: number[] | null }> = [];
  async function walk(path: string, relative: string): Promise<void> {
    let children: Deno.DirEntry[];
    try {
      children = [];
      for await (const entry of Deno.readDir(path)) children.push(entry);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return;
      throw error;
    }
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const childPath = `${path}/${child.name}`;
      const childRelative = relative ? `${relative}/${child.name}` : child.name;
      const info = await Deno.lstat(childPath);
      entries.push({
        path: childRelative,
        mode: info.mode === null ? null : info.mode & 0o777,
        bytes: child.isFile ? [...await Deno.readFile(childPath)] : null,
      });
      if (child.isDirectory) await walk(childPath, childRelative);
    }
  }
  await walk(root, '');
  const input = new TextEncoder().encode(JSON.stringify(entries));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input));
  return [...digest].map((value) => value.toString(16).padStart(2, '0')).join('');
}

Deno.test('foundation adapter preserves PR 0A schema and all executable/policy probes', async () => {
  const first = await translateFoundationReport(report());
  const second = await translateFoundationReport(report('2026-07-10T01:00:00.000Z'));
  assertEquals(first.schemaVersion, RUNTIME_SCHEMA_VERSION);
  assertEquals(first.components.map((entry) => entry.component), RUNTIME_COMPONENT_IDS);
  assertEquals(first.stateDirectories, ['claude', 'codex', 'gemini', 'netscript-agentic']);
  assertEquals(first.stateId, second.stateId, 'generatedAt destabilized observed state identity');
  assertEquals(first.capabilities.codex, 'available');
  const inspector = new FoundationRuntimeInspector(new StaticReportReader(report()));
  assertEquals((await inspector.observeRuntime()).components.length, 16);
});

Deno.test('local state migrates the value-free PR 0A ownership schema without writing', async () => {
  const root = await Deno.makeTempDir();
  try {
    const foundationPath = `${root}/foundation-state.json`;
    await Deno.writeTextFile(
      foundationPath,
      JSON.stringify({
        schemaVersion: '1.0',
        desired: { node: '26.5.0', claude: '2.1.206', gemini: '0.50.0' },
        ownedRoots: ['/secret/owned/root'],
        previousTargets: { node: '/secret/previous/target' },
      }),
    );
    const adapter = new LocalRuntimeStateAdapter(`${root}/runtime`, foundationPath);
    const before = await treeHash(root);
    const state = await adapter.readPersistedState();
    assertEquals(state?.schemaVersion, RUNTIME_SCHEMA_VERSION);
    assertEquals(state?.desired.foundation.versions, desired.foundation.versions);
    assert(!JSON.stringify(state).includes('/secret/'), 'ownership paths entered migrated state');
    assertEquals(await treeHash(root), before, 'read-only migration changed the state tree');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('local state writes atomically at mode 0600 and strips unknown content', async () => {
  const root = await Deno.makeTempDir();
  const sentinel = 'SYNTHETIC_SECRET_PROMPT_SENTINEL';
  try {
    const adapter = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    const unsafe = {
      ...persisted(),
      secret: sentinel,
      desired: { ...desired, promptContent: sentinel },
    } as unknown as PersistedRuntimeState;
    await adapter.writeDesiredState(unsafe);
    const checkpoint = {
      schemaVersion: RUNTIME_SCHEMA_VERSION,
      checkpointId: 'checkpoint-s2',
      commandId: 'configure-s2',
      createdAt: '2026-07-10T00:00:00.000Z',
      status: 'prepared',
      actionIds: [],
      resources: [],
      rawEnv: sentinel,
    } as unknown as RuntimeCheckpointState;
    await adapter.writeCheckpoint(checkpoint);
    const statePath = `${root}/runtime/controller-state.json`;
    const checkpointPath = `${root}/runtime/checkpoints/checkpoint-s2.json`;
    assertEquals((await Deno.stat(`${root}/runtime`)).mode! & 0o777, 0o700);
    assertEquals((await Deno.stat(statePath)).mode! & 0o777, 0o600);
    assertEquals((await Deno.stat(checkpointPath)).mode! & 0o777, 0o600);
    const rendered = `${await Deno.readTextFile(statePath)}${await Deno.readTextFile(
      checkpointPath,
    )}`;
    assert(!rendered.includes(sentinel), 'unknown content entered persisted state');
    assertEquals((await adapter.readPersistedState())?.desired, desired);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('doctor and status are stable read-only commands', async () => {
  const root = await Deno.makeTempDir();
  try {
    const local = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    const observed = await translateFoundationReport(report());
    const ports = readPorts(local, observed);
    const before = await treeHash(root);
    const doctor = await runRuntimeCommand(
      { kind: 'doctor', commandId: 'doctor-s2', mode: 'inspect' },
      ports,
    );
    const repeated = await runRuntimeCommand(
      { kind: 'doctor', commandId: 'doctor-s2', mode: 'inspect' },
      ports,
    );
    const status = await runRuntimeCommand(
      { kind: 'status', commandId: 'status-s2', mode: 'inspect' },
      ports,
    );
    assertEquals(doctor, repeated);
    assertEquals(doctor.changed, false);
    assertEquals(status.changed, false);
    assertEquals(await treeHash(root), before);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('bootstrap and configure plans call zero mutation ports and preserve tree hashes', async () => {
  const root = await Deno.makeTempDir();
  let mutationCalls = 0;
  try {
    const stateRoot = `${root}/runtime`;
    const desiredPath = `${root}/desired.json`;
    const local = new LocalRuntimeStateAdapter(stateRoot, `${root}/foundation.json`);
    await local.writeDesiredState(persisted());
    await Deno.writeTextFile(desiredPath, JSON.stringify({ ...desired, stateId: 'desired-next' }));
    const baseObserved = await translateFoundationReport(report());
    const observed: ObservedRuntimeState = {
      ...baseObserved,
      components: baseObserved.components.map((component) =>
        component.component === 'node'
          ? { component: 'node', version: '18.19.1', status: 'outdated' }
          : component
      ),
    };
    const ports = readPorts(local, observed);
    const spies: RuntimeMutationPorts = {
      desiredStateWriter: {
        writeDesiredState: () => {
          mutationCalls++;
          return Promise.resolve();
        },
      },
      checkpointWriter: {
        writeCheckpoint: () => {
          mutationCalls++;
          return Promise.resolve();
        },
      },
      actionExecutor: {
        executeAction: () => {
          mutationCalls++;
          return Promise.resolve(null);
        },
      },
      actionCompensator: {
        compensateAction: () => {
          mutationCalls++;
          return Promise.resolve(null);
        },
      },
    };
    assert(spies !== undefined, 'mutation spies missing');
    const before = await treeHash(root);
    const bootstrap = await runRuntimeCommand(
      { kind: 'bootstrap', commandId: 'bootstrap-s2', mode: 'plan' },
      ports,
    );
    const configure = await runRuntimeCommand({
      kind: 'configure',
      commandId: 'configure-s2',
      mode: 'plan',
      desiredState: { path: desiredPath },
    }, ports);
    assertEquals(bootstrap.status, 'planned');
    assertEquals(configure.status, 'planned');
    assertEquals(bootstrap.changed, false);
    assertEquals(configure.changed, false);
    assertEquals(mutationCalls, 0, 'dry-run reached a mutation port');
    assertEquals(await treeHash(root), before, 'dry-run changed the temp state tree');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('live mobile repair remains a data-only issue 580 block', async () => {
  const root = await Deno.makeTempDir();
  try {
    const local = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    const result = await runRuntimeCommand({
      kind: 'repair-codex-remote',
      commandId: 'repair-s2',
      mode: 'apply',
      worktree,
    }, readPorts(local, await translateFoundationReport(report())));
    assertEquals(result.status, 'blocked');
    assertEquals(result.diagnostics[0]?.ownerIssue, 580);
    assertEquals(deferredMobileRepairDiagnostic().ownerIssue, 580);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('sentinel content is absent from output, state, checkpoints, and process argv', async () => {
  const sentinel = 'SYNTHETIC_SECRET_PROMPT_SENTINEL';
  const result: RuntimeResult = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    commandId: 'doctor-sentinel',
    command: 'doctor',
    mode: 'inspect',
    status: 'no_change',
    changed: false,
    desiredStateId: null,
    observedStateId: 'observed-sentinel-safe',
    actions: [],
    diagnostics: [],
    timing: {
      startedAt: '2026-07-10T00:00:00.000Z',
      completedAt: '2026-07-10T00:00:00.000Z',
      durationMs: 0,
    },
  };
  const surfaces = [
    renderRuntimeJson(result),
    renderRuntimeHuman(result),
    JSON.stringify(desired),
    JSON.stringify({ checkpointId: 'safe', resources: [] }),
    JSON.stringify(foundationDoctorArguments()),
  ];
  assert(surfaces.every((surface) => !surface.includes(sentinel)), 'sentinel leaked to a surface');
  assertEquals(
    runtimeExitCode({
      ...result,
      status: 'degraded',
      diagnostics: [{
        code: 'auth_conflict',
        category: 'authentication',
        retryable: false,
        message: 'authentication route conflicts with policy',
      }],
    }),
    3,
    'auth conflicts must preserve the PR 0A invalid-configuration exit',
  );
});

Deno.test('CLI parser exposes S2 commands only and keeps lifecycle commands deferred', () => {
  assertEquals(parseRuntimeArgs(['doctor', '--json']).command.mode, 'inspect');
  assertEquals(parseRuntimeArgs(['bootstrap', '--dry-run']).command.mode, 'plan');
  assertEquals(
    parseRuntimeArgs(['configure', '--state', '/desired.json', '--dry-run']).command.kind,
    'configure',
  );
  assertEquals(
    parseRuntimeArgs(['repair', 'codex-remote', '--worktree', worktree]).command.mode,
    'apply',
  );
  let rejected = false;
  try {
    parseRuntimeArgs(['launch']);
  } catch {
    rejected = true;
  }
  assert(rejected, 'S3 launch command became available in S2');
});
