# Evaluation: issue #818 minimum-dependency-age lockstep scoped exemption

## Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g11-818-minage`   |
| Target         | `packages/cli` workspace generation, plugin dispatch, agent init, docs |
| Archetype      | `6 — CLI / Tooling`                                |
| Scope overlays | `docs`                                             |
| Evaluator      | `qwen/qwen3.7-max (OpenRouter) · 2026-07-18`      |

## Process Verification

| Check                                  | Result   | Evidence |
| -------------------------------------- | -------- | -------- |
| Plan-Gate passed before implementation | `PASS`   | `plan.md` locks D1–D8; three implementation slices defined; worklog confirms plan-first design checkpoint. |
| Design section exists in worklog       | `PASS`   | `worklog.md` "Design" section: public surface, vocabulary, A6 structure, ports, constants, semantic test strategy all present. |
| Commit slices match design plan        | `PASS`   | 3 slice commits (`af9e0181`, `5ad34dee`, `12d2c120`) match plan S1/S2/S3 exactly; `chore(harness)` plan commit `260c5eea` precedes them. |
| Each slice has a passing gate          | `PASS`   | S1: 15 generator tests pass; S2: dispatch/AI tests pass; S3: init-agent tests pass. All independent runs below. |
| No speculative seams (unused files)    | `PASS`   | All new imports resolve to used call-sites; no dead code in the diff. |
| Constants used for finite vocabularies | `PASS`   | `SCAFFOLD_JSR_RELEASE_PACKAGES`, `NETSCRIPT_RELEASE_VERSION`, `NETSCRIPT_RELEASE_TAG` are finite constants, not magic strings. |

## Static Gates

| Gate             | Command or check                                                                                          | Result   | Evidence | Notes |
| ---------------- | --------------------------------------------------------------------------------------------------------- | -------- | -------- | ----- |
| Narrow typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`          | `PASS`   | 689 files selected, 6 batches, 0 findings. | |
| Lint             | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`           | `PASS`   | 689 files selected, 0 findings. | |
| Format           | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`            | `PASS`   | 689 files selected, 0 findings. | |
| Doc lint         | `deno doc --lint packages/cli/mod.ts`                                                                     | `PASS`   | 0 findings. `deno doc --filter dispatchPluginVerb` confirms unchanged signature. | |
| Publish dry-run  | `deno publish --dry-run --allow-dirty`                                                                    | `PASS`   | `Success Dry run complete`; only existing dynamic-import warnings. | |
| Link/path check  | `docs/site/capabilities/agent-tooling.md`, `docs/site/orchestration-runtime/cli-scaffold.md`, `packages/cli/README.md` | `PASS` | 98 docs scanned; zero broken links, anchors, or orphans per worklog. | |

## Fitness Gates

| Gate | Function                           | Result   | Evidence | Violations |
| ---- | ---------------------------------- | -------- | -------- | ---------- |
| F-19 | Scoped source gate runners         | `PASS`   | Scoped check/lint/fmt wrappers (3 invocations): all zero findings. | none |
| quality:scan | Repository code quality scan | `PASS`   | `ok: true`, zero findings; seven existing allowances only — none from this diff. | none |
| arch:check   | Doctrine readiness       | `PASS`   | Exit 0; all warnings/info items are pre-existing debt from prior runs. No new FAIL from G11. | none |

## Runtime Gates

| Gate                                  | Validation                                                                                     | Result   | Evidence |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- | -------- | -------- |
| Focused generator tests (S1)         | `deno test -A --unstable-kv .../generators_test.ts`                                            | `PASS`   | 15 passed, 0 failed. |
| Focused dispatch+AI tests (S2)       | `deno test -A --unstable-kv dispatch-plugin-verb_test.ts ai-plugin-command_test.ts`             | `PASS`   | 4 passed (11 steps), 0 failed. |
| Focused agent-init tests (S3)        | `deno test -A --unstable-kv init-agent_test.ts`                                                | `PASS`   | 3 passed, 0 failed. |
| Full workspace template directory    | `deno test -A --unstable-kv packages/cli/src/kernel/templates/workspace`                        | `PASS`   | 15 passed, 0 failed. |
| Full plugins feature directory       | `deno test -A --unstable-kv packages/cli/src/public/features/plugins`                           | `PASS`   | 22 passed (54 steps), 0 failed. |
| Full agent feature directory         | `deno test -A --unstable-kv packages/cli/src/public/features/agent`                             | `PASS`   | 5 passed, 0 failed. |
| Full CLI package                     | `deno test -A --unstable-kv packages/cli`                                                       | `PASS`   | 379 passed (410 steps), 0 failed. |
| Live config parse probe (Deno 2.9.3) | `deno eval --config /tmp/818-live-probe.json "console.log('config-ok')"`                        | `PASS`   | Returned `config-ok`. Workspace warnings are because temp JSON references nonexistent paths (expected). |
| Specifier-case matrix (dispatch)     | Test coverage: unversioned first-party, explicitly lockstep first-party, explicitly non-lockstep first-party, third-party | `PASS` | All four dispatch paths asserted via `RecordingProcess`; see `dispatch-plugin-verb_test.ts`. |

## Consumer Gates

| Consumer                     | Validation                                                                          | Result   | Evidence |
| ---------------------------- | ----------------------------------------------------------------------------------- | -------- | -------- |
| JSR-mode scaffold            | Generator emits `minimumDependencyAge: { age: "P1D", exclude: [...] }`              | `PASS`   | Test `generateDenoJson emits the expected root workspace shape in JSR mode` — asserts exact object. |
| Local-mode scaffold          | Generator emits NO `minimumDependencyAge`                                           | `PASS`   | Test `generateDenoJson keeps the same root-only shape in local mode` asserts `!('minimumDependencyAge' in result)`. |
| Third-party dispatch         | Preserves `deno x -A jsr:<pkg>/cli`                                                 | `PASS`   | Test `keeps an explicitly non-lockstep first-party plugin on protected deno x dispatch` asserts exact `deno x` argv. |
| Lockstep dispatch            | Uses `deno run --config <project>/deno.json -A https://jsr.io/.../cli.ts`           | `PASS`   | Tests `runs an unversioned first-party plugin` and `runs an explicitly lockstep first-party plugin`. |
| AI plugin command            | Uses direct JSR CDN URL, not `./cli` subpath                                        | `PASS`   | Test asserts `https://jsr.io/@netscript/plugin-ai/${NETSCRIPT_RELEASE_VERSION}/cli.ts`. |
| Claude MCP host              | Writes `.mcp.json` with `--config <absolute>/deno.json` before `-A`                 | `PASS`   | `init-agent_test.ts` first test asserts exact argv via `join(root, "deno.json")`. |
| VS Code MCP host             | Writes `.vscode/mcp.json` with `--config <absolute>/deno.json` before `-A`          | `PASS`   | `init-agent_test.ts` second test asserts exact argv via `join(root, "deno.json")`. |
| Generated exclusion shape    | Every entry: `jsr:@netscript/<name>@<NETSCRIPT_RELEASE_VERSION>`                    | `PASS`   | Test asserts prefix, suffix, and no `@std/` contamination. Uniqueness check confirms no duplicates. |

## Anti-Pattern Check

| AP    | Status      | Evidence | Notes |
| ----- | ----------- | -------- | ----- |
| AP-2  | `CLEAR`     | Implementation uses Deno's sanctioned `minimumDependencyAge` object form with scoped `exclude`. | No custom Deno wrapper or shim. |
| AP-9  | `CLEAR`     | `resolveLockstepPluginCliUrl` is a 5-line private function inside `dispatch-plugin-verb.ts`; no new port or framework introduced. | Plan D8 honored. |
| AP-11 | `CLEAR`     | All execution remains behind `ProcessPort`; feature files only build argv arrays. | |
| AP-18 | `CLEAR`     | Tests assert exact argv arrays and parsed JSON properties, not full generated file snapshots. | |
| AP-19 | `CLEAR`     | README and site docs updated with the 24-hour window, exact-lockstep exception, and unchanged third-party policy. | |
| AP-24 | `CLEAR`     | `resolveLockstepPluginCliUrl` is a closed security predicate (regex + version compare), not an open plugin axis. | |
| AP-25 | `N/A`       | No new port introduced. | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No new doctrine violation introduced. |
| Resolved entries      | 0     | No existing debt entry closed by this run. |
| Deepened violations   | 0     | Existing CLI doctrine/public-doc debt unchanged; no new surface or export added. |
| Unrecorded violations | 0     | `quality:scan` reports 7 existing allowances only — all pre-existing, none from this diff. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| `low`    | Stale JSDoc in `packages/cli/src/public/public-api.ts:212`: the `dispatchPluginVerb` re-export wrapper still reads `Dispatch a framework plugin verb through \`deno x -A jsr:<pkg>/cli\`` while the internal source `dispatch-plugin-verb.ts:94` was updated to the new text. Not a runtime or contract regression — the signature is unchanged and `deno doc --lint` passes — but the consumer-facing documentation string is slightly inaccurate for lockstep first-party paths. | `grep -n 'deno x -A jsr:<pkg>/cli' packages/cli/src/public/public-api.ts` → line 212. The README and site docs were properly updated. | Low-priority follow-up: update the JSDoc string at `public-api.ts:212` to match the internal source, or fold the two into one authoritative comment. |

## Lessons for Promotion

| Lesson                          | Pattern                                                                                      | Applies to       | Confidence |
| ------------------------------- | -------------------------------------------------------------------------------------------- | ---------------- | ---------- |
| Public re-export JSDoc mirrors  | When a source-file JSDoc is updated but the public-api barrel has its own copy, the barrel copy stays stale. | Archetype 6 (CLI / Tooling) with public-api barrels | `high` |
| Deno scoped exclude > blanket 0 | Deno 2.9's `minimumDependencyAge` object form with exact-version `exclude` list is the only safe way to exempt lockstep packages without blanket-disabling third-party supply-chain protection. | All archetypes generating scaffold configs | `high` |
| Direct `deno run` over `deno x` for lockstep | Deno 2.9.3's `deno x` drops minimum-age and config selections via internal re-exec; direct `deno run` of the published `cli.ts` keeps resolution in one process. | Archetype 6, any plugin dispatch path | `high` |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All three implementation slices (S1 scaffold generation, S2 dispatch/AI routing, S3 agent-init MCP argv + docs) are correctly implemented against the locked plan decisions D1–D8. Supply-chain protection is never blanket-disabled: every `minimumDependencyAge`/`--minimum-dependency-age` occurrence is either the scoped object form with exact `jsr:@netscript/*@<version>` exclusions or pre-existing e2e test scaffolding. Third-party and explicitly non-lockstep first-party dispatch remain on `deno x` with full protection. All independent gates I ran pass: full CLI package (379/379), full plugins feature dir (22/22), full agent feature dir (5/5), workspace template dir (15/15), scoped type-check/lint/format (0 findings each), `quality:scan` (0 findings), `arch:check` (0 new FAILs), publish dry-run (success), and live Deno 2.9.3 config parse probe (ok). The single low-severity finding (stale JSDoc on the public-api re-export wrapper) is informational and does not block merge. |

PASS
