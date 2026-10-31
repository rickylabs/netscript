# Independent PLAN-EVAL — round 1

Claude Opus 5.5, high effort, read-only separate Anthropic session; no tool permission denials.

I found no blocking issues. The plan can go to implementation as written.

**Plan-gate checklist**
- [x] **Research is current.** It is checked against the current main baseline, and no other PR or branch covers this fix. The `@std/http` `getCookies` finding is right: it returns values without percent-decoding them and throws on an empty key, so it can't replace the existing parser.
- [x] **Decisions are locked, with reasons.** The plan skips any value that fails to decode, catches only `URIError`, keeps the existing parser and adds no competing one.
- [x] **Open decisions are swept.** None are left that would force rework. Publication and merge are marked safe to defer and belong to the coordinator.
- [x] **Commit slices.** There are three ordered slices (S0–S2), each naming its files and the gate that proves it. The write surface matches the allowed file list.
- [x] **Risk register.** Each risk has a mitigation: catching too much, valid decoding drifting, a raw credential being accepted, a test passing by accident, and the cost of the shared runtime suite.
- [x] **Gate set fits an integration package.** File-size, helper, layering, inheritance, surface, permission, re-export, folder and test-shape checks are covered by `quality:gate` plus the listed manual review. The package-publishing check is covered by `audit-jsr-package` and the member publish dry-run. The dry-run also stands in for consumer import validation. Release gates don't apply because no scaffold, plugin or CLI publishing surface is touched.
- [x] **Deferred scope is explicit.**
- [x] **JSR audit of the planned public surface.** No new exports or types. The parser's signature and `ReadonlyMap` return are unchanged, so there is no slow-type risk. Full export-map doc lint is planned.

**All seven design checkpoint fields are present:** public surface, domain vocabulary, ports, constants, commit slices, deferred scope and contributor path.

**Owner constraints**
- **Undecodable values are skipped**, which the owner allows. This is the safer choice for session credentials.
- **Valid neighbouring cookies survive.** Planned cases cover unicode, embedded `=`, empty values and duplicate names. Because a bad value is skipped instead of overwriting, a valid earlier duplicate is kept, which matches the stated "last valid value wins" rule.
- **The backend stays authenticated.** This is tested through the existing `AuthnRequest.cookie` interface, with no bypass.
- **Callback, session lookup and sign-out share the same tolerance.** The callback test runs without the `txn` query parameter so it actually reaches the cookie fallback, and sign-out checks that the session is deleted.
- **The negative control** reverts only the parser and keeps the new tests, so they should go red.
- **The member publish dry-run is planned.**
- **No local `scaffold.runtime`** and no CLI E2E run. Full CLI E2E is left unproven and owned by the coordinator, and the plan doesn't claim it.
- **No metadata or merge changes.** Labels and milestones are untouched, and the footer uses "Refs" instead of a closing keyword.

**Skip policy:** catching only `URIError` around each value's decode is sound. `decodeURIComponent` raises nothing else on string input, cookie names are never decoded, and any other error still propagates.

One non-blocking note: in production, the service middleware reads cookies itself and never decodes them, so production `authenticate` was never exposed to this bug. The backend test exercises the package's own parser through the test request helper. That is a valid regression test at the package boundary, but it isn't proof about the production host.

VERDICT: PASS
