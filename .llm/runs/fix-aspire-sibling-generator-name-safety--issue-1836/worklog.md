# Worklog: #1836 sibling register-generator source safety

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-aspire-sibling-generator-name-safety--issue-1836` |
| Branch | `fix/aspire-sibling-generator-name-safety` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- No published export changes.
- Existing private functions `generateRegisterApps`, `generateRegisterPlugins`,
  `generateRegisterTools`, and `generateRegisterInfrastructure` retain their signatures.
- Generated `.helpers/register-*.mts` resource-name arguments and map keys remain semantically
  identical; only local source bindings and literal representation change.

### Domain Vocabulary

- **Ordinal binding** — a private generated identifier derived only from loop position.
- **User string** — any resource key, entry field, reference, path, environment key/value, or
  primary-resource name supplied through generator options.
- **Source-safe literal** — a JavaScript string literal produced by `JSON.stringify`.
- Existing five Archetype-6 spine abstracts remain untouched: `CliCommand<Input, Result>`,
  `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract, vertical feature, registry, extension axis, port, composition root, command
  name, exit code, or output format changes.

### Ports

- None added. The only consumed seam is the existing Deno executable/parser invoked by the test.
- Existing command execution, filesystem, process, HTTP, template, prompt, and output ports are
  unchanged.

### Constants

- Test-only hostile name/literal vectors define reserved words, normalization collisions, and
  quote/backslash/backtick/`${}`/newline cases.
- Production prefixes are local generated identifiers, not exported domain constants.

### Generated Outputs and Semantic Test Strategy

- Generated outputs: `register-apps.mts`, `register-plugins.mts`, `register-tools.mts`, and
  `register-infrastructure.mts`.
- Each hostile render is written to a temp `.mts` file and parsed by Deno lint.
- Supplementary assertions verify the expected ordinal binding family and original resource-name
  JSON literals without relying on a whole-file snapshot.
- No generated project is started; the owner explicitly excludes runtime.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Activate the run and expose the plan on a draft PR | Clean Git baseline and artifact review | Run-directory Markdown |
| 1 | Prove all four sibling generators emit invalid source for hostile contracts | Focused structured test wrapper returns RED | New focused generator test + run artifacts |
| 2 | Make bindings ordinal and all user strings source-safe | Focused tests plus scoped check/lint/fmt | Four generators + test + run artifacts |
| 3 | Prove mutations and complete repository gates | Two mutation RED runs plus requested gates | Run artifacts only after restoring product tree |
| 4 | Repair the false-green downstream contract coverage | Full helper-generator directory exits 0 plus all requested gates | Two stale consumer tests + run artifacts |

### Deferred Scope

- Background generator source safety — owned by draft PR #1747.
- Runtime/Aspire/Docker validation — explicitly prohibited for this implementation session.
- Formal IMPL-EVAL — mandatory separate supervisor-dispatched session after handoff.

### Contributor Path

When adding another emitted user string to one of these generators, encode it at the interpolation
site with `JSON.stringify`; when adding a new generated binding, derive it from the entry/ref ordinal.
Extend the focused hostile-input case for that field and keep the Deno parse assertion.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-31T08:40:28Z | 0 | bootstrap | Baseline and issue/PR state re-verified; doctrine, harness, PR, tools, and Deno inspection guidance loaded. |
| 2026-08-31T08:40:28Z | plan | PLAN-EVAL | `N/A` — issue #1836 supplies a complete mechanical contract, exact reference treatment, affected sites, hostile matrix, and gates; no architecture or sequencing decision remains open. |
| 2026-08-31T08:51:00Z | 1 | RED | Focused structured test wrapper exited 1: 0 passed, 4 failed; every real generated module failed Deno parsing. |
| 2026-08-31T09:16:53Z | 2 | implementation | Replaced user-derived bindings with `app_<n>`, ordinal plugin-reference, `tool_<n>`, `db_<n>`, and `cache_<n>` bindings; encoded emitted user strings with `JSON.stringify`. |
| 2026-08-31T09:16:53Z | 2 | GREEN | Focused generator set exited 0: 156 passed, 0 failed. Scoped check exited 0 with `failedBatches: 0`; scoped lint and both style-family format batches exited 0 with no findings. |
| 2026-08-31T09:16:53Z | 3 | mutation | Name-derived binding mutant exited 1 with 0 passed / 4 failed; independent raw-literal mutant exited 1 with 0 passed / 4 failed. Restored source-safety test exited 0 with 4 passed / 0 failed. |
| 2026-08-31T09:23:26Z | 3 | repository gates | Root check, quality scan, architecture check, and asset-barrel check all exited 0; lock/generated-file hygiene is clean. |
| 2026-08-31T09:38:24Z | 4 | false-green audit | Owner-reported directory run reproduced at exit 1: 28 files passed / 2 failed, 213 steps passed / 5 failed. Prior focused GREEN and handoff are invalidated. |
| 2026-08-31T09:38:24Z | 4 | semantic determination | Pipeline output is correct: JSON literals preserve `main`, `auth`, and `prisma-studio` values. Plugin environment output is correct: declared values precede generated OTEL/database writes, `PORT` is refused, and the original resource name remains the map key; the extractor alone depended on the removed user-name comment. |
| 2026-08-31T09:38:24Z | 4 | correction | Updated stale literal expectations and made plugin block extraction follow the JSON-encoded `plugins.set` boundary plus ordinal comment. No parity assertion was removed or weakened; production generators are unchanged. |
| 2026-08-31T09:38:24Z | 4 | GREEN | Exact directory run exited 0: 30 passed / 218 steps / 0 failed. Structured directory wrapper exited 0: 248 results / 0 failed. Scoped and repository gates all exited 0. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use ordinal bindings, not reserved-word filtering | Makes reserved words and collisions structurally impossible. | issue #1836 / PR #1747 pattern |
| Use inline `JSON.stringify` | Native primitive and exact sibling precedent. | A7 / PR #1747 pattern |
| Parse every hostile render | Prevents AP-18 false greens from string-only assertions. | issue #1836 / doctrine AP-18 |
| Keep the pipeline generator output | `JSON.stringify("main")` changes source representation, not the parsed resource name or builder behavior. | Directory failure output + generated source inspection |
| Keep plugin environment generation | Measured indexes show declared value 3262, OTEL 3479, database override 4238; refused `PORT` value is absent and the endpoint remains registered. | Diagnostic render + unchanged #1447 assertions |
| Locate plugin blocks by semantic map writes | User-derived comments are intentionally forbidden; `plugins.set(JSON.stringify(name), resource)` is the stable resource-identity boundary. | #1836 D3/D5 + #1447 parity contract |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| PR #1747 remains open, so its fixed background implementation is not present on `main`. | minor | yes |
| `rtk` is not installed despite repository guidance. | minor | yes |
| The initial focused test list omitted two existing downstream generated-output contracts, producing a false-green handoff. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Baseline Git state | raw `git status`, `rev-parse`, and `ls-remote` | PASS | Clean branch at live `origin/main` SHA `71d5fb8e0`. |
| RED hostile generator contract | `run-deno-test.ts -- --allow-all generate-register-source-safety_test.ts` | FAIL (expected) | Exit 1; 0 passed / 4 failed. Apps/plugins/infrastructure rejected raw hostile literals; tools rejected `let class = ...`. |
| Focused generator suite | structured test wrapper over six generator test files | INSUFFICIENT ALONE | Exit 0; 156 passed / 0 failed, but this omitted two generated-output consumer tests and must not be used as the directory verdict. |
| Scoped check | `run-deno-check.ts` over 10 changed TypeScript files | PASS | Exit 0; 10 selected, one batch, `failedBatches: 0`; default `--unstable-kv` active. |
| Scoped lint | `run-deno-lint.ts` over 10 changed TypeScript files | PASS | Exit 0; 10 selected/processed, no findings or dropped files. CLI is excluded by root lint config, so the scoped config retains recommended plus repository process/node rules without the root exclusion. |
| Scoped format | `run-deno-fmt.ts` over 10 changed TypeScript files in existing style families | PASS | Exit 0 for both batches; 8 semicolon-style and 2 no-semicolon-style files selected/processed, no findings or drops. |
| Ordinal-binding mutation | focused hostile generator contract | FAIL (expected) | Exit 1; 0 passed / 4 failed. Apps/tools/infrastructure emitted reserved-word bindings; plugin reference bindings emitted hostile user text. |
| Literal-escaping mutation | focused hostile generator contract | FAIL (expected) | Exit 1; 0 passed / 4 failed. Raw hostile Workdir/TaskName/DataPath interpolation made every emitted module unparsable. |
| Restored hostile generator contract | focused hostile generator contract | PASS | Exit 0; 4 passed / 0 failed after both mutants were explicitly restored. |
| Root check | `deno task check` | PASS | Exit 0; 2,976 selected files, 25 batches, `failedBatches: 0`, no diagnostics. |
| Quality scan | `deno task quality:scan` | PASS | Exit 0; repository scan returned `ok: true`, no findings or allowance failures. |
| Architecture | `deno task arch:check` | PASS | Exit 0; no doctrine failures. Existing repository warning inventory remains, including the pre-existing CLI file-size category. |
| Asset barrel | `deno task check:assets-barrel` | PASS | Exit 0; generation produced no tracked asset/barrel diff. |
| Lock hygiene | `git diff --exit-code -- deno.lock` | PASS | Exit 0; lockfile unchanged. |
| Final worktree hygiene | `git status --short` and generated-file diff | PASS | Clean after implementation commit; no generated asset drift. |
| Initial full generator directory | exact `deno test --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests/` | FAIL (correction trigger) | Exit 1; 28 passed / 2 failed, with 5 failed steps in pipeline and plugin-environment parity contracts. |
| Corrected full generator directory | exact owner-specified directory command | PASS | Exit 0; 30 passed / 218 steps / 0 failed. |
| Corrected directory wrapper | `run-deno-test.ts -- --allow-all .../helpers/tests/` | PASS | Exit 0; 248 results / 0 failed. |
| Corrective scoped check | `run-deno-check.ts` over two changed tests | PASS | Exit 0; 2 files, one batch, `failedBatches: 0`, `--unstable-kv` active. |
| Corrective scoped lint | `run-deno-lint.ts` over two changed tests | PASS | Exit 0; 2/2 processed, zero findings/drops. |
| Corrective scoped format | `run-deno-fmt.ts` over two changed tests | PASS | Write exit 0 and final check exit 0; 2/2 processed, zero findings/drops. |
| Corrective root check | `deno task check` | PASS | Exit 0; 2,976 files, 25 batches, `failedBatches: 0`. |
| Corrective quality scan | `deno task quality:scan` | PASS | Exit 0; no findings or allowance failures. |
| Corrective architecture | `deno task arch:check` | PASS | Exit 0; no doctrine failures, existing warnings only. |
| Corrective asset barrel | `deno task check:assets-barrel` | PASS | Exit 0; no generated diff. |
| Source-safety preservation | direct source audit | PASS | Exit 0; `safeIdentifier` count is 0 in each of four sibling generators, `_utils.ts` still exports it, and background still consumes it. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| AP-18 design | PASS | Design checkpoint | Tests will parse real generated modules; no giant snapshots. |
| PLAN-EVAL | N/A | Owner-supplied mechanical contract | No unresolved plan decision; IMPL-EVAL remains mandatory and separate. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Aspire/Docker/AppHost | N/A | Owner instruction | Must not run. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Generated AppHost modules | PASS | Deno lint parse of four temp `.mts` files | All four hostile renders parse after repair; both safeguard mutants fail all four. |

## Handoff Notes

- Corrected implementation is ready for the mandatory supervisor-dispatched separate-session IMPL-EVAL only after the corrective slice is pushed.
- PR must remain draft and retain `status:impl` until that external evaluator completes.
- No runtime, Aspire, Docker, AppHost, or CLI E2E command was run.
