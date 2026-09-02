# IMPL-EVAL — Slice A: share #1664's client selector (Refs #1354; partial)

- Run: `feat-cli-resource-slice-client-selector--1354-a`
- Branch: `feat/cli-resource-slice-client-selector`, head `f0cc2479d`, base `a30405df1`
- Evaluator: separate Claude (Fable 5.1) session, read-only on product code; commands run from
  `/home/agent/projects/netscript/worktrees/007-leaf-1354-a`
- Plan authority: PR #1891 `.llm/runs/feat-cli-resource-slice--1354/plan.md` (Slice A section, D9 seam)

## Verdict

**PASS_IMPL**

## Findings

| Severity | Finding |
| --- | --- |
| INFO | Root `deno.json` excludes `packages/cli/` from `lint` and `fmt` (pre-existing policy, not delta). The structured wrappers therefore refuse the slice files ("all-excluded" / "No target files found"). Advisory lint/fmt was run with a scratch config copying the root formatter options and lint rule tags; both clean. Not attributable to this slice. |
| INFO | The `packages/cli` root lint wrapper additionally trips on the pre-existing e2e fixture `packages/cli/e2e/fixtures/desktop-native/deno.json` (`Package 'zod' not found in catalog`). Fixture exists on base `a30405df1`; unrelated to the delta. |
| INFO | `rtk` is not installed in this sandbox; `arch:check` and `quality:gate` were run as bare `deno task` with identical semantics. |

No blocking or major findings.

## Checks

### 1. Touch set and ceiling
- `git diff --stat a30405df1 f0cc2479d`: 10 files. Product files = 3 (`resource-slice/client-selector.ts` +121, `resource-slice/client-selector_test.ts` +96, `ui/web-scaffold.ts` +10/-110). Remaining 7 are run artifacts under `.llm/runs/feat-cli-resource-slice-client-selector--1354-a/`.
- Ceiling 4 respected (3 of the 4 listed files touched; `web-scaffold_test.ts` deliberately untouched).
- Nothing else under `packages/` or `plugins/`. `git diff a30405df1 f0cc2479d -- deno.lock | wc -l` = 0 (lock unchanged).
- No edits to add-ui command/input or `service-query.ts.template` (not in diff).

### 2. Selector behavior byte-preserved
- Extracted `findBinding` body from base `web-scaffold.ts` (`git show a30405df1:...`) and compared with `selectClientBinding` in the new module via `diff -B -w`: the only hunk is the function signature (line-wrapped by the formatter, `Promise<Binding>` -> `Promise<ClientBinding>`). Every statement, regex, error string, remedy string, and the `PREREQUISITE` constant is identical.
- `identifyCandidates`, `serviceIdentity`, `selectionRemedy`, `bindingError` moved verbatim. No `findBinding`/`type Binding` references remain in `packages/cli/src`.
- Semantics confirmed by reading: exact `candidate.service === client` identity; zero matches and >1 matches both throw; no auto-pick, alias, or fallback path added; implicit mode still requires exactly one candidate.
- Both call sites in `web-scaffold.ts` (`scaffoldUiPage`, `scaffoldUiIsland`) pass the same `(projectRoot, fs, client)` arguments as before.

### 3. Tests
- `web-scaffold_test.ts`: zero diff vs base; 13/13 pass; #1664 selector regression cases present (auto-discover single client, `--client` by declared identity, unmatched service, duplicate identities, multiple clients fail-closed).
- `client-selector_test.ts` (new, 6 cases): implicit 0 (fail closed, stable prerequisite), implicit 1 (accept; file name != service name), implicit many (fail closed, sorted remedy), explicit exact match, explicit zero match (lists available services), explicit duplicate match. All 6 pass. Covers the required matrix.

### 4. Gate evidence (exit codes)
| Command | Result |
| --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | exit 0; 950 files, 8 batches, 0 failed, 0 diagnostics |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/application/resource-slice/client-selector_test.ts` | exit 0; passed 6 / failed 0 |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/application/ui/web-scaffold_test.ts` | exit 0; passed 13 / failed 0 |
| `deno task arch:check` | exit 0; FAIL=0 across packages (pre-existing WARN/INFO only, none in touched files) |
| `deno task quality:gate` | exit 0 |
| `deno lint -c <scratch cfg> <4 files>` (advisory; root config excludes packages/cli) | exit 0; Checked 4 files |
| `deno fmt --check -c <scratch cfg> <4 files>` (advisory; same reason) | exit 0; Checked 4 files |
| `run-deno-lint.ts` / `run-deno-fmt.ts` scoped to the two application dirs | exit 2, coverage refusal `all-excluded` (repo policy; see INFO finding) |

### 5. Doctrine / layering
- New module imports only `@std/path` and `../../ports/file-system-port.ts` (application -> ports). No UI, presentation, or adapter imports.
- Not re-exported from `packages/cli/mod.ts` or `deno.json` exports; publish surface unchanged.
- No `any`, `as unknown as`, or `deno-lint-ignore` introduced.
- Test imports `adapters/scaffold/memory-fs.ts`, matching the existing `web-scaffold_test.ts` precedent (test-only).

### Not run (per plan D11)
No Aspire, Docker, browser, or `e2e:cli`; runtime proof stays with the hosted lane.
