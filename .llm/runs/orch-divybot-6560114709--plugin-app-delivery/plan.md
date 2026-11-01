# Plan & Design — READY FOR REVIEW

Fix #2578 through the existing settings, plugin declaration, discovery and registry paths.
Archetypes: CLI/tooling (6), Aspire integration (2), workers plugin (5).

## Locked contract

- `NetScript.Apps.<name>.PluginReferences` contains plugin resource configuration keys,
  including companion API keys such as `workers-api`. Preserve existing references.
- `plugin install --app <name>` selects an enabled web app. Without the option, select enabled
  web apps. Persist selection in `scaffold.plugin.json` linking consumer metadata so install,
  update and removal reconciliation share one source of truth. Validate selection before writes.
- The generated AppHost reads current app reference arrays at execution time and injects
  plugin endpoints through the same server/Vite discovery variables as service endpoints.
- Installation runs the existing manifest-driven registry generator after plugin registration.
  Workers `/cli` remains importable and becomes executable through its existing composition.
  Doctor recommends the project-local CLI where available, otherwise the installed package version.
- Remote Docker is explicitly rejected by doctor when published container endpoints are unreachable
  from the AppHost. Verify upstream configuration before claiming a container-host override solves it.
- Runtime acceptance exercises the actual overview for workers and streams, following installs,
  and runs in the existing Docker CI runtime suite.

## Slices and gates

1. Bootstrap: this contract and research; draft PR with Refs #2578, no labels.
2. Delivery: install selection/persistence, runtime endpoint wiring, registry lifecycle, doctor,
   docs and regression proof. Gates: scoped check/test/lint/fmt; quality:gate; JSR audits;
   generated carrier chain; every root check:* task on Deno 2.9.7; release:preflight;
   docs:accuracy; full scaffold.runtime in CI. Keep worklog/context current.
3. Independent read-only Claude IMPL-EVAL, repairs on the same evaluator session, evidence update.

## Risk and deferral

Preserve third-party explicit consumers, disabled apps, renamed instances, dry runs, no-app projects
and no-samples registries. Registry generation errors must fail installation. Update E2E negative
controls to deliberately remove generated registries now that install owns their initial creation.
No dependency upgrades, UI redesign, authentication bypass, release or merge is authorized here.

PLAN-EVAL: N/A. This restores an existing persisted reference contract using existing reconciliation,
endpoint discovery and registry producer interfaces; no new public abstraction or routing choice.
Independent implementation evaluation is mandatory.
