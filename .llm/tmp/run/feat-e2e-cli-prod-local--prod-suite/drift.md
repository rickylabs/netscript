# Drift

## 2026-06-26 - Significant - Prod-local proof fails after guard relaxation

The user brief stated that no `packages/cli/src` change was needed and that the e2e harness guard was
the only code blocker. After relaxing the guard and adding `e2e:cli:prod`, the prod-local runtime
smoke failed at `scaffold.plugin.worker`.

Observed failure:

- `scaffold.init` passed via `deno run -A packages/cli/bin/netscript.ts init ...`.
- `scaffold.plugin.worker` invoked `deno run -A packages/cli/bin/netscript.ts plugin add worker ...`.
- Public plugin dispatch attempted `deno dx jsr:<plugin>/cli ...`.
- Deno 2.9 reported `Module not found ".../dx"`.

Impact: the required prod-local proof is not green, so this slice was not committed or pushed.

## 2026-06-26 - Minor - More pre-existing OpenHands line-ending drift than brief listed

The brief named two pre-existing modified OpenHands request files. `git status --short` showed six
modified `.llm/tmp/run/openhands/**/request.md` files. They were treated as unrelated and left
unstaged.

## 2026-06-26 - Significant - Published plugin CLI cannot satisfy public `plugin add`

After correcting public dispatch from `deno dx` to `deno run -A`, prod-local no longer exercises the
invalid Deno subcommand. The next failure is still in public plugin management: `plugin add worker`
passes the official kind alias `worker` into the dispatch path, which resolves as `jsr:worker/cli`
and fails because that JSR package does not exist.

Manual verification shows that mapping `worker` to `@netscript/plugin-workers` would not complete
the suite: `deno run --no-lock -A --minimum-dependency-age=0
jsr:@netscript/plugin-workers@0.0.1-alpha.4/cli add ...` resolves the published `/cli` export but
returns `Unknown command: add`. The published plugin CLI exposes worker-owned commands such as
`add-job`; it does not expose the framework install verb required by public `netscript plugin add`.

This is separate from the original `deno dx` defect and blocks the required green prod-local proof.
No commit or push was made.

## 2026-06-26 - Significant - Final prod-local fix expanded beyond streams import map

The handoff identified `@durable-streams/server` as the next missing prod import-map entry. That was
real, but not the last prod-local blocker.

Additional fixes required:

- Copied auth/sagas/streams/triggers/workers official plugin workspaces needed explicit prod-mode
  JSR/npm imports for their direct runtime dependencies.
- The copied `workers/bin/combined.ts` did not load
  `.netscript/generated/plugin-workers/jobs.registry.ts`, so the worker process had no generated
  static job definitions/handlers and `behavior.workers-executions` stayed empty after triggering a
  job.
- The copied worker workspace also missed `@netscript/cron`, which made the worker background
  entrypoint fail direct prod type-check.

Resolution: manifests were wired through the real copied-workspace import-map path, the worker
combined entrypoint now loads generated definitions/handlers when present, and prod/local-source
runtime smokes both pass.

Validation drift: `rtk proxy`/tool polling repeatedly left or queued an extra prod smoke process. I
waited for active runs to finish and verified no apphost/listeners before launching the maintainer
smoke.
