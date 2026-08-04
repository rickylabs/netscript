# Context pack — feat-runtime-shutdown-orchestrator--1231

- Fresh branch from `origin/main` at `c384013662169046106ee9dd193ab8972beab3b4`.
- Issue #1231 read first; it is the specification.
- Plan locked for `createRuntimeHost()` in `@netscript/service` with structural existing-drain
  callbacks, fixed phase ordering, one budget, deterministic reporting.
- D6 waives local PLAN-EVAL; formal separate IMPL-EVAL remains required.
- Pre-existing unrelated `deno.lock` modification must remain unstaged.
- S1 implemented and locally green: 3 deterministic tests; scoped check/lint/fmt and doc lint clean;
  quality gate exit 0; focused service doctrine has only three existing warnings.
- Next: commit/push/comment S1, then replace the caveat with the host path and remove the debt entry.
- S2 is complete: caveat and debt removed, still-true warnings retained/clarified, docs gates green.
- Full service suite is 90/0; JSR audit, publish dry-run, doc lint, wrappers, quality gate, docs links,
  and docs accuracy pass. Next: commit/push/comment S2, mark ready, run separate IMPL-EVAL.
