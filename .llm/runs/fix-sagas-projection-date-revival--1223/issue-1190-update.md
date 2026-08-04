Post-fix verification from #1223 is GREEN on both shared queue/KV backends.

Full seven-point evidence:
https://github.com/rickylabs/netscript/issues/1223#issuecomment-5178895344

Quoted result:

> Redis/Garnet and Deno KV each produced four HTTP 200 publish artifacts, a version-3 completed
> instance, a distinct compensating instance, four `saga.handle` spans with stable separate
> correlation keys, and `outcome=compensated` on the rollback leg. After runner and API restarts,
> both instances retained their exact versions, steps, and timestamps. Both saga resources were
> Running/Healthy with populated named health reports. Deno KV API and runner shared
> `CACHE_PROVIDER=denokv` and one `DENO_KV_URL`.

The Redis-persisted projection regression is also recorded RED→GREEN in that evidence: the unfixed
boundary throws `metadata.createdAt.toISOString is not a function`; the fixed real-Redis round trip
passes `1 passed | 0 failed`.
