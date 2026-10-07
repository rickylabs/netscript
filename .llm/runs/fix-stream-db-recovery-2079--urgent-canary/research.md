# Research

Issue #2079 asks bounded restart/reconnect/backoff/resume at createNetScriptStreamDB, real server kill recovery and negative control. Consulted MCP find_guidance/search_docs; no applicable reconnect implementation returned. Loaded runtime doctrine and archetype/scope gates; inspected installed public upstream source and current main factory/test.

Upstream state createStreamDB starts one consumer lazily through preload; the consumer latch never resets after failure and collections must remain stable for mounted queries. Public createStreamDB accepts a DurableStream instance. Public DurableStream.stream returns StreamResponse with subscribeJson, closed, offset and cancellation; read options accept offset. These public seams allow read-session recovery without rebuilding the dispatcher or collections. Upstream onError only wraps initial connection; it does not restart terminal read sessions. Upstream fetch defaults retry indefinitely; disable those inner retries so the owned supervisor can enforce one bounded budget.

No upstream package/private import/lock edit required. Current owned handle types omit preload although the default object has it; expose an optional owned preload hook for compatibility with existing custom factory ports. No UI rendering changes.
