import { assertEquals } from '@std/assert';
import {
  definePlugin,
  mergeContributions,
  type SdkClientContributionReference,
} from '../../src/config/mod.ts';

const browserReference = {
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: '@example/browser:credential',
  module: '@example/browser-credential/sdk',
  export: 'createBrowserCredentialContribution',
  targets: ['browser'] as const,
} as const satisfies SdkClientContributionReference;

const serverReference = {
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: '@example/server:credential',
  module: '@example/server-credential/sdk',
  export: 'createServerCredentialContribution',
  targets: ['server'] as const,
} as const satisfies SdkClientContributionReference;

Deno.test('plugin builder preserves declarative SDK client references', () => {
  const manifest = definePlugin('@example/credentials', '1.0.0')
    .withSdkClients([browserReference, serverReference])
    .build();

  assertEquals(manifest.contributions.sdkClients, [browserReference, serverReference]);
});

Deno.test('contribution merger concatenates SDK client references without mutation', () => {
  const left = { sdkClients: [browserReference] as const };
  const right = { sdkClients: [serverReference] as const };

  assertEquals(mergeContributions(left, right).sdkClients, [
    browserReference,
    serverReference,
  ]);
  assertEquals(left.sdkClients, [browserReference]);
  assertEquals(right.sdkClients, [serverReference]);
});
