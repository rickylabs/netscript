# Research — desktop-orpc-contract-dep--impl

## Re-baseline

- Carried-in source: issue #1926 and dispatcher brief `implement.md`.
- Re-derived against `origin/main` @ `37452f11f5045f0f5a98e07d802bcc2a2e94333b` on 2026-09-02.
- The branch equals current `origin/main`; the established import-map diagnosis remains current.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The SDK and checked-in fixture use the `@orpc/*` `^1.15.0` family, but the fixture omits `@orpc/contract`. | `packages/sdk/deno.json`; `packages/cli/e2e/fixtures/desktop-native/deno.json`; `deno task deps:latest --filter @orpc/contract` reports 0 behind. |
| 2 | A repository-root wrapper scan passes because it uses the root workspace resolution context; running the wrapper with the fixture as `cwd` fails, proving the current ordinary root scan is insufficient. | Compare `run-deno-check.ts --root packages/cli/e2e/fixtures/desktop-native` with `--cwd packages/cli/e2e/fixtures/desktop-native --root .`. |
| 3 | The native suite copies the fixture and replaces its import map in `fixture-workspace.ts`; the prepared map is the packaging/runtime authority and also omits `@orpc/contract`. | `packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts`. |
| 4 | The prepared fixture already materializes the root catalog, so a structured check over that temporary workspace can inspect the exact packaged dependency graph without the checked-in fixture's standalone catalog error. | `prepareDesktopFixture()` sets `workspace = []`, copies the root catalog, and writes the staged imports. |
| 5 | Ordinary PR CI runs the root `check` task in `.github/workflows/ci.yml`; `desktop-native-linux` itself remains label/release/manual only. | `.github/workflows/ci.yml`; `.github/workflows/e2e-cli.yml`. |

## jsr-audit surface scan

- N/A: this changes a non-published CLI E2E workspace and root task wiring, not a package export,
  `mod.ts`, JSDoc, or publish surface.

## Open questions

- None. The issue fixes the dependency range, required runtime lane, acceptance criteria, and scope.
