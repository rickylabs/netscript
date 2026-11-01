# Independent AI10b committed-source evidence review

PASS (slice 10b evidence reconciliation at source commit `f08cafb7`; no READY)

The public evidence matches the reviewed MessageScroller and Questionnaire source and the gate set. I approve the evidence-only commit followed by the audited normal push and the PR comment.

- **Source:** the only change after my source PASS is the README note I asked for about the caret on controlled refusal. The JSON records `generatedCarriersAfterSource: []`, which is consistent with your report that the raw status was clean before the evidence edits, so this unit has no post-source generated files.
- **Tests** (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice10b-validation.json`):
  - 453 final contract and installed tests and 121 registry tests passed, both with nothing failed or ignored and exit code 0.
  - **Chromium:** 60 cases passed with nothing failed, ignored or flaky. The scope covers:
    - the four measured scroll states;
    - pinned and unpinned growth and resize;
    - wheel, key and growth races, inert and child-control input;
    - exact ownership and teardown of listeners, observers and frames;
    - native form refusal, reset, initial defaults, FormData and host-driven steps;
    - no-JS SSR and hydration;
    - native radio edge parity.
  - **Firefox and WebKit:** 60 cases across the same 15 scenarios, explicitly *not* full dark or preset certification.
  - **Shell regression:** 40/0 on the same chat fixture.
  - Zero serious or critical axe findings, zero allowances, zero page console errors, 32 captures.
- **Wrappers:** source check, lint and format passed on 10 files each, plus the browser fixture check (5), spec check (1), lint (7) and format (7), all with nothing dropped.
- **Gates at the commit:**
  - Quality/architecture passed with exit 0 at `f08cafb7`.
  - Preflight, docs accuracy, export drift and the prose site build passed.
  - Native publish passed with 0 slow types at `f08cafb7`.
- **Carriers:** `gen:mcp-export-corpus` and `gen:publish-assets` were followed by all four freshness checks, all exit 0, after the committed source.
- **Negative tests kept** (`slice10b-negative.json`): the native reset failure (an uncontrolled radio unchecked after reset, 5 passed / 1 failed before the fix) and the WebKit anchoring failure (top 2260 → 2209, height 2580 → 2691, state up → both), each with its cause.
- **Debt:** `slice10b-publication-audit.json` records `ACCEPTED_EXISTING_FAILURE` under #2531 (raw exit 1, 124 diagnostics, 123 unchanged with 0 new and 0 removed, plus the one JSON limitation). Not called green.
- **Honest status:**
  - Review threads: 0 unanswered.
  - Inventory 104/96/8/125, 26 source files.
  - `runtime` is `NEW_HEAD_UNPROVEN`, `requiredRemoteCI` is `PENDING_DRAFT_CHECKS_SKIPPED`, `wholePhase2b` is `IN_PROGRESS` and `ready` is `false`.
- **Privacy:** no absolute home paths or UUID-style identifiers in the phase 2b run directory.

Non-blocking: set `independentEvidenceReview` to this PASS in the evidence commit.

Next, the mandatory public audit must pass before the normal push and the PR #2538 comment. Docs and Desktop (11), the declared extensions and all-style harness (12) and the final gates (13) are still required.
