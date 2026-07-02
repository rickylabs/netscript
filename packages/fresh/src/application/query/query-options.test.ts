import { assertEquals } from '@std/assert';
import { QueryClient, QueryObserver } from '@tanstack/query-core';
import type { IslandQueryOptions, QueryKey } from './query-types.ts';

const pollingKey: QueryKey = ['polling'];

function createQueryObserver<TData, TError>(
  queryClient: QueryClient,
  options: IslandQueryOptions<TData, TError>,
): QueryObserver<TData, TError> {
  return new QueryObserver(queryClient, options as never);
}

Deno.test('IslandQueryOptions forwards refetchInterval to the underlying query observer', () => {
  const queryClient = new QueryClient();

  const options: IslandQueryOptions<string, Error> = {
    queryKey: pollingKey,
    queryFn: () => 'polled',
    refetchInterval: 5000,
  };

  const observer = createQueryObserver(queryClient, options);

  assertEquals(observer.options.refetchInterval, 5000);
});

Deno.test('IslandQueryOptions forwards refetchIntervalInBackground to the underlying query observer', () => {
  const queryClient = new QueryClient();

  const options: IslandQueryOptions<string, Error> = {
    queryKey: pollingKey,
    queryFn: () => 'polled',
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  };

  const observer = createQueryObserver(queryClient, options);

  assertEquals(observer.options.refetchInterval, 5000);
  assertEquals(observer.options.refetchIntervalInBackground, true);
});

Deno.test('IslandQueryOptions leaves refetchInterval unset when omitted', () => {
  const queryClient = new QueryClient();

  const options: IslandQueryOptions<string, Error> = {
    queryKey: pollingKey,
    queryFn: () => 'polled',
  };

  const observer = createQueryObserver(queryClient, options);

  assertEquals(observer.options.refetchInterval, undefined);
});
