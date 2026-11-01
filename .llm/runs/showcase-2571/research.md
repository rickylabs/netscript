# Initial source findings

- Public and maintainer init have no example selector. `--from` is an empty
  InitPreset registry with only id/label; do not pretend it already executes recipes.
- Shared validation resolves database/service/model. Public interactive prompts
  must receive showcase defaults before asking about service/database; explicit
  contradictory flags must remain distinguishable from omitted defaults.
- Public init calls executeInit, then preset/agent installation. Maintainer init
  calls executeInit, then syncPackages and preset. executeInit currently prints
  completion/JSON before those outer effects. A showcase must not emit success
  until its recipe has finished; choose one completion owner, not two JSON records.
- Maintainer root dependencies deliberately clear sourceRoot during base init and
  leave scaffoldWorkspacePackages empty; local package sync happens afterward.
  Therefore installing copied-source plugins inside the current base phase before
  sync is unsafe without moving or explicitly deferring that effect.
- Existing installPlugin use case accepts kind/name, DB selection, service/plugin
  references, localPath/JSR, no-samples, MCP and injected I/O. Prefer reuse from the
  command dependency graph; no new subprocess/plugin install protocol.
- Auth manifest defaults to kv-oauth, with external provider configuration. AI
  default starter excludes thread persistence; durable chat needs the explicit
  thread store seam, not merely the sample island. Existing scaffold sign-in and
  capability pages can display configured/unconfigured distinctions.
- Worker/saga/trigger/stream adapters emit type-checked userland resources.
  Saga core exposes durable worker-command effects and state/correlation APIs.
  The showcase must use those runtime seams rather than async work in Fresh loaders.
- Full e2e-cli workflow supports workflow_dispatch on a branch (no inputs). Its
  PostgreSQL/SQLite runtime jobs can host the showcase proof without relying on
  the ordinary-PR skip policy. Any workflow edit needs declared scope and carrier
  review; generic scaffold.runtime must retain its own coverage.

Contributor API inspection: deno doc supports a single --filter symbol, not a
comma-separated symbol list. Runtime core packages are packages/plugin-*-core,
not plugins/*-core. No dependency version changes are required.
