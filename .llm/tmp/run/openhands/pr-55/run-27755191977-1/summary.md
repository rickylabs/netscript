# PLAN-EVAL verdict — chore-deps-hygiene--deps

## Verdict

**`PASS`**

## One-paragraph rationale

The plan (`chore/deps-hygiene` Group 2 of `release/jsr-readiness`) passes the Plan-Gate: research is present and rebaselined (with D-G2-1 explicitly superseded by D-G2-2 confirming the npm `catalog:` protocol IS live), all four locked decisions (DH-1..DH-4) are concrete with rationale, the open-decision sweep resolves every entry (the one deferred item is performed inside the catalog-census slice), the six commit slices (D-1 census, D-2 npm compliance, D-3 JSR centralization, D-4 file/link audit, D-5 task prune, D-6 bump wrapper) are each single-concern, name a proving gate, and stay under ~30 LOC; the risk register explicitly mitigates scanner false-positive lockout via report-only → FAIL sequencing. The load-bearing spot-check for this group — that workspace members declare npm deps as `catalog:` in each member's `package.json` (the Deno 2.8 protocol), resolved against the root `deno.json` `catalog` block — was verified live (18 member `package.json` files using `catalog:`; root catalog defines `amqplib: "^2.0.1"`, `ioredis`, `@preact/signals`, `clsx`, `preact`, `tailwind-merge`, etc.), the planned compliance scanner correctly targets the only real inline `npm:` pin in source (`packages/queue/adapters/amqp.adapter.ts` — `npm:amqplib@^0.10.3` vs catalog `^2.0.1`), and the JSR-centralization scanner finds zero cross-member divergences on the current tree (clean baseline, so the report→FAIL flip has zero CI-lockout risk). One non-blocking NIT for the D-2 implementer: explicitly handle (via parser design or allow-list) the two string-literal sites that contain `"npm:…"` substrings but are not real Deno imports — `packages/cli/src/kernel/constants/windows.ts` (compile-bundle external map) and `packages/fresh-ui/registry.manifest.ts` (user-facing dependency array). The plan correctly forbids catalog restructuring, version-pin edits, and any touch to `scaffold-versions.ts` (DH-1 / Non-Scope). Implementation may begin.

## Summary

- Session role: PLAN-EVAL (separate evaluator session; no implementation)
- Deliverable: `.llm/tmp/run/chore-deps-hygiene--deps/plan-eval.md` (rendered, verdict `PASS`)
- Branch under eval: `chore/deps-hygiene` (off `release/jsr-readiness`)
- Drift active: D-G2-2 supersedes D-G2-1

## Changes

- Created `.llm/tmp/run/chore-deps-hygiene--deps/plan-eval.md` with full checklist + verdict
- No source edits, no version-control operations, no PR comments (workflow owns PR comments per trigger contract)

## Validation

- Read `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`, `.llm/harness/evaluator/verdict-definitions.md`
- Read all run artifacts: `research.md`, `plan.md`, `worklog.md`, `drift.md`
- Confirmed D-G2-2 supersedes D-G2-1 (`catalog:` protocol IS live)
- Verified 18 `package.json` files use `catalog:` protocol
- Verified root `deno.json` `catalog` block defines versions (lines 92-126)
- Inspected inline `npm:` sites in source — one real (`amqp.adapter.ts:10`), two string-literal (windows.ts, registry.manifest.ts)
- Verified cross-member JSR version invariants (no divergence: `jsr:@zod/zod@4.4.3` ×13, `jsr:@hono/hono@4.12.24` ×7, `jsr:@standard-schema/spec@1.1.0` ×5)
- Verified zero `file:`/`link:` specifiers in workspace members
- Confirmed `arch:check` is per-package + not in `ci` today; plan correctly addresses both
- Confirmed `deno task ci` = `deno ci && deno task ci:quality && deno task coverage:functions && deno task publish:dry-run && deno task audit:critical`

## Responses to review comments or issue comments

(n/a — evaluator session; the workflow posts the verdict to the PR, not this session)

## Remaining risks

- One non-blocking NIT for the D-2 implementer: detection rule for inline `npm:` specifiers should anchor on `import`/`export … from "npm:…"` statement contexts (and the `imports`/`scopes` keys of `deno.json`), not on substring `npm:` inside arbitrary string literals. Known string-literal false-positive sites: `packages/cli/src/kernel/constants/windows.ts` (compile-bundle external map), `packages/fresh-ui/registry.manifest.ts` (user-facing dependency array). Plan slice D-2 should name these as known-allow-listed at landing.
- Catalog `amqplib: "^2.0.1"` entry is the load-bearing case the compliance scanner must surface (real pin in `amqp.adapter.ts` is `^0.10.3`). Plan correctly identifies this as the canonical scanner case but does not pre-write the fix.
- The bespoke bump tool the D-6 wrapper replaces was not located in `.llm/tools/` at quick scan — implementer must find it before snapshotting parity. Plan text is sufficient ("wrap native, preserve structured output, snapshot parity test").