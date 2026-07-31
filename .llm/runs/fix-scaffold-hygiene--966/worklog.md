# Worklog — fix-scaffold-hygiene

## Process

Owner classified the grouped change as MECHANICAL and explicitly waived a plan document. No
`plan.md` or PLAN-EVAL was created. Implementation stayed within the supplied four-issue brief.

## Design

- Public surface: `netscript init` gains `--non-interactive`; `AppSettings` and its generated JSON
  Schema model optional top-level string `Parameters`.
- Domain vocabulary: existing `InitCommandInput`, `InitOptions`, and `AppSettings`; no new
  abstraction or extension axis.
- Ports: existing prompt, filesystem, and scaffold ports only.
- Constants: existing scaffold file/template registries only.
- Commit slice: one grouped scaffold-contract slice across the shared init/appsettings output,
  proven by semantic regression tests and `scaffold.runtime`.
- Deferred scope: unrelated Aspire JSR entrypoint documentation failures.
- Contributor path: init routing remains in `public/features/init`; target validation remains in
  `kernel/application/scaffold`; host configuration remains in `packages/aspire/config.ts`.

## Root-cause findings

- #966: the source template itself labelled `appsettings.json` generated even though generation
  consumes it; the embedded barrel faithfully copied that incorrect contract.
- #975: the emitter and `AppSettingsZod` disagreed; Zod stripping made the generated host parameter
  invisible to parsing, JSON Schema, and schema-aware `config set`.
- #967: target resolution unconditionally appended the name, even when cwd basename already was the
  requested project.
- #968: automatic non-TTY prompt bypass already existed; explicit flag spelling and regression
  evidence were missing.

## Fails-before evidence

`deno test --no-check ...` over the five focused files exited 1 before implementation: 19 passed,
5 failed. Failures were `#966` tracked appsettings, `#967` cwd target, `#975` schema preservation,
generated JSON Schema, and config-set-without-force. The new #968 non-terminal prompt guard passed,
confirming the filed cause was stale.

## Validation

| Gate | Result |
|---|---|
| Focused regression suite | PASS — 25 tests / 37 steps |
| Real public CLI `init ... --non-interactive --dry-run --json` | PASS — exit 0 |
| Scoped CLI check / lint / fmt | PASS — 737 files |
| Scoped Aspire check / lint / fmt | PASS — 45 files |
| `deno task quality:gate` | PASS — no findings/failures introduced |
| CLI doc lint | PASS — 0 errors |
| Aspire doc lint | PASS — 0 errors |
| CLI JSR audit | PASS with baseline warnings — exit 0 |
| Aspire JSR audit | FAIL — four pre-existing missing `@module` tags; see drift D2 |
| Asset barrel check | rerun after commit required; pre-commit exit 1 because intended generated diff exists |
| Full `scaffold.runtime` | pending |

## Reconcile

- PR #983 is still draft and carries `Closes #966`, `Closes #975`, `Closes #967`, and
  `Closes #968`.
- All four issues and PR #983 are assigned milestone `0.0.1-beta.12`.
- Issue #968 received the required correction comment for its stale cause.

