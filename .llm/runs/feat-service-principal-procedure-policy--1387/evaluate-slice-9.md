# IMPL-EVAL — #1387 Slice 9 (adoption documentation, final implementation slice)

**Evaluator:** Claude (opposite family, separate session) evaluating Codex-authored work.
**Certified head:** evidence `ffd380532ff83ba7d24703952bae3020352c5653` (= PR #1762 head), content
`ce0c0ebcb39c35db18a12350cc2683630af84381`, Slice 9 content `3cb08103ff9c25ff3ec580301b5936586b13d37e`.
**Verdict:** **ACCEPTED_WITH_FINDINGS** at `ffd380532`.

This is #1387's final implementation slice. The documentation is adequate for the close-gate; the
two findings below are run-artifact bookkeeping that the supervisor should fold into the close-gate
commit — they touch no product or docs content.

## Content — verified against the shipped code, not the prose

| Claim | Method | Result |
| --- | --- | --- |
| Ceiling: exactly 8 authorized files + sanctioned carriers | `git diff --name-status 9ce84de2f..3cb08103f` | 8 ceiling files, 4 ceiling-exempt carriers (`.llm/assets/agent-docs/{prose.json.gz,provenance.json}`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/mcp/src/publish-assets.generated.ts`), receipt archival moves — nothing else. No plugin-core contract, CLI scaffold/template, `packages/ai`, auth provider, or lockfile edit |
| Path-matcher defect fixed (finding 14) | tutorial `05-route-authz.md` read in full | `.meta({ access: {...} })` + `createContractAuthorizer()` is the primary teaching; no bound-route/path-matcher pattern remains; `createScopeAuthorizer` retained, not deprecated, tabled as "Supported legacy path-rule authorizer; standalone, or a fallback only when a matched procedure has no metadata" — matches `contract-authorizer.ts:75-83` exactly |
| Samples compile against real exports | replicated tutorial Steps 1–3 (contract + meta + `implement` + `$context<ServiceHandlerContext>()` + handler narrowing + `createService(...).withRPC().withAuthn().withAuthz().build()` + one-arg and fallback authorizer forms) as a scratch file inside `packages/service/tests/`, `deno check --unstable-kv` | **0 diagnostics**; handler `input`/`context` infer; scratch deleted, worktree clean |
| LD-8 error string | `contract-authorizer.ts:20-21,143` vs tutorial/README/reference quotes | `[netscript.service.contract-policy] optional authentication is unsupported` + `: ${procedureName}` — character-for-character match (placeholder aside); thrown from `compileProcedures` inside `createContractAuthorizer()` = construction, before bind/first request ✓ |
| LD-6 both directions | traced `authorize()` (lines 65–94) | metadata present ⇒ fallback branch unreachable: `'none'` returns allow unconditionally (cannot be made private); otherwise `authorizeRequirements` on declared scopes/roles (cannot be weakened); fallback consulted only for matched-without-metadata; unmatched ⇒ `deny('authz.no-contract-procedure')` ignoring any fallback, and an unmatched fallback rule denies even when standalone `denyByDefault:false` would allow — both directions hold |
| LD-11 accepted substitution | tutorial:335, contracts README, contracts reference page | all state rename continuity + "a stale SDK reference to the old key fails to type-check"; no blanket compile-time-rename claim anywhere |
| Builder defaults & bodies | `auth-middleware.ts:21-24,88,227-232`, `service-builder-impl.ts:477-486` | protect `['/api']`, allowAnonymous `['/health']`, `denyByDefault ?? true`; 401 `{error:'UNAUTHORIZED',message:'missing-credential'}`, 403 `authz.missing-scope:<scope>`; one resolver bound from `resolveRpcWiringPaths` + aliases + deprecated routes, shared by both stages — all as documented |
| MCP access summary | `operation-access.ts` read in full; `tool-contracts.ts:31-34` | four states (absent / none / optional / required) match the projection exactly; bounds maxItems 50 / maxLength 2000 as documented; `builder-auth_test.ts:31` really asserts the 401/403/200 triple the tutorial teaches |
| Stray `</content>` | tail bytes + all six sibling tutorials | established per-file convention, not a defect |

## Evidence — the Tier-A gap fix is genuine, verified at the sign-off commit

- At Tier-A's sign-off commit `b5e3eef4f`, `receipts/check.json` is the re-cut receipt:
  argv exactly `deno task check --include ^packages/(contracts|service|plugin|mcp)/`,
  `gitHead == actualGitHead == 3cb08103f…`, PASS, 344 files / 0 diagnostics, 10 060 ms (matches
  Tier-A's table); `lint`/`fmt-check` re-cuts likewise (343 files, 1 525 / 824 ms).
- **Bare unscoped failure reproduced by me** at the final head: `deno task check` fails with
  TS2551 at `packages/service/src/primitives/health.ts:184:29` (`Deno.openKv`). `health.ts` is
  byte-identical at base `9ce84de2f` and untouched by the whole leaf (last changed by main's
  #847) — pre-existing, unrelated to Slice 9. (A second main-side TS2307 from #1781's e2e refactor
  also appears; outside this leaf.) Scoped four-root check re-run by me at the final head: PASS,
  345 files / 0 diagnostics; `packages/service` alone: PASS, 48 files / 0.
- Carrier freshness at the integrated head, re-run by me: `docs:exports-drift` PASS;
  `check:mcp-export-corpus` PASS (7 709 symbols — grew from 7 655 with main's PRs, corpus
  regenerated); `check:assets-barrel` PASS; worktree clean afterwards.
- All 90 receipt files across the run inventoried: every one has `gitHead == actualGitHead`
  (zero mismatches), judged by argv + durationMs + outcome, never exitCode alone. Slices 1–8
  archives each touched by exactly one commit (their archival, slice-8 as R100 byte-identical
  moves) — intact. `pre-refresh-s9-582e82322/` preserves the 12 diagnostic receipts including the
  two FAILs (bare check TS2551; stale publish carrier), correctly kept as history.
- `deno.lock` byte-identical base → final head; SHA-256 `edfa0c24b7…` matches the worklog's record.
- `docs:exports-drift`, `check:assets-barrel`, `check:mcp-export-corpus` all PASS at the final
  head — the integration's generated carriers are genuinely fresh, not hand-merged.

## Integration — both merges judged

- **catalog.ts union (first integration, sole source conflict):** at `6a8748e28` and at the final
  head, `exports-drift`/`mcp-export-corpus` (lines 39–40) and main's `aspire-version-parity`
  (line 68) are all present; main's side carried only the latter — neither side dropped.
- **No leaf product change reverted:** intersecting main's post-3cb08103f changes with the leaf's
  58 product files yields only the three generated carriers (regenerated, gates above prove fresh)
  and `packages/sdk/README.md` — where main's #1758 additions were layered **on top of** the leaf's
  hunks, which survive verbatim at the final head (verified at lines 28 and 263).
- **Note:** only `test` was re-cut at the second integration (`ce0c0ebcb`, 405/405 across the five
  affected suites); the check/lint/fmt re-cuts sit at the first integration (`6a8748e28`). The gap
  is covered by my own four-root scoped check PASS at the final head plus the three freshness
  gates — substantively closed, but see F-1.

## Findings (non-blocking; fold into the close-gate commit)

- **F-1 (evidence-set manifest stale).** Commits `88546224c`/`ffd380532` replaced the top-level
  `check`/`lint`/`fmt-check`/`test` receipts with integrated-head re-cuts but did not update
  `receipts/evidence-set.json`, which still declares `immutableHead == 3cb08103f` and the twelve
  `1387-s9-*` receiptIds — four of which no longer resolve to the files now at those paths
  (`1387-integrated-*` at `6a8748e28`, `1387-final-test` at `ce0c0ebcb`). The superseded 3cb08103f
  receipts survive only in git history (`b5e3eef4f`), where I verified them. The re-cuts are
  themselves genuine and correctly scoped (five roots incl. sdk) — this is bookkeeping, not
  evidence loss. Fix: recompute `evidence-set.json` over the current set (or archive the
  content-head set under `receipts/slice-9-3cb08103f/` as slices 1–8 were).
- **F-2 (run artifacts not updated for the integration).** `worklog.md`, `context-pack.md`, and
  `drift.md` contain no record of either main integration or the integrated-head evidence — all
  frozen at the Slice 9 Tier-A boundary (context-pack's last update is `c4bd64232`). A close-gate
  session resuming from the run dir would read content head `3cb08103f` and the `1387-s9-*`
  inventory rather than the certified head `ffd380532`. The PR commit trail carries the story, so
  it is discoverable, but the resume state understates the final head. Fix: one run-artifacts
  commit noting both integrations, the head moves, and the receipt re-cuts.
- Minor pre-existing prose inconsistency, recorded not blocking: the author's worklog/context-pack
  say "eleven durable receipts / 11/11" (true at `861bed05b`, where `check` was excluded by the
  author's since-corrected reasoning); Tier-A's recompute made it twelve.

## Not run

`e2e:cli`, Aspire, Docker, browser gates — prohibited for this lane; no runtime lease held, none
acquired. PR #1762 state read read-only via `gh`: OPEN, draft, head `ffd380532`, 55 commits.
