import { createQueryCollection } from '../../src/collections/create-query-collection.ts';
import type { QueryClientPort } from '../../src/ports/query-client.ts';
import type { QueryCollection } from '../../src/collections/create-query-collection.ts';

interface Order {
  readonly id: string;
  total: number;
}

declare const queryClient: QueryClientPort;

const collection = createQueryCollection({
  resource: 'orders',
  queryKey: ['orders', 'list'],
  queryFn: (): Promise<Order[]> => Promise.resolve([{ id: 'ord_1', total: 42 }]),
  getKey: (order) => order.id,
  queryClient,
});

const typedCollection: QueryCollection<Order> = collection;
const item: Order | undefined = typedCollection.get('ord_1');
const values: Order[] = typedCollection.toArray;
const totals: number[] = typedCollection.map((order) => order.total);
const insertTx = typedCollection.insert({ id: 'ord_2', total: 10 });
const persisted: Promise<unknown> | undefined = insertTx.isPersisted?.promise;

typedCollection.update('ord_1', (draft) => {
  draft.total = 44;
});
typedCollection.delete(['ord_1', 'ord_2']);

void item;
void values;
void totals;
void persisted;
