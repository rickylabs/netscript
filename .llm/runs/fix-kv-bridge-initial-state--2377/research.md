# Research

Baseline current main 14816a409e31505bc528714332b0bf4670be2fcb includes previous #2382 merged as #2522. Tracker #2474 / orchestration PR #2475 read live: #2377 is a C1/W4 fix with no requires edges, claim or covering PR. B1 #2374 is claimed, B2/2390 still require unfinished B1; no duplicates filed. Explicit issue claim and tracker continuation posted.

Prior run memory and validation recipes retained. MCP find_guidance(intent) then search_docs(query) consulted; they lack direct bridge documentation, so package API and code are authoritative.

WatchableKvBridge.watch subscribes with initial:true and iterates an AsyncIterable, maintaining state plus equality stamps. It fills only initial:true events and subsequently affected keys, so an initial-ignoring adapter leaves unchanged stored keys absent. WatchStream.ready is optional; plain AsyncIterable is supported. KvStore.getMany is optional; retain Promise.all(get) fallback. First-party Memory/Deno/Redis snapshot support remains valid and must incur no extra bridge snapshot read. Existing watch-initial/watch-review tests already cover acknowledged snapshots, cancellation and replay behavior.

Archetype 2 integration, with existing adapter/port boundaries; no new exports, dependencies, enum, callback, port or public signature. Existing published kvdex WatchableKvBridge class gets clarified JSDoc only. JSR surface audit: metadata/exports/publish map unchanged; no new slow types expected. No new architecture debt.
