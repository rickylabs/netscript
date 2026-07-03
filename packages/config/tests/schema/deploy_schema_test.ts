import { assertEquals } from 'jsr:@std/assert@^1';
import {
  DeployConfigSchema,
  DockerComposeDeployTargetSchema,
  LinuxDeployTargetSchema,
} from '../../src/domain/schemas/deploy-schema.ts';

Deno.test('DockerComposeDeployTargetSchema inherits the shared base fields (spread, no base class)', () => {
  const target = DockerComposeDeployTargetSchema.parse({
    mode: 'compile',
    concurrency: 2,
    generateEnvFile: true,
  });

  assertEquals(target.mode, 'compile');
  assertEquals(target.concurrency, 2);
  assertEquals(target.generateEnvFile, true);
});

Deno.test('DockerComposeDeployTargetSchema defaults the deno base image to denoland/deno:2', () => {
  const target = DockerComposeDeployTargetSchema.parse({ docker: {} });

  assertEquals(target.docker?.denoBaseImage, 'denoland/deno:2');
});

Deno.test('DockerComposeDeployTargetSchema accepts compose/registry-specific fields', () => {
  const target = DockerComposeDeployTargetSchema.parse({
    projectName: 'acme',
    outputPath: '.deploy/compose',
    registry: 'ghcr.io/acme',
    imageName: 'acme-web',
  });

  assertEquals(target.projectName, 'acme');
  assertEquals(target.outputPath, '.deploy/compose');
  assertEquals(target.registry, 'ghcr.io/acme');
  assertEquals(target.imageName, 'acme-web');
});

Deno.test('DeployConfigSchema exposes windows, docker and compose target keys', () => {
  const config = DeployConfigSchema.parse({
    targets: {
      windows: { servicePrefix: 'NetScript' },
      docker: { registry: 'ghcr.io/acme' },
      compose: { projectName: 'acme' },
    },
  });

  assertEquals(config?.targets?.windows?.servicePrefix, 'NetScript');
  assertEquals(config?.targets?.docker?.registry, 'ghcr.io/acme');
  assertEquals(config?.targets?.compose?.projectName, 'acme');
});

Deno.test('LinuxDeployTargetSchema round-trips systemd fields', () => {
  const linux = LinuxDeployTargetSchema.parse({
    systemctlPath: '/usr/bin/systemctl',
    unitPrefix: 'acme',
    installBase: '/srv/acme',
    user: 'acme',
    group: 'acme',
    runtimeDir: '/run/acme',
    mode: 'compile',
    compileTarget: 'x86_64-unknown-linux-gnu',
  });

  assertEquals(linux.systemctlPath, '/usr/bin/systemctl');
  assertEquals(linux.unitPrefix, 'acme');
  assertEquals(linux.installBase, '/srv/acme');
  assertEquals(linux.user, 'acme');
  assertEquals(linux.group, 'acme');
  assertEquals(linux.runtimeDir, '/run/acme');
  // Shared base fields (spread) survive the round-trip.
  assertEquals(linux.mode, 'compile');
  assertEquals(linux.compileTarget, 'x86_64-unknown-linux-gnu');
});

Deno.test('DeployConfigSchema accepts sibling windows + linux targets', () => {
  const deploy = DeployConfigSchema.parse({
    targets: {
      windows: { servicePrefix: 'NetScript' },
      linux: { unitPrefix: 'netscript', installBase: '/opt/netscript' },
    },
  });

  assertEquals(deploy?.targets?.windows?.servicePrefix, 'NetScript');
  assertEquals(deploy?.targets?.linux?.unitPrefix, 'netscript');
  assertEquals(deploy?.targets?.linux?.installBase, '/opt/netscript');
});

Deno.test('DeployConfigSchema accepts a linux-only target', () => {
  const deploy = DeployConfigSchema.parse({
    targets: { linux: {} },
  });

  assertEquals(deploy?.targets?.linux, {});
  assertEquals(deploy?.targets?.windows, undefined);
});
