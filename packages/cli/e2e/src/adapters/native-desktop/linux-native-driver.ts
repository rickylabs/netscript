import { ensureDir, walk } from '@std/fs';
import { join, relative, resolve } from '@std/path';
import { createReleaseRequestHandler } from '../../../../src/public/features/deploy/target/desktop/release/server/release-handler.ts';
import { createReleaseSigningFixture } from '../../../fixtures/desktop-native/src/release-signing-fixture.ts';
import { prepareDesktopFixture } from './fixture-workspace.ts';
import { requireNativeCommand, runNativeCommand } from './command.ts';

const APP_NAME = 'netscript-desktop-e2e';
const TARGET = 'x86_64-unknown-linux-gnu';
const RELEASE_TARGET = 'linux-x86_64';

interface LinuxArtifact {
  readonly deb: string;
  readonly extracted: string;
  readonly runtime: string;
}

interface LaunchEvidence {
  readonly renderer: Readonly<Record<string, unknown>>;
  readonly update?: Readonly<Record<string, unknown>>;
  readonly output: { readonly stdout: string; readonly stderr: string };
}

function argument(name: string): string {
  const index = Deno.args.indexOf(name);
  const value = index < 0 ? undefined : Deno.args[index + 1];
  if (!value) throw new Error(`Missing required ${name}.`);
  return resolve(value);
}

async function packageVersion(
  repoRoot: string,
  smokeRoot: string,
  version: string,
): Promise<LinuxArtifact> {
  const fixture = await prepareDesktopFixture(
    repoRoot,
    join(smokeRoot, `fixture-${version}`),
    version,
  );
  const output = join(smokeRoot, 'packages', version);
  await ensureDir(output);
  await requireNativeCommand(Deno.execPath(), [
    'run',
    '-A',
    join(repoRoot, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
    'deploy',
    'desktop',
    'package',
    '--project-root',
    fixture.root,
    '--app',
    APP_NAME,
    '--target',
    TARGET,
    '--format',
    'deb',
    '--compression',
    'none',
    '--output-dir',
    output,
  ], { cwd: repoRoot, timeoutMs: 600_000 });
  const deb = join(output, `${APP_NAME}-${version}-linux-x86_64.deb`);
  await Deno.stat(deb);
  const extracted = join(smokeRoot, 'extracted', version);
  await ensureDir(extracted);
  await requireNativeCommand('dpkg-deb', ['--extract', deb, extracted]);
  const runtime = await findRuntime(extracted);
  return { deb, extracted, runtime };
}

async function findRuntime(root: string): Promise<string> {
  const candidates: string[] = [];
  for await (const entry of walk(root, { includeDirs: false, followSymlinks: false })) {
    if (entry.name.endsWith('.so') || entry.name.includes('denort')) candidates.push(entry.path);
  }
  if (candidates.length !== 1) {
    throw new Error(
      `Expected one native runtime in ${root}, found ${candidates.join(', ') || 'none'}.`,
    );
  }
  return candidates[0];
}

async function sha256(path: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', await Deno.readFile(path)));
  return digest.toHex();
}

async function installPackage(
  smokeRoot: string,
  artifact: LinuxArtifact,
): Promise<{ readonly root: string; readonly launcher: string; readonly runtime: string }> {
  const root = join(smokeRoot, 'install-root');
  const admin = join(root, 'var', 'lib', 'dpkg');
  await ensureDir(admin);
  await Deno.writeTextFile(join(admin, 'status'), '');
  await requireNativeCommand('dpkg', [
    `--root=${root}`,
    '--force-not-root',
    '--force-depends',
    '--install',
    artifact.deb,
  ]);
  const runtime = join(root, relative(artifact.extracted, artifact.runtime));
  const launcher = runtime.slice(0, -'.so'.length);
  await Promise.all([Deno.stat(runtime), Deno.stat(launcher)]);
  return { root, launcher, runtime };
}

async function generateTlsFixture(
  root: string,
): Promise<{ readonly ca: string; readonly cert: string; readonly key: string }> {
  const ca = join(root, 'release-ca.pem');
  const caKey = join(root, 'release-ca-key.pem');
  const cert = join(root, 'release-server.pem');
  const key = join(root, 'release-server-key.pem');
  const request = join(root, 'release-server.csr');
  const extensions = join(root, 'release-server.ext');
  await requireNativeCommand('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-days',
    '1',
    '-subj',
    '/CN=NetScript Desktop E2E CA',
    '-addext',
    'basicConstraints=critical,CA:TRUE',
    '-keyout',
    caKey,
    '-out',
    ca,
  ]);
  await requireNativeCommand('openssl', [
    'req',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-subj',
    '/CN=localhost',
    '-keyout',
    key,
    '-out',
    request,
  ]);
  await Deno.writeTextFile(
    extensions,
    'subjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=critical,CA:FALSE\n',
  );
  await requireNativeCommand('openssl', [
    'x509',
    '-req',
    '-days',
    '1',
    '-in',
    request,
    '-CA',
    ca,
    '-CAkey',
    caKey,
    '-CAcreateserial',
    '-extfile',
    extensions,
    '-out',
    cert,
  ]);
  return { ca, cert, key };
}

async function prepareRelease(
  repoRoot: string,
  projectRoot: string,
  releaseRoot: string,
  privateKey: string,
  version: string,
  sequence: number,
  currentRuntime: string,
  fromVersion: string,
  fromRuntime: string,
): Promise<void> {
  await requireNativeCommand(Deno.execPath(), [
    'run',
    '-A',
    join(repoRoot, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
    'deploy',
    'desktop',
    'release',
    'prepare',
    '--project-root',
    projectRoot,
    '--target',
    RELEASE_TARGET,
    '--version',
    version,
    '--sequence',
    String(sequence),
    '--current-runtime',
    currentRuntime,
    '--from',
    `${fromVersion}=${fromRuntime}`,
    '--private-key-file',
    privateKey,
    '--release-dir',
    releaseRoot,
  ], { cwd: repoRoot, timeoutMs: 180_000 });
}

async function readJson(path: string): Promise<Readonly<Record<string, unknown>>> {
  const value: unknown = JSON.parse(await Deno.readTextFile(path));
  if (value === null || typeof value !== 'object') {
    throw new Error(`Invalid JSON evidence at ${path}.`);
  }
  return value as Readonly<Record<string, unknown>>;
}

async function launchDesktop(
  launcher: string,
  runtime: string,
  smokeRoot: string,
  sequence: string,
  expectedEvent: 'none' | 'ready' | 'rollback',
  environment: Readonly<Record<string, string>>,
): Promise<
  {
    readonly result: Awaited<ReturnType<typeof runNativeCommand>>;
    readonly evidence?: LaunchEvidence;
  }
> {
  const rendererPath = join(smokeRoot, `renderer-${sequence}.json`);
  const updatePath = join(smokeRoot, `update-${sequence}.json`);
  await Promise.all([
    Deno.remove(rendererPath).catch(() => undefined),
    Deno.remove(updatePath).catch(() => undefined),
  ]);
  // The suite installs into an alternate dpkg root so it can exercise a real
  // package transaction without mutating the host package database. Tell the
  // launcher where that relocated runtime lives explicitly.
  const result = await runNativeCommand(launcher, ['--runtime', runtime], {
    env: {
      ...environment,
      NETSCRIPT_DESKTOP_E2E_EVIDENCE: rendererPath,
      NETSCRIPT_DESKTOP_E2E_UPDATE_EVIDENCE: updatePath,
      NETSCRIPT_DESKTOP_E2E_EXPECT_EVENT: expectedEvent,
    },
    timeoutMs: 90_000,
  });
  if (result.code !== 0) return { result };
  const renderer = await readJson(rendererPath);
  const update = expectedEvent === 'none' ? undefined : await readJson(updatePath);
  return { result, evidence: { renderer, update, output: result } };
}

async function main(): Promise<void> {
  const repoRoot = argument('--repo-root');
  const smokeRoot = join(repoRoot, '.llm', 'tmp', 'desktop-native-e2e');
  await Deno.remove(smokeRoot, { recursive: true }).catch((error) => {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  });
  await ensureDir(smokeRoot);
  const version1 = await packageVersion(repoRoot, smokeRoot, '1.0.0');
  const version2 = await packageVersion(repoRoot, smokeRoot, '2.0.0');
  const installed = await installPackage(smokeRoot, version1);
  const signing = await createReleaseSigningFixture();
  const privateKey = join(smokeRoot, 'release-private-key.pem');
  await Deno.writeTextFile(privateKey, signing.privateKeyPem, { mode: 0o600 });
  const tls = await generateTlsFixture(smokeRoot);
  const releaseRoot = join(smokeRoot, 'releases');

  await prepareRelease(
    repoRoot,
    smokeRoot,
    releaseRoot,
    privateKey,
    '2.0.0',
    1,
    version2.runtime,
    '1.0.0',
    installed.runtime,
  );

  const remoteServer = Deno.serve(
    { hostname: '127.0.0.1', port: 0 },
    () => Response.json({ value: 'remote-service-reached' }),
  );
  const releaseHandler = createReleaseRequestHandler(releaseRoot);
  const releaseServer = Deno.serve({
    hostname: '127.0.0.1',
    port: 0,
    cert: await Deno.readTextFile(tls.cert),
    key: await Deno.readTextFile(tls.key),
  }, releaseHandler);
  const releaseBaseUrl = `https://localhost:${releaseServer.addr.port}`;
  const environment = {
    services__remote__http__0: `http://127.0.0.1:${remoteServer.addr.port}`,
    NETSCRIPT_DESKTOP_E2E_RELEASE_URL: releaseBaseUrl,
    NETSCRIPT_DESKTOP_E2E_PUBLIC_KEY: signing.publicKeyBase64,
    NETSCRIPT_DESKTOP_E2E_MANUAL_URL: `${releaseBaseUrl}/manual`,
    DENO_CERT: tls.ca,
  };

  try {
    const stageV2 = await launchDesktop(
      installed.launcher,
      installed.runtime,
      smokeRoot,
      'stage-v2',
      'ready',
      environment,
    );
    if (stageV2.result.code !== 0 || stageV2.evidence === undefined) {
      throw new Error(`v1 failed to stage v2: ${stageV2.result.stderr || stageV2.result.stdout}`);
    }
    const confirmV2 = await launchDesktop(
      installed.launcher,
      installed.runtime,
      smokeRoot,
      'confirm-v2',
      'none',
      environment,
    );
    if (confirmV2.result.code !== 0 || confirmV2.evidence === undefined) {
      throw new Error(
        `v2 confirmation launch failed: ${confirmV2.result.stderr || confirmV2.result.stdout}`,
      );
    }
    const installedV2Hash = await sha256(installed.runtime);
    const packagedV2Hash = await sha256(version2.runtime);
    if (installedV2Hash !== packagedV2Hash) {
      throw new Error(`Applied v2 runtime hash ${installedV2Hash} differs from ${packagedV2Hash}.`);
    }

    const badRuntime = join(smokeRoot, 'bad-v3-runtime');
    await Deno.copyFile('/bin/false', badRuntime);
    await prepareRelease(
      repoRoot,
      smokeRoot,
      releaseRoot,
      privateKey,
      '3.0.0',
      2,
      badRuntime,
      '2.0.0',
      installed.runtime,
    );
    const stageV3 = await launchDesktop(
      installed.launcher,
      installed.runtime,
      smokeRoot,
      'stage-v3',
      'ready',
      environment,
    );
    if (stageV3.result.code !== 0 || stageV3.evidence === undefined) {
      throw new Error(
        `v2 failed to stage bad v3: ${stageV3.result.stderr || stageV3.result.stdout}`,
      );
    }
    const failedLaunch = await launchDesktop(
      installed.launcher,
      installed.runtime,
      smokeRoot,
      'bad-v3',
      'none',
      environment,
    );
    if (failedLaunch.result.code === 0 || failedLaunch.evidence !== undefined) {
      throw new Error('Bad v3 launch unexpectedly succeeded or emitted renderer evidence.');
    }
    const rollback = await launchDesktop(
      installed.launcher,
      installed.runtime,
      smokeRoot,
      'rollback-v2',
      'rollback',
      environment,
    );
    if (rollback.result.code !== 0 || rollback.evidence === undefined) {
      throw new Error(
        `Rollback launch failed: ${rollback.result.stderr || rollback.result.stdout}`,
      );
    }
    const rolledBackHash = await sha256(installed.runtime);
    if (rolledBackHash !== packagedV2Hash) {
      throw new Error('Rollback did not restore the v2 runtime.');
    }

    const report = {
      status: 'PASS',
      platform: 'linux',
      installMode: 'isolated-root-dpkg',
      package: version1.deb,
      installedLauncher: installed.launcher,
      releaseBaseUrl,
      stages: {
        stageV2: stageV2.evidence,
        confirmV2: confirmV2.evidence,
        stageV3: stageV3.evidence,
        failedLaunch: {
          code: failedLaunch.result.code,
          stdout: failedLaunch.result.stdout,
          stderr: failedLaunch.result.stderr,
        },
        rollback: rollback.evidence,
      },
      hashes: { installedV2Hash, packagedV2Hash, rolledBackHash },
      unsupported: {
        windows: { status: 'NOT_RUN', reason: 'Owner-hosted Windows MSI leg is S4.' },
        darwin: { status: 'NOT_RUN', reason: 'No macOS host; best-effort leg is S4.' },
      },
    } as const;
    await Deno.writeTextFile(
      join(smokeRoot, 'evidence.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify(report));
  } catch (error) {
    const report = {
      status: 'FAIL',
      platform: 'linux',
      installMode: 'isolated-root-dpkg',
      package: version1.deb,
      installedLauncher: installed.launcher,
      releaseBaseUrl,
      failure: error instanceof Error ? error.message : String(error),
      unsupported: {
        windows: {
          status: 'NOT_RUN',
          reason: 'Owner-hosted Windows MSI invocation was not run on this Linux host.',
        },
        darwin: {
          status: 'NOT_RUN',
          reason: 'The macOS best-effort invocation was not run on this Linux host.',
        },
      },
    } as const;
    await Deno.writeTextFile(
      join(smokeRoot, 'evidence.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.error(JSON.stringify(report));
    throw error;
  } finally {
    await Promise.all([remoteServer.shutdown(), releaseServer.shutdown()]);
  }
}

if (import.meta.main) await main();
