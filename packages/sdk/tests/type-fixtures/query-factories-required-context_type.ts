import { oc } from '@orpc/contract';
import { z } from 'npm:zod@^4.4.3';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';
import { createServiceClient } from '../../src/client/mod.ts';
import { createQueryFactories, createQueryFactory } from '../../src/query/mod.ts';
import { defineServices } from '../../src/presets/mod.ts';

const contract = {
  echo: oc.input(z.object({ message: z.string() })).output(z.string()),
};
const bearer = createBearerSdkClientContribution<{ accessToken: string }>({
  context: { accessToken: 'required' },
  resolveCredential: ({ context }) => context.accessToken,
  responseCache: { mode: 'invariant' },
});
const client = createServiceClient({
  contract,
  serviceName: 'query-context',
  contributions: [bearer] as const,
});
const factories = createQueryFactories({
  secured: { contract, client },
  public: { contract, client: createServiceClient({ contract, serviceName: 'public-query' }) },
});
const input = { message: 'hello' };
const options = { context: { accessToken: 'fixture-only' } };
const action = factories.secured.echo;
const output: Promise<string> = action(input, options);
const queryOutput: Promise<string> = action.queryOptions(input, options).queryFn();
void output;
void queryOutput;

// @ts-expect-error required contribution context cannot be omitted
void action(input);
// @ts-expect-error required contribution context cannot be omitted from options
void action(input, {});
// @ts-expect-error required query context cannot be omitted
void action.queryOptions(input);
// @ts-expect-error required query context cannot be omitted from options
void action.queryOptions(input, {});
// @ts-expect-error bearer context remains string-typed
void action.queryOptions(input, { context: { accessToken: 42 } });
// @ts-expect-error contract input remains inferred
void action({ message: 42 }, options);
// @ts-expect-error prefetch requires context
void action.prefetch(input);
// @ts-expect-error mutation options require context
void action.mutationOptions();
// @ts-expect-error cached reads require context
void action.getCachedData(input);
// @ts-expect-error key generation requires context
void action.key(input);

// The same request-options seam also serves the singular factory and preset.
const singular = createQueryFactory('singular', contract, client);
// @ts-expect-error singular factory requires context too
void singular.echo(input);
const services = defineServices({
  secured: {
    contract,
    contributions: [{ ...bearer, responseCache: { mode: 'invariant' as const } }] as const,
  },
});
services.queryUtils.secured.echo.queryOptions({ input, ...options });
// @ts-expect-error preset object-style options also require context
services.queryUtils.secured.echo.queryOptions({ input });

void factories.public.echo(input);
void factories.public.echo.queryOptions(input);
// @ts-expect-error an incompatible client cannot satisfy the contract
createQueryFactories({ invalid: { contract, client: { echo: () => Promise.resolve(42) } } });
