# Plan & Design — READY FOR REVIEW

Archetype 6 CLI/tooling. One implementation slice after this bootstrap; doctrine
axioms A1/A6/A7/A14 apply. Preserve the existing injected filesystem/formatter and
all ownership/write behavior. Do not change template output or design presets.

Locked decisions:
- Return written paths and the existing DoctorReport diagnostic envelope from
  reconciliation. Attach that report to existing lifecycle result objects.
- Informational entries use DoctorCheck.ok=true. Names identify project-relative
  files, messages explain skipped/authored or skipped/already-present and divergence.
  Render those same checks through existing command output; no independent logger.
- Exact canonical generator matches yield no findings, per the explicit rerun
  acceptance. Format expected bytes with the same formatter used for writes.
- Enumerate authored candidates for reporting without granting write ownership.
  Preserve independently scaffold-owned auth/service.ts in authored-app projects.
- Expose information in the relevant lifecycle command report (the acceptance
  permits this instead of adding a second doctor inspection pass).

Commit slices:
0. Bootstrap research/design/run record; open draft against main.
1. Contract + reconciler + all six lifecycle results and command renderers + focused
   tests and short contributor documentation. Gates: focused reconciliation and
   lifecycle/command tests; structured check/lint/fmt; quality:gate; JSR/doc audit.
   Update worklog/context and independent review before slice sign-off.
2. Evaluation/evidence closeout if needed, with run-only changes and final exact-head
   independent review after the final push. Mark ready once no implementation blockers.

Risks: formatter-induced false drift (canonical comparison); mixed ownership and
service-helper exception (tests); staged plugin update leaking staging paths
(project-relative diagnostic names); JSON serialization (real result assertions);
missed lifecycle integration (command/use-case coverage).

Open-decision sweep: none requiring owner input. CI E2E can safely defer execution
to the coordinator; it remains required before merge and will be explicit in READY.
No local scaffold.runtime, per owner. No release action. Existing repository debt
is not expanded. No new architecture debt planned. Universal/CLI gates not touched
structurally are manually reviewed by the independent evaluator.

Deferred: Fresh UI presets/templates, runtime auth behavior, automatic repair or
rewriting existing BFF files, a new diagnostic channel, package versions and locks.
