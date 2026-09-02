# Implementation Brief

## SKILL

- `netscript-harness` — slice discipline, run artifacts, and evidence rules.
- `netscript-deno-toolchain` — dry-run publish-set inspection.
- `netscript-doctrine` — package publish-surface decision.
- `netscript-pr` — closing keyword, labels, milestone, and PR structure.

Implement issue #1897 as one package-hygiene slice. Add only `"tests/"` to `packages/fresh/deno.json` `publish.exclude`, preserving surrounding order and formatting. Prove zero `tests/` publish entries and run the owner-specified gates. Preserve `deno.lock` exactly.
