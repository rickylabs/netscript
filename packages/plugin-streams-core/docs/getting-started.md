# Getting Started

Import the schema and producer primitives from the root package:

```ts
import {
  createDurableStream,
  defineStreamSchema,
} from "@netscript/plugin-streams-core";
```

Testing helpers live on the `./testing` subpath:

```ts
import { MemoryStreamProducer } from "@netscript/plugin-streams-core/testing";
```
