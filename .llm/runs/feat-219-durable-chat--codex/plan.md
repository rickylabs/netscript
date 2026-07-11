# Plan

## Profile and scope

- Archetype 2 (Integration), with `SCOPE-frontend`.
- Surface: `@netscript/fresh/ai`; `@netscript/fresh/streams` is regression-only and remains untouched.
- PLAN-EVAL is owner-waived in the brief; the design checkpoint remains mandatory.

## Locked decisions

1. Preserve the existing NetScript-owned subscribe/send connection surface; do not invent a new wire protocol or re-export upstream implementation types.
2. Prove acceptance with a deterministic in-memory durable log that simulates multiple concurrent subscribers, cursor resume, sends, and live token appends.
3. Model optimism at the `useChat` boundary: the local user turn appears immediately in simulated UI state while `connection.send` persists it; the adapter is not responsible for duplicating TanStack AI's optimistic reducer.
4. Use the existing snapshot projection and offset as the reload handoff, then subscribe from that cursor.
5. Keep multibyte text as literal UTF-8 content in the same lifecycle test.
6. Add implementation code only if the acceptance test exposes a real contract defect.

## Open-decision sweep

- Must resolve now: cursor semantics for seed-to-live handoff and fan-out semantics for multi-tab subscribers. The integration test locks both.
- Safe to defer: application route migration, end-to-end browser automation, and docs prose outside JSDoc.

## Commit slices

1. **Durable lifecycle proof** — add the fake-stream integration test and minimal adapter correction if required. Gate: focused `deno test`; files: `packages/fresh/src/runtime/ai/*_test.ts`, optionally the directly exposed adapter module, plus run artifacts.
2. **Package gates and handoff** — run scoped check/lint/fmt, focused tests, doc-lint, publish dry-run, record evidence, commit and push. Files: run artifacts only unless a gate requires an owned fix.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Test merely restates mocks | Fake owns an append-only log, cursors, waiter fan-out, and independent connections. |
| Optimism is falsely attributed to adapter | Explicitly simulate TanStack AI's local optimistic state before awaiting send. |
| Hanging live iterators | Abort every subscription and assert deterministic teardown. |
| Existing StreamDB behavior regresses | Do not edit streams surface; run its existing focused test. |
| Upstream types leak publicly | Keep test seams structural and run full export-map doc-lint/publish dry-run. |

## Required gates

- Focused durable-chat and StreamDB tests.
- Scoped wrapper check/lint/fmt for `packages/fresh`.
- `deno task doc:lint` / export-map doc lint for `packages/fresh`.
- `deno task publish:dry-run` in `packages/fresh`.
- Manual Archetype 2 fitness review plus available doctrine/JSR audit evidence.

## Deferred scope

- Docs-page guidance (owned by docs wave); handoff note: clearly state chat uses durable sessions and `useChat`, while StreamDB shapes remain for tables/live-query data.
- eis-chat consumer migration and deletion of its three workaround sites.
- Real-browser E2E; acceptance explicitly permits an in-memory simulated lifecycle.
