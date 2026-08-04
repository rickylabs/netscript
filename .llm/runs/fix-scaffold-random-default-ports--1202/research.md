# Research — randomized scaffold default ports

## Re-baseline

- Evidence source: live issue 1202 body and its live comments, read before code inspection.
- Re-derived against `origin/main` at `f7558aa1c4e06f076114d924c7324feddf554e45` on 2026-08-04.
- The live API reports two comments although the owner brief says three. Both live comments were
  read; the discrepancy is recorded rather than filling in a missing comment from inference.
- The branch equals that baseline. The supplied worktree contains a pre-existing `deno.lock`
  modification; this run will neither revert nor commit it.

## Evidence findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Every local reproduction fails at the DB-backed `users` process pinned to fixed host port 3001; dynamically allocated siblings stay healthy. | Issue body and owner comments. |
| 2 | The owner diagnosis is a Windows autostart service occupying that range and becoming visible through WSL2 localhost forwarding. | Latest owner scope-amendment comment. |
| 3 | Cloud CI does not have that Windows service and is the owner-declared verdict source for the expensive runtime gate. | Owner brief for this slice. |
| 4 | Default init already omits `HostPort`, but the runtime E2E command defeats that behavior by explicitly passing `--service-port 3001`. | `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts`; `generate-appsettings.ts`. |
| 5 | Standalone generated service and app source still bake low/common fallback listeners (3000, 8010, and Vite 5173). | `validate-init.ts`, `write-app-files.ts`, service/app template assets. |
| 6 | `service add` and both plugin scaffold paths allocate from fixed low windows and persist legacy `Port`, which the AppHost treats as a pinned host-port alias. | `port-allocator.ts`, `plugin/scaffolder.ts`, `appsettings-entry-builders.ts`, `render-http-endpoint.ts`. |
| 7 | Aspire-generated resource registration supports fully dynamic endpoints by omitting `HostPort`/`Port` while injecting the chosen endpoint through `PORT`. | `render-http-endpoint.ts` and its focused tests. |
| 8 | Database/cache/OTLP target ports are protocol-owned internal/container contracts, not generated application host-listener defaults. | infrastructure generator and database adapters. |

## jsr-audit surface scan

- Surface: `@netscript/cli` internal scaffold planning, generator adapters, and E2E command emission.
- Planned changes do not alter `deno.json`, root/subpath exports, dependencies, versions, or public
  entrypoints. Internal result shapes may gain explicit host-pin provenance but are not exported.
- No slow-type risk is expected. CLI doc-lint and publish dry-run remain final framework-wave gates.

## Open questions

- Resolved now: Aspire defaults are fully dynamic; only explicit user overrides pin host ports.
- Resolved now: standalone fallbacks are deterministic per project/resource, not re-randomized on
  every start, so a generated project is stable across restarts.
- Resolved now: the allocation range is 49152–65535. The lower bound is the generated-output floor.
- Owner-owned: identify and record the Windows autostart service. This PR does not claim that box.

