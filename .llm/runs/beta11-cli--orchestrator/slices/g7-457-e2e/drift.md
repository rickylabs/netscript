# Drift Log: G7 #457 native-first thin-client deploy E2E

Drift is append-only.

## 2026-07-18 — Option A supersedes the older single-artifact/graph authority for beta.11 windows

- **What:** Earlier issue/RFC material described a single-artifact or snapshot/graph updater and
  Windows apply proof. The later owner-ratified Option-A amendment makes native Deno Desktop update
  authoritative for the window-only thin-client tier and limits Windows to staged/manual proof.
- **Source:** live issue #457 final amendment; landed G2/G6 drift records.
- **Expected:** Implement graph/snapshot or cross-platform apply semantics.
- **Actual:** Implement native formats, Linux/macOS apply+rollback, Windows staged/manual, and remote
  service discovery; defer graph mode to SD-8/beta.14.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `research.md` findings 1, 8–12; `plan.md` D7, D14–D19.

## 2026-07-18 — Current Codex thread is not discoverable through the agentic runtime controller

- **What:** The user supplied the supervising Fable session ID but no Codex thread UUID. The
  inspect-only runtime status found zero managed sessions for this worktree.
- **Source:** `deno task agentic:runtime status --worktree /home/codex/repos/wt-g7-457`.
- **Expected:** Tier-D attachment evidence includes daemon-managed status and a concrete thread ID.
- **Actual:** `MISSING_IDENTITY`; worktree and current interactive session are real, but
  daemon/mobile attachment is unproven.
- **Severity:** minor
- **Action:** accept for plan generation; do not claim attachment
- **Evidence:** `supervisor.md` § Attachment evidence.
