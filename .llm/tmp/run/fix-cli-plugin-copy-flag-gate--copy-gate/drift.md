# Drift — fix-cli-plugin-copy-flag-gate--copy-gate

## 2026-06-26 — significant — default-off local copy conflicts with runtime e2e expectations

While preparing S1, the implementation agent found downstream gate coupling that makes the locked
default-off decision unsafe to apply silently.

Evidence:

- `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` waits for and calls the full
  first-party worker/saga/trigger/auth HTTP surfaces, including `/api/v1/workers/jobs`,
  `/api/v1/workers/tasks`, `/api/v1/sagas/sagas`, `/api/v1/webhooks/inbound/generic`, and auth
  session routes.
- `packages/cli/e2e/src/application/gates/scaffold/database-gates.ts` type-checks generated
  workspaces including `./workers`, `./sagas`, and `./triggers`.
- `packages/cli/src/kernel/assets/registry-generator-fixture.ts` discovers and reads root copied
  official plugin sample/runtime directories such as `workers/jobs`, `sagas`, and `triggers`.
- The thin-stub branch in `packages/cli/src/kernel/adapters/plugin/scaffolder.ts` generates only a
  starter `plugins/<name>/` workspace with generic router/service/sample stubs. It does not create
  the root `workers`, `sagas`, or `triggers` implementation workspaces and does not provide the full
  behavior endpoints asserted by `scaffold.runtime`.

Impact:

The plan's S3 says to update `scaffold.plugins`/`scaffold.runtime` expectations while still running
the full runtime suite green. Under the current scaffold implementation, simply flipping local
official plugin add to default thin stubs would make the runtime suite stop validating the actual
first-party plugin behavior it currently asserts.

Required decision before implementation:

1. Keep copy default-on for maintainer/runtime e2e and add `--no-copy-source` as the opt-out, or
2. Keep D1 default-off but also implement a replacement runtime reader/scaffold path that preserves
   the full first-party behavior gates without vendoring source.

No implementation files were changed before this drift was recorded.

## 2026-06-26 — resolution — D1 flipped to default-on with `--no-copy-source`

Supervisor decision after reviewing the drift: flip plan decision D1. Maintainer/local official
plugin source copy remains default-on, preserving today's vendored-source behavior and keeping
`scaffold.plugins` / `scaffold.runtime` validating the real first-party plugin implementations. The
new flag is a single opt-out, `--no-copy-source`, with help text "Generate a thin local-import stub
instead of copying the official plugin source tree."

Rationale:

- Runtime-gate coupling makes default-off a separate, larger reader-rework program.
- The user's requirement was that maintainer copy be optional and behind a flag; an opt-out flag
  satisfies that requirement without changing the maintainer default.
- The user's primary prod/JSR no-copy guarantee remains satisfied by leaving the public path
  hardcoded to `importMode: 'jsr'` and adding a regression lock.
- Default-off plus a replacement runtime reader/scaffold path can be requested later as its own
  scoped task.
