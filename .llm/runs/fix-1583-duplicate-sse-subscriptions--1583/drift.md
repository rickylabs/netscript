# Drift Log: #1583 durable chat subscription ownership

## 2026-08-12 — Issue acceptance checklist absent

- **What:** The slice brief requires `box-index` acceptance evidence, but the live #1583 body contains no markdown checkboxes or acceptance section.
- **Source:** GitHub issue #1583 fetched on 2026-08-12.
- **Expected:** One or more close-gated acceptance boxes that the PR can map.
- **Actual:** Reproduction, Expected, Adoption gap, and Version evidence prose only.
- **Severity:** minor
- **Action:** fix before finalizing the draft PR evidence map; never emit an empty `entries` list.
- **Evidence:** https://github.com/rickylabs/netscript/issues/1583

## 2026-08-12 — Acceptance checklist reconciled

- **What:** Added the three slice-brief acceptance checks to #1583 and authored a non-empty `box-index` map in draft PR #1593.
- **Source:** User-required tests and `netscript-pr` close-gate contract.
- **Expected:** Mappable acceptance evidence.
- **Actual:** Boxes 1-3 now cover one physical upstream, physical abort, and re-subscribe.
- **Severity:** minor
- **Action:** fix
- **Evidence:** https://github.com/rickylabs/netscript/issues/1583; https://github.com/rickylabs/netscript/pull/1593

## 2026-08-12 — Full Fresh doc-lint residue outside changed surface

- **What:** The required full-export-map doc-lint command exits 0 but reports 44 diagnostics in query, route, and streams; the changed `./ai` entrypoint reports zero.
- **Source:** `deno task doc:lint --root packages/fresh --pretty` on the implementation tip.
- **Expected:** The slice plan initially expected zero diagnostics across every Fresh export.
- **Actual:** Query has 8 private-type diagnostics, route has 8 private-type plus 17 missing-JSDoc diagnostics, and streams has 11 private-type diagnostics. None are in changed files; the route findings include the explicitly forbidden sibling-owned subtree.
- **Severity:** significant
- **Action:** report as baseline residue; do not expand this P0 lifecycle slice or edit sibling-owned paths.
- **Evidence:** `worklog.md` Static Gates table and command output captured on 2026-08-12.

## 2026-08-12 — Retry ownership moved with the internal hub

- **What:** The SR2 retry loop moved intact from the published connection module into `src/internal/chat-subscription-hub.ts` beside its single physical owner.
- **Source:** Slice review after the first green implementation.
- **Expected:** Preserve the retry algorithm as the sole upstream path.
- **Actual:** Semantics and focused SR2 tests are unchanged; extraction reduces `create-chat-connection.ts` from 684 baseline lines to 605 doctrine-counted lines and avoids adding a fourteenth `runtime/ai` child.
- **Severity:** minor
- **Action:** accepted implementation-structure refinement; no public surface or replay semantic change.
- **Evidence:** `create-chat-connection_test.ts` SR2 tests and final package run.

## 2026-08-12 — Late-join suffix semantics made explicit

- **What:** A subscriber joining an active hub receives only values published after attachment because the hub has no replay buffer. A subscriber joining after retirement opens a fresh upstream that may replay from `initialOffset`.
- **Source:** Fallback IMPL-EVAL C2 and direct inspection of `acquire`/`publish`.
- **Expected:** The public subscribe documentation should state delivery semantics.
- **Actual:** Before correction cycle 2, neither the internal hub nor `NetScriptChatConnection.subscribe` documented the suffix/full-replay inconsistency.
- **Severity:** significant documentation gap; behavior change explicitly out of scope.
- **Action:** document both sides plainly; do not add a replay buffer until external transport behavior establishes the correct policy.
- **Evidence:** `packages/fresh/src/internal/chat-subscription-hub.ts`; `packages/fresh/src/runtime/ai/create-chat-connection.ts`.
