# Drift Log: saga publish delivery (#1190)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-04 — sibling RED does not cover publish delivery

- **What:** PR #1193 captured missing Redis adapter/bootstrap failure but not #1190's HTTP publish
  hang or absent runner projection.
- **Source:** `/home/codex/repos/ns005-sagas/.llm/runs/fix-sagas-kv-glue-registration--w2-f/worklog.md`.
- **Expected:** Reuse #1193 RED if it captured the publish hang.
- **Actual:** Its protocol publishes returned 200 after glue changes; it did not prove runner
  consumption or `saga_instances`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** sibling worklog and PR #1193 body/comments reviewed 2026-08-04.

## 2026-08-04 — foreign ephemeral AppHost blocks protocol start

- **What:** A live `aspire/db-operation/apphost.mts` belongs to the #1193 worktree and is not owned
  by this run.
- **Source:** `aspire ps --format Json`.
- **Expected:** One AppHost at a time with an empty machine before fresh scaffold protocol.
- **Actual:** One foreign host is already active.
- **Severity:** significant
- **Action:** accept
- **Evidence:** worktree path
  `/home/codex/repos/ns005-sagas/.llm/tmp/cli-e2e/plugin-smoke-20260804-012128/aspire/db-operation/apphost.mts`.

## 2026-08-04 — current session model build is not observable

- **What:** The owner assigned the current Codex session, but the API surface does not expose its
  internal model build for comparison with the canonical route.
- **Source:** current session metadata and `workflow/lane-policy.md`.
- **Expected:** requested and observed route identity are recorded.
- **Actual:** only the product/session identity is observable.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` distinguishes canonical requested route from observed surface.

