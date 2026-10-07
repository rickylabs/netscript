# Plan & Design — READY FOR REVIEW

Resolve #2080 in one PR. Preserve native durable store and server behavior; replace full-log buffering at the NetScript service edge.

Locked decisions: bounded chunk reader, complete framing offsets, fixed-capacity recent checkpoint cache, native store/server instance subclasses (no global prototype patches), clear failure on missing native hooks, synthetic >=1 GiB subprocess regression with RSS ceiling and real old-native-store negative control.

The issue supplies the behavior and acceptance contract; PLAN-EVAL N/A for a bounded I/O repair with no public/storage contract redesign. Mandatory independent implementation evaluation remains required.

Gates: structured check/test/lint/fmt for streams service; quality:gate; JSR audit/doc lint; full CLI scaffold.runtime before merge readiness. Run 1 GiB recovery/tail RSS regression on Linux with old full-buffer control and preserve exact numeric output. Native HTTP restart test validates actual server seam.

Risk: private upstream hook coupling is explicit, guarded, and exercised using the resolved dependency; file an upstream issue requesting bounded native I/O and supported store injection. Bounded cache cannot accelerate every historical offset; this is acceptable because memory stays fixed and historical payload bytes are skipped. Returned message arrays necessarily scale with requested response bytes, not unrelated retained history. No new generic framework primitives or debt outside this adapter.

Slices: (0) harness bootstrap; (1) bounded adapter, service composition, semantics and >=1 GiB RSS tests, upstream issue; (2) independently evaluated final evidence/handoff. No independent remaining feature scopes to fan out.
