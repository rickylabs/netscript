# Context pack

Issue2639 on fresh main b0eb07957. Draft bootstrap; product unchanged. Need actual Redis stop/restart red test because issue was code-read only. Feature tier separate PLAN-EVAL before implementation. Restore shared live subscriptions and reread keys after any acknowledged reconnect; bounded terminal typed errors, abort/close/lease cleanup. Existing errors become catchable exports. No Redis Streams or saga transports. Full CLI smoke N/A for internal KV recovery with direct real-server coverage.

Two genuine baseline failures reproduced: server restart after subscriber end leaves existing watch silent; never-restarted server leaves iteration pending past35seconds instead of typed failure. Production remains main. Final plan now pins30-second recovery bound, native acknowledgement before snapshot, shared live-lease restore, cancellable generations and typed error exports. Next separate feature PLAN-EVAL before implementation.

Short-gap oracle also fails on unchanged main: native MULTI kills exactly one real pub/sub connection then SETs the envelope before any resubscription; the next batch times out. This proves reconnect state loss without a mocked backend or a publication race. Total baseline: three distinct failing runtime regressions, no bootstrap failure. Final resource label scan empty.

PLAN-EVAL cycle1 PASS at94a7bb380, comment6927438505, artifact plan-eval.md committed for shared context. No repairs; implementation next per approved protocol. Final independent IMPL-EVAL remains mandatory.

S2 contract committed before recovery implementation: existing typed errors are named root/Redis exports with JSDoc; outage regression uses the public type. Package59file check and doc lint zero pass. Next implement approved connection/subscription/queue recovery and state rereads; existing red tests remain the oracle.
