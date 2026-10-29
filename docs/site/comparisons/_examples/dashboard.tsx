/** @jsxImportSource preact */
import { createNetScriptStreamDB, useLiveQuery } from '@netscript/fresh/streams';
import { schema } from './streams.ts';

// Create once per mounted dashboard, using the authorized streams endpoint.
export function createDashboard(streamsUrl: string) {
  const db = createNetScriptStreamDB({
    streamPath: '/ops/orders',
    schema,
    baseUrl: streamsUrl,
  });
  function Orders() {
    const { data } = useLiveQuery((query) => query.from({ order: db.collections.order }));
    return <ul>{data?.map((order) => <li key={order.id}>{order.id}: {order.status}</li>)}</ul>;
  }
  return { db, Orders };
}
