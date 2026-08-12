```ts
import { createServiceQueryUtils } from '@netscript/sdk/query-client';
import { docsClient } from '../lib/docs.ts';

const docsQueryUtils = createServiceQueryUtils(docsClient);
docsQueryUtils.getById.queryOptions({ input: { id: 'doc-1' } });
```
