# Research

- Issue #1251 is the specification and was read before code inspection.
- `generate-register-infrastructure.ts` deliberately skips SQLite resources.
- `generate-appsettings.ts` emits scaffolded Deno KV as `Mode: External`, which becomes an unresolved connection-string resource.
- Existing container/executable backing services expose endpoints but infrastructure generation does not attach health checks.
- The implementation must use the Aspire TypeScript SDK's supported resource/health APIs and preserve generated AppHost type-checking.

