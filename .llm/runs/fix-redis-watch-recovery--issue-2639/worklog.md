# Worklog

## Design

Current-state watch contract, live lease identity and lifecycle research are in plan.md. Initial state is connected; close enters reconnecting, successful SUBSCRIBE acknowledgement enters resynchronizing/connected, exhausted recovery enters failed, release/adapter close enters closed. Shared subscription owner supervises physical subscriber; individual watch queues own caller cancellation and typed failure propagation. Redis remains external clock/transport adapter; native retry/delay own bounded timing, all cleanup must cancel it. No new handler registry, port or global state.

Bootstrap only. No production changes or reproduction claimed. Next write/run genuine server-outage regression on unchanged main and lock plan before separate evaluation.


## Red runtime reproduction

Structured real Redis tests:0passed/2failed. Both reach subscriber end after the native retry window. Recovery case restarts the actual server and confirms PING, but iterator times out rather than reporting lost state. Terminal case times out after35seconds rather than throwing KvConnectionError. No product code changed. Test fixture uses a stable container endpoint while controlling its Redis server and removes only the exact owned labelled container. Short-gap test added next using native transactional kill+write, with no timing or publication dependency.

Short-gap oracle also fails on unchanged main: native MULTI kills exactly one real pub/sub connection then SETs the envelope before any resubscription; the next batch times out. This proves reconnect state loss without a mocked backend or a publication race. Total baseline: three distinct failing runtime regressions, no bootstrap failure. Final resource label scan empty.
