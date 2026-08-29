# Tier-A slice review — S1 (#1713, PR #1727) — supervisor: Fable 5 medium

Status: **TIER-A SIGN-OFF at exact head `69b2ebaf686672d5ac3117cf40f7d8ac22dfe784`** (2026-08-29) —
pending independent IMPL-EVAL; draft→ready withheld until the baseline Fresh blocker (drift D-14) is
routed by the coordinator.

## Commits reviewed (branch `chore/aspire-13-5-s1-pin-bump`, base `origin/main` `3b32d1628`)

| SHA                               | Message                                                    | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `95680776e`                       | test(aspire): prove phase-1 parity detects the stale train | OK — RED-first: gate + 4 unit tests + committed RED receipt (`outcome: FAIL`, exactly the 7 S1-owned fail rows; 21 owner-tagged deferred; 6 archival info; lockfile skipped). Manifest imported byte-for-byte at the D-13 path (blob `3341910f…`, 813 rows) because `origin/main` lacks the research run dir — recorded in the child's `drift.md`; identical bytes to the research branch, so the eventual merge cannot conflict.                                                                                                                                                      |
| `4e30264fa`                       | chore(aspire): prove one atomic 13.5.3 train               | OK — every pin on 13.5.3; Browsers `13.5.3-preview.1.26425.3` (OF-2a); CommunityToolkit 13.5.0 (incl. the unused `SCAFFOLD_COMMUNITY_TOOLKIT`, re-pinned not deleted — S13 decides); `e2e-cli-prod.yml` off `install.sh`+preview onto `dotnet tool install … 13.5.3`, preflight `13.5.*`; cache keys `13.5.3-v1` ×4; policy test single-train and asserts the install/preflight strings; generator tests compare against constants; parity phase 1 wired into `ci.yml` via `run-gate.ts` (receipt id `quality-aspire-version-parity`); GREEN receipt committed (fail 0 / deferred 20). |
| `68b0aef87` (amended `5b42e92e1`) | docs(aspire): preserve preview debt and evaluator handoff  | OK — append-only debt entry `aspire-browsers-preview-1713` with a stable-drop gate; worklog/context-pack complete. Amend + `--force-with-lease` on the child's own unmerged branch is acceptable; PR comments cite the pre-amend SHA for slice 3 — noted, not blocking.                                                                                                                                                                                                                                                                                                                |

## Independent gate run (supervisor, in the S1 worktree)

| Gate                                                                                                               | Result                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `run-deno-check.ts --root .llm/tools/validation --root packages/cli/src/kernel/constants`                          | 38 files, 0 diagnostics                                                                                           |
| raw `deno fmt --check` on the 7 touched TS/test files (wrappers exclude `.llm/tools` and `packages/cli` by config) | clean                                                                                                             |
| `deno test .llm/tools/validation/check-aspire-version-parity_test.ts`                                              | 4/4                                                                                                               |
| `deno task check:scaffold-versions`                                                                                | E-12 OK, 11 stable pins                                                                                           |
| `deno task check:aspire-version-parity`                                                                            | ok=true, fail 0, deferred 20, info 6, skipped 1, missing 66 (research-run paths absent on this branch — expected) |
| `.github/scripts/aspire-nuget-cache-policy.test.ts`                                                                | 2/2                                                                                                               |
| `generate-aspire-config_test.ts`                                                                                   | 1 test / 4 steps green                                                                                            |
| `deno task quality:scan`                                                                                           | ok, 0 findings (7 pre-existing allowances)                                                                        |
| `deno task arch:check`                                                                                             | 3 pre-existing F-5/F-6 warnings, no new                                                                           |
| `deno task check:assets-barrel`                                                                                    | clean                                                                                                             |

## Observations (non-blocking)

1. **Route drift on resume turns.** Launch identity matched (openai · gpt-5.6-sol · medium), but
   `codex-resume.ts`/`run-codex-slice.ts` do not pass `--effort`, so the child's later turns ran at
   the profile default (`codex-status` shows `high`). Recorded as supervisor drift; the review
   pairing stays Fable (medium+) either way. Follow-up for the agentic suite, not for S1.
2. **`scaffold-static (deno-only)` failed** on the child-dispatched `e2e-cli` run 33276629736 at
   `68b0aef87`: generated-project type-check error in
   `packages/fresh/src/application/query/hydration.ts` (TanStack `DehydratedState` readonly
   mismatch). S1's diff does not touch `packages/fresh` (verified:
   `git diff origin/main..HEAD -- packages/fresh` is empty) → baseline/dependency drift, owned by
   the 0.0.7 fixes lane, not S1. Blocks `ready` only if the coordinator treats `scaffold-static` as
   required for this PR; the Aspire verdict is the two runtime tiers.
3. The child manually dispatched `e2e-cli.yml` (`workflow_dispatch`) at its head to obtain the
   runtime verdict while the PR is draft — consistent with the repo's "draft pushes schedule no
   jobs" policy and with the brief's "CI is running" condition.

## Pending before sign-off

- `scaffold-runtime (aspire + docker + postgres)` and
  `scaffold-runtime-sqlite (aspire + sqlite + garnet)` results from run 33276629736 (13.5.3 CLI
  installed by the workflow — first live 13.5 proof).
- Child's terminal `DONE` / runner JSON.

## Fresh exact-head review — `69b2ebaf6` (coordinator Tier-A repair folded into commit 3)

| Item                                             | Result                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finding 1 (missing required path must fail)      | Closed: non-archival missing row → `fail` (`required manifest path is missing`); archival missing rows stay `info`; negative test added.                                                                                                                                        |
| Finding 2 (exact-train coverage)                 | Closed: `PHASE_ONE_EXACT_VERSIONS` allow-list per phase-1 pin file (13.5.3 / 13.5.0 / Browsers preview / `13.5.3-v1` cache key); any other `13.x.y` literal → `fail` (`outside the locked phase-1 pin policy`); test proves a `13.5.2` drift fails on every one of the 7 files. |
| Gate tests                                       | 6/6                                                                                                                                                                                                                                                                             |
| `check:aspire-version-parity`                    | ok=true, fail 0, deferred 20, info 6, skipped 1, missing 66 (all archival)                                                                                                                                                                                                      |
| `run-deno-check.ts --root .llm/tools/validation` | 0 diagnostics                                                                                                                                                                                                                                                                   |
| raw `deno fmt --check` (gate + test)             | clean                                                                                                                                                                                                                                                                           |
| `check:scaffold-versions`                        | E-12 OK                                                                                                                                                                                                                                                                         |
| Child terminal state                             | `BLOCKED: … Fresh hydration TS2345` (correct: work complete, out-of-scope baseline)                                                                                                                                                                                             |

Non-blocking note for S13/parity follow-up: the exact-pin allow-list duplicates the pin values
instead of deriving them from `SCAFFOLD_VERSIONS`/`SCAFFOLD_ASPIRE_INTEGRATIONS`; acceptable for
phase 1 (it is precisely the "no silent patch drift" guard), revisit when phase 2 lands.

Sign-off: supervisor (Fable 5 medium). IMPL-EVAL dispatched to an independent Fable session in
`/home/codex/repos/netscript-aspire-13-5-s1-eval` at the same head (see worklog).
