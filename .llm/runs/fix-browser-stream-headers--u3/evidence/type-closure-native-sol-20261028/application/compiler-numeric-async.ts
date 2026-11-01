import type { HeadersRecord as Native, MaybePromise as NativePromise } from '@durable-streams/client';
import type { HeadersRecord as Fresh, MaybePromise as FreshPromise, NetScriptStreamDBOptions, NetScriptStreamDBFactoryInput, NetScriptStreamStateDefinition } from 'file:///C:/Users/ericc/source/repos/netscript-browser-stream-headers-008/packages/fresh/src/runtime/streams/mod.ts';
import type { HeadersRecord as FreshSource, MaybePromise as FreshSourcePromise } from 'file:///C:/Users/ericc/source/repos/netscript-browser-stream-headers-008/packages/fresh/src/runtime/streams/create-stream-db.ts';
import { createWorkersStreamDB } from 'file:///C:/Users/ericc/source/repos/netscript-browser-stream-headers-008/plugins/workers/streams/mod.ts';
import type { HeadersRecord as Workers, MaybePromise as WorkersPromise } from 'file:///C:/Users/ericc/source/repos/netscript-browser-stream-headers-008/plugins/workers/streams/mod.ts';
import type { HeadersRecord as WorkersSource, MaybePromise as WorkersSourcePromise } from 'file:///C:/Users/ericc/source/repos/netscript-browser-stream-headers-008/plugins/workers/streams/factory.ts';
type FreshHeaders = NonNullable<NetScriptStreamDBOptions<NetScriptStreamStateDefinition>['headers']>;
type InputHeaders = NetScriptStreamDBFactoryInput<NetScriptStreamStateDefinition>['streamOptions']['headers'];
type WorkersHeaders = NonNullable<NonNullable<Parameters<typeof createWorkersStreamDB>[0]>['headers']>;

const fresh: FreshHeaders = { authorization: async () => 1 };
const input: InputHeaders = { authorization: async () => 1 };
const workers: WorkersHeaders = { authorization: async () => 1 };
void [fresh, input, workers];
