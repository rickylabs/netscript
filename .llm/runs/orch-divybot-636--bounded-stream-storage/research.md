# Research

Current main and checkout coincide at 6f6cbdf030d7595d1730272d0a74aedd66225069. No duplicate inbox triage or PR covers #2080.

The resolved @durable-streams/server 0.3.8 stores frames as uint32 big-endian length + payload + one trailer byte. Both scanFileForTrueOffset and readMessagesFromSegmentFile call node:fs.readFileSync on the entire segment. Offsets count framing bytes, not only payload bytes. Recovery adds forkOffset to the physical frame end. Native read stitches fork chains with baseByteOffset and capByte; arbitrary positions return the frame whose end is past the requested position.

The public server constructor provides dataDir, but no store injection. Its readonly store is used dynamically and stop checks instanceof FileBackedStreamStore. Both offending store methods are TypeScript-private, ordinary virtual prototype methods at runtime. A dedicated local subclass can replace only these two hooks before its constructor invokes recovery; no upstream prototype or consumer process needs mutation. A dedicated server subclass can use the bounded native store while retaining protocol, metadata, producer, fork, and shutdown behavior. Runtime hook checks will fail closed on incompatible dependency shape.

Tail seek cannot assume arbitrary requested offsets are frame boundaries. Keep a strictly bounded recent boundary cache (fixed segment and checkpoint counts), populated during recovery and reads; locate the nearest verified boundary before traversing headers. Payload reads include only requested complete messages. Cold historical reads may traverse earlier framing headers, never allocate retained payload history. No sidecar index, storage migration or metadata schema change.

Archetype 5 / service edge integration: the new code is a dependency-specific adapter, not a framework convention. JSR export map and shipped services glob already cover it; public root contracts unchanged. Explicit types and JSDoc required; regression workers must be excluded from publish.
