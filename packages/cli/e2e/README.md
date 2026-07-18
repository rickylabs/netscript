# @netscript/cli-e2e

Doctrine archetype: **6 - CLI / Tooling**.

This package owns NetScript CLI capability smoke suites. It is additive to the existing
`@netscript/cli` package and keeps `.llm/tools/e2e/scaffold-e2e-test.ts` as an independent
behavioral baseline while the product-grade suite matures.

## Quick Start

```bash
deno task e2e:cli suites
deno task e2e:cli
deno task e2e:cli run scaffold.service --format pretty
deno task e2e:cli run scaffold.plugins --format pretty
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
deno task e2e:cli:prod --cleanup --format pretty
```

Programmatic use:

```ts
import { defineCliE2eSuite, SCAFFOLD } from '@netscript/cli-e2e';

const suite = defineCliE2eSuite()
  .withId(SCAFFOLD.PLUGIN)
  .withWorkspace((workspace) => workspace.withRepoRoot('.'))
  .withScaffold((scaffold) => scaffold.withOfficialPluginSuite())
  .build();
```

## Command Surface

| Command               | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| _(no subcommand)_     | Run the full merge-readiness suite with cleanup |
| `suites`              | List built-in suites                            |
| `gates <suite>`       | List suite gates                                |
| `run <suite>`         | Run a complete suite                            |
| `gate <suite> <gate>` | Run one gate for debugging                      |

The bare `deno task e2e:cli` command runs `scaffold.runtime` with cleanup enabled. That full
merge-readiness scenario validates generated project scaffolding, official plugin addition, database
workflow, generated type checks, Aspire runtime boot, HTTP behavior checks, OTEL behavior, and
cleanup. The narrower `scaffold.plugins` suite stops after plugin scaffold and host-diagnostic
checks.

## Native desktop deployment

`deploy.desktop-native` packages the checked-in thin-client fixture through
`netscript deploy desktop package`, installs the generated Debian package with a real `dpkg`
transaction in a suite-owned alternate root, and launches the installed native runtime against
suite-owned remote-service and ephemeral-CA HTTPS release servers. The Linux leg is fail-closed:
update apply and failed-launch rollback must both complete for a `PASS` report.

Linux prerequisites are `dpkg`, `openssl`, `bsdiff`, and the native desktop GTK/WebKit libraries.
Run the exact one-pass gate from a native Linux filesystem (WSL paths under `/home`, never
`/mnt/c`):

```bash
deno task e2e:cli run deploy.desktop-native --cleanup --format pretty
```

The structured native report is written to
`.llm/tmp/desktop-native-e2e/evidence.json`. A host-inapplicable gate is `NOT_RUN`, not a pass.
The current WSL execution reached the signed manifest through ephemeral-CA TLS but failed in the
packaged runtime because `op_desktop_verify_ed25519` was unavailable; that recorded `FAIL` is the
Linux verdict until the consumed runtime/SDK seam is reconciled and the complete gate reruns green.

Owner-hosted Windows invocation (from an elevated Developer PowerShell in a native Windows clone):

```powershell
deno task e2e:cli run deploy.desktop-native --cleanup --format pretty
```

The Windows MSI/manual-update leg remains `NOT_RUN` until that owner-hosted command produces its
report. On macOS, use the same command from a native checkout with Xcode command-line tools and
`hdiutil`; the DMG leg is best effort and likewise remains `NOT_RUN` without a host report. Never
translate either unavailable host into a green checkbox.

`deno task e2e:cli:prod` runs the same `scaffold.runtime` suite in prod-local mode: the CLI
entrypoint is the local public binary (`packages/cli/bin/netscript.ts`), while generated workspaces
resolve `@netscript/*` dependencies from JSR via `--source jsr`. This mode requires no JSR publish
and no CLI install; it validates the branch's public CLI flow against already-published package
versions. Public plugin dispatch uses Deno's `x` subcommand, with permissions before the JSR
specifier. Published `jsr:@netscript/*` invocations also pass `--minimum-dependency-age=0`: release
E2E deliberately tests lockstep artifacts published seconds earlier, so Deno's default supply-chain
minimum-age window must not delay the production verdict by roughly 24 hours.

Version pinning. The generated project pins `jsr:@netscript/*@<CLI deno.json version>`. The suite is
green only when that version is already published on JSR. On `main`/alpha.4 -> published -> green.
On a version-bump branch (e.g. alpha.5 before publish) -> expected-pending until publish. Follow-up
idea: a `--package-version` override on the public `init` to target an explicit published version
(out of scope here).

#124 blind spot. Prod-local runs the public bin from LOCAL source (`file://`), so it does NOT
exercise the `https://` asset-read path and CANNOT catch the CLI-self-asset class (#124). That
remains covered exclusively by the published-CLI smoke (`e2e-cli-prod.yml`).

`gate <suite> <gate>` is a narrow debugging command. It does not automatically run prerequisite
gates, so dependent gates such as `database.init`, `database.generate`, runtime waits, and behavior
checks require an existing generated project via matching `--smoke-root` and `--name` options. CI
and requested PR checks should use
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` instead of invoking
`database.init` directly.

## Built-in Suites

| Suite                     | Coverage                                                   |
| ------------------------- | ---------------------------------------------------------- |
| `scaffold.service`        | init, generated service discovery, typecheck               |
| `scaffold.contracts`      | init, generated contract discovery, typecheck              |
| `scaffold.infrastructure` | init, database init/generate/seed, typecheck               |
| `scaffold.plugins`        | init, official plugins, registry generation, plugin doctor |
| `scaffold.runtime`        | full scaffold runtime behavior path                        |

## Required Permissions

The CLI entrypoint is intended to run with `--allow-all` because smoke tests create files, spawn
`deno`, `aspire`, and `docker`, and call local HTTP endpoints. Narrower permissions for the current
implementation are:

- `--allow-read`
- `--allow-write`
- `--allow-run`
- `--allow-env`
- `--allow-net`
- `--allow-sys`

## Docker Cleanup

Before a smoke run starts, the suite snapshots existing Docker container IDs. After the run
completes, it stops the generated Aspire AppHost and removes only containers that were created after
that snapshot. Existing containers from the main checkout are left untouched.
