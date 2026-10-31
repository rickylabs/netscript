# Independent CLI slice review

**PASS.** I found no blockers in CLI slice 4. I only read code, docs and the private logs; I didn't run or edit anything.

### What I checked
- **App selection and wrong-workspace writes.** The three commands use the same app selection as the `ui:*` commands (`tokens-group.ts:27-31`). Every operation first checks that the target has `deno.json` and a `routes/` folder (`token-files.ts:30-35`), so a workspace root is rejected. The `workspace roots and escaping input paths` test covers this.
- **Paths stay inside the app.** Every configured or flag path goes through `appTokenPath`, which rejects absolute paths and `..` (`token-files.ts:18-27`). Build checks every output path before it writes anything (`build-app-tokens.ts:47-50`).
- **Bundled and app-owned sources.** With no `tokens.config.json`, build uses the bundled sources. A declared `sourceRoot` reads the app's resolver and documents, and the config schema is strict.
  - Flag precedence is: explicit flag, then config, then the installed `theme-preset.json`, then the default preset.
  - A configured override that doesn't exist fails instead of being silently skipped (`token-files.ts:64-71`, plus the "missing configured inputs" test).
- **The override goes through the public builder.** The CLI passes the override to `buildTokens`. That function validates it, then applies it last in every context (`style-dictionary.ts:41-70`). The validation (`resolve-tokens.ts:161-174`) accepts only semantic keys, requires aliases, rejects unknown roles or type changes, and checks references. The CLI has no validator of its own.
- **Failed validation writes nothing.** Build runs completely before any write, and writing starts only after all five outputs exist (`build-app-tokens.ts:46-57`). A unit test confirms the files are unchanged after a failure. The real run's log shows the error `Semantic token must be an alias: semantic.radius-md`.
- **Init can't overwrite by accident.** Init checks every planned file before writing any of them, and existing files need `--force` (`init-app-tokens.ts:36-44`). A test confirms that a late conflict leaves every file as it was. Init never writes generated assets.
- **Clean touches only five files.** It removes exactly `APP_TOKEN_FILES` from `assets/` (`token-output.ts:65-71`) and refuses anything that isn't a plain file. The test keeps `styles.css`, an unrelated JSON file, the config and the sources, and a second clean is a no-op.
- **A real scaffold was used.** The scaffold log shows a public-CLI project with one Fresh app. The init, build, invalid-override and clean logs match what slice-4-cli.md claims: 10 files written, 5 built, the alias error, and 5 removed.
- **Style Dictionary stays out of normal startup.** Only `FreshUiTokenEngine` loads `@netscript/fresh-ui/tokens`, and it does so with an `await import(...)`. Every other use is a type-only import. The publish dry-run does not flag that import as one it can't resolve, so publishing will rewrite it; the dry-run ends with "Success".
- **No architecture regression.** The dependency direction is: domain constants, then ports, then application functions using `FileSystemPort` and `TokenEnginePort`, then the adapter, then the public command, then root wiring (`public-command-dependencies.ts:335`, `public-command-tree.ts:92-95`). Every new source file is reachable from the root or from a test. The quality and architecture receipt reports outcome `PASS` with exit code 0.
- **Docs are complete and no gate was weakened.** `commands.md:290-322` and `cli-reference.md:92-94` document all three commands, their flags, the five-file clean and the override rules. The census moved from 93 to 97 (one group plus three commands) and from 158 to 162 recursive paths. That matches the dated lesson at `.llm/2026-10-28-tokens-v2.md:34-35`, the live-tree check still runs in full, and the docs-accuracy and snippets checks pass.
- **Gates.**

  | Gate | Result |
  | --- | --- |
  | Type check | 9 files, 0 findings |
  | Lint and format | 14 files each, 0 findings, nothing dropped |
  | Tests | 14 passed, 0 failed |
  | Publish dry-run | Success |

### Non-blocking limits
- The raw proof logs contain only command output. The SHA-256 "unchanged" claims and the `--ns-radius-md: var(--ns-radius-lg)` excerpt appear only in slice-4-cli.md. In the final pass, keep a hash manifest and the CSS excerpt next to the logs.
- `appTokenPath` checks paths as text only. A symlink inside the app could still point outside it.
- The five output files are written one after another. A failed validation writes nothing, but a disk error part-way through could leave a mixed set.
- The CLI imports `jsr:@netscript/fresh-ui@0.0.8/tokens`, which currently resolves to the workspace package. The published CLI will need a fresh-ui release that includes `./tokens` at the same version.
- `slice-4-cli.md:3` still says the review is pending; update it with this PASS when you sign off.
- As you scoped it, this slice doesn't cover the full scaffold runtime E2E (`scaffold.runtime`), the browser screenshots, the attribute and font migration, or the `/design/tokens` route.

The sign-off commit and push can go ahead. I'll keep this session open for the migration slice.
