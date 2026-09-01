use harness

# #1349 — close the remaining S3 scope, reconciled against what already shipped

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `netscript-doctrine` — `packages/sdk` (Archetype 4) public surface and gates.
- `netscript-deno-toolchain` — `deno doc` to read published surfaces cheaply.

## Step 1 is an audit, not implementation — do this before writing code

#1349's scope was **amended in place** by the *0.0.7 normative scope amendment (2026-08-13)*: RFC 0001
Stage 2 supersedes conflicting rows in the issue body. Slices S1–S3 already shipped through **#1834**
and **#1841** (which published canary 5), and `packages/sdk/src/internal/client-contributions/`
(`adapter-ports.ts`, `prepared-call.ts`, `stable-v1-adapter.ts`) plus
`packages/sdk/src/client/sdk-client-contribution.ts` are on `main` today.

So the first deliverable is a written reconciliation in `research.md`: **for each amended acceptance
row, is it shipped, partially shipped, or outstanding — with the file and symbol as evidence.** Use
`deno doc` on the published surface rather than reading source broadly. Do not re-implement anything
that is already on main.

Then implement **only** what the audit proves outstanding. If the audit shows everything is shipped,
say so with evidence and stop — that is a legitimate and valuable outcome, and the supervisor will
handle closure. Do not manufacture work to fill the slice.

## Hard constraints from the amendment — these are prohibitions, not preferences

The amendment states this issue **must not**:

- publicly export `createHttpClientLink`, `ClientLinkPort`, `ClientLinkCallOptions`, or **any**
  internal adapter port — the stable-v1 implementation stays under the **private**
  `src/internal/client-contributions/` path;
- accept upstream interceptor/plugin callback arrays;
- remove `port` and `timeout` — they stay **accepted and deprecated**.

`#451` remains the sole future custom-link owner. **`#1351` owns transport consolidation and no-op
option migration — do not do that work here**, even if it looks adjacent.

Coverage the amendment requires: key algebra, reconnect preparation, desktop rejection, cache modes,
conflicts, and the local failure taxonomy. Verify each is actually pinned by a test; an uncovered one
is outstanding scope.

## Ordering — binding

The milestone order is **#1349 → #1351 (Internals) → #1352 → #1353 → #1467**. #1352/#1353/#1467 are
planned separately and all rewrite `packages/sdk/src/client/http-client-link.ts:82-101`. **Do not touch
that header-authorship callback here** — doing so would collide with three queued slices and pre-empt a
plan that is not yours.

## Gates

Focused `packages/sdk` check/test/lint/fmt via the structured wrappers; `deno doc --lint` measured
**A/B against base** (the sdk export map has pre-existing findings — report *new* diagnostics, never
absolute); publish dry-run; `deno.lock` must not move. **Do not run any local runtime, Aspire, Docker,
browser, or `e2e:cli` gate.**

## PR contract

Full metadata in the same action as opening: `orchestrator:features`, `status:impl`, `type:feat`,
`priority:p1`, `wave:v1`, `area:sdk`, milestone **0.0.7**. Reference `#1349`; **do not add a closing
keyword** — closure is the supervisor's decision after close-gate verification, and #1348 is an epic
that must never carry one.

Keep `research.md`, `worklog.md`, and `drift.md` under `.llm/runs/feat-sdk-client-s3--1349/`.
