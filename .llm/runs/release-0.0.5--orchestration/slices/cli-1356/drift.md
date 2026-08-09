# Drift Log: #1356 UI app-root resolution

## 2026-08-09 — Tier-D runtime identity is not registered

- **What:** The active thread id exists in `CODEX_THREAD_ID`, but the agentic runtime controller
  cannot match it to this worktree/session.
- **Source:** `deno task agentic:runtime status --agent codex --worktree
  /home/codex/repos/ns005-w3b1 --session 019fe4b4-7c12-72c2-b692-8d851f9c3b5c --json`.
- **Expected:** Daemon-managed Tier-D identity with worktree, session, and steering command.
- **Actual:** `status=blocked`, diagnostic `missing_identity`, raw exit 3; foundation components are
  ready but desired/observed worktree and session lists are empty.
- **Severity:** significant
- **Action:** accept owner-authorized continuation of this already-active sole-writer product
  thread; make no daemon/mobile-visibility claim and do not create a replacement thread.
- **Evidence:** `supervisor.md`; raw status output in the implementation session.

## 2026-08-09 — Live issue has nine acceptance rows

- **What:** The dispatch shorthand names four behavioral rows, while the live issue body has nine
  close-gated acceptance boxes.
- **Source:** `gh issue view 1356 --repo rickylabs/netscript`.
- **Expected:** Four behavioral rows from the dispatch.
- **Actual:** Five additional rows cover public input, docs truth, two negative controls, and the
  serialized runtime proof.
- **Severity:** minor
- **Action:** implement/evidence every non-runtime live row; leave the runtime proof to owner CI
  because no token is granted.
- **Evidence:** `research.md` F8 and the validation plan.

