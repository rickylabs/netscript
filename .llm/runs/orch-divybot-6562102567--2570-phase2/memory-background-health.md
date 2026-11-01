# Background discovery — 2026-11-01

Generated app health already probes a background child’s `/health` and requires `state: ready`, `registryReady: true`, `dependencyReady: true`. A healthy worker can appear unwired when Aspire app registration never receives the background resource map. Carry `registerBackgroundProcessors`’ result into `registerApps` and inject child endpoints through server-only `services__…__http__0`. Match the Deno/RequiresKv endpoint predicate; never use the worker API sibling’s health as evidence for the child. The live S6 fixture reports5healthyresources.

Changing appsettings cache definitions requires `netscript-dev generate aspire`; generating plugin registries does not regenerate infrastructure. Finish DB CLI operations before starting the normal AppHost, because their lifecycle cleanup stops the owned host. DB CLI mode returns before plugins/workers register, so automatic seed-triggered jobs need a deliberate lifecycle handoff.
