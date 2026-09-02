# Implementation Prompt: SDK reference contribution example

Use harness.

## SKILL

- `netscript-harness` — obey the locked single-page docs slice and leave run artifacts to the supervisor.
- `netscript-deno-toolchain` — treat the already-recorded `deno doc` signatures as the API authority.

## Task

Edit only `docs/site/reference/sdk/index.md`. Under the service-client reference, add one compact
reference section that:

1. states that `CreateServiceClientOptions.contributions` accepts an explicit literal tuple and that
   tuple inference projects declared context onto per-call client context;
2. inventories the six `SdkClientContribution` fields: `protocol`, `id`, `context`, `headerKeys`,
   `responseCache`, and `prepare`;
3. contains one self-contained TypeScript example that imports and binds every name, defines a small
   oRPC contract, defines a required `tenantId` contribution owning lower-case `x-tenant-id`, uses a
   partitioned response cache keyed by `tenantId`, passes `[tenantHeader] as const` to
   `createServiceClient`, and calls the client with typed context.

Use no `any`, `declare`, or compiler escapes. Keep this as reference documentation: concise surface
description and a compact example, not a copy of the guide's auth/locale narrative. Do not edit any
other file and do not run formatters or generators.
