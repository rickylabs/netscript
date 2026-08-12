# Worklog — #1457 chat proxy query forwarding

Implementation lane: Codex · GPT-5.6 Sol · low (`light_implementation`).
Branch: `fix/1457-chat-proxy-query-forwarding`.
Baseline: `origin/main@f99cb4fbf`.

## Design

- Public contract: optional `query(URLSearchParams): URLSearchParams`; its explicit types avoid a
  slow-type regression and existing callers remain source-compatible.
- Default: forward every incoming pair except `id`.
- Merge: snapshot names already present on the resolved upstream URL, then append every forwarded
  pair whose name is not in that snapshot. This preserves repeated client keys while making every
  resolved value authoritative on collisions.
- Existing IO behavior: header, auth, request body, duplex, redirect, abort, fetch, stream body,
  and response sanitization code remains unchanged.
- PLAN-EVAL: N/A — the owner brief locks every behavioral decision for this small slice.
- Deferred scope: #1459 `application/defer/**` and #1548 `stream-url-resolver.ts`.

## Evidence

The first package test run was red with two test-fixture expectation failures:

- The collision fixture used the string `streamPath` form, which is a prefix before `sessionId`;
  changed it to the documented function form so the resolved URL genuinely carries the query.
- The pre-existing eis-chat test expected the incoming `session` parameter to disappear; D1 now
  intentionally forwards it, so the expected injected-fetch URL includes `?session=eis-123`.

No implementation behavior or assertion strength was relaxed. Required gates remain pending.

## GitHub reconciliation

Issue #1457 was fetched live on 2026-08-12. It is open, milestone 26 (`0.0.6`), and carries
`type:fix`, `area:fresh`, `area:plugin-ai`, `area:streams`, `priority:p1`, and `status:plan`.
Its current body has no markdown acceptance checkboxes, so there are no valid `box-index` entries
to mirror in the PR's `acceptance-evidence` block.
