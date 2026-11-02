# CLI quality ratchet

`deno task quality:cli` runs both structured lint and formatting wrappers with
`--root packages/cli --ext ts,tsx` and a scoped config that omits root exclusions. It runs in
`ci:quality` and in the CI quality job, including tooling-only changes. CI uploads its gate receipt.

The initial `cli-quality-baseline.json` records SHA-256 source hashes for 29 files with 50 existing
lint findings and 163 files with formatting drift on the #2516 follow-up baseline. It preserves
legacy source rather than mass-formatting the CLI. The new regression tests and edited source are
not exempt. Wrappers print their coverage and exit codes; tooling crashes and empty selections fail.

Only an exact byte match may skip a recorded file, independently for lint and formatting. New files
and any edits to baseline files enter the ordinary wrappers and must pass. A deleted baseline file
is harmless. Once a file passes, remove its baseline entry in that PR. Never update a baseline hash
to accept a changed file's new violations; there is intentionally no baseline update command.

To repair an edited file, run the structured wrappers with `--file <path>` and
`--config .llm/tools/quality/cli-quality.deno.json`; formatting supports `--write`. Keep the scoped
config's rules aligned with root `deno.json` (excluding its path include/exclude lists). The tests
exercise actual wrappers against isolated fixtures, including new/changed violations and crashes.
