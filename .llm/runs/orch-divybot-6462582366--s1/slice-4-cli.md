# Slice 4: consuming app token commands

Parent: 25a531980d02b88ee01113e08801a0a73f7b0fd4. Status: PASS. The same independent supervisor signs off; substantive review is recorded in slice-4-review.md.

## Public behavior

`netscript tokens init|build|clean` reuse Fresh app selection. An ambiguous workspace requires `--app`; explicit project roots must contain an app's deno.json and routes. Init copies eight bundled DTCG documents, an empty semantic override and versioned configuration. It checks the full write plan before replacing anything; existing source files require `--force`.

Build uses bundled sources before init, retaining an installed registry preset and detecting a conventional semantic override. Initialized apps can own the resolver/documents through sourceRoot. Explicit flags take precedence over settings. Configured inputs must exist and remain app-relative. The public token engine validates schema, aliases, references, names and types before any output write. Clean removes only the five generated web files and retains app styles/configuration/sources.

The new filesystem flow depends on FileSystemPort and TokenEnginePort. FreshUiTokenEngine dynamically imports the public fresh-ui/tokens entrypoint, so ordinary commands do not initialize Style Dictionary. DTCG types are imported type-only; the CLI does not duplicate the token validator or spawn a build process.

## Gate evidence

- Structured check: PASS, zero occurrences; frozen root lock.
- Structured lint/format: PASS with complete explicit coverage (14 TypeScript files). A temporary scoped config retains root rules while avoiding root include/exclude dropping CLI files.
- Focused filesystem/controller/root composition tests: 14 PASS, zero failed.
- Repository quality/architecture receipt: PASS, exit 0; existing advisory debt remains recorded.
- CLI publish dry-run: PASS, exit 0, throwaway workspace only.
- Documentation accuracy: PASS, 97/97 root/direct commands and 162 recursive paths. The explicit census changes by one group and three direct commands; exhaustive coverage remains enforced.
- Documentation snippets: PASS. No gate was removed or weakened.

## Actual scaffold proof

Used the public CLI to scaffold an app without orchestration, then ran the real token commands against it:

1. Init with Studio Utility: exit 0, eight DTCG sources plus settings/override written.
2. Set semantic.radius-md to the alias {semantic.radius-lg}; build: exit 0, five web assets. Generated CSS keeps the live --ns-radius-md: var(--ns-radius-lg) reference, token JSON reports that alias, and preset metadata selects studio/utility/compact. The builder traverses all 72 requested resolver inputs.
3. Replace the alias with a raw dimension; build: exit 1, Semantic token must be an alias. SHA-256 of every prior web output stays unchanged.
4. Restore the alias; clean: exit 0, exactly five generated files removed. Hashes of app styles, settings, all eight source documents and the semantic override stay unchanged.

Private raw logs and local fixture paths are kept outside tracked evidence. Full scaffold.runtime and the browser/attribute/font migration remain the next slice and final readiness pass.
