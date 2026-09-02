# IMPL-EVAL — test-fresh-partial-nav-browser--1590-s2 (head f44f96928)

- Evaluator session: OpenHands (cloud), model `openrouter/z-ai/glm-5.3-flash`; reasoning effort NOT
  attested (adapter does not expose it). Separate session from the generator.
- Evaluated head: `f44f9692879028dc1abc0d44bea938401c5787df` (trusted base
  `634b83d647c37f60f24a57839333f16c7cc61f12`; branch merge-base with main `e938ecd31`).
- Route: phase-bound OpenHands IMPL-EVAL per `workflow/lane-policy.md`; PR body explicitly reserves
  "Separate-session IMPL-EVAL" for this pass (not openhands-handoff), so evaluator separation holds.

## Inputs verified

- Plan: locked plan `.llm/runs/fix-fresh-partial-nav--1590/plan.md` § "Slice 2"; PLAN-EVAL `PASS`
  (`.llm/runs/fix-fresh-partial-nav--1590/plan-eval.md`, separate session, 2026-08-31).
- Design checkpoint: worklog § Design present; slice follows it (proof-only, 6-file ceiling).
- Drift: 6 entries read; two significant entries adjudicated (publish filter, doc-lint baseline).
- Commit trail: PR #1895 commits + comments; review threads 0 open/0 unanswered (agentic gate PASS).

## Gate matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| No product source (scope ceiling) | PASS | `git diff 634b83d6..f44f96928 -- packages/fresh/src` EMPTY; identical via merge-base `e938ecd31`. src changes exist only via the merged #1904/#1900 fix branch, identical to trusted base (556690a99). `keyed-partial.tsx` diff = JSDoc-only (672cbbf, #1913 docs binding). |
| Static scoped check/lint/fmt | PASS | 211 files, 0 diagnostics / 0 findings (run 33599996142-1 re-derivation + impl-lane runs at final head). |
| Fresh source tests | PASS | 254 passed / 0 failed (incl. coordinator_test receiver-preservation unit for #1904). |
| quality:gate / quality:scan / arch:check | PASS | exit 0; 0 findings; doctrine 0 failures. |
| Publish dry-run + filter | PASS | exit 0; proof files excluded (`tests/fixtures/`, `**/*_browser.ts(x)` added by 4267ec699, committed on branch). Publish-set leak 25 → 3, residual filed #1897. |
| Full-export doc-lint | N/A (baseline) | 45 pre-existing diagnostics from #1914 doc binding on main; navigation 0/0; source prohibition forbids fixing here — supervisor classified. |
| Lock hygiene | PASS | `git diff e938ecd31..f44f96928 -- deno.lock` = 0 lines. Trusted-base diff orpc rows = main's own #1890 bump (9924794be, ancestor of trusted base); head root specs remain `^1.14.x`; lock consistent with head. No branch lock delta. |
| Runtime: hosted fresh-browser at exact head | PASS | Run 33621810422, check-test job 100218639224, head f44f96928, "Managed form browser regression" SUCCESS, gate `fresh-browser` → `deno task test:browser`. PR body cited truncated run id `33628…`; supervisor cross-checked = same SUCCESS. Receipt: `.llm/tmp/gate-receipts/check-test/fresh-browser.json` on run artifact. Two sibling browser tests + full scenario green; Vite stderr abort/overlay regexes asserted in-test after drain-before-close teardown. |
| Consumer import path | PASS | Fixture imports `@netscript/fresh/navigation` → resolved `@fresh/core@2.3.3` (deno info); proof exercises installed client live. |
| Close-gate | HONORED | `Refs #1590` only; closingIssuesReferences empty. Gate red strictly on 2 unticked PR DoD boxes ("Hosted fresh-browser proof green" / "Separate-session IMPL-EVAL passes"). First box: now evidenced (job 100218639224). Second box: this verdict. Maintainer ticks per gate design "only after its claim is true and evidenced". Acceptance mirroring arms only after `status:ready-merge` (mirror log notice, run 33621258025). |
| SKILL chapters in briefs | PASS | present in agent briefs; PR body exempt by rule 13. |

## Remount-evidence sufficiency (dynamic-name remount, #1590 scope)

Exact `frsh:partial:region-{a,b}:0:region-{a,b}` marker equality over the three fetched HTML
bodies proves the server encodes each native key by dynamic name (colon probe: exact string
`frsh:partial:colon:probe:0:colon_probe`). Live-DOM marker walking was invalidated by installed
@fresh/core@2.3.3 `reviver.ts` (SHOW_MARKERS=false; nested markers consumed into keyed PartialComp
VNodes — recorded drift). Marker presence alone cannot distinguish remount from same-node
reconciliation (preact may reuse the node), so the live proof uses node identity: an expando is
stamped on `#region-content` immediately before each name change; `dynamicRemounts: [true, true]`
proves the tagged node was replaced at A→B and at B→A. Worklog correction "self-updating expando"
is falsified by the held-stale-B and no-marker-flag fixtures (no fresh-partial delivery between
stamps and reads). Expando keying does not carry hydration (Preact serializes `key`, not unknown
props) — irrelevant here: assertions run in the live session, no reload. B→A `region-a` remount is
a Fresh Partial-comp identity boundary, not a React `key` remount; same dynamic-name effect the
issue owns, zero source change. Conclusions stand.

## AP sweep

Scope = browser test + package config. AP-11/12/13: all Deno.* / console.log / timers confined to
the browser evidence file (test harness edge — not published; publish filter verified). AP-2/9: no
new helpers. AP-1: proof file exactly at the 500-line ceiling, no breach. No new AP introduced; no
debt entry required.

## Findings

1. MINOR (pre-existing, not introduced): 45 full-export doc-lint diagnostics on main (post-#1914
   doc binding); navigation export 0/0; outside proof-only scope. Tracked by supervisor.
2. MINOR (pre-existing): publish-set residual `tests/runtime-catalog-dependencies.ts` (245B) —
   filed #1897.
3. MINOR (cosmetic): PR body DoD cites truncated hosted run id `33628…`; correct run is
   33621810422 / job 100218639224 (same SUCCESS). Evidence verified at exact head.

All blocking close-gate preconditions are now satisfied; the two unticked DoD checkboxes are the
gate's designed final step and are now true with evidence.

## Verdict

OPENHANDS_VERDICT: PASS
