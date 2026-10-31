import type { HeadersRecord } from '@durable-streams/client';
import { createStateSchema } from '@durable-streams/state';
import { createStreamDB } from '@durable-streams/state/db';
import { createNetScriptStreamDB, useLiveQuery } from '@netscript/fresh/streams';
import type {
  NetScriptStreamDBReconnectOptions,
  NetScriptStreamDBStatus,
} from '@netscript/fresh/streams';
import { z } from 'zod';

const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
});

type Person = z.infer<typeof personSchema>;

const state = createStateSchema({
  people: {
    schema: personSchema,
    type: 'person',
    primaryKey: 'id',
  },
});

const streamOptions = {
  url: 'https://streams.example.test/v1/stream/netscript/people',
  contentType: 'application/json' as const,
};

const control = createStreamDB({ streamOptions, state });
const wrapped = createNetScriptStreamDB({
  baseUrl: 'https://streams.example.test',
  streamPath: '/people',
  schema: state,
});

const headerRecord: HeadersRecord = {
  authorization: 'Bearer fixture-static',
  'x-u3-sync': () => 'fixture-sync',
  'x-u3-async': () => Promise.resolve('fixture-async'),
};

const withHeaders = createNetScriptStreamDB({
  baseUrl: 'https://streams.example.test',
  streamPath: '/people-headers',
  schema: state,
  headers: headerRecord,
});

const viaPort = createNetScriptStreamDB({
  baseUrl: 'https://streams.example.test',
  streamPath: '/people-port',
  schema: state,
  headers: headerRecord,
  createStreamDB(input) {
    const forwarded: HeadersRecord = input.streamOptions.headers;
    const roundTrip: typeof input.streamOptions.headers = forwarded;
    void forwarded;
    void roundTrip;
    return wrapped;
  },
});

// Control: the upstream package accepts the documented query shape.
const controlQuery = useLiveQuery((query) => query.from({ person: control.collections.people }));

// Contract: the NetScript wrapper must preserve the same collection type.
const wrappedQuery = useLiveQuery((query) => query.from({ person: wrapped.collections.people }));

const controlPerson: Person | undefined = control.collections.people.get('person-1');
const wrappedPerson: Person | undefined = wrapped.collections.people.get('person-1');

void controlQuery;
void wrappedQuery;
void controlPerson;
void wrappedPerson;

const reconnect: NetScriptStreamDBReconnectOptions = { maxRetries: 2 };
const status: NetScriptStreamDBStatus | undefined = wrapped.status;
const preload: (() => Promise<void>) | undefined = wrapped.preload;
void reconnect;
void status;
void preload;
void withHeaders;
void viaPort;
