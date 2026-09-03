# Draft #1372 update — S10 contribution

S10 (#1722) adds the structured Aspire 13.5 E2E evidence layer that #1372 needs:

- `preflight.aspire` now retains `aspire doctor` JSON through the durable gate-receipt path, fails
  on explicit failed checks, and preserves warnings.
- `runtime.aspire-start` records bounded `describe --follow --format Json` NDJSON and readiness gates
  consume last-seen resource state plus S6's object-valued `healthReports` contract.
- cleanup targets the exact AppHost, adds cleanup-only `stop --force`, and records an S7-compatible
  Docker ownership probe that requires zero owned survivors.
- `runtime.resource-command` exercises the S8 typed `<db>-cli` command and background-child
  restarts, then proves resource convergence through a fresh describe-follow stream. Missing runtime
  start evidence produces an explicit skip receipt.

Still open for #1372: lease-backed Phase-B proof on both runtime tiers; saga compensation semantics;
the remaining streams/runtime acceptance work; and any broader CLI behavior not owned by S10. This
is a partial update only: `Refs #1372`, never closes it.
