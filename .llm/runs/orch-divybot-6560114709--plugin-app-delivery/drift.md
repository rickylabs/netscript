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

- First Docker CI attempt reached 42 passing gates in each tier, then stopped at the existing
  example-route constant-condition lint defect before starting the runtime. The required proof
  therefore needs a small scaffold writer/template correction: emit applicable hrefs and example
  entries during generation. No lint rule or functional gate is disabled.
- Full CI also exposed stale assertions outside the initial focused selection: literal app auth
  endpoint text, probe argv, global duplicate-name detection across nested scopes, fake doctor
  output and webhook adoption's use of a now-mutating negative-control gate. These are updated
  without weakening runtime/type-check/isolation assertions, subject to same-session review.

- Second Docker attempt passed 99 SQLite gates and 106 PostgreSQL gates, including backend/child
  readiness, but failed the actual overview readiness assertion. The auth-enabled suite sends its
  public workers read through a BFF whose unmarked-procedure fallback requires a bearer. A focused
  SDK composition reproduces SDK_PREPARATION_FAILED for that contract without a cookie. The plan
  now permits an explicit optional fallback for the public plugin read, retaining required defaults,
  explicit procedure metadata and every backend authentication policy.
