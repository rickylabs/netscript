# Drift Log — chore-deps-hygiene--deps

Append-only. Severity ∈ {minor, significant, architectural}.

## D-G2-1 — Catalog law is defined but unimplemented (architectural)

> **[SUPERSEDED by D-G2-2 — this conclusion was WRONG. The catalog IS implemented and used via each
> member's `package.json` (`catalog:` protocol); the analysis below only inspected `deno.json`.]**

- **Observed (2026-06-18):**
  - Root `deno.json` defines a 36-entry npm `catalog` block.
  - **Zero workspace members reference it** — `(?i)catalog` across `**/deno.json` matches only the
    root file. No member `imports` uses `"<pkg>": "catalog:"`.
  - Members **inline-pin** npm deps in their own import maps instead, e.g.
    `plugins/workers/deno.json` `"@orpc/server@^1.14.6"`, `packages/fresh/deno.json`
    `"preact@^10.29.2"`; some are inline in source (`packages/queue/adapters/amqp.adapter.ts`
    `npm:amqplib@^0.10.3`).
  - The catalog block is **partly stale/wrong**: it lists `amqplib: ^2.0.1` while the code uses
    `^0.10.3` (and amqplib has no 2.x release) — proof the catalog is not the source of truth.
- **Why it matters:** The LOCKED "catalog law" (*npm via root `catalog:` + member refs*) is the
  premise of Group 2 deliverable #2 (npm catalog-compliance scanner). Reality contradicts it: a
  "FAIL if a shared npm dep isn't a `catalog:` ref" scanner would fail on **every** shared npm dep.
  PLAN-EVAL would (correctly) reject a plan built on a false premise.
- **Constraint tension:** "never de-catalog" forbids dropping the block; "Group 2 = tooling only,
  never restructure the catalog" forbids migrating members onto it inside this run. So neither
  silent fix is allowed — this is a user decision.
- **Reframe (proposed, pending user):** members inline-pin **both** npm and jsr, symmetrically. The
  reality-matching, in-scope tooling is a **shared-dep version-centralization scanner (npm + jsr):
  flag when a spec used by >1 member diverges in version** — independent of catalog adoption. The
  npm catalog-compliance check becomes a **report-only adoption/divergence census** (does not
  FAIL-gate). Actual member→catalog migration is a **separate, explicitly-scoped decision** (touches
  every member's `deno.json`; structural, not tooling).
- **Status:** ESCALATED to user (decision: tooling-only + census now vs. expand Group 2 to migrate
  members onto the catalog). Plan slices held until resolved.

## D-G2-2 — Correction to D-G2-1: catalog IS in use via package.json (minor)

- **Cause of error:** D-G2-1 grepped only `deno.json` for `catalog:` and missed that Deno 2.8's
  catalog is consumed through each member's **`package.json`** (`"<pkg>": "catalog:"`). User-flagged.
- **Verified (2026-06-18):** `plugins/{sagas,triggers,streams,workers}` and
  `packages/{fresh,contracts,kv,telemetry,…}` declare npm deps as `catalog:` in `package.json`; the
  root `deno.json` `catalog` block resolves them. **The catalog law is implemented and live.**
- **Effect:** D-G2-1's escalation is **WITHDRAWN**; the AskUserQuestion is moot. Group 2 deliverable
  #2 (npm catalog-compliance scanner) stands **as originally scoped** — it enforces a live invariant
  and catches the *exceptions*: npm deps inline-pinned instead of `catalog:` (e.g.
  `queue/adapters/amqp.adapter.ts` `npm:amqplib@^0.10.3`) and stale catalog entries (`amqplib ^2.0.1`
  — no 2.x exists). No migration, no 5th sub-run.
- **Lesson (→ `netscript-deno-toolchain`):** Deno 2.8 catalog membership lives in member
  `package.json`, not `deno.json` — check both.
- **Status:** RESOLVED.
