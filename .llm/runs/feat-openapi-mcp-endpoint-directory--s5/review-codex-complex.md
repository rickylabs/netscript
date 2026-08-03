# Review — OMB S5 ServiceEndpointDirectoryPort + adapters (Codex-authored)

Opposite-family substantive review of the Codex implementation for issue #1131 (epic #1126,
RFC PR #1123), PR #1194. Read-only except this artifact.

## 1. Route identity

| Field | Requested | Observed / actual |
| --- | --- | --- |
| Lane | `review_codex_complex` (canonical) | `review_codex_complex` (canonical) |
| Provider / model | Anthropic **Fable 5** (`claude-fable-5`) | Anthropic **Opus 4.8** (`claude-opus-4-8`) — configured Claude-family fallback |
| Effort | medium | medium |
| Primary launch | session `1abc6d8e-4c4a-4677-81dd-057eaab9145d` | returned provider `model_not_found` **before any review work or token use** |
| Fallback reason | — | `fable-5` unavailable at provider; this turn is the documented Claude-family Opus 4.8 fallback at the same medium effort. Family-independence from the Codex implementer is preserved. |

Reviewed range: baseline `2c8865e8c` → `HEAD a26b1fd1b` (6 commits `b0a6ad0b1`..`a26b1fd1b`).
Inputs read: issue #1131, RFC/proof context, `P1-verdict.md` (FAIL → F1(b)), `P3-verdict.md` (PASS),
`plan.md`, `worklog.md`, `drift.md`, the port contract, all four source adapters, the fetch probe,
the URL-normalization policy, both test files + fixtures, `mod.ts`, and the README diff.
Note: the prompt cited `design.md`; no such file exists in the run dir — design content lives in the
`worklog.md` "Design" section (verified present, so no gap).

## 2. Adversarial assessment against the required dimensions

All items below were traced in source and, where noted, re-executed read-only.

- **Contract correctness (A1/A2).** `ServiceEndpointDirectoryResult` exposes `entries` **and** every
  `sources` outcome; states are discriminated unions with mandatory discriminators. `failed` rows
  always carry `code` + `reason`; `absent`/`failed` rows are statically forbidden from carrying
  candidates/exclusions (`readonly []`). Degraded states cannot be hidden. **OK.**
- **Four source outcomes (S-9).** `used` / `absent` / `failed(code)` proven per source: override &
  appsettings (`absent`/`used`/`invalid`), manifest (`absent`, `expected_run_id_missing`,
  `run_id_mismatch`, `project_root_mismatch`, `invalid`, `used`), aspire-cli (`used`,
  `command_not_found`, `command_failed`, `parse_failed`). A failed read is never rendered as healthy
  absence. **OK.**
- **Qualified F1(b) precedence (D3/S-10).** `ENDPOINT_SOURCE_PRECEDENCE = override > aspire-cli >
  run-manifest > appsettings`; `selectCandidate` sorts by frozen precedence index. Matches the P1
  FAIL→F1(b) ruling (CLI is primary live source, human override stays supreme). **OK.**
- **Manifest identity safety (S-8/D4).** `run-manifest-endpoint-source.ts` requires real-path
  equality of `projectRoot` **and** an externally supplied `expectedRunId` equal to manifest `runId`;
  absence → `absent`, missing token → `expected_run_id_missing`, foreign root → `project_root_mismatch`,
  stale token → `run_id_mismatch`. No currency is inferred from the file's own token/clock. **OK.**
- **Aspire CLI failure states / parsing.** `command_not_found` (`Deno.errors.NotFound`),
  `command_failed` (non-zero exit or other error, with stderr/stdout detail), `parse_failed`
  (non-JSON or missing top-level `resources[]`). `AbortError` is re-thrown, not swallowed.
  `extractJson` tolerates a leading banner; a banner without JSON fails safe as `parse_failed`
  (never a false success). DCP `-xxxxxxxx` suffix stripped, `displayName` preferred. **OK.**
- **Deterministic conflict reporting (S-10).** Lower-precedence differing URLs recorded as
  `conflicts` in precedence order with per-`(source,url)` dedup; identical URLs and the selected
  source are excluded. Directory fixture asserts exact ordered conflict list. **OK.**
- **Exclusion before network (S-25).** `#row` returns the `excluded` row before any probe; the
  precedence/status test asserts the excluded service name never appears in the `probed[]` log. **OK.**
- **Row-local hard timeout incl. non-cooperative fetch (S-11).** `probeWithDeadline` races the probe
  against an `aborted` promise driven by `AbortSignal.any([parent, AbortSignal.timeout])`. The
  aborted-listener is registered before the probe starts, so on timeout it resolves first and yields
  a `spec_unavailable` "timed out after Nms" row **regardless of whether the probe honors the
  signal**. Verified by the dedicated `new Promise(() => {})` non-cooperative-fetch test (re-ran:
  pass, 21ms). Concurrency cap enforced by a bounded worker pool; `maximumActive <= 2` asserted. **OK.**
- **Parent cancellation.** `list()` calls `throwIfAborted()` at entry, post-source, post-workers;
  `probeWithDeadline` and `#readSource` re-throw on parent abort so cancellation surfaces as a
  rejection rather than fabricated rows. Correct by trace — see Finding 2 (no test).
- **Credential / redirect / response bounds.** Probe uses `credentials: 'omit'`, `redirect: 'error'`,
  no `authorization` header (asserted); `readBoundedText` enforces the byte cap by both
  `content-length` and streamed length, cancelling the body on overflow. **OK.**
- **Spec-first reused-port identity (D6).** Probe fetches `/api/openapi.json` first, then `/`, and
  only both-success with `identity.service === candidate.name` yields `running`; a valid spec on a
  reused port with a foreign `/` identity maps `identity_mismatch`. **OK.**
- **Exact P3 `spec_unavailable` guidance.** `SPEC_UNAVAILABLE_AUTH_GUIDANCE` is byte-for-byte the
  ratified P3 wording and is attached only on 401/403. **OK.**
- **Public API / JSDoc.** Every exported symbol has a JSDoc line; contract re-exported from both `.`
  and `./cli`; worklog records `doc:lint` + `deno doc --lint` zero-diagnostic and a clean publish
  dry-run. Naming is consistent and intention-revealing. **OK.**
- **A2 layering / S4 independence.** Consumed contract in `src/ports/`, adapters in
  `src/infrastructure/service-endpoints/`, composition in `src/application/`. Spec kept `unknown`
  (opaque); `grep` confirms **no** S4/projection import in any new file. Drift log records the
  adapter grouping that kept `src/infrastructure` under the cardinality cap. **OK.**

Focused suite re-run on `HEAD`: `13 passed | 0 failed` (both `service-endpoint-*_test.ts`).

## 3. Findings (by severity)

No blocking finding. All four items are low-severity / advisory; none breaks an acceptance box,
crashes, or produces a false-positive `running`.

### F-1 (low) — path-prefixed base URL is silently dropped by the probe
`packages/mcp/src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts:45,76`.
`new URL('/api/openapi.json', \`${baseUrl}/\`)` and `new URL('/', …)` use **absolute** paths, so any
path segment in the base URL is discarded (verified: base `http://operator.example.test/users` →
probe targets `http://operator.example.test/api/openapi.json` and `…/`). The override normalizer
(`endpoint-url.ts:18`) *retains* the base path, and the directory fixture stores exactly
`http://operator.example.test/users` under a **stubbed** probe — so the green test gives false
end-to-end confidence that a path-mounted override works, when a real probe would degrade it to
`spec_unavailable`/`identity_mismatch`.
Failure scenario: operator sets `introspection.serviceEndpoints.orders =
"https://gw.example/orders"` for a reverse-proxied service → probe hits `https://gw.example/…` root,
returns a wrong-service or missing-spec row for a healthy service.
Impact bound: safe degradation only (never a false `running`); discovered sources are origin-only
loopback so are unaffected. Non-substantive for this slice, but should be closed before S6 consumes
overrides.
Remedy: compose probe URLs relative to the base path (join without a leading slash) **or** normalize
all base URLs to origin-only and document the "origin, not spec URL" constraint (the README already
implies a base URL, but the P3 "reachable public spec URL" phrasing invites path/spec URLs the probe
cannot honor).

### F-2 (low) — parent cancellation is correct but unproven
No fixture aborts the `list(signal)` parent mid-probe. The behavior is implemented correctly
(traced), but the review dimension "parent cancellation" has no regression guard.
Remedy: add a test that aborts the supplied signal during a slow probe and asserts `list()` rejects
(`AbortError`) without emitting fabricated rows.

### F-3 (low) — service self-identification contract is undocumented
The probe requires `/` to return JSON `{ "service": <name> }` (S-8). If a healthy NetScript service
root returns HTML or omits `service`, it maps `identity_mismatch`. The expectation is reasonable but
is an implicit product contract.
Remedy: document the `/` self-identification shape (README or the JSDoc on
`FetchServiceEndpointProbe`) so S7/product services conform.

### F-4 (very low) — `firstHttpUrl` prefers plaintext `http://` over `https://`
`aspire-cli-endpoint-source.ts:160` selects the first `http://` URL before any `https://`. Correct
for loopback dev; note for future TLS-fronted services. No action required now.

## 4. Acceptance-box verdicts

| Box | Verdict | Evidence |
| --- | --- | --- |
| Fixture matrix covers every source outcome + status-mapping row, incl. foreign-root manifest, torn/invalid manifest with healthy appsettings, and identity mismatch on a reused port | **PROVEN** | `service-endpoint-sources_test.ts` (all source outcomes, `project_root_mismatch`, dedicated torn-manifest-with-healthy-appsettings test) + `service-endpoint-directory_test.ts` (running/not_running/spec_unavailable/identity_mismatch/excluded, reused-port mismatch) + probe test. Re-ran: pass. |
| One hanging spec endpoint yields a row-level timeout while the rest of the directory returns | **PROVEN** | Two tests — cooperative-abort probe and non-cooperative `new Promise(() => {})` fetch — both assert the hung row is `spec_unavailable` "timed out after 20ms" while sibling rows return `running`. Re-ran: pass. |

Both boxes are honestly proven by executable evidence, not narration.

## 5. Verdict

**PASS.**

Rationale: the contract, precedence (qualified F1(b)), manifest identity binding, all four source
outcomes, complete S-12 status mapping, deterministic conflicts, pre-fetch exclusion, credential-
and redirect-free bounded probing, spec-first reused-port identity, the exact P3 guidance, the hard
non-cooperative row-level timeout, parent-cancellation propagation, and A2/S4 independence are all
correct and, for the two acceptance gates, proven by re-run tests. The four recorded findings are
low-severity/advisory: each is a narrow edge or coverage/documentation gap, none violates an
acceptance box or the honesty invariant (no path can fabricate a `running` row). F-1 is the closest
to substantive and should be resolved before S6 wires operator overrides, but it degrades safely and
does not block this slice.

Scope note: this review did not run `quality:gate`, `arch:check`, `doc:lint`, JSR audit, or publish
dry-run itself; those verdicts are taken from the worklog gate tables (all PASS) and are the
implementer's evidence, not re-verified here. No GitHub state, commit, push, PR, or issue change was
made.

---

## 6. Follow-up review — findings F-1..F-3 (commit `3a095bc85`)

Same opposite-family reviewer (Claude-family Opus 4.8 fallback, medium effort — route identity
unchanged from §1). Reviewed the exact `a26b1fd1b..3a095bc85` diff: 4 files, +57/-6
(`README.md`, `fetch-service-endpoint-probe.ts`, `publish-assets.generated.ts` regen,
`service-endpoint-directory_test.ts`). No product source outside the probe changed; no lockfile,
dependency, or unrelated churn. **Reviewed HEAD advanced `a26b1fd1b` → `3a095bc85`.**

Focused suite re-run on `3a095bc85`: **15 passed | 0 failed** (was 13; +2 new tests). Full log
confirmed both new tests and all prior tests green.

| Finding | Status | Evidence |
| --- | --- | --- |
| **F-1** path-mounted base URL dropped by probe | **RESOLVED** | `fetch-service-endpoint-probe.ts:49-50,81` now build `const baseUrl = new URL(\`${candidate.baseUrl}/\`)` and resolve the spec as the **relative** `new URL('api/openapi.json', baseUrl)`, and the identity request as `baseUrl` itself — so any base path is preserved. New test `fetch probe preserves a path-mounted operator base…` asserts a `https://gateway.example.test/services/orders` override probes `…/services/orders/api/openapi.json` then `…/services/orders/` and maps `running`. Verified no regression to origin-only bases: the existing "spec before identity" test still asserts `http://127.0.0.1:43127/api/openapi.json` + `http://127.0.0.1:43127/` and passes (relative-join preserves the empty base path identically). |
| **F-2** parent cancellation unproven | **RESOLVED** | New test `parent cancellation rejects the directory instead of fabricating endpoint rows` aborts the `list(signal)` parent mid-probe (1s probe, immediate `AbortError`) and asserts `assertRejects(…, DOMException, 'fixture cancelled')` — proving cancellation surfaces as a rejection, not a fabricated row. Re-ran: pass. |
| **F-3** self-identification contract undocumented | **RESOLVED** | `FetchServiceEndpointProbe` JSDoc now states "The identity response must be JSON with a `service` field equal to the candidate name," and the README adds prose: a running service must return JSON containing its selected service name (e.g. `{ "service": "orders" }`) from its selected base path, framed as the reused-port guard. Embedded README asset (`publish-assets.generated.ts`) regenerated to match. |

**No new substantive issue introduced.** The relative-URL change is the minimal correct fix and is
symmetric across spec and identity requests; `redirect: 'error'`, `credentials: 'omit'`, byte
bounds, and the spec-first ordering are untouched. F-4 (very-low: `firstHttpUrl` prefers plaintext
`http` over `https`) was not in scope for this commit and remains an open, non-blocking note.

**Follow-up verdict: PASS (retained).** All three addressed findings are resolved with executable
proof; both acceptance boxes remain proven; no regression or new substantive finding. No GitHub,
commit, push, or PR-state change was made.
