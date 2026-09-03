# Drift Log: workers payload registry map remainder

Drift is append-only.

## 2026-09-03 — enqueue validation strengthened

- **What:** The remainder brief requires payload validation both at enqueue and at the application
  handler boundary.
- **Source:** `implement-brief.md` S1.
- **Expected:** The accepted parent plan placed runtime validation only at the handler boundary to
  preserve enqueue behavior.
- **Actual:** Enqueue must now validate with the same definition before constructing/enqueuing the
  otherwise unchanged message.
- **Severity:** significant
- **Action:** accept within the explicitly owner-provided remainder; preserve message fields/order
  and validate only after the selected definition is resolved.
- **Evidence:** focused service test plus dispatcher test will be recorded in `worklog.md`.

## 2026-09-03 — contract version stays v1

- **What:** Typed `triggerJob` narrows only the TypeScript client surface.
- **Source:** accepted plan §1/§3 and `implement-brief.md` S3.
- **Expected:** Record whether a wire contract version bump is needed.
- **Actual:** The runtime Zod schema, route path, input fields, and output remain byte-for-byte
  compatible; the existing v1 value remains the service implementer.
- **Severity:** minor
- **Action:** accept; do not introduce v2.
- **Evidence:** contract soundness test and unchanged `JobTriggerInputZodSchema` runtime value.

## 2026-09-03 — supervisor-expanded first-party repair ceiling

- **What:** The hosted workspace check exposed schema-less first-party consumers in
  `plugins/triggers` and one `plugins/sagas` runtime test, outside the original implementation
  ceiling.
- **Source:** Supervisor repair steer for PR #1970 at `feb55c046`.
- **Expected:** The remainder brief limited implementation to workers-core, workers, one CLI
  fixture, tests, and the run directory.
- **Actual:** The owner explicitly required either an unsafe compatibility overload or migration of
  every named first-party consumer; the same steer authorized those consumer files.
- **Severity:** significant
- **Action:** migrate the named consumers to schema-backed handlers, retain the schema-required
  public contract, and make no trigger-core or unrelated plugin changes.
- **Evidence:** repo-wide `deno task check` and focused trigger/saga test receipts in `worklog.md`.

## 2026-09-03 — owner-expanded Flow-B fixture repair ceiling

- **What:** The schema-first generated workers job made the CLI runtime fixture's legacy async
  callback rewrite stale, preventing both hosted Aspire graphs from converging.
- **Source:** Owner resume steer for PR #1970 at `14bdf2f98` plus Actions run `33710942351`.
- **Expected:** The original ceiling named only the canonical CLI registry fixture and generated
  counterparts.
- **Actual:** The owner explicitly requested the narrow repair for both hosted runtime reds; the
  required compatibility seam is
  `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`.
- **Severity:** minor.
- **Action:** update only the schema-first callback marker and add fail-fast drift detection; do not
  change application runtime semantics or absorb unrelated CLI work.
- **Evidence:** hosted RED logs, direct generator probe, and exact runtime-suite receipts recorded in
  `worklog.md`.
