# Runtime acceptance must respect the public DTO

Workers execution responses deliberately omit correlationId. Use the public
`/api/v1/workers/executions/by-correlation/{correlationId}` endpoint to establish seed provenance,
then assert completion, actual result, progress and time. Parse the canonical public response
schema in a regression fixture; a hand-built DTO containing hidden fields can mask a broken test.

The first CI run 41418574351 at f82ef33 exercised two documented variants in 189693ms. The seed
negative control was RED while real stream-backed Activity passed. The next variant completed a
real job, exposing the test's incorrect DTO assumption. That run is a failed attempt, not acceptance.

The general teardown reporter did not enumerate detached AppHosts on that runner. Reuse the existing
runtime/evidence/cleanup.ts fixture helper with the exact generated AppHost and project root.
Place the documented gate after static init so the main cleanup tail has a valid AppHost file,
while keeping it before all plugin-link and runtime-restart fixtures. Preserve nested errors.
