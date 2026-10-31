# CI snapshot at 5acb515435e1d3b44cc8ef3d269d6aaf842adc5d

- Current command-postgres: FAILURE, [PR run 41194298113](https://github.com/rickylabs/netscript/actions/runs/41194298113).
  The generated-client projection-recovery scenario still reads `row.state.count`
  and receives undefined from the intentional v2 nested document. The sibling
  second-transition assertion has the same stale assumption. Other 17 inner saga
  PostgreSQL conformance tests passed; earlier command suite steps also passed.
- Latest main run of this same workflow: SUCCESS,
  [run 41152000845](https://github.com/rickylabs/netscript/actions/runs/41152000845),
  head a410a815ce1401d533b18f2a85eb75e266de94a5. This is a PR fixture migration,
  not a baseline failure to dismiss.
- Code-quality and close-gate passed. Root check/test/docs jobs were still running.
- Scaffold runtime was skipped: coordinator must arm the e2e-cli gate; no verdict
  is claimed. Thread gate passed with zero threads/unanswered findings.

S2 updates only the two projection assertions and fixture business state, retaining
atomicity/replay/compensation assertions. The new CI run must verify live SQL again.
