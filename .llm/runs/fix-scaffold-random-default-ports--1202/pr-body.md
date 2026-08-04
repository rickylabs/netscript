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
- [x] S2 Land RED-first listener-default contract and implementation
- [ ] S3 Complete framework/runtime/cloud gates (formal evaluation passed)

## Validation

- Plan-Gate: composed per milestone-run.md (orchestrator waiver)
- Generated-output RED/GREEN: pass (baseline rejected service `3000` and Vite `5173`)
- Scoped check/lint/fmt, quality/architecture, and CLI JSR dry-run: pass
- One-pass `scaffold.runtime`: pass (70 passed, 0 failed, cleanup green); cloud CI remains the owner-declared verdict source
- IMPL-EVAL: pass (separate-session Qwen 3.7 Max; no blocking findings)
- Cloud scaffold-static/supporting lanes: pass; cloud scaffold-runtime was cancelled twice before
  runner assignment (zero steps/logs), so its verdict remains pending
- Review-thread gate: pass (0 threads, 0 unanswered)

## Harness

- Run dir: `.llm/runs/fix-scaffold-random-default-ports--1202/`
- Phase: implementation evaluation passed; cloud verdict pending

## Drift / Debt

- Live API returns two issue comments although the brief names three; both live comments were read.
- The worktree arrived with an unrelated `deno.lock` modification, which is excluded from this PR.
- Plugin API resources use deterministic high-range host pins because current behavior/telemetry
  consumers require stable direct endpoints; app/service Aspire endpoints remain dynamic.
- GitHub cancelled the cloud runtime job and its retry before assigning a runner; neither attempt
  executed a test, so the cloud DoD remains unchecked.

## Definition of Done

- [x] App/service Aspire defaults omit host pins; plugin API defaults use seeded high-range pins;
      explicit user pins remain supported.
- [x] Standalone generated app/service/plugin listeners are stable per project and at least 49152.
- [x] A generated-output test is RED on the baseline and rejects default listener ports below 49152.
- [ ] Prisma/DB endpoint wiring passes a clean local one-pass (70/70); cloud CI is green.
- [x] Scoped wrappers, quality/architecture, JSR static gates, and lock hygiene pass with no new lint ignores.
- [x] The owner-owned Windows-service identification is left explicitly routed on the issue and is not claimed by this PR.
