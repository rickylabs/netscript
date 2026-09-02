# Research — fix-workers-sample-plugin-source--1874

## Re-baseline

- Carried-in source: issue #1874 brief and PR #1872 head.
- Re-derived against `898d3aada814f2f926ff2fac4b26561d38c8f775` on 2026-09-01.
- The D6 source-mismatch rejection is present and correct. The official sample writer is the
  inconsistent producer.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `create-user-settings` points outside `workers.jobsDir` into `plugins/workers/jobs` but omits `source: 'plugin'`. | `plugins/workers/src/cli/official-sample-configuration.ts` |
| 2 | Missing source normalizes to `local`, while discovery classifies the same path as `plugin`; D6 rejects that disagreement. | `plugins/workers/src/cli/runtime-registry-generator.ts` |
| 3 | The official sample writer authors no other `../../plugins/...` entrypoint, so there is no second latent mismatch in this surface. | focused `rg` over official sample writers |
| 4 | Existing debt records 20 private-type-ref diagnostics under #1655; this config-data repair neither changes nor deepens that public-surface debt. | `.llm/harness/debt/arch-debt.md` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `plugins/workers/deno.json` exports and the two planned files.
- Slow-type / surface risks: none introduced. The repair changes no export, public type, module
  documentation, dependency, or publish include/exclude rule. Existing #1655 debt is unaffected.
- A publish dry-run is not necessary to distinguish this one-line authored-data correction; the
  focused static gates and unchanged lockfile provide the bounded evidence requested by the owner.

## Open questions

- None. The correct source is fixed by ownership of the discovered entrypoint.
