import { assertEquals } from 'jsr:@std/assert@^1';
import {
  DeployConfigSchema,
  DockerComposeDeployTargetSchema,
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
