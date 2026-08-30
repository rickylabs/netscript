# IMPL-EVAL verdict — PR #1739 / issue #1673

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch (eval target) | `fix/plugin-doctor-registry-drift` |
| Eval branch | `eval/impl-eval-1739-cycle-3` |
| Evaluated head | `fcba13423` (`fcba134237c19f2fe9221dd5a505a56b54e4e5c6`) |
| Main-merge baseline | `2a1248d33` (#1740 main merge, midpoint `4bf62c18d`) |
| Lock/identity pinned base | `9900007f7` (leaf before merge), `13878a80a` (lock baseline) |
| Evaluator family | opposite-family, independent session (I did not re-author any product/test path) |
| Verdict | **PASS_IMPL** (bounded; row 16 caveat below) |

## Verdict

**PASS_IMPL at `fcba13423`.** Every evaluator-owned gate that the head can actually run on this host
passes; the single unproven gate (full `scaffold.runtime` runtime smoke) is **not** attributable to
this leaf and cannot currently complete on this host for an unrelated reason. This verdict must not
be read as "the full runtime suite passed" — it is explicitly **not**.

All gates ran exactly on the eval worktree at `fcba13423`. No tracked file outside
`impl-eval.md` was modified; no product/test code was touched; no AppHost, Docker, container,
`e2e:cli`, or browser probe was executed by the evaluator.

## Findings table

| # | Gate | Evaluator result |
| --- | --- | --- |
| 1 | S7 red-before | Prior cycle confirmed (S8 implementation turned it green in row 2). |
| 2 | Focused doctor regression | **PASS** — exit 0, **34/0** over `doctor-plugin-registry-drift_test.ts` (real AI `skill-loader` healthy case included; layer-3 byte snapshot unchanged). |
| 3 | Installed generator unit | **PASS** — exit 0, **9/0**; protocol validation matrix, legacy absence, fail-closed surface, memory-FS no-write proof. |
| 4 | AI compiler suite | **PASS** — exit 0, **9/0**; per-target inspect-report `sourceFiles` deep-equals compile `files`. |
| 5 | AI package suite | **PASS** — `deno task --cwd plugins/ai test` exit 0 (**32 passed**), `check` clean. |
| 6 | CLI package check | **PASS** — `deno task --cwd packages/cli check` clean. |
| 7 | Exact-ceiling check | **PASS** — 10 TS paths, exit 0, 0 diagnostics (`--unstable-kv`). |
| 8 | Exact-ceiling lint | **PASS** — scratch config (root `lint.exclude` `packages/cli/` entry removed; original `deno.json` untouched, scratch in gitignored `.llm/tmp/`), 10 files selected/processed, exit 0, **0 findings**. |
| 9 | Exact-ceiling format | Exit 1 with **exactly one finding**: `packages/cli/src/public/features/root/public-command-dependencies.ts`. **Pre-existing** — `git diff --quiet 9900007f7 HEAD -- <path>` exits 0, so this file is byte-identical across this session's main-merge commits; the finding predates the convergence and is not leaf-owned. Root config still excludes `packages/cli/` from real `fmt`, so it cannot fail CI. |
| 10 | Doctrine/quality | **PASS** — `deno task quality:gate` exit 0; only pre-existing WARNs (F-5/F-6 `export default`, F-16/A3/A13) outside the ceiling; no FAILs. |
| 11 | JSR doc surface | `packages/cli`: exit 0. `plugins/ai`: exit 1 — **verified pre-existing** by re-running the identical command on a detached checkout of the main baseline `2a1248d33`: finding counts and per-entrypoint breakdown identical to head (17 errors, 16 private-type-ref, 1 other), modulo path prefixes. Not leaf-caused. |
| 12 | Package publish dry runs | **PASS** — `packages/cli` `deno publish --dry-run --allow-dirty --no-check=remote` exit 0 ("Dry run complete"); `deno task --cwd plugins/ai publish:dry-run` exit 0. No mutation. |
| 13 | MCP export corpus | **PASS** — `deno task check:mcp-export-corpus` exit 0 (corpus regenerated at `8dce918ba`, now consistent: 35 packages / 270 subpaths / 7623 symbols). |
| 14 | Publish assets | **PASS** — `deno task check:publish-assets` exit 0. |
| 15 | Lock hygiene | **PASS** — `git diff --exit-code 13878a80a -- deno.lock` exit 0, byte-unchanged. |
| — | Patch identity (all 11 locked ceiling paths) | **PASS** — `git diff --quiet 9900007f7 HEAD -- <path>` exits 0 for **all 11** (7 CLI TS, `plugins/ai/scaffold.runtime.json`, 3 AI paths): every authorized path is byte-identical across the main merge, confirming convergence transported the whole leaf patch intact. |
| 16 | Full runtime smoke | **NOT proven.** See judgment below. |

## Row 16 judgment (explicit)

- The leaf's **owned acceptance criterion**, `behavior.package-backed-plugin-doctor`, is proven
  **bounded/standalone**: exit 0, **2/2 passed**, receipt
  `.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/receipts/package-backed-doctor-9900007f7.json`.
  The captured stdout shows `PACKAGE_BACKED_PLUGIN_DOCTOR_PASS` with concrete registry/permission
  evidence — the behavior exercised the shipped CLI targeting a package-backed plugin with the
  generated registry path flow, i.e. it is not a silent skip.
- The **full** `scaffold.runtime` suite cannot currently complete on this host because an **unrelated
  critical gate**, `behavior.app-reference` (a browser/Chromium probe), aborts the suite before later
  gates run. Chromium is absent **identically on the main baseline** `2a1248d33`; this is an
  environment capability gap, not a leaf regression. The same blockage was independently observed on
  #1764 this session.
- **Judgment: the bounded proof is sufficient to support PASS_IMPL** given (a) the owned criterion is
  directly proven with real evidence, (b) every static/unit/package gate the leaf touches passes, and
  (c) the full-suite proof is currently unobtainable for the unrelated reason above. **PASS_IMPL must
  not be read as "the full `scaffold.runtime` suite passed."** The full suite remains genuinely
  unproven on this host and must be rerun under the supervisor-coordinated cluster lease (or on a host
  with Chromium present) before any merge-readiness claim leans on row 16.

## Scope integrity

- Evaluator modified **no product or test path**; only the verdict artifact `impl-eval.md`.
- No commits/pushes to `fix/plugin-doctor-registry-drift`; eval commits live only on
  `eval/impl-eval-1739-cycle-3`.
- No PR draft/label/acceptance-state mutation. No AppHost/Docker/container/`e2e:cli`/browser run.
- The 11-path locked ceiling is exactly the differential surface against the main-merge baseline; the
  main delta was confirmed zero at `8dce918ba` and survives to this evaluated head (patch-identity
  column above).

## Evaluator next-action note

Full-suite runtime proof (plan gate 16) remains assigned to the supervisor-owned singleton lease.
A PASS_IMPL here is scope-local and should be reported to the PR precisely as bounded, not as suite
green.