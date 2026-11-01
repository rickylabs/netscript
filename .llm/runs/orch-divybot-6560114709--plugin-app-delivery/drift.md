# Drift

- Task-specific operator instructions override generic PR defaults: draft, Refs #2578, no labels,
  no session identifiers; Cockpit owns merge. Final visible report is handed off through the
  excluded .divybot-final-report.md file, not posted directly.
- RTK is absent. Focused shell inspections and repository structured wrappers remain available.

- Export-map verification corrected the initial CLI diagnosis: workers `/cli` already resolves
  to the executable composition. The silent local invocation ran the distinct root `cli.ts`
  adapter. Preserve both contracts and make remediation choose the project CLI.
- Upstream Aspire 13.5.4 DcpExecutor and DcpModelUtilities confirm ContainerHostname projects
  host executables into the container network, not daemon-published loopback ports into the
  AppHost network. Reject remote Docker explicitly instead of offering a misleading override.

- Write surface expanded to `.llm/harness/debt/arch-debt.md` before recording the bounded
  increase in the existing install feature's size/cardinality advisories. The selection policy
  and regression tests remain separate concerns; a larger pre-existing orchestration split
  is deferred with a closing gate.
