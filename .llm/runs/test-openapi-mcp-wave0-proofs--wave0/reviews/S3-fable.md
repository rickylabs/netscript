APPROVED

# S3 Fable review — P3 auth-guarded spec fixture and wording

- Reviewer: separate opposite-family Claude (Fable 5) session, advisory slice review (not
  IMPL-EVAL), 2026-08-03.
- Scope reviewed: `packages/service/tests/auth/define-service-auth_test.ts` (read-only),
  `proofs/P3-verdict.md`, `proofs/evidence/P3-auth-fixture.json`, `worklog.md`, `context-pack.md`,
  `drift.md`, `briefs/S3-implement.md`, plan D9/D10/D11/D12, `plan-eval.md`, seed RFC §4 Wave 0 / §2
  D6 / OMB-3, and the full stable uncommitted S3 diff.

## Independent verification performed

1. **Fixture really performs all three requests against one live auth-guarded service.** Read the
   fixture source: one `defineService` lifecycle named `preset-auth` with a static-credential
   authenticator and a scope authorizer matching `/api`; three sequential `fetch`es of
   `/api/openapi.json` (no credential; `Bearer write` lacking `docs:read`; `Bearer read` carrying
   it), then `running.stop()` in `finally`. No branch is conditional or skippable; a skipped branch
   is structurally impossible in this test, so skip-as-FAIL (RFC §4 S-17) cannot be silently
   violated.
2. **Exact envelope assertions.** Lines 60–64 assert status 401 and the exact parsed JSON
   `{error: 'UNAUTHORIZED', message: 'missing-credential'}`; lines 69–73 assert status 403 and
   `{error: 'FORBIDDEN', message: 'authz.missing-scope:docs:read'}`; line 78 asserts the authorized
   status 200 only. The fixture never parses the 200 body, and both the verdict and the evidence
   file explicitly qualify that no success-body shape is claimed. Matches the brief's bar.
3. **Read-only rerun.**
   `deno test --allow-all --frozen packages/service/tests/auth/define-service-auth_test.ts --filter 'defineService auth option enforces 401, 403, and 200'`
   → exit 0, `ok | 1 passed | 0 failed | 1 filtered out`. Runtime log showed `Service listening`,
   exactly three `HTTP request started` events (deny, deny, allow decisions), and
   `Service shutdown completed` — corroborating the evidence file's `runtimeAttribution` and the
   recorded exit-zero result.
4. **Attribution claims.** `git rev-parse HEAD` = `5b0ba26b5bd4be87288d981cdb951c978618ca6e` and
   `git hash-object` on the fixture = `090f1b73803a6ffddaed494885f0c1d56152d7a7` — both match the
   evidence exactly. `deno --version` = deno 2.9.3 / v8 14.9.207.2-rusty / typescript 6.0.3 —
   matches the recorded versions.
5. **Wording byte-for-byte.** SHA-256 over the extracted `spec_unavailable: …` sentence is identical
   (`65c0c97b…e6904d`) in plan D9, `briefs/S3-implement.md`, and `proofs/P3-verdict.md`. The
   ratified text is byte-for-byte the D9 text.
6. **Wording justification and auth posture.** The measured behavior supports every clause: 401
   grounds "may require authentication"; 403 shows the authorization variant of the same
   operator-visible symptom; 200 shows the route is reachable when policy permits. The remedies are
   operator configuration choices (anonymous exemption of the spec route, or a public spec URL),
   consistent with seed RFC §2 D6/[P3] (`spec_unavailable (401)` naming the likely authz-matcher
   cause and the fix). Nothing in the verdict weakens auth, adds a product envelope, or implies
   authenticated-spec support exists — the verdict explicitly defers that to the later Wave 4
   feature and issues no IMPL-EVAL disposition or #1129 acceptance claim.
7. **Scope/lock hygiene.** `git status --porcelain` shows the S3 diff touches only run artifacts:
   modified `codex-thread-ids.md`, `context-pack.md`, `drift.md`, `worklog.md`; new `briefs/S3-*`,
   `proofs/P3-verdict.md`, `proofs/evidence/P3-auth-fixture.json`. No product/test/template source,
   no `deno.lock`, no lint-ignore directives anywhere in the diff, no credentials in the evidence
   (normalization block checks out). Reviewed S1/S2 evidence is preserved untouched.

## Findings (ranked by severity)

No blocking or major findings. Three minor items, none of which gates sign-off:

- **m1 (minor, worklog/record hygiene):** The S3 diff rewrites `codex-thread-ids.md` in place,
  replacing the S1/S2 thread record (`019fc95d-…`, worktree `ns005-proofs-impl`) with the new P3b
  thread record (`019fc996-…`). The prior record survives in git history (committed at `7f62ff71d`),
  so attribution is recoverable, but the file now reads as if only one implementation thread
  existed. **Required action (non-blocking):** before or at the sign-off commit, either restore the
  file as an append-style record listing both threads, or add one line noting the P3b record
  supersedes the committed S1/S2 record.
- **m2 (minor, evidence precision):** `assertionLines.authorized` is recorded as `"75-78"`, but
  lines 75–77 are the fetch; the single authorized assertion is line 78. The 401/403 ranges are
  exact. **Required action (non-blocking):** optionally tighten to `"78"` or rename the field's
  intent in a future schema; no correction is required for P3's validity.
- **m3 (minor, formatting):** The rewritten `codex-thread-ids.md` lacks a trailing newline and was
  outside the S3 fmt gate's stated scope (P3 MD/JSON only). **Required action (non-blocking):** let
  the S4 hygiene pass or the supervisor's sign-off formatting sweep pick it up.

Informational, no action: the new thread record replaces the S1/S2 "no push" line with an
explicit-refspec push rule. No push occurred (the S3 diff is uncommitted and the branch has no
upstream), and commit/push authority remains with the supervisor per D11, so this is a record of the
supervisor's integration path, not a brief violation.

## #1129 acceptance statement

Separately from the findings above: **yes — #1129's acceptance box may truthfully be checked after
the reviewed S3 artifacts are committed** (and per the close-gate convention, mirrored/pushed).
OMB-3's deliverable is exactly "auth-guarded spec fixture + `spec_unavailable` envelope wording →
`proofs/P3-verdict.md`": the committed-to-be P3 verdict is an explicit `PASS` backed by an executed,
independently re-run, exit-zero fixture covering all three branches with exact 401/403 envelopes and
an authorized 200, and the ratified wording is byte-identical to the locked D9 text. No branch was
skipped, so skip-as-FAIL is satisfied. Checking the box must happen from the supervisor's session
after commit — not from the implementation session — and does not imply the Wave 4 production
`spec_unavailable` emission exists.
