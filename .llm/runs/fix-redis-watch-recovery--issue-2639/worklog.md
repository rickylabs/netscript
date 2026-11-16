# Worklog

## Design

Current-state watch contract, live lease identity and lifecycle research are in plan.md. Initial state is connected; close enters reconnecting, successful SUBSCRIBE acknowledgement enters resynchronizing/connected, exhausted recovery enters failed, release/adapter close enters closed. Shared subscription owner supervises physical subscriber; individual watch queues own caller cancellation and typed failure propagation. Redis remains external clock/transport adapter; native retry/delay own bounded timing, all cleanup must cancel it. No new handler registry, port or global state.

Bootstrap only. No production changes or reproduction claimed. Next write/run genuine server-outage regression on unchanged main and lock plan before separate evaluation.
