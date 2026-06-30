# Drift

- 2026-06-30 Slice 0 (minor): The PLAN-EVAL refinement said sagas already exposed
  `startSagaRuntime`; inspection showed the real exported start API was `startSagaRunner`.
  Chose option (a) and added `startSagaRuntime` as an additive alias while keeping the existing
  `./runtime` export and real saga background runner.

- 2026-06-30 finalize (minor): Reproduced the remaining `behavior.triggers-webhook`
  failure with `deno task e2e:cli run scaffold.runtime --format pretty`; direct
  probe returned `HTTP/1.1 404 Not Found` with body
  `{"accepted":false,"status":404,"error":"TRIGGER_NOT_FOUND","message":"Trigger inbound/generic not found."}`.
  Manual AppHost logs for `triggers-api` showed post-listen startup failed before
  context population:
  `KvConnectionError: Redis/Garnet KV provider was auto-detected but the Redis adapter is not registered. Add import '@netscript/kv/redis';`.
  The generated helper also still pointed `NETSCRIPT_TRIGGER_REGISTRY_MODULE` at
  the project trigger barrel (`../../triggers/mod.ts`) rather than the generated
  registry path; the reproduced scratch project lacked the generated registry file,
  so the registry loader now derives a project-barrel fallback from an explicit
  missing generated-registry URL.
