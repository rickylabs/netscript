# Validation evidence

The structured wrappers produced full machine reports in the private project run.
This public record contains commands relative to the repository and their observed
verdicts; raw reports contain process paths and are not copied into the public run.

| Gate | Selection | Exit | Result |
| --- | --- | --- | --- |
| `run-deno-test.ts` red baseline | mirror behavior, `--no-check --filter 'post-merge reads comment evidence'` | 1 | 1 failing behavior test before implementation |
| `run-deno-test.ts` green | mirror + acceptance-evidence + check-close-gate tests, `--allow-all` | 0 | 50 passed, 0 failed |
| `run-deno-check.ts` | `--root .llm/tools/validation --include mirror-acceptance-evidence --ext ts` | 0 | 2 files, zero findings; wrapper enables unstable KV |
| `run-deno-lint.ts` default config | same mirror files | 2 | Correct coverage refusal: root lint excludes `.llm/` |
| `run-deno-lint.ts` explicit config | `--file` per mirror file, root lint rules without exclusions | 0 | 2 files processed, zero findings |
| `run-deno-fmt.ts` | same mirror files, `--ext ts` | 0 | 2 files processed, zero findings |
| `deno task release:preflight` | maintained publish surfaces | 0 | All four checks pass |
| `deno task check:netscript-jsr-specifiers` | maintained package/plugin surface | 0 | 3040 scanned files, zero failures |
| `deno task check:aspire-host-ports` | maintained framework/e2e/plugin surface | 0 | 1324 files, no pinned host ports |
| `deno task check:aspire-version-parity` | manifest scan | 0 | 1021 checked, zero failures, fresh manifest |
| `git diff --check` | working delta | 0 | No whitespace errors |

Focused test invocation:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/validation/mirror-acceptance-evidence_test.ts .llm/tools/validation/acceptance-evidence_test.ts .llm/tools/validation/check-close-gate_test.ts
```

Lint's explicit config contains the root `lint.rules` verbatim, removing only
selection exclusions; the repository configuration remains unchanged. Check and
format run directly through the structured wrappers.

The full CLI E2E runtime suite is outside the workflow's path-selected scope: no
framework, scaffold, plugin, database, runtime, or published asset changes. No skip
labels are applied. The independent evaluator verifies this applicability decision.

See `real-data-dry-runs.md` for the three mandated live dry-runs, all read-only and
safely refused. No lock-file or generated-source changes.
