# fix-aspire-lifecycle — context pack

Grouped beta.12 fix. Branch `fix/aspire-lifecycle`, milestone `0.0.1-beta.12`.

## Issues

- **#958** — `fix(aspire): default 120s start timeout fails the first cold AppHost start`.
  Triple-confirmed (GPT-5.6 Sol measured ~67s of cold TypeScript AppHost validation;
  Grok 4.5 and Claude Fable 5 both hit the 120s default). A warm retry succeeds.
- **#970** — `fix(aspire): persistent Postgres conflicts with isolated instances; prisma-studio exits 1`.
  `ContainerLifetime.Persistent` reuses the previous container while `--isolated` generates
  new endpoints, so the port mapping belongs to the earlier instance and Postgres stays
  unhealthy. Second half: the generated `prisma-studio` executable exits 1 with only
  `Finished` shown in the dashboard.

## Shared-cause hypothesis

Both are the **same lifecycle bug seen from two sides**: NetScript's generated AppHost is written
as if every `aspire start` were the *only* start on the machine. Nothing in the generated graph
is scoped to the instance, and nothing in the CLI accounts for a start that has never been
validated before.

- The instance has no identity. `--isolated` re-allocates endpoints, but generated resource
  identity (container name, lifetime, data bind mount) is workspace-global. A `Persistent`
  container therefore straddles two instances and one of them is always wrong (#970).
- The first start is treated as a steady-state start. Cold AppHost validation happens *inside*
  the start window, so the 120s budget is spent on work that the CLI could have done during
  `aspire restore` — and the CLI reports the timeout without saying which phase consumed it (#958).

Fixing the symptoms separately (bump the timeout, force `Persistent: false`) leaves the
underlying rule unwritten: **what a persistent resource means when more than one instance of the
workspace is running, and what the start budget is actually paying for.** That is a semantics
change to an existing configuration key, hence the plan.

## Known code touchpoints (recon only — verify before trusting)

- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts:108`
  emits `.withLifetime(ContainerLifetime.Persistent)` unconditionally from `entry.Persistent`,
  with no isolation awareness.
- `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:203` seeds
  `Tools['prisma-studio'].TaskName = 'db:studio'`.
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-tools.ts:38`
  resolves that task name into the generated executable. Possible mismatch between the seeded
  `db:studio` and what the scaffolded workspace actually defines — a candidate root cause for
  the exit-1 half of #970, but UNVERIFIED.

## Non-goals

Do not merge, do not undraft. The supervisor verifies and promotes.
