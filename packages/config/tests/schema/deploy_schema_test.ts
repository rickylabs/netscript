import { assertEquals } from 'jsr:@std/assert@^1';
import {
  AspireAppHostDeployTargetSchema,
  AspireCloudDeployTargetSchema,
  CloudRunDeployTargetSchema,
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

Deno.test('AspireAppHostDeployTargetSchema inherits the shared base and AppHost fields', () => {
  const target = AspireAppHostDeployTargetSchema.parse({
    mode: 'script',
    outputPath: '.deploy/azure-aks',
    appHost: 'aspire/apphost.mts',
  });

  assertEquals(target.mode, 'script');
  assertEquals(target.outputPath, '.deploy/azure-aks');
  assertEquals(target.appHost, 'aspire/apphost.mts');
});

Deno.test('AspireCloudDeployTargetSchema remains an AppHost-target alias', () => {
  const target = AspireCloudDeployTargetSchema.parse({
    outputPath: '.deploy/kubernetes',
    appHost: 'aspire/apphost.mts',
  });

  assertEquals(target.outputPath, '.deploy/kubernetes');
  assertEquals(target.appHost, 'aspire/apphost.mts');
});

Deno.test('CloudRunDeployTargetSchema owns the Docker-image provider fields', () => {
  const target = CloudRunDeployTargetSchema.parse({
    mode: 'script',
    registry: 'acme.azurecr.io',
    imageName: 'orders-api:latest',
  });

  assertEquals(target.mode, 'script');
  assertEquals(target.registry, 'acme.azurecr.io');
  assertEquals(target.imageName, 'orders-api:latest');
});

Deno.test('DeployConfigSchema exposes kubernetes, azure, and cloud-run target keys', () => {
  const config = DeployConfigSchema.parse({
    targets: {
      kubernetes: { outputPath: '.deploy/kubernetes' },
      'azure-aca': { appHost: 'aspire/apphost.mts' },
      'azure-app-service': { appHost: 'aspire/apphost.mts' },
      'azure-aks': { outputPath: '.deploy/azure-aks' },
      'cloud-run': {
        registry: 'us-docker.pkg.dev/acme',
        imageName: 'orders-api:latest',
      },
    },
  });

  assertEquals(config?.targets?.kubernetes?.outputPath, '.deploy/kubernetes');
  assertEquals(config?.targets?.['azure-aca']?.appHost, 'aspire/apphost.mts');
  assertEquals(config?.targets?.['azure-app-service']?.appHost, 'aspire/apphost.mts');
  assertEquals(config?.targets?.['azure-aks']?.outputPath, '.deploy/azure-aks');
  assertEquals(config?.targets?.['cloud-run']?.registry, 'us-docker.pkg.dev/acme');
  assertEquals(config?.targets?.['cloud-run']?.imageName, 'orders-api:latest');
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

Deno.test('shared base carries the activation/secrets/otel convention blocks (spread, R-DEPLOY-3)', () => {
  const linux = LinuxDeployTargetSchema.parse({
    activation: {
      retain: 5,
      strategy: 'symlink',
      healthGate: {
        path: '/healthz',
        port: 8080,
        timeoutMs: 1500,
        intervalMs: 3000,
        retries: 4,
        expectStatus: 204,
      },
    },
    secrets: { envFile: 'config/.secrets.env', mode: 0o600 },
    otel: {
      enabled: true,
      endpoint: 'http://otel:4318',
      protocol: 'grpc',
      serviceNamePrefix: 'acme-',
    },
  });

  assertEquals(linux.activation?.retain, 5);
  assertEquals(linux.activation?.strategy, 'symlink');
  assertEquals(linux.activation?.healthGate?.path, '/healthz');
  assertEquals(linux.activation?.healthGate?.expectStatus, 204);
  assertEquals(linux.secrets?.envFile, 'config/.secrets.env');
  assertEquals(linux.secrets?.mode, 0o600);
  assertEquals(linux.otel?.endpoint, 'http://otel:4318');
  assertEquals(linux.otel?.serviceNamePrefix, 'acme-');
});

Deno.test('activation.strategy rejects an unknown swap strategy', () => {
  const parsed = LinuxDeployTargetSchema.safeParse({
    activation: { strategy: 'copy-over' },
  });
  assertEquals(parsed.success, false);
});

Deno.test('the convention blocks are optional on every target member', () => {
  // Absent blocks parse cleanly across all target members (defaults are applied
  // downstream by resolveDeployBase, not the schema).
  assertEquals(DockerComposeDeployTargetSchema.parse({}).activation, undefined);
  assertEquals(LinuxDeployTargetSchema.parse({}).secrets, undefined);
});
