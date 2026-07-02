import { assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { MutationObserver, QueryClient } from '@tanstack/query-core';
import type { IslandMutationOptions, QueryKey } from './query-types.ts';

type KnowledgeItem = Readonly<{
  id: string;
  title: string;
}>;

type AddKnowledgeVariables = Readonly<{
  title: string;
}>;

type KnowledgeSnapshot = Readonly<{
  previous: readonly KnowledgeItem[];
}>;

const knowledgeKey: QueryKey = ['knowledge'];

function createMutationObserver<TData, TError, TVariables, TContext>(
  queryClient: QueryClient,
  options: IslandMutationOptions<TData, TError, TVariables, TContext>,
): MutationObserver<TData, TError, TVariables, TContext> {
  return new MutationObserver(queryClient, options as never);
}

Deno.test('island mutation lifecycle rolls back optimistic cache updates on error', async () => {
  const queryClient = new QueryClient();
  const existing: KnowledgeItem = { id: 'existing', title: 'Existing' };
  const optimistic: KnowledgeItem = { id: 'optimistic', title: 'Draft' };
  const failure = new Error('mutation failed');
  const order: string[] = [];

  queryClient.setQueryData<readonly KnowledgeItem[]>(knowledgeKey, [existing]);

  const options: IslandMutationOptions<
    KnowledgeItem,
    Error,
    AddKnowledgeVariables,
    KnowledgeSnapshot
  > = {
    onMutate(variables) {
      order.push(`onMutate:${variables.title}`);
      const previous = queryClient.getQueryData<readonly KnowledgeItem[]>(knowledgeKey) ?? [];
      queryClient.setQueryData<readonly KnowledgeItem[]>(knowledgeKey, [optimistic, ...previous]);
      return { previous };
    },
    mutationFn(variables) {
      order.push(`mutationFn:${variables.title}`);
      throw failure;
    },
    onError(error, variables, context) {
      order.push(`onError:${variables.title}`);
      assertEquals(error, failure);
      assertEquals(context, { previous: [existing] });
      queryClient.setQueryData(knowledgeKey, context?.previous ?? []);
    },
    onSettled(data, error, variables, context) {
      order.push(`onSettled:${variables.title}`);
      assertEquals(data, undefined);
      assertEquals(error, failure);
      assertEquals(context, { previous: [existing] });
    },
  };

  const observer = createMutationObserver(queryClient, options);

  const thrown = await assertRejects(() => observer.mutate({ title: 'Draft' }));

  assertEquals(thrown, failure);
  assertEquals(queryClient.getQueryData(knowledgeKey), [existing]);
  assertEquals(order, [
    'onMutate:Draft',
    'mutationFn:Draft',
    'onError:Draft',
    'onSettled:Draft',
  ]);
});

Deno.test('island mutation lifecycle threads optimistic context through success and settled', async () => {
  const queryClient = new QueryClient();
  const existing: KnowledgeItem = { id: 'existing', title: 'Existing' };
  const saved: KnowledgeItem = { id: 'saved', title: 'Saved' };
  const order: string[] = [];

  queryClient.setQueryData<readonly KnowledgeItem[]>(knowledgeKey, [existing]);

  const options: IslandMutationOptions<
    KnowledgeItem,
    Error,
    AddKnowledgeVariables,
    KnowledgeSnapshot
  > = {
    onMutate(variables) {
      order.push(`onMutate:${variables.title}`);
      const previous = queryClient.getQueryData<readonly KnowledgeItem[]>(knowledgeKey) ?? [];
      queryClient.setQueryData<readonly KnowledgeItem[]>(knowledgeKey, [
        { id: 'optimistic', title: variables.title },
        ...previous,
      ]);
      return Promise.resolve({ previous });
    },
    mutationFn(variables) {
      order.push(`mutationFn:${variables.title}`);
      return { ...saved, title: variables.title };
    },
    onSuccess(data, variables, context) {
      order.push(`onSuccess:${variables.title}`);
      assertEquals(data, { id: 'saved', title: 'Saved' });
      assertEquals(context, { previous: [existing] });
      queryClient.setQueryData<readonly KnowledgeItem[]>(knowledgeKey, [data, ...context.previous]);
    },
    onError(error) {
      throw error;
    },
    onSettled(data, error, variables, context) {
      order.push(`onSettled:${variables.title}`);
      assertEquals(data, { id: 'saved', title: 'Saved' });
      assertEquals(error, null);
      assertEquals(context, { previous: [existing] });
    },
  };

  const observer = createMutationObserver(queryClient, options);

  const data = await observer.mutate({ title: 'Saved' });

  assertEquals(data, { id: 'saved', title: 'Saved' });
  assertEquals(queryClient.getQueryData(knowledgeKey), [saved, existing]);
  assertEquals(order, [
    'onMutate:Saved',
    'mutationFn:Saved',
    'onSuccess:Saved',
    'onSettled:Saved',
  ]);
});

Deno.test('island mutation lifecycle passes typed errors to rollback callbacks', async () => {
  const queryClient = new QueryClient();
  const failure = new TypeError('typed failure');
  const seenErrors: string[] = [];

  const options: IslandMutationOptions<KnowledgeItem, TypeError, AddKnowledgeVariables> = {
    mutationFn() {
      throw failure;
    },
    onError(error) {
      assertInstanceOf(error, TypeError);
      seenErrors.push(error.message);
    },
  };

  const observer = createMutationObserver(queryClient, options);

  await assertRejects(() => observer.mutate({ title: 'Draft' }), TypeError);

  assertEquals(seenErrors, ['typed failure']);
});
