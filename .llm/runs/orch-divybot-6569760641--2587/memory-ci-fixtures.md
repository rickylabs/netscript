# CI clean fixture dependencies

`docs:snippets` materializes generated application modules in
`.llm/tools/docs/service-scaffold-support.ts`; new relative template imports must be
materialized there too. `docs:accuracy` alone does not compile fences.

`netscript-dev init` injects root imports while consumer CLI init does not. A passing
maintainer workspace cannot prove every consumer import: generated database seeds that
use `@std/path` must declare that existing resolver mapping in their database deno.json.
`deno task e2e:cli run scaffold.service --cleanup --format pretty` exercises that boundary.

Runtime Overview now consumes record activity, so its existing persistent-stream fixture
links the users service and the existing live CRUD gate performs a successful PATCH.
Do not replace the ready-panel assertion with empty/unavailable acceptance.

SQLite deliberately excludes the Postgres live-endpoint gate. Put provider-neutral record
mutation in `behavior.record-activity`, shared by both suites before `behavior.app-home`.
The latter must still require populated ready panels; do not synthesize event payloads.
