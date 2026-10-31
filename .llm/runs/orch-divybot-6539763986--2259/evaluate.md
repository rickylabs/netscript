# Independent spike slice review

Requested route: `claude-opus-5-5`, high effort, separate Anthropic session.
Read-only tools, stdin closed; same evaluator re-steered from PLAN-EVAL.
This reviews the reproduction, not implementation or merge readiness.
The exact pushed-head implementation verdict will be attached to PR #2501.

**Verdict: PASS FOR SPIKE EVIDENCE, ISSUE IMPLEMENTATION BLOCKED.** I found no blockers to keeping this evidence and stopping product work as the owner instructed. I read every listed run artifact and wrote, ran or sent nothing. This is the slice review only, not merge authorization.

- **The installed redactor is really invoked.** `Program.cs:40-43` finds `AuxiliaryBackchannelRpcTarget.RedactIfSecretValue` by its exact private static signature in the loaded assembly, and fails if it's missing. No local copy of the redactor is used. `Program.cs:11` also fails unless the loaded assembly reports version `13.5.3+…`, so a differently resolved package can't slip through.
- **The direct-secret control works.** The parameter is checked to be secret, its runtime value equals the synthetic password, and the real redactor turns it into null (`:22`, `:37`, `:51`). That proves the redactor ran with a correct secret set.
- **The byte detector controls work.** There is a null check, a clean value that comes back unchanged, a clean scan that finds nothing, and a planted plaintext the scan must catch (`:52-56`). These only test the probe's own detector. The README and worklog say so, and say it is not the repository's runtime gate.
- **Runtime resolution is real.** `ExecutionConfigurationBuilder` resolves the consumer's environment without errors. All four composed bindings must contain the synthetic password before their redacted output is checked (`:32-37`, `:67-68`). This proves SDK-level resolution only; no database connectivity is claimed.
- **Both composition paths are covered.**
  - Direct `ReferenceExpression`: `DATABASE_URL`, `POSTGRES_URI`, `PROBE_DB_URI`.
  - `AddConnectionString(ReferenceExpression)` via `WithReference`: `ConnectionStrings__probe-db`. Its resource is checked to be exactly a `ConnectionStringResource` and not a `ParameterResource` (`:59-61`).
- **The all-versus-any rule matches the approved contract.** BLOCKED is printed only when `masked == 0`. Any failed control lands in the catch, which prints INVALID with no exception details and exits 1. `result.txt` shows every control passed, all four bindings EXPOSED, and BLOCKED. It contains no credential values.
- **One limitation, not a blocker.** The secret set is built by hand from the one secret parameter rather than by the upstream collector. The README discloses this. It doesn't weaken BLOCKED: the pinned source says the collector takes only secret `ParameterResource` values, the probe confirms the connection resource is not one, and the redactor only masks exact matches. This is also the same exposure the repository's credential-scan exemption already records under #2259.
- **Nothing is overclaimed.** The research, worklog, context pack, drift and README all keep the three acceptance items unproven. They claim no live CLI snapshot, dashboard or database result, and no upgrade or workaround is proposed. The owner's negative-spike branch is followed.

**PASS FOR SPIKE EVIDENCE, ISSUE IMPLEMENTATION BLOCKED.**
