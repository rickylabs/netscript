# Implementation Prompt: #1452 Slice 3 plugin service host context

use harness

## SKILL

- `netscript-harness` — follow the locked slice and keep run artifacts current.
- `netscript-doctrine` — preserve plugin thinness and the structural base seam.
- `netscript-deno-toolchain` — inspect and validate the public Deno/JSR surface.

Implement only `.llm/runs/feat-plugin-service-context-s3--1452/plan.md`.

1. Extend `PluginServiceContext` with optional opaque appsettings.
2. Extend `createPluginServiceContext` with optional async `getAppsettings` and `getEnvironment`
   resolvers. DB/KV remain lazy; env/appsettings resolve once during assembly. Preserve the current
   environment default and zero concrete dependencies.
3. Strengthen the focused factory test.
4. Add a generated-consumer integration test that reads/uses the already-shipped CLI service-context
   template and proves workers, auth, and sagas services construct and reach ready, then stop. If a
   genuine scaffolded project is required, stop and report it; do not substitute an object-shape
   unit test.
5. Do not edit `packages/cli`, `packages/plugin/deno.json`, or `deno.lock`.
6. Update `worklog.md` and `context-pack.md`; do not commit or push. The supervisor performs slice
   review and the sign-off commit after gates.

