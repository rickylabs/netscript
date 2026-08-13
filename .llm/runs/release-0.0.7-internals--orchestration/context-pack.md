# Context pack — 0.0.7 internals topic

Wave 0 contains exactly two active leaves, both branched from live `origin/main`
`01e0960494c95ce56eb35892c211a095eb13e6ed` with no upstream:

1. `quality-scan-allowance-rail` — #1378 + #1545, inseparable; worktree
   `/home/codex/repos/netscript-007-quality-rail`; branch
   `chore/quality-scan-allowance-rail`; Sol/high; thread
   `019ffcc9-97d6-7602-bb7d-582ecc92b069`.
2. `harness-evidence-and-verdict-tooling` — #1561 + #1563 + #1621; worktree
   `/home/codex/repos/netscript-007-harness-evidence`; branch
   `fix/harness-evidence-and-verdict-tooling`; Sol/medium; thread
   `019ffcc9-97ba-7770-a890-a1ebd80ec793`.

Coordinator authority remains external in
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
Do not mutate its cluster state. Supervise leaves event-first, serialize the single evaluator slot,
and never overlap the global expensive gate.

Both requested/observed routes match. Same-thread steering commands are recorded in `worklog.md`
and each leaf's `codex-thread-ids.md`. The launcher reported Remote Control disabled, so do not
claim mobile-visible Remote Control.

The evidence/verdict leaf is draft PR #1644. The coordinator authorized the exact five
implementation/test peers and retained `netscript-pr/SKILL.md` as read-only; its existing Codex
thread resumed and committed the authorization at `41328ea3e6620dbe730157a313ff1d6c6b3f52f5`.
S1 passed Tier-A re-review through `01db2bd360ea15d8bd9b53fee5fc392678321f43` after the requested
mirror-boundary regression. S2 passed Tier-A through
`8b4f4b509e4cb9ad6f7e9414b9b948ce9a2b7a33`; final structured gates and separate IMPL-EVAL remain.
The #1561/#1621 documentation versus
read-only-skill closure conflict is still coordinator-owned and blocks a truthful final closing
claim.

The quality leaf is draft PR #1653. Its Codex plan head is `c573beda9`; the separate evaluator
artifact head is `8a4709afe`. Native Fable 5 medium was unavailable (`model_not_found`, session
`4427e1d6-ab15-4f80-8840-2281744b1214`), so the one evaluator slot used the approved
Claude/OpenRouter Minimax M3 high fallback, session
`977b0618-1b0c-4957-8369-698d3c5274c6`. Verdict: `FAIL_PLAN`. Implementation is hard-stopped on
the durable allowance owner, exact test/generated file-surface amendment, and workers JSR debt
baseline; live #1545 also needs its stale count reconciled from 8 to 7 before closure.
