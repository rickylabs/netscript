# Drift Log: #1732 background reference-name validation / source safety

## 2026-08-30 — Current scaffold is looser than Aspire

- **What:** The current scaffold regex accepts consecutive/trailing hyphens and lacks a service-name
  64-character cap, while Aspire's default resource policy rejects those values.
- **Source:** `scaffold-validation.ts`, `validate-init.ts`, Microsoft Aspire upstream validation.
- **Expected:** A platform-aligned grammar could be applied mechanically without rejecting any
  scaffold-produced name.
- **Actual:** An exact grammar changes observable scaffold/config acceptance.
- **Severity:** significant
- **Action:** owner approved an observable fail-fast correction, preserved it in plan/PR, and
  released implementation after independently verifying the final PLAN-EVAL mechanical findings.
- **Evidence:** `research.md` findings 3–7.

## 2026-08-30 — RTK unavailable

- **What:** The requested `rtk` command is not installed or not on PATH.
- **Source:** shell exit 127: `/bin/bash: rtk: command not found`.
- **Expected:** The `rtk` skill states the binary is available machine-wide.
- **Actual:** Focused raw read commands are required.
- **Severity:** minor
- **Action:** accept for this run; keep durable verdicts on structured wrappers.
- **Evidence:** research command transcript in the active session.

## 2026-08-30 — Initial rule location contradicted the JSR-surface claim

- **What:** The first plan placed an exported grammar constant in `packages/aspire/constants.ts`
  while research incorrectly described the change as having no published-symbol effect.
- **Source:** `packages/aspire/deno.json` exports `./constants` from `./constants.ts`.
- **Expected:** Published-surface analysis and the planned path agree.
- **Actual:** The planned path would have permanently added a JSR API symbol.
- **Severity:** significant
- **Action:** keep the grammar module-private under `packages/aspire/src/domain/`; add attributable
  doc-lint and JSR-audit baselines to the plan.
- **Evidence:** `research.md` JSR section and `plan.md` D3/gate table.

## 2026-08-30 — PLAN-EVAL exposed an undeclared identifier seam

- **What:** Cycle 1 proved that literal escaping alone does not protect emitted identifier
  positions. `safeIdentifier` only replaces hyphens, so `class`/`await` remain reserved and
  `builder`/`config` can shadow generator bindings.
- **Source:** `plan-eval.md` F1 and its direct generated-module probes.
- **Expected:** D1's load-bearing source-safety property covered every syntax/binding seam.
- **Actual:** The plan covered string literals but silently assumed identifier safety.
- **Severity:** significant
- **Action:** owner authorized option (a): background-local, user-text-free ordinal identifiers; add
  parse-and-execute rows for `class`, `await`, and `builder`; keep the platform grammar pure.
- **Evidence:** repaired `plan.md` D1, matrix, slice 2, and risk register.

## 2026-08-30 — Sibling generators retain identifier exposure

- **What:** The evaluator found the same weak identifier-policy class in sibling service, plugin,
  and app registration generators.
- **Source:** `plan-eval.md` F1 side-effect / attack narrative and focused sibling scan.
- **Expected:** A shared helper named `safeIdentifier` would guarantee valid, collision-safe
  generated bindings.
- **Actual:** It only replaces hyphens, and sibling generators remain exposed to reserved words or
  binding collisions.
- **Severity:** significant, pre-existing
- **Action:** deliberately defer. #1732 changes only the background generator; the supervisor owns
  upstream follow-up. Do not touch sibling files or open an issue from this lane.
- **Evidence:** PR #1747 Drift / Debt section and repaired plan's Deliberately Untouched section.

## 2026-08-30 — Host zombie condition resolved; root evidence corrected

- **What:** The earlier host carried roughly 7,700 unreapable PID-1-owned zombies, so the owner
  directed this lane not to fire the root test. That historical refusal was honest but is now
  superseded.
- **Source:** Current host inspection reports `/proc/1/comm` as `tini`, zero zombies (including zero
  by parent PID), 113 total processes, and `ulimit -n` of 524,288.
- **Expected:** Once the host limitation cleared, the final evidence table would use a measured root
  wrapper result instead of carrying the refusal forward.
- **Actual:** The owner fired `.llm/tools/run-deno-test.ts -- --allow-all` at
  `6605625ab50850da40e71b6f0a77bb704c675751`: exit 1 in 179,100 ms; 4,308 passed, 2 failed, 19
  ignored, 4,329 total, and 2 unique failures. Both remaining failures reproduce at `main`
  `13878a80a50c55b9662099fed64555f2310ae4a3` and are outside this leaf's scope.
- **Severity:** evidence correction; no product drift.
- **Action:** Record row 6 as FIRED/exit 1, retain the old NOT-FIRED decision as dated history, and
  attribute only the two currently reproducible failures to their established pre-existing
  baselines.
- **Evidence:** Both failures reproduce at the evidence head and `main`:
  - `.llm/tools/agentic/claude/hybrid-launcher_test.ts:102` —
    `fixture did not publish its
    descendant pid`.
  - `packages/fresh-ui/tests/registry/markdown-renderer.test.ts:142` — Rollup native
    `failed to map segment from shared object`. Leaf-focused suites remain green.
- **Correction:** The earlier record attributed the `hybrid-launcher_test` red to zombie exhaustion.
  That attribution was wrong for this file. With the host fixed, it still fails at this head and at
  `main`, now with a different message. The old failure mode's cause is no longer decidable, so no
  host-causation claim is retained.
