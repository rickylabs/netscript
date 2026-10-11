import { assertEquals } from '@std/assert';
import {
  createWorkersContract,
  type WorkersContract,
  workersContract,
  type WorkersContractRoute,
  type WorkersContractRouteName,
  type WorkersContractRouteSchemas,
  workersContractV1,
} from '@netscript/plugin-workers/contracts';
import type {
  WorkersContractRoute as CoreRoute,
  WorkersContractRouteSchemas as CoreSchemas,
} from '@netscript/plugin-workers-core/contracts/v1';

type Payloads = {
  email: { to: string };
  index: { documentId: string };
};

type SchemaInput<TSchema> = TSchema extends {
  '~standard': { types?: { input: infer TInput } };
} ? TInput
  : never;

type SchemaOutput<TSchema> = TSchema extends {
  '~standard': { types?: { output: infer TOutput } };
} ? TOutput
  : never;

type TriggerSchemas = WorkersContractRouteSchemas<'triggerJob', Payloads>;
type TriggerInput = SchemaInput<NonNullable<TriggerSchemas['inputSchema']>>;
type TriggerOutput = SchemaOutput<NonNullable<TriggerSchemas['outputSchema']>>;

const validInput: TriggerInput = { id: 'email', payload: { to: 'a@example.com' } };
const invalidInput: TriggerInput = {
  id: 'index',
  // @ts-expect-error The public schema contract binds payload to the selected job id.
  payload: { to: 'a@example.com' },
};
const invalidOutput: TriggerOutput = {
  jobId: 'email',
  // @ts-expect-error Trigger output retains its boolean discriminator.
  triggered: 'yes',
};
// @ts-expect-error Route vocabulary is finite, even though the base seam has an index signature.
const invalidRoute: WorkersContractRouteName = 'missing';

Deno.test('public workers contract graph retains every named route', () => {
  const routes: { [K in WorkersContractRouteName]: WorkersContractRoute<K> } = workersContract;
  const names = [
    'describe',
    'listJobs',
    'getJob',
    'createJob',
    'updateJob',
    'deleteJob',
    'triggerJob',
    'listExecutions',
    'getExecution',
    'batchQueryExecutions',
    'listExecutionsByCorrelationId',
    'listTasks',
    'getTask',
    'triggerTask',
    'listTaskExecutions',
    'getTaskExecution',
    'cleanup',
    'cleanupDbExecutions',
    'archiveExecutions',
    'seed',
    'subscribe',
    'listTopics',
  ] satisfies WorkersContractRouteName[];
  assertEquals(Object.keys(routes).sort(), names.sort());
});

Deno.test('public workers route schemas preserve concrete Zod methods and defaults', () => {
  const route: CoreRoute<'getJob'> = workersContract.getJob;
  const schemas: WorkersContractRouteSchemas<'getJob'> = route['~orpc'];
  const coreSchemas: CoreSchemas<'getJob'> = schemas;
  assertEquals(coreSchemas.inputSchema?.shape.id.parse('job-1'), 'job-1');
  // @ts-expect-error The id schema stays a Zod string schema, not an erased structural validator.
  const invalidMinimum: Parameters<
    NonNullable<typeof coreSchemas.inputSchema>['shape']['id']['min']
  >[0] = 'one';
  void invalidMinimum;
});

Deno.test('public workers graph preserves literal payload and handler inference', () => {
  const contract: WorkersContract<Payloads> = createWorkersContract<Payloads>();
  const route: WorkersContractRoute<'triggerJob', Payloads> = contract.triggerJob;
  assertEquals(route['~orpc'].inputSchema?.parse(validInput), validInput);
  const handler = workersContractV1.$context<{ service: string }>().triggerJob.handler(
    ({ input, context }) => {
      const id: string | undefined = input.id;
      const service: string = context.service;
      return { jobId: id ?? service, triggered: true };
    },
  );
  assertEquals(typeof handler, 'object');
  void invalidInput;
  void invalidOutput;
  void invalidRoute;
});
