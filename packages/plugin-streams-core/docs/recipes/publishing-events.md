# Publishing Events

Create a producer with `createDurableStream`, then call `upsert` or `delete`.
Call `flush` before shutdown so pending writes can drain.
