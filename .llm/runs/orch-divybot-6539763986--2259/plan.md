# Plan & Design — READY FOR REVIEW

Issue #2259, feature tier. The dispatcher leaf profile governs this run. Potential product
surface: Archetype 6 CLI scaffold and its Aspire runtime credential gate. Initial deliverable:
a bounded, reproducible capability spike, with no package exports or shipped code changes.

## Locked decisions

1. Keep Aspire 13.5.3. Test the installed pinned assembly, using a fresh synthetic credential.
2. Resolve direct and composed bindings through Aspire's ExecutionConfigurationBuilder,
   then invoke the actual private backchannel redactor through reflection. A missing method
   or unexpected SDK shape fails the diagnostic; do not reimplement the redactor.
3. Cover direct secret binding as the positive masking control, direct ReferenceExpression
   composition, and the AddConnectionString expression overload. Include a hostile
   plaintext value to prove the scan detects embedded credential bytes.
4. Do not start an AppHost, database, dashboard, or scaffold.runtime suite for this diagnostic.
   SDK environment resolution is not a claim of database connectivity.
5. If every tested supported composition exposes bytes, record BLOCKED and stop product
   implementation, exactly as the owner directs. Preserve all issue acceptance boxes unchecked.
6. Only if the prerequisite succeeds, declare exact product write paths, extend this plan,
   and get PLAN-EVAL approval for implementation before touching shipped source.

## Ordered slices and gates

1. Bootstrap and evaluate the spike plan. Files: this run's supervisor, research, plan,
   worklog, context pack, drift, and plan evaluation. Gate: independent PLAN-EVAL.
2. Reproduce capability and record the decision. Files: this run's `spike/Program.cs`,
   `spike/MaskingProbe.csproj`, `spike/result.txt`, research/worklog/context/drift/lessons.
   Gate: pinned dotnet SDK diagnostic with valid controls, a recorded capability verdict, and
   process exit 0. This exit code proves diagnostic validity, not successful masking.
   Independent read-only evaluator reviews the proof and blocker decision before handoff.

Commit and push each completed slice. Open a draft PR with the first meaningful commit.
Do not add closing keywords, labels, or milestones. No merge authority.

## Open-decision sweep

- Must resolve now: pinned composed-value masking capability, explicitly owned by the spike.
  No product design is selected until this prerequisite is measured.
- Safe to defer: upstream version or alternative credential delivery if unsupported. Either
  requires a coordinator decision because the assignment forbids an upgrade or workaround.

## Risks and mitigation

- A successful resolver could be mistaken for a masking pass: assert redaction separately.
- A diagnostic could be mistaken for full runtime evidence: explicitly mark all three issue
  acceptance items unproven and distinguish SDK evaluation from live CLI/dashboard probes.
- Secret or private environment leakage in evidence: generate a synthetic value in memory;
  print only assertions, resource kinds, and the SDK package version. Keep transport output
  and build products outside Git. Include no operator paths or session identity in public text.
- Reflection binds an internal API: fail closed if the exact pinned method is missing.

## Gate selection, deferred scope, and debt

This research-only surface has no Deno source, exports, dependency changes, or generated
AppHost changes. Package check/test/lint/format wrappers, quality:scan, arch:check, jsr-audit,
and full CLI E2E are N/A to this slice. They become mandatory as applicable if product code
is authorized after a successful spike. Local scaffold.runtime is expressly prohibited.
No new architecture debt is accepted. The existing upstream security limitation stays open
under #2259. No database, service, Prisma Studio, or dashboard success is inferred.

Contributor entry: this file, then `spike/Program.cs` for the reproduction.

## Diagnostic verdict contract

`spike/result.txt` records assertion names and the verdict, never credential values.

- **INVALID**: nonzero exit and no capability claim if any control fails, reflection cannot
  bind the expected pinned redactor, or any composed runtime value lacks the synthetic bytes.
  The direct parameter must be secret and must be masked by the actual redactor; a clean
  value must stay clean; a planted plaintext substring must be detected by the credential scan.
- **BLOCKED**: exit 0, all controls pass, every tested composition retains the synthetic
  credential at runtime, and every corresponding redactor output still contains it.
- **CAPABLE**: exit 0, all controls pass, and at least one supported composition retains the
  synthetic credential at runtime while its redactor output contains none of those bytes.

BLOCKED is relative to the tested supported secret-reference mechanisms and the corroborating
pinned source contract. It is not a proof that no alternative design could exist. CAPABLE is
only a prerequisite for further live verification, never a full acceptance verdict.
