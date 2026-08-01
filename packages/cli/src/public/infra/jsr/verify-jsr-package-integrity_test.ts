import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';

import type { ValidatedPluginDescriptor } from '../../features/plugins/install/jsr-plugin-validator-port.ts';
import { fetchJsrPackageSchemaFragments } from './verify-jsr-package-integrity.ts';

const textEncoder = new TextEncoder();
const SCHEMA_PATH = '/database/schema.prisma';

Deno.test('fetchJsrPackageSchemaFragments returns checksum-verified schema content', async () => {
  const bytes = textEncoder.encode('model Verified {}');
  const descriptor = descriptorWithSchemaChecksum(await checksum(bytes));

  assertEquals(
    await fetchJsrPackageSchemaFragments(descriptor, {
      fetchFile: () => Promise.resolve(bytes),
    }),
    [{ path: 'database/schema.prisma', content: 'model Verified {}' }],
  );
});

Deno.test('fetchJsrPackageSchemaFragments rejects tampered schema content', async () => {
  const expectedBytes = textEncoder.encode('model Verified {}');
  const descriptor = descriptorWithSchemaChecksum(await checksum(expectedBytes));

  const error = await assertRejects(
    () =>
      fetchJsrPackageSchemaFragments(descriptor, {
        fetchFile: () => Promise.resolve(textEncoder.encode('model Tampered {}')),
      }),
    Error,
    SCHEMA_PATH,
  );

  assertStringIncludes(error.message, descriptor.package.packageSpecifier);
  assertStringIncludes(error.message, descriptor.versionMetadata.files[SCHEMA_PATH]);
  assertStringIncludes(error.message, 'actual sha256-');
});

Deno.test('fetchJsrPackageSchemaFragments rejects a schema without a checksum', async () => {
  const error = await assertRejects(
    () =>
      fetchJsrPackageSchemaFragments(descriptorWithSchemaChecksum(''), {
        fetchFile: () => Promise.resolve(textEncoder.encode('model Unchecked {}')),
      }),
    Error,
    SCHEMA_PATH,
  );

  assertStringIncludes(error.message, 'expected checksum is missing');
});

function descriptorWithSchemaChecksum(schemaChecksum: string): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: '@example/plugin-schema',
      source: 'scoped-name',
      scope: 'example',
      packageName: 'plugin-schema',
      packageSpecifier: '@example/plugin-schema',
      jsrSpecifier: 'jsr:@example/plugin-schema',
    },
    version: '1.0.0',
    manifest: {
      schemaVersion: 1,
      name: '@example/plugin-schema',
      version: '1.0.0',
      displayName: 'Schema Plugin',
      description: 'Schema fixture.',
      peerDependencies: {},
      capabilities: {
        hasDatabaseMigrations: true,
        hasRoutes: false,
        hasBackgroundWorkers: false,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: { net: [], read: [], write: [] },
      },
    },
    packageMetadata: { latest: '1.0.0', isYanked: false },
    versionMetadata: {
      exports: { './scaffold': './scaffold.ts' },
      files: { [SCHEMA_PATH]: schemaChecksum },
    },
    details: {},
  };
}

async function checksum(bytes: Uint8Array): Promise<string> {
  const input = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(input).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return `sha256-${Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')).join('')}`;
}
