# Evaluation: PR #1982 delta — shipped helper closure + generated-project safeguard (cycle 2)

IMPL-EVAL cycle 2 (formal). Same independent evaluator session as cycle 1. The cycle-1 verdict at
`c487e9273` is preserved **verbatim** in `evaluate-cycle-1.md` in this run directory (verified
byte-identical to the originally written artifact). This document evaluates only the bounded delta
`c487e9273..0475c3213` plus the carry-over findings from cycle 1. No source edits, no commits, no
GitHub mutation performed by this evaluation.

## Identity

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-parity-context--0.0.7` |
| Evaluated head (this cycle) | `0475c32134166b9ba60ce1ea1a53c6abcc5af695` (exact, clean worktree, PR #1982 head at review time) |
| Cycle-1 head (preserved verdict) | `c487e927367e6b6eee281c7ca19f384c89a1fae7` |
| Base | `94fe507af47171cd4f295e8f532b281d7147b334` |
| Session / model identity | Session `7ffea6b7-4401-4fec-b826-7d5e7657d88f` — same independent evaluator session as cycle 1; `z-ai/glm-5.3-flash`, effort max, via checked-in Claude Code/OpenRouter transport |
| Generator | Primary coordinator GPT-5.6-SOL high (unchanged); no model switch |
| Delta scope | 12 files: `consumer-tools.json`, `check-aspire-host-ports.ts(+test)`, `scaffold-e2e-test.ts(+test)`, `AGENTS.md`, `agent-tools.generated.ts`, and 4 run artifacts |

## Commands and results (all run independently in this worktree, Deno 2.9.5 via mise)

| Command | Result |
| --- | --- |
| `run-deno-test.ts -- --allow-all` over `aspire-scan-scope_test.ts`, `check-aspire-version-parity_test.ts`, `check-aspire-host-ports_test.ts`, `check-aspire-resource-polling_test.ts`, `check-compat-fixtures_test.ts`, `scaffold-e2e-test_test.ts`, `generate-cli-assets-barrel_test.ts` | exit 0, **64 passed / 0 failed** (matches author receipt) |
| `deno task check:aspire-version-parity --phase 1` | exit 0, 867 checked, 0 fail, 12 deferred, 5 info, 1 skipped, 0 missing, `manifestFresh:true` |
| `deno task check:aspire-version-parity --phase 2` | exit 0, 867 checked, 0 fail, 17 info, 1 skipped, 0 missing, `manifestFresh:true` |
| `deno task check:aspire-host-ports` | exit 0, "Scanned 966 files. OK — no pinned host ports." |
| `deno task check:assets-barrel` (regenerate + `git diff --exit-code` over all 7 generated assets) | exit 0 — canonical carriers fresh at this head; regeneration in my worktree produced identical bytes (worktree clean afterwards) |
| CLI probe: `check-aspire-host-ports.ts /tmp/x /tmp/y --generated-project` | exits **1** with `--generated-project requires one root` |
| CLI probe: repo-scope scan of a scratch fixture project at `/tmp/.../.llm/tmp/gen-proj` containing `aspire/appsettings.json` pin + internal `.llm/runs/hist/apphost.ts` | "Scanned 0 files." — incidental scratch ignored by repository scans |
| CLI probe: same project with `--generated-project --pretty` | "Scanned 1 files.", 1 FAIL on the generated `appsettings.json` host-port pin; internal `.llm/runs` file NOT scanned (1 file, not 2) |
| `deno check --unstable-kv` over the 12 touched TS files | exit 0, zero diagnostics |
| `run-deno-lint.ts --config .llm/tmp/eval-parity-lint.json` (root rules `recommended`,`jsr` + `no-process-global`,`no-node-globals`, **no excludes**) over the 12 files | 12 selected / **12 processed / 0 dropped / 0 refusals**, 0 occurrences, exit 0 |
| `run-deno-fmt.ts` over the 12 files | 12 selected / 12 processed, 0 findings, exit 0 |
| `git diff --check c487e9273..0475c3213` | clean (delta introduces no whitespace defects) |
| `git diff c487e9273..0475c3213 -- deno.lock` | empty — no lock movement |
| live polling scan (`findAspireResourcePolling` over repo root) | unchanged: 2 findings, both pre-existing at base (see carry-over F-2) |
| `git status` after all runs | only the two untracked evaluation artifacts (`evaluate.md`, `evaluate-cycle-1.md`) |

Lint coverage note (honest): same evaluator-created temporary config as cycle 1 (`.llm/tmp/eval-parity-lint.json`,
gitignored, transient) because the root `deno.json` lint config excludes `.llm/`. All 12 files were
actually processed — none dropped — under the root rule set with no exclusions.

## Delta review

1. **Shipped helper closure (consumer carrier).** The host-port checker is shipped to consumers by
   agent init, so cycle 1's new `aspire-scan-scope.ts` import created an unclosed bundle: the shared
   helper was missing from the consumer bundle. The delta declares it as a `consumer-tools.json`
   module (`validation/aspire-scan-scope.ts`) and regenerates `agent-tools.generated.ts` (7+/4−;
   now embeds the helper and the `--generated-project` checker). Independently verified: the
   `generate-cli-assets-barrel_test.ts` real-bundle relative-import closure test passes, and
   `check:assets-barrel` regenerates to zero diff. This was a real gap at `c487e9273` — caught by
   hosted quality CI, not by my cycle-1 review; I verified the closure directly rather than taking
   the CI claim.
2. **Generated-project safeguard (no scratch false-green).** The existing scaffold E2E deliberately
   validates a generated application created under scratch; the cycle-1 repository-scope exclusions
   would have silently scanned 0 files there. The delta adds an explicit `--generated-project` mode:
   `scanContent` gains a `scopePath` parameter (transient classification now uses the scope, not the
   repo path), `scanHostPorts(roots, generatedProject)` computes scope relative to the selected
   project, and the CLI requires exactly one root when the flag is present. The existing E2E caller
   passes the flag (`scaffold-e2e-test.ts` +1) and its report test asserts it. Both directions are
   proven by unit test and by my CLI probes: repository scans still ignore scratch entirely
   (0 files), while an explicitly selected project under `.llm/tmp` is scanned and a real generated
   `HostPort` defect stays red, with internal `.llm/runs` inside that project still excluded.
   Fail-closed shape: the one-root guard throws, and there is no blanket re-inclusion of scratch.
3. **Documentation/run artifacts.** `AGENTS.md` documents the explicit generated-project acceptance
   scan and that internal run/temp files stay excluded; `drift.md` D-3/D-4 and `plan.md` items 7–8
   record the boundary decisions; the worklog honestly records the initial unsupported wrapper-flag
   lint invocation and the CI job that caught the missing carrier. Coherent with observed behavior.
4. **No collateral change.** Delta touches only the 12 files listed; no lock movement, no workflow
   edits, no harness deletion, no package runtime/output change, no new entrypoint or dependency;
   `scanContent`'s public call signature is backward compatible (scopePath defaults to `path`, and
   cycle-1 tests pass unchanged).

## Carry-over findings from cycle 1 (status)

| Cycle-1 finding | Status at `0475c3213` |
| --- | --- |
| F-1 (medium) head drift: PR head beyond evaluated `c487e9273` | **Closed by this cycle.** The two follow-on commits are now independently reviewed and gate-verified at the exact final head; the verdict below covers `0475c3213`. |
| F-2 (low) polling guard unwired to any gate; live repo scan reports 2 findings pre-existing at base (its own test fixture; `packages/cli/src/kernel/adapters/database/operation-runner.ts:357`) | **Unchanged — still stands as pre-existing advisory.** Not touched by the delta; re-confirmed by live scan at this head. Whoever wires the guard as a gate must resolve these first. |
| F-3 (low) D-13 `check-compat-fixtures_test.ts` pins 5 of the manifest's 6 compat-fixture rows | **Unchanged — still stands as optional advisory.** `check-compat-fixtures_test.ts` untouched by the delta; the new row remains enforced by phase-2 parity directly (re-confirmed in this cycle's phase-2 report). |
| F-4 (low) trailing blank lines in two run artifacts (`research.md:12`, `supervisor.md:17`) | **Unchanged — still stands as cosmetic.** The delta commits are themselves `git diff --check`-clean; the two flagged artifacts were not modified by the delta. |

Transparency note: my cycle-1 review did **not** independently flag the missing consumer carrier or
the scratch false-green — hosted CI caught the carrier and the author's own checker trace caught the
scratch caller. This cycle closes both risks and I verified each directly. The cycle-1 F-1 finding
correctly required exactly this follow-on review before sign-off.

## Findings (this cycle)

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low | `--generated-project` renders findings with a repo-root-relative path containing `../` when the selected project is outside the repository (observed in my `/tmp` probe). Cosmetic in manual probes; the shipped E2E caller selects an in-repo project root, so no shipped behavior is affected. | CLI probe output at this head | None for this PR; optional path-normalization polish in a later tooling slice |
| low | Carry-over F-2, F-3, F-4 remain open as non-blocking advisories (table above). | see carry-over table | None required for merge of this PR |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **PASS** (coordinator token: **PASS_IMPL**) |
| Rationale | The bounded delta is correct and complete at exact head `0475c3213`: the shipped host-port checker's import closure is restored through the canonical `consumer-tools.json` declaration and fresh `agent-tools.generated.ts` carrier (assets-barrel exit 0, bundle-closure test green); the generated-project safeguard keeps repository scans blind to scratch while the existing functional E2E gate still detects a real generated-app host-port defect, with internal run state inside the selected project still excluded — proven by the new regression test, the E2E caller wiring, and my independent CLI probes in both modes including the one-root fail-closed guard. 64 focused tests pass, both parity phases pass (867 checked, 0 fail/missing, fresh manifest), host-port scan 966 files PASS, and the 12 touched files are check/lint/fmt clean with honest full lint coverage. No lock movement, no runtime/output change, no collateral edits. Cycle-1 F-1 is closed by this evaluation; F-2/F-3/F-4 remain non-blocking pre-existing/cosmetic advisories and are not grounds to block this PR. Source CI remains a coordinator-owned gate; this verdict does not certify CI and nothing here fabricates a CI PASS. |
