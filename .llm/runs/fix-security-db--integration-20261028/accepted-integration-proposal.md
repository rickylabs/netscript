# Proposed atomic security + DB qualification integration

Decision requested AFTER the public independent-review checkpoint is root-accepted and published.
This proposal performs no merge, branch change, gate rerun, inference, commit or push.

## Order and exact boundary

1. Keep the accepted security public-review checkpoint on existing fix/better-auth-critical-1-7-7.
2. Under NEW explicit root integration scope, merge accepted DB head
   ec3cc9161474ef1e1298e7a91148d1ee781cc61d into that existing security branch, preserving both leaf
   histories/reviews. Security source origin remains aec36a68e65df77012d4b2add4692e0b0506290f.
   Do not rebase, squash, cherry-pick selected product hunks, integrate Windows2424/service2422 or
   change any product bytes. Stop for any conflict or additional source/config/lock/dependency owner.
3. Make PR2426 explicitly the atomic security+DB integration against1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d.
   Prove its product diff is exactly the7-owner union below; provenance may contain both accepted
   leaf records. Match every product blob to its accepted origin using native Git bytes.
4. Qualify the combined candidate, continue the SAME security GLM reviewer session on the DB delta,
   and obtain root final integration acceptance. Real CI/close-gate must describe the final head.
5. Only after accepted combined main merge is DB PR2425 superseded as landed by the union. Do not
   close it now or claim a separate DB source defect. No intermediate main merge that borrows the
   missing opposite prerequisite: the atomic candidate carries both patched critical graph and the
   native Windows DB file-URL guard, removing the critical-CI/cold-architecture circularity.

## Exactly seven existing source owners

Native origin proof: seven-owner-integration-source-proof.json. All7 immutable Git blobs were read;
there was no integration operation. Three literal-only owners remain287/78/184lines; both native
locks remain4877/4373lines. DB production100/cap120, test86/cap140. No API, age/config/lock range,
assertion, sanitizer, test discovery or debt owner is added by the integration.

- deno.json
- deno.lock
- packages/fresh-ui/deno.lock
- plugins/auth/tests/services/better-auth-global-logout-http_test.ts
- plugins/auth/tests/services/unsupported-revocation-http_test.ts
- .llm/tools/deps/check-db-alignment.ts
- .llm/tools/deps/check-db-alignment_test.ts

## Narrow required proof after new integration authority

- Before/after source proof: exactly7 product paths against1582; byte-identical5 security+2 DB
  accepted origins, frozen other-PR/remaining source and maintained reference/config/lock bindings.
  Any extra source or lock delta returns to root before expansion.
- Run the existing owning DB regression module on the integrated head (6controls) with native
  Deno2.9.7, cached/frozen/check and original ops/resources/trace-leaks settings. Preserve the real
  normalized spaces/# Windows input, external/empty/identity/error controls. Select the2 DB source
  files through existing type/lint/fmt tooling with actual counts; preserve the existing canonical
  lint-exclusion qualification instead of editing configuration/exclusions to manufacture selection.
- Run existing native audit:critical: actual0critical/exit0 on the unchanged1.7.14 root lock.
  Retain lower findings. No advisory ignore, reload or age bypass.
- Run one existing composite arch:check on the combined candidate under its finite native deadline.
  This runs the existing reference/catalog/private-lock/Zod checks and both actual cold DB consumer
  graphs, then doctrine. Require actual Windows cold graph identities and compositeGREEN together
  with criticalGREEN; do not duplicate passing child graphs unnecessarily. Cold inner resolver uses
  a new cache/network intentionally; cached outer setup is not an all-offline claim. Verify cleanup.
- Let actual required CI run on the new integrated head, including existing all-six-test-shard,
  quality/typecheck/check-test/close-gate policy. Root-reported security CI40629313749 already passes
  all six/quality/typecheck/check-test at the old source head; that is useful evidence, not new-head
  inherited success. Do not change CI/discovery policy or add arbitrary all-repository gates.
- Continue evaluator session ses_e7f4aad3cffe0JFQyEBR1JXEte (same GLM5.3Flash/provider_default), with
  full2 DB owners, exact old-to-new diff/new target head,7-blob source proof and actual combined gate
  receipts. Original five-owner verdict remains verbatim historical evidence; continuation must
  explicitly evaluate the combined target. Fresh root expense/reservation/serialization authority
  is required later; this proposal grants no inference or continuation.
- Root accepts the actual continuation and final CI/integration, then updates authoritative PR DoD
  boxes and requests current close-gate against the live final head/body. Unchecked final boxes are
  not repaired by optimistic assertions. No merge/release/issue closure before that acceptance.

This follows CONTRIBUTING's narrowest-change proof and the accepted leaf proposal. That proposal's
item4 required one composite architecture OUTCOME while explicitly leaving the unintegrated DB
repair separate. Do not invent a new leaf source gate requiring all unrelated baseline findings to
be fixed. No need to rerun accepted auth78/publication/corpus/source controls absent changed owners,
new failures or required CI. Shipping test bodies and sanitizer settings remain live.

## Remaining parent qualification ownership (unwaived; outside this7-owner slice)

-13 unchanged KV interval sanitizer failures: existing auth-service/kv-oauth fixtures and registry
  resource teardown, traced to MemoryKvAdapter.startExpirationChecker. Root must select any repair
  owners from actual trace evidence before edits; this proposal does not assume a KV API change.
-2 unchanged Windows SIGTERM/SIGINT stdout assertions: workos-composition_test.ts controls. Preserve
  them; no OS-ignore, fabricated process or assertion relaxation.
-Original missing-sh control: owned PATH now reaches real Git sh; the same control subsequently
  fails its CRLF cookie assertion on both versions. Ownership is documented-cookie-jar fixture/test
  portability, not a new auth behavior exception. Preserve both original and later native evidence.
-Existing private-type-ref: unchanged auth-better-auth/src/better-auth.ts public return surface,
  reproduced on base. Any correction requires its own narrowly selected scope before source edits.

Those remain parent Windows/full-release qualification work, explicitly open. They are not turned
into invented new7-owner source gates and are not erased, waived or called a broad-suitePASS.
The independent evaluator's broader merge-limit wording remains verbatim; root's final authority
selects the actual integration acceptance boundary. No full Windows/release readiness claim follows.