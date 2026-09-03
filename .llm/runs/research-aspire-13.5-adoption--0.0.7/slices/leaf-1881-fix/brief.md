use harness

# Slice: readme.quickstart install-root isolation (Canary 9 exact red, #1881 / #863 gate 3)

## SKILL

Load and follow: `.agents/skills/netscript-harness`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-tools`, `.agents/skills/netscript-pr`, `.agents/skills/aspire`.
Archetype 6 (CLI/tooling), nested E2E gate workspace `packages/cli/e2e`. Gate code only — no
product behaviour, no `packages/*/src` outside `packages/cli/e2e`, no `plugins/`, no lockfile.

## Exact red (immutable evidence, do not rerun)

Canary 9 `e2e-cli-prod` run 33704697088 at `v0.0.7-canary.9`: scaffold.runtime and
quickstart.walk PASSED; `readme.quickstart.01-install-cli` FAILED, exit 1, receipt 01.json:
argv `deno install --global --allow-all --name netscript jsr:@netscript/cli@0.0.7-canary.9`,
stderr `error: Existing installation found. Aborting (Use -f to overwrite).`. Cause: the workflow's
earlier "Install published CLI from JSR" step already owns the ambient global `netscript`; the
README command inherits the runner env (`runCommand` → `runAspireCommand` in
`packages/cli/e2e/src/application/gates/quickstart/readme-command.ts` passes no `env`).
`cleanup.aspire-stop` red is downstream (scaffold never ran) — do not touch cleanup.

## Fix (decided; no owner decision)

1. In `readme-command.ts`: derive a run-owned install root `resolve(runRoot, '.deno-install')`
   (created on index 0 in `initializeState`, recorded in `ReadmeWalkState` as
   `denoInstallRoot`). Spawn EVERY README command (all indexes, not just index 0) with env
   `DENO_INSTALL_ROOT=<root>` and `PATH=<root>/bin<delimiter><ambient PATH>` so command 1
   installs into the isolated root and later `netscript …` commands resolve to exactly the binary
   the README installed. `aspire`, `deno`, `curl` still resolve from the ambient PATH tail.
2. Extend `runAspireCommand(command, cwd, timeoutMs, env?)` in `aspire-walk.ts` with an optional
   `env: Record<string,string>` (merged over inherited env via `Deno.Command({ env })`). Default
   behaviour for `quickstart.walk` MUST be unchanged (no env passed there).
3. Receipt: add `environment: { denoInstallRoot, pathPrepend }` to `ReadmeCommandReceipt` so the
   hosted receipt proves isolation. argv stays verbatim — NEVER add `-f`, never edit README.md,
   never uninstall/remove the workflow's prior install, no retry, no fallback.
4. Do NOT change `.github/workflows/e2e-cli-prod.yml`.

## RED/GREEN proof (required)

- RED first: a focused test in `packages/cli/e2e/tests/presentation/readme-quickstart-suite_test.ts`
  (or a new `tests/application/readme-command_test.ts`) that drives index 0 through the command
  seam with a fake runner/recorded spawn and asserts (a) the spawned env carries
  `DENO_INSTALL_ROOT` under `runRoot` and `PATH` starting with `<root>/bin`, (b) argv is byte-
  identical to the README command with only `<version>` substituted (no `-f`), (c) index ≥1
  commands carry the same env. Commit the failing test, then the fix, then the green run — cite
  both outputs in the worklog. If a spawn seam does not exist, add the smallest injectable
  `spawn` parameter (default = real) — no test-only branches in production paths.
- Existing tests must stay green: `readme-quickstart_test.ts`, drift test, suite/registry tests.

## Gates (scoped; no runtime)

`deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`;
`deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests`;
`deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`;
lint on changed files only (desktop-native fixture `catalog:` refusal is a known baseline);
`deno task e2e:cli gates readme.quickstart` (listing only). Do NOT run readme.quickstart,
quickstart.walk, scaffold runtime suites, Aspire, or Docker.

## PR

Branch `fix/aspire-1881-readme-install-isolation` off main `45e57377f`. Title:
"fix(e2e): isolate DENO_INSTALL_ROOT for the verbatim README quickstart walk (#863 gate 3)".
Body: exact red above with run id and stderr line; RED/GREEN outputs; `Part of #1881` and
`Part of #863` (NO closing keyword — #1881 closes only on the green hosted transcript). Labels
`type:fix area:cli area:aspire gate:e2e priority:p0 orchestrator:aspire status:impl`, milestone
0.0.7. Open non-draft. Record worklog/drift under
`.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/`. Do not mark ready-merge.
