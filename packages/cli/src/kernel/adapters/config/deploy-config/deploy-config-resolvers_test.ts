import { assertEquals } from 'jsr:@std/assert@^1';
import type { DeployConfig } from '@netscript/config';
import { resolveLinuxDeploy, resolveWindowsDeploy } from './deploy-config-resolvers.ts';

Deno.test('resolveLinuxDeploy applies Linux-sensible defaults', () => {
  const resolved = resolveLinuxDeploy(undefined);

  assertEquals(resolved.systemctlPath, 'systemctl');
  assertEquals(resolved.unitPrefix, 'netscript');
  assertEquals(resolved.installBase, '/opt/netscript');
  assertEquals(resolved.runtimeDir, '/run/netscript');
  assertEquals(resolved.compileTarget, 'x86_64-unknown-linux-gnu');
  assertEquals(resolved.mode, 'compile');
  assertEquals(resolved.user, undefined);
  assertEquals(resolved.group, undefined);
});

Deno.test('resolveLinuxDeploy honors user overrides from deploy.targets.linux', () => {
  const userDeploy: DeployConfig = {
    targets: {
      linux: {
        systemctlPath: '/usr/bin/systemctl',
        unitPrefix: 'acme',
        installBase: '/srv/acme',
        user: 'acme',
        group: 'acme',
        runtimeDir: '/run/acme',
        mode: 'script',
      },
    },
  };

  const resolved = resolveLinuxDeploy(userDeploy);

  assertEquals(resolved.systemctlPath, '/usr/bin/systemctl');
  assertEquals(resolved.unitPrefix, 'acme');
  assertEquals(resolved.installBase, '/srv/acme');
  assertEquals(resolved.user, 'acme');
  assertEquals(resolved.group, 'acme');
  assertEquals(resolved.runtimeDir, '/run/acme');
  assertEquals(resolved.mode, 'script');
});

// resolveWindowsDeploy coverage is the green backstop for the D2 base-default
// extraction: both OS resolvers now spread the shared `resolveDeployBase`, so the
// Windows defaults + overrides must stay byte-stable through that refactor.
Deno.test('resolveWindowsDeploy applies Windows-sensible defaults', () => {
  const resolved = resolveWindowsDeploy(undefined);

  // OS-specific fields.
  assertEquals(resolved.servyCliPath, 'C:\\Program Files\\Servy\\servy-cli.exe');
  assertEquals(resolved.servicePrefix, 'NetScript');
  assertEquals(resolved.installBase, 'C:\\NetScript');
  assertEquals(resolved.compileTarget, 'x86_64-pc-windows-msvc');
  // Shared base defaults (from resolveDeployBase).
  assertEquals(resolved.mode, 'compile');
  assertEquals(resolved.denoPath, 'deno');
  assertEquals(resolved.concurrency, 4);
  assertEquals(resolved.generateEnvFile, true);
  assertEquals(resolved.docker.denoBaseImage, 'denoland/deno:2');
});

Deno.test('resolveWindowsDeploy honors user overrides from deploy.targets.windows', () => {
  const userDeploy: DeployConfig = {
    targets: {
      windows: {
        servyCliPath: 'D:\\tools\\servy.exe',
        servicePrefix: 'Acme',
        installBase: 'D:\\Acme',
        mode: 'script',
        denoPath: 'D:\\deno\\deno.exe',
        compileTarget: 'aarch64-pc-windows-msvc',
        concurrency: 8,
      },
    },
  };

  const resolved = resolveWindowsDeploy(userDeploy);

  assertEquals(resolved.servyCliPath, 'D:\\tools\\servy.exe');
  assertEquals(resolved.servicePrefix, 'Acme');
  assertEquals(resolved.installBase, 'D:\\Acme');
  assertEquals(resolved.mode, 'script');
  assertEquals(resolved.denoPath, 'D:\\deno\\deno.exe');
  assertEquals(resolved.compileTarget, 'aarch64-pc-windows-msvc');
  assertEquals(resolved.concurrency, 8);
});

// ── Shared convention-block defaults (activation / secrets / otel, R-DEPLOY-3) ──

Deno.test('resolveDeployBase defaults the activation/secrets/otel convention blocks (U1–U3)', () => {
  const resolved = resolveLinuxDeploy(undefined);

  // Activation + health-gate defaults (U1, U3).
  assertEquals(resolved.activation.retain, 3);
  assertEquals(resolved.activation.strategy, 'symlink');
  assertEquals(resolved.activation.healthGate.path, '/health');
  assertEquals(resolved.activation.healthGate.expectStatus, 200);
  assertEquals(resolved.activation.healthGate.retries, 5);
  assertEquals(resolved.activation.healthGate.intervalMs, 2000);
  assertEquals(resolved.activation.healthGate.timeoutMs, 2000);
  assertEquals(resolved.activation.healthGate.port, undefined);
  // Secret env-file convention defaults (U2).
  assertEquals(resolved.secrets.envFile, '.env');
  assertEquals(resolved.secrets.mode, 0o600);
  // OTEL convention defaults.
  assertEquals(resolved.otel.enabled, true);
  assertEquals(resolved.otel.protocol, 'http/protobuf');
  assertEquals(resolved.otel.endpoint, undefined);
});

Deno.test('activation.strategy defaults per-OS (symlink on Linux, dir-swap on Windows)', () => {
  assertEquals(resolveLinuxDeploy(undefined).activation.strategy, 'symlink');
  assertEquals(resolveWindowsDeploy(undefined).activation.strategy, 'dir-swap');
});

Deno.test('resolveDeployBase honors activation/secrets/otel overrides', () => {
  const userDeploy: DeployConfig = {
    targets: {
      linux: {
        activation: {
          retain: 7,
          strategy: 'dir-swap',
          healthGate: { path: '/ready', retries: 2, expectStatus: 204 },
        },
        secrets: { envFile: 'config/.secrets.env', mode: 0o640 },
        otel: { enabled: false, endpoint: 'http://otel:4318', protocol: 'grpc' },
      },
    },
  };

  const resolved = resolveLinuxDeploy(userDeploy);

  assertEquals(resolved.activation.retain, 7);
  assertEquals(resolved.activation.strategy, 'dir-swap');
  assertEquals(resolved.activation.healthGate.path, '/ready');
  assertEquals(resolved.activation.healthGate.retries, 2);
  assertEquals(resolved.activation.healthGate.expectStatus, 204);
  // Unset health-gate fields still fall back to the shared defaults.
  assertEquals(resolved.activation.healthGate.intervalMs, 2000);
  assertEquals(resolved.secrets.envFile, 'config/.secrets.env');
  assertEquals(resolved.secrets.mode, 0o640);
  assertEquals(resolved.otel.enabled, false);
  assertEquals(resolved.otel.endpoint, 'http://otel:4318');
  assertEquals(resolved.otel.protocol, 'grpc');
});
