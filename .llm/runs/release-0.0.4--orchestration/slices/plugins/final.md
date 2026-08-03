## Ready for merge

Rebased onto `main` @ `4634afe56` (post-#1077), force-pushed with lease after confirming the remote
had not moved. 8 commits.

`mergeStateStatus=CLEAN` · `mergeable=MERGEABLE` · **all checks SUCCESS**, including `close-gate`,
`scaffold-runtime (aspire + docker + postgres)` and `scaffold-static (deno-only)`. The `CANCELLED`
entries in the rollup are superseded duplicate runs from the `status:ready-merge` label event; each
has a `SUCCESS` counterpart on the same SHA.

All 11 previously-unticked acceptance boxes across #1067, #1014, #1015, #1017 and #1022 are ticked,
each with evidence in the preceding comment — including red-proofs for #1067's permutation test and
all four of #1017's threading cases.

**One judgement call flagged for the merger:** #1067's third box reads *"An E2E case covers
install-order permutations."* The coverage is an integration test driving the real install pipeline
(real scaffolders, real plugin sources, real `appsettings.json` writes) in both orders, living in
`install-plugin_test.ts` rather than as a gate in the `e2e:cli` suite. I ticked it on substance and
said so explicitly rather than interpreting it quietly. If you read that box strictly, untick it.

Unresolved review threads: **0**. Leak check: `survivors: []`, aspire and docker probes `ok`, no
containers and no scratch artifacts left behind.
