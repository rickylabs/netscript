# Drift Log: generated database schema contract predecessor

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-10 — Bootstrap baseline matches the implementation brief

- **What:** No material mismatch discovered during branch, issue, source, or doctrine bootstrap.
- **Source:** `git fetch origin`; GitHub issue #1332; focused source reads listed in `research.md`.
- **Expected:** Clean requested branch at `origin/main` `da40fbfe3…`, eight acceptance boxes, docs-only scope.
- **Actual:** Matches expected state.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` bootstrap gate rows; `research.md` re-baseline.

## 2026-08-10 — Real scaffold emitters require runtime loading in the docs fixture

- **What:** A direct static import of the real CLI scaffold path made the new fixture's outer type
  check traverse unrelated CLI files and fail on 22 pre-existing `isolatedDeclarations`
  diagnostics before executing the fixture.
- **Source:** First `rtk proxy deno task docs:contract-derivation` run.
- **Expected:** The docs tool could statically import the emitters and reach the temp-workspace gate.
- **Actual:** Root declaration mode failed in existing CLI constants/templates. The final fixture
  writes a temp runtime probe that imports and executes the unchanged real emitters with
  `--no-check`; both committed fixture files independently pass the scoped check wrapper, and the
  generated consumers then run real `deno check --unstable-kv` compilation.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Final derivation task passes 4/4; scoped check selects 2 files with 0 diagnostics;
  root and contracts-member compile exits are 0; all three negative commands exit 1.

## 2026-08-10 — Mobile visual review required an opt-in wide-diagram viewport

- **What:** The first 390px Playwright screenshot scaled the expanded horizontal contract-flow SVG
  into a 324px image, making its node labels too small despite zero measured page overflow.
- **Source:** Slice 1.8 Playwright matrix and visual inspection of
  `.llm/tmp/docs-1332-playwright/home-390-dark.png`.
- **Expected:** The new optional predecessor diagram would remain legible at all required widths
  using the existing responsive image rule.
- **Actual:** The final opt-in `wide` diagram mode renders this chart at 720px inside a 324px
  horizontally scrollable viewport at 390px. Root/body overflow remain exactly 0px; 1024px and
  1600px retain contained 798px and 881px renderings. Other diagrams do not opt in.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Final six-case Playwright matrix, screenshots, source/rendered site gates, and
  `diagrams:check` all pass.
