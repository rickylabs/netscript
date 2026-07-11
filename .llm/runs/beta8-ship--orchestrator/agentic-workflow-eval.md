# Agentic Workflow Eval — beta8-ship--orchestrator (pilot round 3)

Round 2: `.llm/runs/beta7-ship--orchestrator/agentic-workflow-eval.md`.

## Drift

- **D1 (carried)**: external evaluator dispatch owner-waived; Tier-A substantive review per slice;
  GPT implements / Claude reviews satisfies opposite-family at the slice level.
- **D2**: launcher crashes if `--slice-dir` doesn't pre-exist — the ledger write happens AFTER
  send, so the crash aborted thread ns-b8-663's first turn (resumed OK). Launcher should mkdir.
- **D3**: foreground launcher timeouts (Bash 2-min cap) killed two first turns mid-stream
  (663 hard-abort, 664 silent stall discovered ~45 min later by jsonl mtime). Always launch
  detached (`nohup ... &`); a turn-liveness watchdog (jsonl mtime) would have caught 664 sooner.
- **D4**: #687/#688 "CI never runs" root cause — conflicted PRs get no merge commit, so
  `pull_request` workflows silently never fire. Orchestrator now rebases before wondering.
- **D5**: `release:cut` in a FRESH worktree crashes writing the PR body (`.llm/tmp` untracked →
  absent) — one line before the new #663 API path. Follow-up issue filed (beta.9). Manual PR via
  the same token path; gates/branch/push unaffected.
- **D6**: two mid-flight CI failures were cross-package guard tests the slice agents couldn't
  know to run (#497 → CLI telemetry-subpath rewrite-map guard; #290 → two CLI expectation
  tables). Steer-resume fixed both in one loop each. Slice briefs for package-surface changes
  should name the known cross-package guard suites.

## Good mechanics

- 13-thread parallel Codex launch wave: 11 of 13 slices landed with zero fix loops; GPT-5.6
  turnaround per slice ~10–25 min; merge-base discipline held everywhere (955b4abf/fd0dafaf/
  51112a77 bases all verified).
- The #665 fix (this run) diagnosed with live probe threads and replaced the send edge with a v2
  JSONL client — the launcher now fails closed on route mismatch. Filed→fixed→merged in-run.
- Close-gate machinery (#607 lineage) worked as designed: it BLOCKED three merges until issue
  boxes were ticked with evidence, and passed on rerun. First run where the gate did its job
  end-to-end.
- Docs lane: 7 Opus 4.8 agents (2×#660, 5×#661), zero public-docs grep violations, zero invented
  APIs (scratch `deno check` de-risking caught a real non-spreadable-options seam in #684),
  169→170 pages verify-green at every merge. The D8/D9 (beta.7) protections — absolute paths,
  base preflight, orchestrator-side merge-base + diff + grep gates — had zero recurrences.

## Improvements

- **I16**: launch-codex-slice should `mkdir -p` the slice dir and write the ledger BEFORE send
  (D2), and the wrapper docs should mandate detached launches (D3).
- **I17**: add a turn-liveness signal (session jsonl mtime age) to codex-status so a stalled
  thread surfaces in minutes, not on manual inspection.
- **I18**: PR-open helper should check `mergeable` and auto-flag "CI will not run — rebase
  needed" (D4).
- **I19**: cut.ts mkdir fix (D5, issue filed).
- **I20**: brief template: name cross-package guard suites for surface changes (D6).

## Outcome (2026-07-12 ~02:10)

Single-night beta.8: 17 issues implemented+shipped across tooling (3), CLI (1), AI stack (12 incl.
the #219 proof), docs (#660 + #661 wave, 8 PRs); 3 board triages; 24 PRs merged, all Tier-A
reviewed with close-gate evidence; release PR #693 cut and CI-green, stopped awaiting owner go.
Two fix loops, two thread resumes, zero fabricated evidence, zero pushes to main.
