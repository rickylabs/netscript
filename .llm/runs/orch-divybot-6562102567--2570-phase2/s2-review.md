**PASS — terminal S2 source-review verdict.**

The supplied changes close both remaining findings. I found no remaining blocking issue in the reviewed S2 source.

| Area | Resolution |
|---|---|
| Generic rendering | Rich formatting now requires supported `name` and `ownerEmail` types. Structured values fall back to recursive generic rendering, and nonnumeric `limit` metadata remains visible. The added rendering test covers both cases. |
| Stream cursor recovery | Using the supplied protocol semantics, saved cursors rejected with 400/410 reset once per read. Reset clears the previous items and history flag, and recovery stays within `MAX_ACTIVITY_BATCHES`. The tests cover recovery without retaining old events. |
| Stream privacy | Activity requests remain credential-free. GET 401/403 responses return immediately without retrying or returning cached items. The new tests explicitly exercise denial after populating the snapshot. |
| Resource health | Strict background readiness and identity-derived stream readiness remain intact. Missing discovery produces `unwired`, displayed as **Not linked**, without a latency value. |
| Amount formatting | Conversion remains an explicit opt-in for the known sample contract. Generic amounts retain their units, and malformed currency strings retain the safe fallback. |

The earlier fixes for envelope contents, extra fields, bounded history reads, and qualified freshness descriptions also remain intact.

This closes **S2 source supervision only**. I made no tool calls and have not independently rerun the reported checks or captures. Final IMPL-EVAL remains separate, and the full-suite result is still pending.
