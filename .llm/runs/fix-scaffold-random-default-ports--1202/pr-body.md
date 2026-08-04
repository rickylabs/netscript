## Summary

Replace generated low/common listener defaults with dynamic Aspire endpoints and deterministic
high-range standalone fallbacks. The runtime scaffold suite exercises the default path instead of
pinning the reproduced colliding port.

Do not merge until generated-output, framework, runtime, cloud, and composed evaluation gates are
complete.

## Scope

- Archetype / area: Archetype 6 CLI scaffold emission; generated service/database runtime wiring

Refs #1202

## Slices

- [x] S1 Lock evidence/design and open the draft review surface
- [ ] S2 Land RED-first listener-default contract and implementation
- [ ] S3 Complete framework/runtime/cloud/evaluation gates

## Validation

- Plan-Gate: composed per milestone-run.md (orchestrator waiver)
- Generated-output RED/GREEN: pending
- Scoped check/lint/fmt and quality gate: pending
- One-pass `scaffold.runtime`: pending; cloud CI is the owner-declared verdict source

## Harness

- Run dir: `.llm/runs/fix-scaffold-random-default-ports--1202/`
- Phase: plan; implementation not started

## Drift / Debt

- Live API returns two issue comments although the brief names three; both live comments were read.
- The worktree arrived with an unrelated `deno.lock` modification, which is excluded from this PR.
- No new architecture debt planned.

## Definition of Done

- [ ] Automatic Aspire resources omit fixed host ports; explicit user pins remain supported.
- [ ] Standalone generated app/service/plugin listeners are stable per project and at least 49152.
- [ ] A generated-output test is RED on the baseline and rejects default listener ports below 49152.
- [ ] Prisma/DB endpoint wiring passes a clean local one-pass or any unrelated local residual is recorded without changing scope; cloud CI is green.
- [ ] Scoped wrappers, quality/architecture, JSR static gates, and lock hygiene pass with no new lint ignores.
- [ ] The owner-owned Windows-service identification is left explicitly routed on the issue and is not claimed by this PR.
