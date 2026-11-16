# Context pack

Issue2639 on fresh main b0eb07957. Draft bootstrap; product unchanged. Need actual Redis stop/restart red test because issue was code-read only. Feature tier separate PLAN-EVAL before implementation. Restore shared live subscriptions and reread keys after any acknowledged reconnect; bounded terminal typed errors, abort/close/lease cleanup. Existing errors become catchable exports. No Redis Streams or saga transports. Full CLI smoke N/A for internal KV recovery with direct real-server coverage.
