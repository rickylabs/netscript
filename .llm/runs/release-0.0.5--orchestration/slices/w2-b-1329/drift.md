# Drift Log: W2-B #1329 versioned stream SSE envelope

## 2026-08-08 — Shared supervisor contract file absent at dispatched base

- **What:** The dispatch requires reading `_shared-brief-contract.md` in full, but the file is not
  present under the stated parent slice directory.
- **Source:** direct filesystem lookup and complete slice-tree listing.
- **Expected:** `.llm/runs/release-0.0.5--orchestration/slices/_shared-brief-contract.md`.
- **Actual:** no such file at `c383b2e84`; the user supplied its complete contents inline.
- **Severity:** significant.
- **Action:** accept the exact inlined contract for this dispatch and preserve this provenance note;
  do not reconstruct or invent a repository file.
- **Evidence:** dispatch prompt; `find .llm/runs/release-0.0.5--orchestration/slices`.

## 2026-08-08 — Prepared/held metadata superseded by explicit dispatch

- **What:** Existing slice supervisor metadata described a different planned branch/worktree and a
  pre-C14 hold.
- **Source:** existing `supervisor.md` versus dispatch identity and parent terminal C14 context.
- **Expected:** slice metadata matches the active implementation lane.
- **Actual:** branch `fix/streams-versioned-sse-envelope`, worktree `/home/codex/repos/ns005-w2b`,
  base `c383b2e84`; C14 green pair is already recorded.
- **Severity:** minor.
- **Action:** update slice supervisor identity; no product rescope.
- **Evidence:** `git rev-parse`, parent `context-pack.md`, dispatch prompt.

## 2026-08-08 — Published export-map baseline is not doc-lint clean

- **What:** The planned package audit found five `private-type-ref` diagnostics and one slow-type
  warning before any implementation change.
- **Source:** structured full-export doc lint and package JSR audit.
- **Expected:** carried-in preflight implied doc lint/publish were ordinary green gates.
- **Actual:** package tests and dry-run pass, but telemetry public annotations leak five private
  types across `.`, `./telemetry`, and `./testing` reachability.
- **Severity:** significant.
- **Action:** fix within this changed published package; no waiver and no unrelated package sweep.
- **Evidence:** baseline commands and counts in `worklog.md`.

## 2026-08-09 — Fresh streams entrypoint carries eleven pre-existing doc diagnostics

- **What:** Full Fresh export-map lint reports unrelated route/query debt plus eleven diagnostics
  already present on `@netscript/fresh/streams` before this branch.
- **Source:** current full Fresh doc lint and the same direct streams-entrypoint command in the
  untouched PLAN-EVAL checkout.
- **Expected:** the new Fresh SSE helper must not add private type leakage.
- **Actual:** both before and after report exactly eleven streams-entrypoint private refs, all in
  the existing StreamDB/TanStack query surface. The new event-source helper and core SSE files add
  zero; package publish dry-run passes.
- **Severity:** significant baseline, no regression.
- **Action:** do not widen #1329 into the Fresh query/StreamDB public-type cleanup. Keep the active
  generated SSE island on the versioned authority; preserve the separately accepted streams
  connector convergence debt for the remaining upstream StreamDB factory.
- **Evidence:** `deno doc --lint packages/fresh/src/runtime/streams/mod.ts` in both worktrees.
