# Research

## Re-baseline

The follow-up branch starts at `origin/main` commit `2a1c8ed9`, the squash merge of #813. Run
29564434302 proves #813 fixed the initial `deno x` package lookup but not the executable re-run.

## Root cause

- Deno 2.9.3 `deno x` resolves and installs the JSR executable, then re-executes it as an internal
  `deno run` subprocess. In tag `v2.9.3`, `cli/tools/x.rs` constructs that child argv from
  permissions plus unstable flags only; it drops both `--minimum-dependency-age` and config.
- The second `@netscript/plugin-ai/meta.json` request is therefore the internal executable re-run,
  not plugin-ai's `add tool` flow and not a NetScript-created child process.
- Current Deno source explicitly forwards the minimum-age/config selections and names issue #35991,
  confirming this was upstream propagation behavior.
- The exact Deno config key is root `minimumDependencyAge`; `.npmrc` exposes `min-release-age` for
  npm policy. A generated-project `minimumDependencyAge: 0` does not repair Deno 2.9.3 `deno x`
  here because a `jsr:` main module disables config discovery in the re-run and v2.9.3 does not
  forward the discovered/explicit config.

## Local causal reproduction

On Deno 2.9.3, a fresh temp root with `deno.json` reproduced the failure using the exact published
`plugin-ai@0.0.1-beta.10` command. Adding `minimumDependencyAge: 0`, including with explicit
`--config`, still failed at the second meta lookup. Executing the published `cli.ts` URL via
`deno run -A --minimum-dependency-age=0` succeeded and emitted the tool/registries. This keeps the
policy on the only resolver process rather than relying on broken `deno x` forwarding.

## Planned surface

Change the published AI lifecycle builder from `deno x ... jsr:.../cli` to `deno run ...
https://jsr.io/@netscript/plugin-ai/<version>/cli.ts`, retain the explicit age override, and update
the full-array builder assertion. No product export, dependency, generated project, or JSR package
surface changes; jsr-audit slow-type/export risk is N/A.

## User-facing finding

Real users on Deno 2.9.x invoking freshly published plugin executables through `deno x` hit the
same internal re-resolution window for roughly 24 hours. Project config does not save this path on
2.9.3. The PR must state this explicitly to seed the beta.11 CLI-side issue.
