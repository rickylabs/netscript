# S4 independent source reconciliation

Same read-only Astra source reviewer, resumed across both corrections. Source-only approval; local gates below are implementation-run evidence, and new-head CI remains required.

## Explicit amount-unit provenance

**PASS — source approval includes the S4 amount-unit preservation correction.**

The supplied implementation preserves the intended safety boundaries:

- **Units require an exact canonical match.** `readPriorState()` treats marker metadata as a candidate setting, then re-renders the complete island for the selected client/procedure and requires exact path and content equality before adopting it. Marker parsing or a stored body hash alone does not authorize preservation.
- **Mismatches remain subject to reconciliation.** Marker/body edits and changes to the rendered client or procedure prevent unit adoption. Forcing a different client consequently renders with the unknown-unit default.
- **No new currency assumption is introduced.** Generic generation still defaults to `{}`. Explicit `minor` or `major` metadata is restricted to result islands, and the renderer writes it alongside the corresponding presentation behavior.
- **Existing marker syntax remains compatible.** Schema-1 markers without `amountUnit` retain their canonical representation and remain parsable. Unannotated legacy content is not assigned a unit by inference.
- **The type relocation preserves the existing import surface** through the renderer’s re-export.

The supplied tests address preservation during dry-run, application, and layer additions; refusal of edited or mismatched provenance; and dropping units when forcing a different client. I identify no remaining source blocker in this correction.

This is source approval for the reviewed revision. I used no tools and executed no tests. The reported 21 focused passes remain implementation-provided evidence, and the broader public CLI integration result remains pending as stated. This verdict does not certify CI completion or reassess visual quality.

## Populated Overview readiness

**PASS — prior source approval is preserved with this S4 correction included.**

In `packages/cli/src/kernel/assets/app/routes/(_components)/dashboard-view.tsx.template`, both attribute pairs derive directly from the loaded capability’s `id` and `state`. Populated panels therefore expose their actual readiness. Non-ready states remain non-ready, and a missing streams capability does not acquire a fabricated marker.

The regression test exercises the actual populated panel branches and calls the unchanged runtime assertion. Replacing `CapabilityEmpty` with `null` ensures the positive case depends on the restored outer-panel markers. Testing each non-ready state independently also checks that one ready capability cannot satisfy the other’s requirement.

This restores the existing DOM contract without changing capability probes, authorization, data projection, or accessibility semantics. I identify no new source blocker.

This is a source-review PASS. I used no tools and executed no gates. Carrier regeneration, local integration results, and the ongoing full-test rerun remain reported evidence; this verdict does not certify completed CI or reassess the prior visual review.

## Implementation verification after review

Deno2.9.7: 163/163 focused tests, including both failed CI tests and the rendered-dashboard positive/negative regression; scoped check/lint/fmt seven files; 126 emitted files; root check4,198 files; quality/architecture; four carrier tasks; all15root check:* tasks. The unchanged behavior.app-home probe passed against the live seeded service with workers and streams, both ready. Source changes after visual PASS are metadata comments and DOM attributes only. No new visual claim is made.
