# S10 Phase-B cycle 3 — make the describe-follow parser DTO-complete (same thread, same branch)

Same rules as cycles 1–2 (thread `01a052a5-21d9-7d80-b4b1-c267be7e112a`, branch
`test/aspire-13-5-s10-e2e-gate-upgrades` @ `67827e8b`): no evaluators, no runtime, no CI dispatch,
explicit-refspec push, focused gates, no PLAN-EVAL.

## Evidence

Hosted proof run 33328308643 (sha `597f92008` = your `67827e8b` on the combined head): postgres
tier 36 PASS then `runtime.aspire-start` FAIL `prisma-studio omitted state`; sqlite tier 37 PASS
then FAIL `sagas-api omitted state`. Third consecutive boundary of the same kind (`resources[]`
wrapper → nullable report `status` → nullable `state`).

## Root cause — the DTO, once and for all

`dotnet/aspire` v13.5.3 `src/Shared/Model/Serialization/ResourceJson.cs` (serialized with nulls
omitted): **every property is nullable** — `Name?`, `DisplayName?`, `ResourceType?`, `Uid?`,
`State?`, `WaitingFor?`, `StateStyle?`, `CreationTimestamp?`, `StartTimestamp?`, `StopTimestamp?`,
`Source?`, `ExitCode?`, `HealthStatus?`, `DashboardUrl?`, `Relationships?`, `Urls?`, `Volumes?`,
`Properties?`, `Environment?`, `HealthReports?`, `Commands?`; nested `ResourceHealthReportJson`
(`Status?`, `Description?`, `ExceptionMessage?`), `ResourceUrlJson`, `ResourceVolumeJson`,
`ResourceRelationshipJson`, `ResourceCommandJson` (all `?` except a few bools). Your parser must
never require a field the DTO can omit.

## Required change (bounded, single pass)

1. Model the line as the DTO: a `DescribeResourceLine` type where **only the resource identity is
   required** (first non-empty of `name`/`displayName`/`resourceName`; a line with none is the one
   precise throw). `state` missing/null → pending (`'Unknown'`), same treatment as
   `healthReports[].status` in cycle 2; `healthReports` missing → `{}`; every other field optional
   and ignored by the gate. Keep fail-closed only for **wrong types** (non-object line, non-object
   report, non-string non-null `state`/`status`), each with the precise line/resource/report name.
2. `evaluateDescribeFollow`: a resource whose last-seen `state` is pending counts as not converged
   (retryable did-not-converge), as today.
3. Tests, RED first, table-driven from the DTO list above: for each nullable field, a line with the
   field omitted parses; `state` omitted → pending; wrong-type cases throw precisely. Add the two
   CI shapes as fixture lines (`prisma-studio` and `sagas-api` without `state`) next to the real
   capture fixture.
4. Focused gates (`run-deno-check.ts`/`lint`/`fmt --ext ts,tsx` on `packages/cli/e2e`,
   `run-deno-test.ts -- --allow-all` on the evidence test), commit citing run 33328308643 and the
   DTO file, push `HEAD:refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades`, report head SHA + exit
   codes.
