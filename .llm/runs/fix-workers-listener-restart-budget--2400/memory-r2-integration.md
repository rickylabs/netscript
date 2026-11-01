# R2 merge and gate recipes

Current main592a446af changes Redis listener concurrency/drain; workers runtime source
has no upstream delta since f89260ac9. Merge conflicts only in tuning guide and native
prose/export carriers. Keep both guide sections; use gen:agent-docs-prose and
 gen:mcp-export-corpus --allow-dirty for pending merge. Export --check rejects
--allow-dirty; ordinary check works against a dirty tree. Check wrapper enables
--unstable-kv by default and rejects that explicit flag; pass --deno-arg --frozen.

Existing real Redis ACL recovery proof still works with default concurrency1;
both real-store negative controls fail on explicit exhaustion and restored workers
suite111passes. Upstream Redis concurrency suite8passes with6Garnet skips. Main
now removes Redis abort callback; prior deferred risk is superseded. A custom
healthy reset shorter than visibility drain can include drain time in running;
default60s reset exceeds default30s drain. Preserve upstream behavior.
