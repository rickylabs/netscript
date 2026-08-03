# PLAN-EVAL — fix-1087-harness-hardening--release-blockers

- Plan evaluator session: qwen3.7-max / 2026-08-03
- Run: `fix-1087-harness-hardening--release-blockers`
- Surface / archetype: 6 — CLI / Tooling
- Scope overlays: docs (for #1083 release intro and harness guidance)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselines against `origin/main` / `4833a1676` on 2026-08-03; clean worktree on `fix/1087-harness-hardening`. |
| Decisions locked                        | PASS   | `plan.md` "Locked Decisions" table: D1–D8 with rationale (loopback guard, UUID session + kill, evaluator-only scope, session-staged publication, per-run scratch root, Redis service + env, negative control with restore, tracked run-directory intro). |
| Open-decision sweep                     | PASS   | `plan.md` "Open-Decision Sweep" table: 4 items, all resolved or safe-to-defer. None would force rework. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` "Commit Slices" table: 6 slices (0–5), ordered by issue priority, each names proving gate and files. |
| Risk register                           | PASS   | `plan.md` "Risk Register": 7 risks with mitigations (streaming, resume bypass, audit leakage, cosmetic staging, silent skip, checkout corruption, premature close-gate). |
| Gate set selected                       | PASS   | `plan.md` "Fitness Gates" table: Static, F-1/F-3/F-5/F-10/F-11/F-12, Agentic guard tests, Redis integration, Docs overlay required. JSR/publish/scaffold marked N/A with reason (internal tooling, no published export change). Archetype 6 + docs overlay correctly selected from gate matrix. |
| Deferred scope explicit                 | PASS   | `worklog.md` "Deferred Scope": Redis connection pooling, release publication/canary, historical run-log rewriting. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md` "jsr-audit surface scan": N/A with reason — internal harness tooling, CI orchestration, tests-as-CI-consumers, and release prose; no package export map, JSDoc surface, or publishable API changes. |

## Open-decision sweep (evaluator-run)

Independently reviewed the plan for open decisions that would force rework if deferred:

- **Child-model enforcement mechanism**: D1 locks "loopback Anthropic-compatible request guard" with exact model ids from `OPEN_EVALUATOR_MODEL_IDS`. The implementation seam (HTTP proxy vs. environment interception) is an implementation detail, not an architectural decision — the port boundary is named in `worklog.md` Design ("HTTP upstream fetcher — fakeable seam"). No rework risk.

- **Publication ownership proof**: D4 locks "owner+SHA-256 metadata, refuses mismatch before network publication". This proves current-session authorship (cryptographic integrity + session identity), not just unique names. The design is sound for the #1084 acceptance criterion.

- **Negative control permanence**: D7 locks "mechanically removes exactly #1075's `atomicTail` serialization, runs both real-Redis files, requires non-zero, restores in `finally`". Verified against tree: `atomicTail` exists at `packages/kv/adapters/redis.adapter.ts` lines 75, 451, 453. The transform is exact and reversible. No rework risk.

- **Release intro location**: D8 locks "tracked run directory" as `release:publish --notes-file` input. Verified against release skill and historical precedent (`beta7-ship`, `beta10-cli` run directories). This is a real release input, not documentation.

No open decisions found that would force rework if deferred.

## Verdict

`PASS`

## Notes

**Spot-check verification of load-bearing findings:**

- Finding #1 (child-model enforcement boundary): confirmed — `resolveCanonicalFormalEvaluatorRoute()` validates only the launched route; `claude-print.ts` spawns Claude with default tool set; no HTTP-level guard validates child model ids on each request.

- Finding #4 (gh-pr ownership gap): confirmed — `gh-pr.ts` line 283 reads `--body-file` immediately before publication with no ownership record, session id, unique staging directory, or fingerprint check.

- Finding #6 (CI Redis skip): confirmed — CI workflow has no Redis service or `NETSCRIPT_TEST_REDIS_URL`; both test files (`packages/kv/tests/redis.adapter_test.ts`, `packages/plugin-sagas-core/tests/stores/kv-saga-store_redis_test.ts`) skip when env var is absent.

- Finding #7 (negative control validity): confirmed — `atomicTail` serialization at `packages/kv/adapters/redis.adapter.ts` lines 75, 451, 453 is the exact #1075 fix; removing it is a valid negative control proving test sensitivity.

- Finding #8 (release notes location): confirmed — release skill requires `--notes-file`; earlier releases kept intros in run directories.

- Finding #9 (assertResolvable absence): confirmed — no live references outside historical run evidence.

**Design checkpoint adequacy:**

The `worklog.md` Design section names public surface (5 items), domain vocabulary (3 concepts), ports (4 ports), constants (3 groups), commit slices (6), deferred scope (3 items), and contributor path (4 entry points). Sufficient for implementation to begin.

**Debt implications:**

No relevant open debt entries in `.llm/harness/debt/arch-debt.md` for #1087, #1084, #1080, or #1083. Plan correctly states "no intentional doctrine violation or deferred implementation is planned."
