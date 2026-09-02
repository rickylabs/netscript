import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { authAdapterPlugin } from '../plugin.ts';
import { authBarrelScaffolder, DEFAULT_AUTH_BARREL_INPUT } from './mod.ts';
import { authBarrelStub } from './barrel/barrel.stub.ts';

const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'contracts/',
  'src/runtime/',
  'src/aspire/',
  'streams/',
  'database/',
  'bin/',
  'scaffold.plugin.json',
  'deno.json',
  '.prisma',
] as const;

Deno.test('auth install starter barrel is byte-identical to the install-only scaffolder', () => {
  const installBarrel = collectInstallArtifacts(authAdapterPlugin).find((artifact) =>
    artifact.path === 'auth/mod.ts'
  );
  const addBarrel = authBarrelScaffolder.emit(DEFAULT_AUTH_BARREL_INPUT)[0];

  assertEquals(installBarrel?.path, addBarrel.path);
  assertEquals(installBarrel ? artifactText(installBarrel) : undefined, artifactText(addBarrel));
});

Deno.test('auth is install-only and exposes no add resources', () => {
  assertEquals(authAdapterPlugin.resources, []);
});

Deno.test('auth install emits separate control-plane and userland modules under auth', () => {
  const artifacts = collectInstallArtifacts(authAdapterPlugin);

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'auth/plugin.ts',
    'auth/mod.ts',
    'auth/sdk-client.ts',
  ]);
  for (const artifact of artifacts) {
    assertEquals(artifact.path.startsWith('auth/'), true);
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain ${forbidden}`,
      );
    }
  }
});

Deno.test('auth SDK starter is explicit, typed, and contains no credential material', () => {
  const credential = crypto.randomUUID();
  const artifact = collectInstallArtifacts(authAdapterPlugin).find((candidate) =>
    candidate.path === 'auth/sdk-client.ts'
  );
  const text = artifact === undefined ? '' : artifactText(artifact);

  assertStringIncludes(text, "from '@netscript/plugin-auth-core/sdk'");
  assertStringIncludes(text, 'createBearerSdkClientContribution<AuthSdkClientContext>');
  assertStringIncludes(text, 'contributions: [authSdkClientContribution] as const');
  assertEquals(text.includes(credential), false);
  assertEquals(text.includes('Deno.env'), false);
  assertEquals(text.includes('import.meta.env'), false);
  assertEquals(text.includes('localStorage'), false);
  assertEquals(text.includes('sessionStorage'), false);
  assertEquals(text.includes('document.cookie'), false);
});

Deno.test('auth install records the Prisma contract without emitting database files', () => {
  assertEquals(authAdapterPlugin.install.prismaContract, 'database/auth.prisma');
  assertEquals(
    collectInstallArtifacts(authAdapterPlugin).some((artifact) =>
      artifact.path.includes('.prisma')
    ),
    false,
  );
});

Deno.test('auth userland barrel imports the published auth core only', () => {
  const [barrel] = authBarrelScaffolder.emit(DEFAULT_AUTH_BARREL_INPUT);
  const text = artifactText(barrel);

  assertStringIncludes(text, "from '@netscript/plugin-auth-core/contracts/v1'");
  assertEquals(text.includes('@netscript/auth-'), false);
  assertEquals(text.includes('@netscript/plugin-auth/services'), false);
});

Deno.test('auth barrel token map rejects misspelled tokens at compile time', () => {
  // @ts-expect-error AUTH_CORE_CONTRACTS is required by authBarrelStub.
  substituteTokens(authBarrelStub, {});
  assertEquals(true, true);
});
