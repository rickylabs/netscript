use harness

## SKILL

- netscript-harness — perform a substantive independent slice review; do not edit, commit, push, or
  comment on GitHub.
- netscript-doctrine — packages/cli/e2e is strict gate code: no unsafe casts, any, or lint ignores;
  keep parsing pure and runtime IO at the gate edge.
- netscript-cli — verify suite and stable gate registry integration.

Review the uncommitted S1/S2 diff for issue #1881 in this worktree. The contract is to parse only
the marked root README bash fences, preserve ordered commands and README line numbers, permit only
published-version and service-port substitutions, execute every README command once in order with
no retry, retain Aspire start for following commands, emit bounded line-aware receipts, and append
createCleanupGates() unchanged. The README readiness command must be exactly supported by Aspire
13.5.3. No runtime suite may be run locally.

Inspect AGENTS.md, the leaf plan/worklog/drift artifacts, and the complete git diff including
untracked files. Focus on correctness, clean-runner path/cwd behavior, command fidelity, receipt
truthfulness, process lifecycle, port evidence, no-retry semantics, cleanup ownership, type safety,
and test strength. The known exact lint-wrapper failure is baseline: seven desktop-native fixture
files cannot resolve catalog:zod; it reports zero lint findings. Existing gates show check PASS (229
files), tests PASS (310), format PASS (229), quality PASS, suite/gate listings PASS.

Return exactly one verdict, `PASS` or `CHANGES_REQUIRED`, followed by concise, severity-ranked
findings with file and line references. Do not modify any file.
