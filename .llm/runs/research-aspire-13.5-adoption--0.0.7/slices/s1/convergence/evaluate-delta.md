# S1 convergence — delta IMPL-EVAL (independent Fable 5 medium session)

- Evaluator: separate Claude/Fable 5 session (native opposite-family of the Codex Sol generator),
  worktree `/home/agent/projects/netscript/worktrees/007-aspire-s1-eval` detached @
  `e0d70e40407458bebcf02cc408bea6b49107f42b`. Route per lane-policy: Claude · Anthropic · Fable 5 ·
  medium. Evaluated 2026-08-30. Scope: **delta only** on top of the Phase-A IMPL-EVAL PASS at
  `ee379457e` (`slices/s1/evaluate.md`); Phase-A findings not re-litigated.

## Verdict: `FAIL_FIX` — one bounded item, comment text only; no code change

Both Phase-A open findings are now closed by evidence at the frozen head; the only remaining gap is
that the #1713 restore-timing acceptance requires the numbers **in the PR comment**, and the PR
carries only the older cold-only CI comment (10523/12462 ms at `ee379457e`, "warm not observable").

### Required fix (bounded)

- **F1 (comment text only):** Post on PR #1727 the frozen-head `aspire restore` timing with full
  context: **cold 4385 ms / warm 2477 ms**, host `ai-agents`, CLI `13.5.3+b5f14331`, SDK 13.5.3,
  2026-08-30T18:43:51Z (source: `slices/s1/convergence/review-tier-a-convergence.md`). This is the
  #1713 acceptance line 65 ("timing recorded in the PR comment (cold and warm cache)") and is what
  currently blocks that box from mirroring. No branch/code change.

## 1. Identity — PASS (reproduced)

- `git range-diff 3b32d1628..ee379457e origin/main..e0d70e404` reproduced: all four commits `=`
  (`9c0d63655`, `d49faded7`, `91cd66fa1`, `38c3e9e18`), plus the adjudicated fifth
  `e0d70e404 fix(e2e): accept stable 13.5 persistent allocation; prove live second endpoint` as
  `>` (new).
- `git merge-base origin/main e0d70e404` = `52a881c58842` — exactly the stated main (#1736/#1734);
  origin/main has since advanced to `74e3d451e` but the head's base is the exact freeze base.
- PR #1727: head `e0d70e404` (= earlier freeze `38c3e9e18` + adjudicated commit), base `main`,
  draft, open. The brief's "head = 38c3e9e18" predates the adjudicated push; the actual head
  matches the frozen-head definition.
- `git diff --stat ee379457e e0d70e404 -- .github/workflows` — empty: workflows identical to
  `ee379457e`. Fifth-commit scope: run-dir artifacts + `packages/cli/e2e/**` only (per
  `git show --stat e0d70e404`); no file outside the adjudicated scope. Full PR diff
  (`52a881c..e0d70e404`, 29 files) matches the five commits' declared scope; nothing under
  `packages/fresh`, docs, or skills.

## 2. Hosted runtime tiers — PASS (acceptance met)

- `e2e-cli.yml` run **33330714604**, headSha `e0d70e40407458bebcf02cc408bea6b49107f42b`, overall
  conclusion **success**. Jobs: classify **success**; scaffold-static **success**;
  desktop-native-linux **success**; **scaffold-runtime-sqlite (aspire + sqlite + garnet) success**;
  **scaffold-runtime (aspire + docker + postgres) success**; visibility job skipped (expected).
- Preflight evidence from the run logs: `dotnet tool install Aspire.Cli … --version 13.5.3`
  succeeded and preflight printed `13.5.3+b5f143315ffb6968ea939a9978797a5b20e4c688` on the runtime
  tiers. **Acceptance "`scaffold.runtime` green on both CI tiers" is MET at the exact head** —
  Phase-A's medium finding (the #1734 baseline blocker) is closed.

## 3. Restore timing acceptance — FAIL_FIX item F1

- Tier-A convergence file records cold **4385 ms** / warm **2477 ms** at the frozen head with host
  `ai-agents`, CLI `13.5.3+b5f14331`, SDK 13.5.3, 2026-08-30T18:43:51Z (Phase-A's low finding is
  closed **in the run artifacts**).
- PR comment/body check: no comment carries 4385/2477. The only timing comment (2026-08-29) has
  cold-only CI numbers at `ee379457e` and states warm is not observable. The acceptance text
  demands the PR comment → **F1 above**.

## 4. Close-gate (#387) — reported, not ticked

`check-close-gate.ts --repo rickylabs/netscript --pr 1727` at head `e0d70e404`: **FAIL, exit 1**.
Closing reference `Closes #1713` detected from the PR body (keyword ✓). Unchecked boxes (live
issue body, mirror-managed — not ticked by this evaluator):

- #1713 L54 phase-1 scoped sweep clean — evidence exists (parity gate fail=0, reproduced §5).
- #1713 L60 `check:aspire-version-parity` local+ci — evidence exists (§5 + green `ci.yml`).
- #1713 L61 `check:scaffold-versions` — evidence exists (§5).
- #1713 L62 cache-policy test — evidence exists (§5).
- #1713 L63 `scaffold.runtime` green both tiers — evidence exists (run 33330714604, §2).
- #1713 L65 restore timing in PR comment — **blocked by F1** (no evidence to mirror yet).
- PR #1727 DoD L47 (tiers green + preflight) — now true via run 33330714604; tick at handover.
- PR #1727 DoD L48 (Tier-A review + IMPL-EVAL complete) — completed by this pass; tick at handover.

After F1 lands, all six issue boxes have linkable evidence and the mirror/ready handover can
proceed.

## 5. Static regression at `e0d70e404` — PASS (all reproduced by this evaluator)

| Gate | Result |
| --- | --- |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` | 884 files, 8 batches, 0 failed, 0 diagnostics, exit 0 |
| S1-scope tests (parity gate tests, cache-policy, `generate-aspire-config_test`, delta e2e `runtime-gates_test` + `verify-live-db-endpoint_test`) | **42 passed / 0 failed**, exit 0 |
| `deno task check:aspire-version-parity` | ok=true; fail 0 / deferred 20 (owner-tagged, 0 archival) / info 6 / skipped 1 / missing 66 (all archival), exit 0 |
| `deno task check:scaffold-versions` | E-12 OK, 11 stable pins, exit 0 |
| `deno task arch:check` | exit 0 (pre-existing F-5/F-6 `export default` warnings only) |
| `deno task quality:scan` | ok=true, 0 findings, 7 pre-existing allowances, exit 0 |

## Handover

`FAIL_FIX` with the single bounded item F1 (post the cold+warm timing comment). Once posted, this
delta eval's evidence supports the `ready` + close-gate handover with no further evaluation cycle:
re-mirror the acceptance boxes and rerun `check-close-gate.ts` to confirm exit 0. No branch or PR
metadata was modified by this evaluator.
