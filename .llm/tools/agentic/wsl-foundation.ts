import {
  type BootstrapPlan,
  buildDoctorReport,
  buildRollbackPlan,
  classifyAuth,
  classifyComponent,
  classifyGeminiAuthPolicy,
  classifyMobileControl,
  classifyStateDirectory,
  EXIT_CODES,
  FORBIDDEN_GEMINI_AUTH_KEYS,
  NODE_VERSION,
  planBootstrap,
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
  return `Usage:
  deno task agentic:wsl-foundation doctor [--json]
  deno task agentic:wsl-foundation bootstrap [--dry-run] [--json]
  deno task agentic:wsl-foundation rollback-plan [--json]`;
}

const OWNED_ROOT = '.local/share/netscript-agentic';
const NPM_PREFIX = `${OWNED_ROOT}/npm`;

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

interface ExternalResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function runExternal(
  command: string,
  args: string[],
  env: Record<string, string> = {},
): Promise<ExternalResult> {
  try {
    const output = await new Deno.Command(command, {
      args,
      stdout: 'piped',
      stderr: 'piped',
      env,
    }).output();
    const decoder = new TextDecoder();
    return {
      code: output.code,
      stdout: decoder.decode(output.stdout).slice(0, 4096),
      stderr: decoder.decode(output.stderr).slice(0, 4096),
    };
  } catch (error) {
    return {
      code: error instanceof Deno.errors.NotFound ? 127 : 1,
      stdout: '',
      stderr: String(error).slice(0, 512),
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
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

async function readJsonObject(path: string): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = JSON.parse(await Deno.readTextFile(path));
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    return null;
  }
}

async function readGeminiAuthPolicy(home: string): Promise<{
  exists: boolean;
  selectedType: string | null;
  enforcedType: string | null;
}> {
  const path = `${home}/.gemini/settings.json`;
  const fileExists = await pathExists(path);
  const settings = fileExists ? await readJsonObject(path) : null;
  const security = settings?.security && typeof settings.security === 'object'
    ? settings.security as Record<string, unknown>
    : null;
  const auth = security?.auth && typeof security.auth === 'object'
    ? security.auth as Record<string, unknown>
    : null;
  return {
    exists: fileExists,
    selectedType: typeof auth?.selectedType === 'string' ? auth.selectedType : null,
    enforcedType: typeof auth?.enforcedType === 'string' ? auth.enforcedType : null,
  };
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
  const geminiPolicy = await readGeminiAuthPolicy(home);
  components.push(
    classifyGeminiAuthPolicy(
      geminiPolicy.exists,
      geminiPolicy.selectedType,
      geminiPolicy.enforcedType,
    ),
  );

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

async function resolveStableCliVersions(): Promise<{ claude: string; gemini: string }> {
  const resolve = async (packageName: string): Promise<string> => {
    const result = await runExternal('npm', ['view', packageName, 'dist-tags.latest', '--json']);
    if (result.code !== 0) {
      throw new Error(`unable to resolve stable ${packageName} version (exit ${result.code})`);
    }
    const value: unknown = JSON.parse(result.stdout);
    if (typeof value !== 'string' || !/^\d+\.\d+\.\d+/.test(value)) {
      throw new Error(`npm returned an invalid stable version for ${packageName}`);
    }
    return value;
  };
  const [claude, gemini] = await Promise.all([
    resolve('@anthropic-ai/claude-code'),
    resolve('@google/gemini-cli'),
  ]);
  return { claude, gemini };
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function installNode(home: string): Promise<void> {
  const archiveName = `node-v${NODE_VERSION}-linux-x64.tar.xz`;
  const baseUrl = `https://nodejs.org/dist/v${NODE_VERSION}`;
  const [checksumsResponse, archiveResponse] = await Promise.all([
    fetch(`${baseUrl}/SHASUMS256.txt`),
    fetch(`${baseUrl}/${archiveName}`),
  ]);
  if (!checksumsResponse.ok || !archiveResponse.ok) {
    throw new Error(
      `official Node download failed (${checksumsResponse.status}/${archiveResponse.status})`,
    );
  }
  const checksumLine = (await checksumsResponse.text()).split('\n').find((line) =>
    line.endsWith(`  ${archiveName}`)
  );
  if (!checksumLine) throw new Error(`official checksum missing for ${archiveName}`);
  const expectedChecksum = checksumLine.split(/\s+/)[0];
  const archive = await archiveResponse.arrayBuffer();
  const actualChecksum = toHex(await crypto.subtle.digest('SHA-256', archive));
  if (actualChecksum !== expectedChecksum) throw new Error(`checksum mismatch for ${archiveName}`);

  const root = `${home}/${OWNED_ROOT}`;
  const target = `${root}/node-v${NODE_VERSION}-linux-x64`;
  const existing = await runExternal(`${target}/bin/node`, ['--version']);
  if (existing.code === 0 && existing.stdout.trim() === `v${NODE_VERSION}`) return;

  await Deno.mkdir(root, { recursive: true });
  const nonce = crypto.randomUUID();
  const archivePath = `${root}/.${archiveName}.${nonce}`;
  const staging = `${root}/.node-v${NODE_VERSION}.${nonce}`;
  await Deno.writeFile(archivePath, new Uint8Array(archive), { createNew: true });
  await Deno.mkdir(staging);
  try {
    const extracted = await runExternal('tar', [
      '-xJf',
      archivePath,
      '-C',
      staging,
      '--strip-components=1',
    ]);
    if (extracted.code !== 0) throw new Error(`Node extraction failed (exit ${extracted.code})`);
    try {
      await Deno.remove(target, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    await Deno.rename(staging, target);
  } finally {
    try {
      await Deno.remove(archivePath);
    } catch {
    }
    try {
      await Deno.remove(staging, { recursive: true });
    } catch {
    }
  }
}

async function readSymlink(path: string): Promise<string | null> {
  try {
    const info = await Deno.lstat(path);
    if (!info.isSymlink) throw new Error(`refusing to replace non-symlink ${path}`);
    return await Deno.readLink(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw error;
  }
}

async function ensureSymlink(target: string, link: string): Promise<string | null> {
  const previous = await readSymlink(link);
  if (previous === target) return previous;
  await Deno.mkdir(link.slice(0, link.lastIndexOf('/')), { recursive: true });
  const temporary = `${link}.netscript-${crypto.randomUUID()}`;
  await Deno.symlink(target, temporary);
  try {
    await Deno.rename(temporary, link);
  } catch (error) {
    try {
      await Deno.remove(temporary);
    } catch {
    }
    throw error;
  }
  return previous;
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await Deno.mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  const temporary = `${path}.netscript-${crypto.randomUUID()}`;
  await Deno.writeTextFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    createNew: true,
    mode: 0o600,
  });
  await Deno.rename(temporary, path);
}

async function executeBootstrap(home: string, plan: BootstrapPlan): Promise<void> {
  const nodeRoot = `${home}/${OWNED_ROOT}/node-v${NODE_VERSION}-linux-x64`;
  const npmPrefix = `${home}/${NPM_PREFIX}`;
  const binRoot = `${home}/.local/bin`;
  const previousTargets: Record<string, string | null> = {};
  const createdFiles: string[] = [];
  for (const action of plan.actions) {
    if (action.kind === 'create_directory') {
      await Deno.mkdir(`${home}/${action.relativePath}`, { recursive: true, mode: 0o700 });
    } else if (action.kind === 'install_node') {
      await installNode(home);
    } else if (action.kind === 'install_npm_clis') {
      await Deno.mkdir(npmPrefix, { recursive: true });
      const result = await runExternal(`${nodeRoot}/bin/npm`, [
        'install',
        '--global',
        '--prefix',
        npmPrefix,
        ...action.packages,
      ], {
        PATH: `${nodeRoot}/bin:${home}/.local/bin:${Deno.env.get('PATH') ?? ''}`,
      });
      if (result.code !== 0) {
        throw new Error(
          `native WSL CLI install failed (exit ${result.code}): ${result.stderr.slice(0, 240)}`,
        );
      }
    } else if (action.kind === 'configure_gemini_auth') {
      const settingsPath = `${home}/.gemini/settings.json`;
      if (await pathExists(settingsPath)) {
        throw new Error(
          'refusing to replace existing Gemini settings; doctor reports the conflict',
        );
      }
      await writeJsonAtomic(settingsPath, {
        security: {
          auth: {
            selectedType: action.selectedType,
            enforcedType: action.selectedType,
          },
        },
      });
      createdFiles.push(settingsPath);
    } else if (action.kind === 'ensure_symlinks') {
      const targets: Record<string, string> = {
        node: `${nodeRoot}/bin/node`,
        npm: `${nodeRoot}/bin/npm`,
        npx: `${nodeRoot}/bin/npx`,
        claude: `${npmPrefix}/bin/claude`,
        gemini: `${npmPrefix}/bin/gemini`,
      };
      for (const name of action.names) {
        if (!(await pathExists(targets[name]))) {
          throw new Error(`expected installed executable missing: ${name}`);
        }
        previousTargets[name] = await ensureSymlink(targets[name], `${binRoot}/${name}`);
      }
    } else if (action.kind === 'write_state') {
      const statePath = `${home}/${action.relativePath}`;
      const existing = await readJsonObject(statePath);
      const existingTargets =
        existing?.previousTargets && typeof existing.previousTargets === 'object'
          ? existing.previousTargets as Record<string, string | null>
          : {};
      const existingCreated = Array.isArray(existing?.createdFiles)
        ? existing.createdFiles.filter((value): value is string => typeof value === 'string')
        : [];
      await writeJsonAtomic(statePath, {
        schemaVersion: plan.schemaVersion,
        installedAt: new Date().toISOString(),
        desired: plan.desired,
        ownedRoots: [`${home}/${OWNED_ROOT}`, `${home}/${NPM_PREFIX}`],
        ownedLinks: ['node', 'npm', 'npx', 'claude', 'gemini'].map((name) => `${binRoot}/${name}`),
        previousTargets: { ...existingTargets, ...previousTargets },
        createdFiles: [...new Set([...existingCreated, ...createdFiles])],
      });
    }
  }
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
  const allowed = command === 'doctor'
    ? flags.every((flag) => flag === '--json')
    : command === 'bootstrap'
    ? flags.every((flag) => flag === '--json' || flag === '--dry-run')
    : command === 'rollback-plan'
    ? flags.every((flag) => flag === '--json')
    : false;
  if (!allowed) {
    console.error(usage());
    Deno.exit(EXIT_CODES.executionFailure);
  }
  try {
    if (command === 'rollback-plan') {
      const rollback = buildRollbackPlan();
      if (flags.includes('--json')) console.log(JSON.stringify(rollback, null, 2));
      else {
        console.log('WSL foundation rollback plan (non-destructive output only)');
        for (const [index, step] of rollback.steps.entries()) console.log(`${index + 1}. ${step}`);
      }
      Deno.exit(EXIT_CODES.ready);
    }

    let report = await doctor();
    if (command === 'bootstrap') {
      if (report.overall === 'invalid_configuration') {
        if (flags.includes('--json')) console.log(JSON.stringify({ report, plan: null }, null, 2));
        else printHuman(report);
        Deno.exit(EXIT_CODES.invalidConfiguration);
      }
      const desired = await resolveStableCliVersions();
      const plan = planBootstrap(report, desired);
      if (!flags.includes('--dry-run') && plan.changed) {
        await executeBootstrap(Deno.env.get('HOME') ?? '', plan);
        report = await doctor();
      }
      const result = { dryRun: flags.includes('--dry-run'), plan, report };
      if (flags.includes('--json')) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(
          `${result.dryRun ? 'Bootstrap dry-run' : 'Bootstrap'}: ${plan.actions.length} action(s)`,
        );
        printHuman(report);
      }
    } else if (flags.includes('--json')) console.log(JSON.stringify(report, null, 2));
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
