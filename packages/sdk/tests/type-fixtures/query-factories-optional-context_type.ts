import { oc } from '@orpc/contract';
import { z } from 'jsr:@zod/zod@4.4.3';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { createServiceClient } from '../../src/client/mod.ts';
import { createQueryFactories } from '../../src/query/mod.ts';

const contract = { echo: oc.input(z.string()).output(z.string()) };
const bearer = createBearerSdkClientContribution<{ accessToken?: string }>({
  context: { accessToken: 'optional' },
  resolveCredential: ({ context }) => context.accessToken,
  responseCache: { mode: 'invariant' },
});
const client = createServiceClient({
  contract,
  serviceName: 'optional-query-context',
  contributions: [bearer] as const,
});
const action = createQueryFactories({ optional: { contract, client } }).optional.echo;
void action('hello');
void action.queryOptions('hello');
void action.prefetch('hello');
void action.mutationOptions();
void action('hello', { context: { accessToken: 'fixture-only' } });
void action.queryOptions('hello', { context: { accessToken: 'fixture-only' } });
// @ts-expect-error optional bearer context remains string-typed
void action('hello', { context: { accessToken: 42 } });
