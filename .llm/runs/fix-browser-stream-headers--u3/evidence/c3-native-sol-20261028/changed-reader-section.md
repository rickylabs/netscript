### Caller-provided reader headers

Fresh `createNetScriptStreamDB` and workers `createWorkersStreamDB` accept native
`HeadersRecord` values from `@durable-streams/client`: each value is a string or
a sync/async callback. The native client resolves callbacks per request, including
reads after a Fresh reconnect.

```ts
import { createWorkersStreamDB } from "@netscript/plugin-workers/streams";
declare const readReaderToken: () => Promise<string>;
const workers = createWorkersStreamDB({
  headers: { authorization: async () => `Bearer ${await readReaderToken()}` },
});
```

Any supplied record, including `{}`, replaces ambient producer auth completely;
only omission or `undefined` selects `getStreamsAuth()`. Fresh's exported custom
`createStreamDB` port now accepts native header values instead of strings only:
external serializers must forward the record unchanged to the native client.
Header forwarding neither issues credentials nor authenticates a reader; callers
still own reader credential and browser bootstrap policy.
