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

No implementation behavior or assertion strength was relaxed.

Final gate evidence on the formatted head:

| Gate | Result |
| --- | --- |
| Fresh scoped check | PASS — 182 files, 2 batches, 0 findings |
| Fresh scoped lint | PASS — 182 files, 0 findings |
| Fresh scoped format | PASS after formatting the one owned file — 182 files, 0 findings |
| post-format parameter grep | PASS — `offset`, `live`, `handle`, `cursor`, `forwardedQuery`, `resolvedQueryNames`, and the `query` option remain present |
| `quality:gate` | PASS — exit 0; configured quality and doctrine roots omit `packages/fresh` |
| explicit Fresh quality scan | PASS — 0 findings; one pre-existing allowance in route-support |
| explicit Fresh doctrine scan | PASS — `FAIL=0`; three pre-existing warnings and one info finding |
| Fresh package tests | PASS — 223 passed, 0 failed |
| Fresh doc lint | exit 0; AI entrypoint 0 findings, package aggregate 44 pre-existing findings in untouched query/route/streams surfaces |

The first format-wrapper invocation was red with one finding in the newly added `forwardedQuery`
expression. Only `stream-proxy.ts` was formatted, after which the wrapper passed. The mandatory
post-format grep confirmed every introduced protocol parameter and merge symbol remained present.

`quality:gate` confirmed #1542's coverage gap in its own output: `quality:scan` scanned only
`packages/cli/src` and `plugins`, while `arch:check` did not include `packages/fresh`. Explicit Fresh
quality and doctrine scans therefore provide the package-specific evidence.

`doc:lint` returned exit code 0 while reporting 44 findings: 27 private-type references and 17
missing JSDoc items, all in untouched query, route, and streams files. The changed
`src/runtime/ai/mod.ts` entrypoint reported zero findings. This slice did not hide or repair those
out-of-scope legacy findings.

## GitHub reconciliation

Issue #1457 was fetched live on 2026-08-12. It is open, milestone 26 (`0.0.6`), and carries
`type:fix`, `area:fresh`, `area:plugin-ai`, `area:streams`, `priority:p1`, and `status:plan`.
Its current body has no markdown acceptance checkboxes, so there are no valid `box-index` entries
to mirror in the PR's `acceptance-evidence` block.
