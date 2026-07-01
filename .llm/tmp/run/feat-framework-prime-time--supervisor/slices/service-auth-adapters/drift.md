# Drift — service-auth-adapters

## Deferred scope

- WorkOS webhook-to-database user/org sync remains deferred by the approved plan.
- CLI scaffold prompts for auth provider selection remain deferred by the approved plan.

## Slice 1

- No implementation drift.

## Slice 6

- `deno task deps:audit` still reports pre-existing `undici` and `vite` advisories outside this
  slice's new provider packages.
- `deno task arch:check` still reports pre-existing repository-wide doctrine failures outside the
  new auth adapter packages. The schema-generation wrapper was adjusted to avoid adding a new
  `Deno.exit` architecture warning.
- Running the better-auth schema-generation wrapper help smoke caused Deno to add an exact
  `npm:better-auth@1.6.20` resolver entry alongside the catalog-range resolver in `deno.lock`.
  This is lockfile churn from the approved wrapper path, not a version-pin change.
