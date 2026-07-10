/** Read-only doctor and reversible bootstrap entry point for the native WSL foundation. */

import {
  buildDoctorReport,
  classifyAuth,
  classifyComponent,
  classifyMobileControl,
  classifyStateDirectory,
  EXIT_CODES,
  FORBIDDEN_GEMINI_AUTH_KEYS,
  type RawComponentProbe,
  type RuntimeComponentId,
  type RuntimeDoctorReport,
} from './wsl-foundation-lib.ts';

interface CommandSpec {
  component: RuntimeComponentId;
  command: string;
  args: string[];
  expected?: string;
}

const COMMAND_SPECS: CommandSpec[] = [
  { component: 'node', command: 'node', args: ['--version'], expected: '26.5.0' },
  { component: 'npm', command: 'npm', args: ['--version'] },
  { component: 'deno', command: 'deno', args: ['--version'] },
  { component: 'git', command: 'git', args: ['--version'] },
  { component: 'codex', command: 'codex', args: ['--version'] },
  { component: 'codex-app-server', command: 'codex', args: ['app-server', 'daemon', 'version'] },
  { component: 'claude', command: 'claude', args: ['--version'] },
  { component: 'gemini', command: 'gemini', args: ['--version'] },
  { component: 'dotnet', command: 'dotnet', args: ['--version'] },
  { component: 'aspire', command: 'aspire', args: ['--version'] },
  { component: 'docker', command: 'docker', args: ['--version'] },
];

function usage(): string {
  return 'Usage: deno task agentic:wsl-foundation doctor [--json]';
}

async function run(spec: CommandSpec): Promise<RawComponentProbe> {
  try {
    const output = await new Deno.Command(spec.command, {
      args: spec.args,
      stdout: 'piped',
      stderr: 'piped',
      env: { PATH: `${Deno.env.get('HOME') ?? ''}/.local/bin:${Deno.env.get('PATH') ?? ''}` },
    }).output();
    return {
      component: spec.component,
      output: new TextDecoder().decode(output.stdout).slice(0, 512),
      exitCode: output.code,
      expected: spec.expected,
    };
  } catch (error) {
    const missing = error instanceof Deno.errors.NotFound;
    return {
      component: spec.component,
      output: '',
      exitCode: missing ? 127 : 1,
      expected: spec.expected,
    };
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function hasSessionMetadata(providerDir: string): Promise<boolean> {
  if (!(await exists(providerDir))) return false;
  for await (const entry of Deno.readDir(providerDir)) {
    if (entry.isFile && /auth|credential|oauth|session/i.test(entry.name)) return true;
  }
  return false;
}

async function doctor(): Promise<RuntimeDoctorReport> {
  const home = Deno.env.get('HOME') ?? '';
  const raw = await Promise.all(COMMAND_SPECS.map(run));
  const components = raw.map(classifyComponent);
  const statePaths = [
    ['state-claude', '.claude'],
    ['state-codex', '.codex'],
    ['state-gemini', '.gemini'],
    ['state-netscript-agentic', '.config/netscript-agentic'],
  ] as const;
  for (const [component, relativePath] of statePaths) {
    components.push(
      classifyStateDirectory(component, relativePath, await exists(`${home}/${relativePath}`)),
    );
  }

  const inspectedKeys = ['ANTHROPIC_API_KEY', ...FORBIDDEN_GEMINI_AUTH_KEYS];
  const presentKeys = new Set(inspectedKeys.filter((key) => Deno.env.get(key) !== undefined));
  const auth = classifyAuth(
    presentKeys,
    await hasSessionMetadata(`${home}/.claude`),
    await hasSessionMetadata(`${home}/.gemini`),
  );
  const cliVersion = components.find((probe) => probe.component === 'codex')?.detectedVersion ??
    null;
  const appServerVersion =
    components.find((probe) => probe.component === 'codex-app-server')?.detectedVersion ?? null;
  const managed = raw.find((probe) => probe.component === 'codex-app-server')?.exitCode === 0;
  const cwd = Deno.cwd();
  return buildDoctorReport({
    generatedAt: new Date().toISOString(),
    nativePath: { cwd, nativeExt4: cwd.startsWith('/home/') && !cwd.startsWith('/mnt/') },
    components,
    auth,
    mobileControl: classifyMobileControl(managed, cliVersion, appServerVersion),
  });
}

function printHuman(report: RuntimeDoctorReport): void {
  console.log(`WSL foundation: ${report.overall} (schema ${report.schemaVersion})`);
  console.log(
    `native ext4: ${report.nativePath.nativeExt4 ? 'yes' : 'no'} (${report.nativePath.cwd})`,
  );
  for (const probe of report.components) {
    const version = probe.detectedVersion ? ` ${probe.detectedVersion}` : '';
    console.log(
      `${probe.status.toUpperCase().padEnd(18)} ${probe.component}${version} — ${probe.detail}`,
    );
  }
  for (const probe of report.auth) {
    console.log(
      `${probe.status.toUpperCase().padEnd(18)} ${probe.provider} auth — ${probe.detail}`,
    );
  }
  console.log(
    `${
      report.mobileControl.status.toUpperCase().padEnd(18)
    } codex mobile — ${report.mobileControl.detail}`,
  );
}

async function main(): Promise<void> {
  const [command, ...flags] = Deno.args;
  if (command !== 'doctor' || flags.some((flag) => flag !== '--json')) {
    console.error(usage());
    Deno.exit(EXIT_CODES.executionFailure);
  }
  try {
    const report = await doctor();
    if (flags.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else printHuman(report);
    Deno.exit(
      report.overall === 'ready'
        ? EXIT_CODES.ready
        : report.overall === 'invalid_configuration'
        ? EXIT_CODES.invalidConfiguration
        : EXIT_CODES.degraded,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(EXIT_CODES.executionFailure);
  }
}

if (import.meta.main) await main();
