# Context Pack — CLI JSR production hardening

Run `fix-cli-jsr-prod-hardening--prod-hardening` implements PR #127 on branch
`fix/cli-jsr-prod-hardening` as three commits:

1. S1 — portable asset hydration and lazy public scaffold bootstrap.
2. S2 — JSR `bin` map for the public `netscript` command.
3. S3 — production package-source e2e wiring and release workflow.

Current process note: the checked-in run directory had the revised plan but not the second
PLAN-EVAL artifact or tracking files. The implementation proceeds from the user-provided
PLAN-PASS instruction and records that mismatch in `drift.md`.

S1 implementation status: portable `TemplateRegistry.hydrate()` and cached sync template reads are
implemented, public scaffold/render commands hydrate lazily at command entry, `editor-config.ts`
uses a JSON module import, contract templates read through manifest keys, and focused tests plus
public local `init` are green. Root scoped lint/fmt wrappers cannot produce package evidence because
the workspace Deno config excludes `packages/cli`; touched-file raw lint/fmt checks are green and
the wrapper/config limitation is recorded in `worklog.md`.

S2 implementation status: `packages/cli/deno.json` now has top-level
`"bin": { "netscript": "./bin/netscript.ts" }` next to unchanged `exports`. `deno publish
--dry-run --allow-dirty --no-check=remote`, `deno doc --lint packages/cli/mod.ts`, scoped
`run-deno-check.ts`, and package `deno task check` all passed. No lockfile changed.

S3 implementation status: the e2e runner now accepts `jsr` as a first-class `packageSource`, suite
workspace defaults can carry an overridden package source, scaffold init rejects `--source jsr`
unless `--cli jsr:@netscript/cli@<version>` is pinned, and plugin add gates avoid the maintainer
saga shortcut in JSR mode. The new `.github/workflows/e2e-cli-prod.yml` runs on release publication
or manual dispatch, installs the published JSR CLI, performs a public init smoke, and then runs the
existing full runtime suite via `--source jsr --cli jsr:@netscript/cli@<version>`. Root check,
scoped check, direct touched-file lint/fmt, and YAML parsing passed; the expensive runtime smoke was
not run locally by plan.
