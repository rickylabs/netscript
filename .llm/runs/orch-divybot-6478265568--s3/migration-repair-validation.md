# Coordinator-approved migration repair validation

Product repair: faad5805c. Main reconciliation: d5f5fa5f3 imports 4aa734e2b without changing the repair product sources. Evidence commits change only this run record.

| Gate | Observed result |
| --- | --- |
| Regressions against acd9a5abe | RED: all3 migration regressions, copied Markdown lint |
| Restored old implementation controls | RED: CSS1, spread2, template1 failures; restored repaired sources afterward |
| CLI migration and app-root | PASS19, zero failed/ignored |
| Full Fresh UI tree | PASS300, zero failed/ignored |
| Template and copied Markdown guard | PASS2; actual lint rejects braces mutants |
| Structured source type/lint/format | PASS263/262/262 files; lint and format use root rules without path exclusions |
| quality:gate incl. dependency/architecture | PASS at merged d5f5fa5f3 |
| docs:accuracy | PASS99/99 root/direct commands from164 recursive paths |
| docs:links | PASS |
| Site/rendered output | PASS253HTML pages |
| All four final carrier checks | PASS prose/assets/MCP export corpus/publish assets on merged committed inputs |
| Exact0.0.8 consumer replay | PASS62 changed files, dry-run preserves bytes, second run0, no legacy CSS state hooks, workspace check and app formatting |
| Browser parity, authored CSS | PASS188 cases x4 width/scheme combinations; zero computed differences, identical pixels |
| Browser parity, actual CLI CSS | PASS188 cases x4 width/scheme combinations; zero computed differences, identical pixels |
| Local one-pass scaffold.runtime | Exit1 at Aspire doctor and Docker daemon unavailable; no generated runtime started |
| Final remote CI / both runtime tiers | PENDING: require all green at final pushed head before READY |

The initial broad test attempt with read/write/run alone exposed the pre-existing token-build test's TF_BUILD environment requirement. The full rerun used allow-all and passed300. No test capability or validator was disabled in source. Native RTK is unavailable, so structured wrappers and direct raw Git verification were used.

All retained JSON reports are portable projections of their original private wrapper outputs. No command verdict alone is called merge sufficiency. CI links and exact final head will be posted in the PR and issue handoff without committing another remote-evidence-only head.

## Independent review correction

Round1 FAIL_FIX found two further supported-input gaps: canonical formatting changes the Markdown hunk, and a trailing spread overrides an explicit class. The expanded tests reproduce all three affected regressions RED before this corrective pass. The real formatter/use-case Markdown test now passes with a zero-change second migration and a customized-anatomy negative control. The whole-app no-write test includes both classless and trailing spreads; a later explicit class remains supported.

After correction: CLI/app-root20/0; full Markdown copied-render/Fresh-production-build/template guard3/0; structured check/lint/format262/262/262 PASS. The expanded exact0.0.8 replay explicitly installs Markdown before conversion, migrates62 files and passes zero-change repeat, workspace check and app formatting. Browser inputs are unchanged by these TSX whitespace and preflight-only edits, so both retained188-case comparisons remain valid. A final full-package rerun and same-reviewer re-evaluation are pending.

## Final local verdict

Same-session independent Opus5.5/high re-review at15a806e93 returns PASS after one corrective pass. Final full Fresh UI rerun is300/0. Final quality:gate (dependencies/architecture), docs:accuracy99/99 and all four carrier checks PASS at15a806e93. The following commit contains evidence only.

Final exact0.0.8 replay targets Markdown installation directly at the app (the old CLI lacks the newer --app routing). It converts65 files, explicitly including components/ui/markdown.tsx; dry-run, second0, workspace check and format of every migrated file pass. Old ui:add produces a baseline tokens.css format finding before migration; its unchanged hash is recorded. The earlier workspace-root Markdown replay did not cover app Markdown; the final changed-file list removes that ambiguity.

Do not claim remote CI success from these local results. Push this evidence-only head and require every required check and both PostgreSQL/SQLite runtime jobs green at that exact head before final READY. No further commits solely for remote evidence.
