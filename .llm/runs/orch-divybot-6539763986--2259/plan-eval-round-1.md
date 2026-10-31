# PLAN-EVAL round 1

**Verdict: FAIL_PLAN.** There is one blocker: the plan doesn't define how a result becomes a verdict, so it can't truthfully support a BLOCKED call yet.

I reviewed this as the separate evaluator for `plan.md`, alongside its research, worklog, context pack, supervisor and drift files. I wrote nothing and changed nothing.

**The pinned facts check out in the repository:**
- `scaffold-versions.ts:5` pins the Aspire SDK at 13.5.3, and `scaffold-aspire.ts:15` pins PostgreSQL at 13.5.3.
- `credential-secret-surfaces.ts:20-21` carries the exemption that names #2259, and `assertHealthReportsHaveNoSecrets` scans only the health evidence keys.
- Aspire.Hosting 13.5.3 is installed in the local NuGet cache. Its assembly contains the strings `ExecutionConfigurationBuilder`, `AuxiliaryBackchannelRpcTarget`, `ConnectionStringResource` and `RedactIfSecretValue`. So the plan to call the real redactor by reflection, rather than rewrite it, can be carried out.
- The plan is right not to claim database or dashboard acceptance. It runs no AppHost or E2E, leaves all three acceptance boxes unchecked, and states that SDK resolution is not connectivity.
- It already has a positive masking control (direct secret binding) and a hostile control (a planted plaintext value the scan must catch).

## Blocker: the verdict rule doesn't match the operator's condition or the gate

1. **The rule contradicts the research question.** The operator says to stop BLOCKED if pinned Aspire *cannot* mask composed connection strings. The research question asks whether *either* composition removes the password bytes, so one masking path counts as capability. But Locked decision 5 says to record BLOCKED if *either* composed binding exposes the bytes. If one path masks and the other leaks, the plan would report BLOCKED wrongly. BLOCKED is only true when every tested supported composition leaks.

2. **"Exit 0" is ambiguous.** The slice-2 gate requires "all behavioral assertions and process exit 0", but the plan never says whether masking the composed value is one of those assertions. If it is, a genuine leak fails the gate and can't be told apart from a broken diagnostic. If it isn't, nothing defines what exit 0 proves.

3. **Failed controls have no stated outcome.** Nothing in the plan says a failed control blocks any capability verdict. Examples: the direct secret isn't masked, the hostile value isn't detected, or the resolved runtime value doesn't contain the synthetic bytes (say, it's unresolved). Without that rule, a leak seen in a value that never contained the credential, or a pass where the redactor never ran, could be reported as evidence.

**Fix needed in `plan.md`:** a three-way verdict, recorded in `result.txt` as assertion names only:
- **INVALID** (nonzero exit, no capability claim): any control fails, the reflection target doesn't match, or a composed case's runtime value lacks the synthetic bytes.
- **BLOCKED**: all controls pass, the runtime value of every tested supported composition contains the bytes, and every redactor output still contains them.
- **CAPABLE**: all controls pass and at least one supported composition comes out of the redactor without the bytes while its runtime value keeps them.

Exit 0 should mean only "the diagnostic is valid and the verdict is recorded". Decision 5 needs rewording to "all tested compositions expose → BLOCKED".

There are no other blockers.

**FAIL_PLAN**
