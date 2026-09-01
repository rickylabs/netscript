# IMPL-EVAL — #1387 Slice 9, final re-evaluation at the moved head

**Evaluator:** Claude (opposite family, separate session) evaluating Codex-authored work; second
opposite-family IMPL-EVAL of Slice 9. Prior verdict artifact preserved untouched at
`evaluate-slice-9.md`.

**Certified head:** evidence `2a26f0254ae585e516ac81e78da5d625ea5d1c55` (= PR #1762 head, OPEN,
draft, 58 commits), content `236a3d3314711a5bfa5bd4036699a22a8575a367`, Slice 9 content
`3cb08103ff9c25ff3ec580301b5936586b13d37e`.

**Verdict:** **ACCEPTED_WITH_FINDINGS** at `2a26f0254`. The documentation is adequate for the
close-gate. One finding (F-2 only partially folded into the run artifacts — context-pack body still
stale) should be completed in the close-gate commit; it blocks nothing.

## F-1 — fixed, complete and honest

- `receipts/evidence-set.json` now declares `immutableHead 236a3d331…` and nine `1387-final-*`
  receiptIds; the receipts directory holds exactly those nine files. Manifest and directory agree;
  `SUFFICIENT`, zero reasons.
- Commit `9b484571a` archived the whole Slice 9 set to `receipts/slice-9-3cb08103f/` via R100
  byte-identical moves plus four additions — the eight `1387-s9-*` content-head receipts, the
  superseded integrated re-cuts (`superseded-check/lint/fmt-check` at `6a8748e28`,
  `superseded-test` at `ce0c0ebcb`), and the stale manifest itself. **Nothing was discarded;
  every superseded receipt is on disk or in git history.**
- All nine top-level receipts: `gitHead == actualGitHead == 236a3d331`, PASS, judged by argv and
  durationMs. `check`/`lint`/`fmt-check` argv scope to
  `^packages/(contracts|service|plugin|mcp|sdk)/` (five roots — correctly scoped, not the bare
  task); `test` scopes to the five affected suites (405/405); corpus receipt reports 7 709 symbols.
- Full run inventory re-run by me: **96 receipts, zero `gitHead == actualGitHead` mismatches**, 94
  PASS plus the two known FAILs preserved as history in `pre-refresh-s9-582e82322/` (bare-check
  TS2551; stale publish carrier). Slices 1–8 archives untouched — each directory's last-touch
  commit predates Slice 9.
- Minor observation, not a finding: the archived stale manifest still names four `1387-s9-*` ids
  (`check`/`fmt-check`/`lint`/`test`) whose files resolve only via git history (`b5e3eef4f`),
  because Tier-A's exact-content-head re-cuts had already been replaced before the fix landed.
  History preserves them and the prior evaluation verified them there.

## F-2 — only partially folded; the one finding of this evaluation

- **`worklog.md`: complete and accurate.** Its "Post-Slice-9" section records all three
  integrations by hash (`0ac06c5f1`, `65cd8a077`, `8a9257642`), the catalog-union resolution, the
  carrier-only second integration, the corpus regeneration to 7 709, and both fixes. Every claim I
  independently checked holds.
- **`context-pack.md`: not complete.** The F-2 fix changed exactly one line — the phase row
  (`236a3d331` diff confirms). The body still tells a resuming session the pre-integration state:
  "the MCP export corpus stayed at **7,655** symbols" (now 7 709), "The final **eleven**-receipt
  evidence set is SUFFICIENT" (now a nine-receipt set at `236a3d331`), "awaiting substantive
  supervisor review and a separate opposite-family IMPL-EVAL" (both done; this is the second
  IMPL-EVAL), Next Steps still instruct performing Slice 9's Tier-A review, and the Gates/Commits
  sections end at `3cb08103f`. No integration hash appears anywhere in the file. This is the third
  recurrence of the failure class the file itself documents at lines 45–51 ("flagged again by the
  Slice 6 IMPL-EVAL… Update this file at every Tier-A certification"). A close-gate session
  resuming from `context-pack.md` alone would read an 11-receipt / 7 655-symbol / pre-verdict state
  — exactly the confusion F-1 created in the receipts directory, now in prose.
- `drift.md` was not updated; defensible — the integrations are run mechanics, not plan/doctrine
  drift, and the original finding's fix list is satisfied by worklog + context-pack once
  context-pack is actually refreshed.
- **Fix:** one run-artifacts commit refreshing `context-pack.md`'s narrative, Gates, Commits, and
  Next Steps to the certified head (three integration hashes, 7 709, nine-receipt set at
  `236a3d331`, both evaluator verdicts recorded). Bookkeeping only; no product, docs, or receipt
  change.

## Documentation content — re-verified against the shipped code at this head

The eight ceiling files are byte-unchanged since `3cb08103f` (no ceiling file appears in the
`3cb08103f..236a3d331` diff), so the prior verdict's content findings carry over; I re-verified the
load-bearing ones directly rather than on trust:

- **Finding 14 (path-matcher defect): genuinely fixed.** Tutorial read in full. Primary teaching is
  `baseContract.route(...).meta({ access: {...} })` (tutorial lines 102–113) plus
  `createContractAuthorizer(WorkspaceContractV1)` (line 169); no path-rule map remains.
  `createScopeAuthorizer` is retained and not deprecated — tabled as "Supported legacy path-rule
  authorizer; standalone, or a fallback only when a matched procedure has no metadata" (line 177),
  which matches `contract-authorizer.ts:75-83` exactly.
- **LD-8, exact:** quoted string
  `[netscript.service.contract-policy] optional authentication is unsupported: <procedure>`
  (tutorial line 136, service README line 174, reference pages for contracts and service) matches
  `OPTIONAL_AUTHENTICATION_ERROR` + `: ${procedureName}` at `contract-authorizer.ts:20-21,143`
  character for character; thrown from `createContractAuthorizer` → `compileProcedures` →
  `normalizePolicy`, i.e. **at construction, before the first request** — framing correct in all
  surfaces.
- **LD-6, both directions, traced in source:** the fallback branch (`contract-authorizer.ts:75-83`)
  is reachable only when a matched procedure has no policy. With metadata: `'none'` returns
  `{ allow: true }` unconditionally (`:85-87`) — a fallback cannot make a declared public procedure
  private; otherwise `authorizeRequirements` on the **declared** scopes/roles (`:89-93`) — a
  fallback can neither weaken nor strengthen them. Unmatched requests deny
  `authz.no-contract-procedure` ignoring any fallback (`:71-73`), and a non-matching fallback rule
  denies even when standalone `denyByDefault:false` would allow (`:82`) — exactly what tutorial
  lines 187–190 and service README lines 144–150 state, both directions.
- **LD-11, accepted substitution:** tutorial lines 333–335 and contracts README lines 88–89 state
  rename continuity plus "a stale SDK reference to the old key fails to type-check"; no blanket
  compile-time-rename claim exists anywhere in the eight files.
- **Samples compile against real exports.** I replicated tutorial Steps 1–3 (contract + meta +
  `implement` + `$context<ServiceHandlerContext>()` + handler narrowing + one-arg and fallback
  authorizer forms + `createService(...).withRPC().withAuthn().withAuthz().build()`) as a scratch
  file under `packages/service/tests/`; `deno check --unstable-kv` returned **0 diagnostics** at
  this head. (First run surfaced TS9027/TS9035 — publish-bar slow-type diagnostics on my own
  `export const`s, not tutorial defects; non-exported form checks clean.) Scratch deleted,
  worktree clean. The 401/403/200 triple the tutorial teaches is genuinely asserted by
  `packages/service/tests/auth/builder-auth_test.ts` (`missing-credential`, `authz.missing-scope:*`).

## Integration — the third `main` merge preserved every leaf change

- Intersecting the leaf's full file set (Slices 1–9 range against `13878a80a`) with everything
  changed in `3cb08103f..236a3d331` yields only the four generated/README carriers. Of those, the
  MCP export corpus was regenerated (7 709 symbols — gate PASS under my own run, matching the
  receipt), `agent-docs.generated.ts`/`publish-assets.generated.ts` are ceiling-exempt carriers, and
  `packages/sdk/README.md` was **never owned by the leaf** (its leaf-range change came from main's
  #1731; its current content matches main's tip, so nothing of the leaf was reverted there).
- **catalog.ts union intact:** `exports-drift` (line 39), `mcp-export-corpus` (line 40), and main's
  `aspire-version-parity` (line 68) all present — neither side dropped.
- **Carriers fresh, verified by my own runs at this head:** `check:assets-barrel` PASS;
  `check:mcp-export-corpus` PASS (7 709 symbols); `docs:exports-drift` PASS.
- The eight ceiling docs changed nowhere after `3cb08103f`; Slices 1–9 product files show no other
  intersection with the third integration.
- `deno.lock` byte-identical at base, `236a3d331`, and `2a26f0254` — SHA-256 `edfa0c24b7…`,
  matching the worklog's record.

## Evidence gap (item 6) — verified, not trusted

- Bare unscoped `deno task check` **reproduced by me at this head**: exit 1, exactly one diagnostic
  — TS2551 `Deno.openKv` at `packages/service/src/primitives/health.ts:184:29` (2 974 files
  selected, 1 failed batch, no other diagnostics). `health.ts` is byte-identical to base
  `9ce84de2f` and untouched by the whole leaf (last changed by main's #847) — pre-existing,
  unrelated to Slice 9. (The second main-side TS2307 the prior evaluation observed is gone at this
  head.)
- The receipt's scoped form re-run by me: `deno task check --include
  '^packages/(contracts|service|plugin|mcp|sdk)/'` → PASS, 434 files, 0 diagnostics — matching the
  receipt exactly.
- **The final nine-gate set dropped four doc-specific gates the Tier-A set had**
  (`agent-docs-prose`, `docs-tagline`, `publish-assets`, `service-doc-lint`) — their receipts are
  from `3cb08103f`, while the integrations regenerated the prose carrier and touched other site
  files. I closed this question myself at this head: `check:agent-docs-prose` PASS (`fresh:true`,
  `stalePaths:[]`), `docs:tagline:check` PASS, `check:publish-assets` PASS; `deno doc --lint` is
  exercised by the PASSing `publish:dry-run`. The manifest's `SUFFICIENT` therefore holds, with the
  note that the dropped gates' currency at the final head is proven by this evaluation's runs, not
  by receipts.

## What I could not verify / did not run

`e2e:cli`, Aspire, Docker, browser gates — prohibited for this lane; no runtime lease held, none
acquired. The close-gate itself is open and remains the supervisor's. PR #1762 state read read-only
via `gh`: OPEN, draft, head `2a26f0254`, 58 commits.
