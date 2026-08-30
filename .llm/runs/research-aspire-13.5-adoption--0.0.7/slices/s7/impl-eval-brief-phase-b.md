use harness

## SKILL

- netscript-harness — evaluator protocol; you are the **independent Phase-B IMPL-EVAL** for
  Codex-authored S7 work; never continue implementation, never self-certify.
- netscript-tools — scoped wrappers, raw git verification. netscript-pr — close-gate (#387).
- aspire — CLI facts; **read-only for all Docker/Aspire state**: no AppHost, no containers, never
  touch `relay-*` containers or `loopback-relay.ts` processes.

## Context

Formal IMPL-EVAL for **S7 Phase B** — #1719 (`Closes #1429`) / PR #1744 (base `main`), epic #1712.
Phase-A IMPL-EVAL passed at `473286671`-era head (`slices/s7/evaluate-cycle-2.md`). Phase B first
run (head `8633972fd`) was an **honest FAIL** of the reporter (re-parented descendants classified
`unproven`); the bounded repair (`f48a151e9` line) passed supervisor Tier-A
(`slices/s7/review-tier-a-reporter-fix.md`), was rebased patch-identically (12/12) onto shipped
main `9710a2898d4f` → **evaluate exactly the branch head named in the supervisor's dispatch note
below**, worktree `/home/agent/projects/netscript/worktrees/007-aspire-s7-eval` (detached at that
head; write only your evaluate file).

## Verify (reproduced yourself)

1. Rerun receipts `phase-b-11` … `phase-b-20` (`.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/receipts/`):
   the #1429 reproduction (CLI killed, descendants re-parented) now classifies the leased orphans
   **owned with named provenance evidence** (contained `cwd`/`--contentRoot`, Aspire identity,
   census success, stable PID+start identity, age threshold, inactive run — never PPID-only), and
   `teardown --apply` terminated exactly them (targeted TERM, no `--all`).
2. Foreign-control invariant: the control AppHost identities are unchanged from baseline through
   the final receipts and were never mutated; `relay-*` classified foreign/supervisor-owned.
3. Census caveat honored: final receipts carry the exact local process census; no receipt cites
   `cleanup.aspire-stop` alone as process-zero.
4. Zero: final `aspire ps` `[]`, containers/volumes empty (modulo `relay-*` while the lease held),
   scratches removed. Reconcile with the supervisor's `zero-after-relay` receipt.
5. Static regression at the head: teardown unit suite, scoped check/lint, `arch:check`,
   `quality:scan` — record exits. Diff vs `origin/main` stays `.llm/`-only.
6. Close-gate readiness for #1719/#1429: acceptance evidence vs the `phase-b-handoff.md` block;
   PR hygiene (draft state, labels, closing keywords, comments).

Verdicts: `PASS` / `FAIL_FIX` (bounded) / `FAIL_PLAN`. Write
`slices/s7/evaluate-phase-b.md` in the supervisor run dir and post the verdict as a PR #1744
comment `[PHASE: IMPL-EVAL] [VERDICT: …] — phase B`. Touch nothing else.
