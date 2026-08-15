# Drift Log: app-side service client/query wiring

Drift is append-only. Record facts that diverge from the plan, issue citations, doctrine, or
current-state documentation.

## 2026-08-15 — issue citations moved and naming acceptance already landed

- **What:** The cited client template moved twice, and its six fixed `exampleService*` exports are
  already derived from `serviceName` at the required base.
- **Source:** `git log --follow` for the live template; commits `2e7c845ad` (#1424) and `abaf2b009`
  (#1427); live template lines 8-27 and scaffolder test lines 22-29.
- **Expected:** Issue #1355 cites
  `packages/cli/src/kernel/assets/app/lib/example-service.ts.template` with six fixed exports at
  `fac9e339042c`.
- **Actual:** The live path is
  `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template`, and
  no export is still name-fixed. The literal resource and invalidation mismatch remain.
- **Severity:** significant
- **Action:** accept the landed naming fix; preserve it and plan only the remaining acceptance.
- **Evidence:** `research.md` findings 1-3.

## 2026-08-15 — command topology partially changed

- **What:** A `service generate` verb exists, but it regenerates only Aspire helpers and has no
  client generation, dry-run, or force flags.
- **Source:**
  `packages/cli/src/public/features/services/generate/generate-service-command.ts:21-41`.
- **Expected:** Issue #1355 says there is no verb for a second service.
- **Actual:** The name exists; the required all-service client behavior does not.
- **Severity:** minor
- **Action:** broaden the existing verb through one shared generator rather than add a competing
  command.
- **Evidence:** `research.md` finding 3.

## 2026-08-15 — SDK key-bridge module comment is stale

- **What:** The module comment describes server keys with a leading `cache_query` segment.
- **Source:** `packages/sdk/src/query-client/key-bridge.ts:4-7` versus
  `packages/sdk/src/ports/query-key.ts:35-40`.
- **Expected:** Documentation in the public module matches the live server key shape.
- **Actual:** Live server keys are `[resource, action, serializedInput]`.
- **Severity:** minor
- **Action:** do not edit `docs/**`; if SDK source is changed after PLAN-EVAL, correct the adjacent
  public module JSDoc as part of the public-surface audit.
- **Evidence:** `research.md` finding 1.

## 2026-08-15 — frontend overlay references a missing required-read file

- **What:** The frontend overlay links `.claude/05-frontend.md`, which is absent at the baseline.
- **Source:** `.llm/harness/archetypes/SCOPE-frontend.md:13-18` and filesystem check.
- **Expected:** Every required-read link resolves.
- **Actual:** The file does not exist.
- **Severity:** minor
- **Action:** accept for this leaf; use the overlay's explicit gate table and the `deno-fresh`
  skill; do not touch docs.
- **Evidence:** `research.md` doctrine/frontend section.

## 2026-08-15 — contracted scaffold runtime has no durable gate-catalog entry

- **What:** The leaf requires `run-gate.ts` receipts for `scaffold.runtime`, but the catalog has a
  `fresh-browser` entry and no scaffold-runtime entry.
- **Source:** `.llm/tools/gates/catalog.ts`; existing suite-owned receipt precedent under
  `.llm/runs/fix-scaffold-generated-output-correctness--0.0.7-wave0/receipts/scaffold-runtime.json`.
- **Expected:** Every contracted binding gate can be invoked by the required durable runner.
- **Actual:** `run-gate.ts --gate scaffold.runtime` would reject the unknown gate.
- **Severity:** significant
- **Action:** PLAN-EVAL must choose a minimal catalog addition or an explicitly approved evidence
  exception before the expensive gate is leased.
- **Evidence:** `research.md` open question 2; `plan.md` hidden scope and validation plan.

## 2026-08-15 — correction: catalog absence is the release-gate boundary

- **What:** Tier-A established that the preceding entry interpreted deliberate evidence-class
  separation as missing plumbing.
- **Source:** `.llm/harness/gates/release-gates.md:1-52` defines `scaffold.runtime` as a
  release/merge-readiness gate with raw command evidence; `.llm/tools/gates/catalog.ts:54-66`
  includes `fresh-browser` and deliberately has no `scaffold.runtime` entry.
- **Expected:** The initial plan proposed adding a catalog entry or requesting an evidence
  exception.
- **Actual:** No catalog entry or exception is appropriate. `scaffold.runtime` produces suite-owned
  exact-head output plus the central expensive-gate lease and cleanup record. Only `fresh-browser`
  produces a run-gate receipt.
- **Severity:** significant
- **Action:** fix the plan, receipt set, context, and PR PLAN comment; never add the catalog entry
  or hand-author a scaffold receipt.
- **Evidence:** Tier-A plan review T-1 supplied by `topic-features-0.0.7`; repaired `plan.md`
  validation and release-condition sections.

## 2026-08-15 — PLAN-EVAL ruled direct emission and explicit ownership

- **What:** Cycle 1 rejected the proposed SDK identity-wrapper overload and found the plan omitted
  generator-owned paths and whole-command flag behavior.
- **Source:** `plan-eval.md` §§1 and evaluator sweeps A/B.
- **Expected:** The initial plan recommended a new SDK overload and described regeneration without
  locking its filesystem or Aspire-helper boundary.
- **Actual:** The template directly emits `{ queryKey: <svc>Queries.list.clientKey() } as const`;
  the generator owns only `apps/<app>/lib/<service>.ts`; dry-run/force govern both client and Aspire
  output; package READMEs own the migration notes.
- **Severity:** significant
- **Action:** amend plan/research/design and keep implementation stopped until a separately
  dispatched PLAN-EVAL cycle returns PASS.
- **Evidence:** cycle-1 evaluator commit `ed34105e2ef344a5b590bca6985810f45f89b0ca`.

## 2026-08-15 — F5 post-init canonicalization amendment

- **What:** S5 reached a 12-file generated format failure after F4 passed; the existing formatter is
  init-only and a post-write repair would invalidate same-input idempotency.
- **Source:** suite-owned S5 attempt-3 log; exact structured `fmt:check` path set; unchanged
  `post-scripts-init.ts:7` and sole `init-pipeline.ts:80` caller at `c53726c69` and current head.
- **Expected:** the earlier plan treated generated content comparison/write as sufficient once F4
  proved a repeated renderer result was byte-identical.
- **Actual:** raw rendered content can be stable yet non-canonical. Formatting only after write makes
  the next raw-render-versus-formatted-disk comparison permanently unequal.
- **Severity:** significant
- **Action:** pending Tier-A, add one Deno-backed formatter port with bulk-path and content-in/out
  operations; canonicalize all four writer outputs before equality and writing. Preserve templates
  and fixtures unchanged.
- **Evidence:** `plan.md` F5 amendment and `reports/f5-plan-amendment.md`.
