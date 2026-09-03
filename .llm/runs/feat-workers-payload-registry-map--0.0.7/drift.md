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

