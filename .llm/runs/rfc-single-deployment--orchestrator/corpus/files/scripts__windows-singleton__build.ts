import { dirname, fromFileUrl, isAbsolute, join, relative, resolve } from '@std/path';
import {
  windowsSingletonServiceEnvironment,
  windowsSingletonTelemetryEnvironment,
} from '../../apps/dashboard/lib/windows-singleton.ts';

const repoRoot = resolve(dirname(fromFileUrl(import.meta.url)), '..', '..');
const windowsOutputRoot = join(repoRoot, 'dist', 'windows');
const buildTimestamp = Temporal.Now.instant()
  .toString({ smallestUnit: 'second' })
  .replaceAll('-', '')
  .replaceAll(':', '');
const outputDir = resolve(
  Deno.env.get('EISCHAT_WINDOWS_SINGLETON_OUTPUT_DIR') ??
    join(windowsOutputRoot, `eis-chat-singleton-${buildTimestamp}`),
);
const relativeOutputDir = relative(windowsOutputRoot, outputDir);
if (
  !relativeOutputDir || isAbsolute(relativeOutputDir) || relativeOutputDir.startsWith('..')
) {
  throw new Error('Windows singleton output must be a child of dist/windows.');
}
const desktopOutput = join(outputDir, 'eis-chat');
const dashboardDir = join(repoRoot, 'apps', 'dashboard');
const aspireCliVersion = '13.4.6';
const aspireToolStaging = join(windowsOutputRoot, `.aspire-cli-${buildTimestamp}`);
const aspireOutput = join(desktopOutput, 'tools', 'aspire');
const sidecars = [
  ['eischat-service.exe', join(repoRoot, 'services', 'eischat', 'src', 'main.ts')],
  ['streams-service.exe', 'jsr:@netscript/plugin-streams@0.0.1-beta.9/services'],
  [
    'workers-api-service.exe',
    join(repoRoot, 'scripts', 'windows-singleton', 'entries', 'workers-api.ts'),
  ],
  ['workers-service.exe', join(repoRoot, 'scripts', 'windows-singleton', 'entries', 'workers.ts')],
  ['legacy-archeo-mcp-service.exe', join(repoRoot, 'tools', 'legacy-archeo-mcp.ts')],
  ['excalidraw-mcp-service.exe', join(repoRoot, 'tools', 'excalidraw-mcp.ts')],
] as const;

async function run(
  command: string,
  args: readonly string[],
  cwd = repoRoot,
  env?: Readonly<Record<string, string>>,
): Promise<void> {
  console.log(`> ${command} ${args.join(' ')}`);
  const child = new Deno.Command(command, {
    args: [...args],
    cwd,
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
    env: env ? { ...env } : undefined,
  }).spawn();
  const result = await child.status;
  if (!result.success) throw new Error(`${command} exited with code ${result.code}.`);
}

await Deno.remove(outputDir, { recursive: true }).catch((error) => {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
});

// Browser-side typed clients cannot read the runtime `services__...` variables.
// Vite must replace their `import.meta.env.VITE_services__...` lookups while it
// builds the Fresh client. Inject the whole singleton graph from the same source
// used by the runtime supervisor so packaged and Aspire-style discovery agree.
const viteEnvironment = windowsSingletonServiceEnvironment({ includeVite: true });
const telemetryBuildEnvironment = windowsSingletonTelemetryEnvironment({
  serviceName: 'eis-chat-build',
});
await run(
  'deno',
  ['task', 'build'],
  dashboardDir,
  viteEnvironment,
);
// Deno Desktop recognizes Fresh applications and performs another production
// build before bundling them. Preserve the discovery environment for that
// second build too, otherwise it silently replaces the correctly built client.
await run(
  'deno',
  [
    'desktop',
    '--backend',
    'cef',
    '--no-check',
    '--allow-all',
    '-o',
    desktopOutput,
    '.',
  ],
  dashboardDir,
  { ...viteEnvironment, ...telemetryBuildEnvironment },
);
for (const [fileName, entrypoint] of sidecars) {
  await run(
    'deno',
    [
      'compile',
      '--node-modules-dir=none',
      '--allow-all',
      '--no-check',
      '--exclude-unused-npm',
      '--output',
      join(desktopOutput, fileName),
      entrypoint,
    ],
    repoRoot,
    telemetryBuildEnvironment,
  );
}

await run('dotnet', [
  'tool',
  'install',
  'garnet-server',
  '--version',
  '1.1.10',
  '--tool-path',
  join(desktopOutput, 'tools', 'garnet'),
]);

// Aspire 13.4 ships its CLI as a self-contained NativeAOT .NET tool. The
// standalone dashboard command is the documented zero-container hosting path,
// so stage only its portable executable (not the NuGet tool cache/shim) beside
// the singleton. End-user machines do not need Aspire, .NET, or Docker.
await Deno.remove(aspireToolStaging, { recursive: true }).catch((error) => {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
});
try {
  await run('dotnet', [
    'tool',
    'install',
    'Aspire.Cli',
    '--version',
    aspireCliVersion,
    '--tool-path',
    aspireToolStaging,
  ]);
  const aspirePackageRoot = join(
    aspireToolStaging,
    '.store',
    'aspire.cli',
    aspireCliVersion,
    'aspire.cli.win-x64',
    aspireCliVersion,
  );
  await Deno.mkdir(aspireOutput, { recursive: true });
  await Deno.copyFile(
    join(aspirePackageRoot, 'tools', 'net10.0', 'win-x64', 'aspire.exe'),
    join(aspireOutput, 'aspire.exe'),
  );
  await Deno.copyFile(
    join(aspirePackageRoot, 'THIRD-PARTY-NOTICES.TXT'),
    join(aspireOutput, 'THIRD-PARTY-NOTICES.TXT'),
  );
  await Deno.copyFile(
    join(repoRoot, 'scripts', 'windows-singleton', 'assets', 'ASPIRE-LICENSE.TXT'),
    join(aspireOutput, 'LICENSE.TXT'),
  );
  await Deno.copyFile(
    join(repoRoot, 'scripts', 'windows-singleton', 'assets', 'aspire-dashboard.json'),
    join(aspireOutput, 'aspire-dashboard.json'),
  );
} finally {
  await Deno.remove(aspireToolStaging, { recursive: true }).catch((error) => {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  });
}

const launcherPath = join(outputDir, 'eis-chat-singleton.cmd');
const observedLauncherPath = join(outputDir, 'eis-chat-singleton-observed.cmd');
const observedEnvironment = {
  EISCHAT_WINDOWS_SINGLETON: '1',
  EISCHAT_ASPIRE_DASHBOARD: '1',
  ...windowsSingletonTelemetryEnvironment({ serviceName: 'eis-chat-desktop' }),
};
const observedEnvironmentScript = Object.entries(observedEnvironment)
  .map(([name, value]) => `set "${name}=${value}"\r\n`)
  .join('');
await Deno.writeTextFile(
  launcherPath,
  '@echo off\r\nset EISCHAT_WINDOWS_SINGLETON=1\r\n"%~dp0eis-chat\\eis-chat.exe" %*\r\n',
);
await Deno.writeTextFile(
  observedLauncherPath,
  '@echo off\r\n' +
    observedEnvironmentScript +
    '"%~dp0eis-chat\\eis-chat.exe" %*\r\n',
);

console.log(`\nwindows-singleton staged at ${outputDir}`);
console.log(`Launch with: ${launcherPath}`);
