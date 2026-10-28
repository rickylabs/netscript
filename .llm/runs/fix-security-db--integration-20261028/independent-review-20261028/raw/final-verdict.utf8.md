## Security + DB integration PR2426 - 88ae6fcacd36573b2f2f6244f4bebc31e49fc5e5
VERDICT: PASS

All 12 integration packets read through EOF (step 1, batched with my own MCP query). Same evaluator session, Zhipu GLM-5.3Flash `provider_default`; generator family OpenAI remains distinct. Original five-owner security PASS (aec36a68) preserved verbatim as historical evidence; this is a distinct integration-only verdict.

### MCP query (relevance + limits)
`find_guidance`/`search_docs` (dependency graph / native Windows DB qualification) returned `pages/reference/sdk` and the Expo streams page: they document `@netscript/sdk` and `@netscript/fresh` as the two TanStack-DB consumers (`@tanstack/db` + `@tanstack/query-db-collection` vs `@tanstack/react-db` + `@durable-streams/state/…/db`), matching exactly the two owners the guard checks. Limits: curated docs do not cover `deno info --json` module `kind` semantics, peer-suffix identity formats, or Windows drive-letter file-URL behavior — for those, local source (`.llm/tools/deps/check-db-alignment.ts`) and native receipts govern. MCP is orientation only; no hidden required-MCP preflight inferred.

### Two DB owners — source verified (integration-01/04)
| Control | file:line | Verified |
| --- | --- | --- |
| Native `toFileUrl` entry | check-db-alignment.ts:48 (`toFileUrl(entry).href` as the sole `deno info` argument) | ✓ — the only path-identity change; prevents Windows drive-letter-as-external-scheme |
| Exact-one peer-qualified identity | ts:24–29 (mixed version / mixed typescript-peer → exactly 1 finding) | ✓ retained |
| missing/empty/external-only/kindless | ts:31–34; test:141–159 — all four yield exactly `['Consumer graph contains no resolved modules']` despite success-shaped identity metadata; each test enables `sanitizeOps/sanitizeResources/sanitizeExit` | ✓ new controls |
| unresolved module | ts:35–37 (`error !== undefined` → finding) | ✓ retained |
| Windows path spaces + `#` | test:161–196 — real `deno info --json --no-config --no-lock --node-modules-dir=none` against `consumer space #.ts`; asserts roots==[fileUrl], kind esm, specifier==fileUrl, zero errors; 10s abort deadline | ✓ actual native oracle |
| Cold resolver scope | ts:62–98 — fresh temp `DENO_DIR` per consumer; deliberately new cache/network (composite stderr shows a live registry download, integration-10:27) — no offline claim | ✓ matches boundary |

Original test assertions updated only by supplying resolved module metadata, so each still isolates its original identity/error concern (test:115–139). Caps respected: prod 100/120, test 86/140. No third owner, no dependency/config/lock/API change.

### Exact 7-owner union (integration-02/03/05)
- Combined diff against 1582e1c9 = exactly 7 paths: the five accepted security owners (byte-identical to my cycle-1 verified hunks: catalog line, 4 literals, 8-entry 1.7.14 closure, `deprecated:true` metadata, rou3 0.7.12/0.9.2, set-cookie-parser) + the two DB owners. DB-only delta diff confirms no other byte changed during merge.
- seven-owner-proof.json: native Git blob IDs for all 7 match accepted origins — 5× aec36a68 blobs (`7fd92d5c/56b8b9cd/a9faaab0/ac5aea39/dc7337c1`, identical to hashes I independently verified in the live worktree last cycle) and 2× ec3cc916 blobs (`babe9043/634c289a`, which independently match the root-audit JSON bound in cycle-1 packet 30 for the accepted DB leaf). `exactSevenSourceUnion/allOriginBytesMatch/noConflictResolution: true`; signed-off native merge c243d315 (parents 77a3bfb1 + ec3cc916). No product edits during merge.

### Integrated gates (integration-07/08/09/10)
| Gate | Result | Evidence |
| --- | --- | --- |
| db-owning | **6/0/0** with `--cached-only --frozen --check --allow-all --sanitize-ops --sanitize-resources --trace-leaks` (original sanitizers) | db-owning.json |
| db static 2 files | check 2/0, lint-canonical 2/2 (exact root rules, `lintRulesExact:true`), fmt 2/2 — nonempty selection | db-check/lint-canonical/fmt.json |
| audit-critical | exit 0, 47 vulnerabilities (4L/23M/20H), **0 critical**; stdout sha identical to cycle-1 green receipt (`ad243fc3…`); 47 lower findings retained | audit-critical.receipt.json |
| ONE Windows composite arch | **PASS exit 0, 22,409ms < 180s**, full receipt **not truncated** (48,308B stdout / 1,744B stderr, `truncated:false`); `db-alignment sdk-fresh identities=@tanstack/db@0.13.0_typescript@7.0.2` and `fresh-only` identical single peer identity + `db-alignment PASS`; reference-lock PASS(3), private-lock PASS, zod PASS; doctrine stage reached with **FAIL=0 across all 37 roots** (existing WARN/INFO retained) | arch-check.receipt.json (integration-08:160–164; integration-09) |
| Cleanup | owned temp 0, root package.json absent, 0 owned native processes | cleanup.json |

This closes the previously OPEN cold-DB arch limitation: the cycle-1 composite failed at `deps:check:db` on Windows; the integrated `toFileUrl` guard resolves both actual cold consumers, and the same composite now passes end-to-end. Not duplicated, not waived — resolved by an accepted, separately-reviewed two-owner leaf.

### Actual CI successor (authoritative, integration-12; integration-11 historical)
| Item | Result | Evidence |
| --- | --- | --- |
| New-head CI run | 40633645853 attempt 2, head 88ae6fca, native CI checkout merge 189c903b; **all 6 test shards + check + browser PASS**, quality PASS, check-test PASS, separate Code quality (40633645949) and Fresh UI quality (40633645889) PASS, docs Pages PASS, pr-metadata success | ci-status-successor.json |
| Attempt-1 shard test-5 | 1439/17/3 — all 17 = shared public auth fixture setup (`installed-auth-fixture.ts`, `error reading a body from connection`) in unchanged `browser-auth-reconciler_test.ts`; transport cause explicitly unproven; original artifact preserved, launch stopped, no silent retry | ci-failure-classification.json |
| Root-authorized rerun | exactly one failed-job rerun after parent completed; pre-dispatch source proof: 7 security-relevant files byte-identical to accepted aec origins, tracked diff empty → **no source changes**; attempt 2: **1456 PASS / 0 FAIL / 3 ignored**, receipt PASS at same 189c903b; no successful-shard retry, no skip/sanitizer/age change | pre-dispatch-source-proof.json, single-job-rerun-decision.md, attempt2-artifact-summary.json |
| OVERALL workflow | conclusion **failure retained by close-gate** — log shows the failure is exactly the three unchecked PR DoD boxes (integration verdict / required CI accepted / root final acceptance), exit 1 | close-gate-error-excerpt.txt |

The close-gate failing is correct pre-acceptance behavior: this verdict supplies the first box; the second and third remain root actions. Later CI and final metadata remain root's final gate; pending/in_progress is never PASS.

### Findings
1. LOW — attempt-1 17-fixture-setup fragility (`packages/cli/tests/installed-auth-fixture.ts` transport failure): root cause unproven; passed once on the authorized rerun. Not caused by the 7 owners (fixture/module proven unchanged from aec). Parent-qualification observation; no correction in scope.
2. INFO — `deps-report` job skipped by existing CI policy; `nativeCiMergeHead` 189c903b is GitHub's checkout merge, distinct from source head c243 — receipts bind it consistently.
3. INFO — composite doctrine emits many existing WARN/INFO (A8/A13/A3/F-5) with FAIL=0; unchanged baseline posture, retained.
4. Verification limit — read-only: gates not re-executed, git objects not recomputed; binding rests on native blob IDs, SHA manifests, receipts, and cross-corroboration with cycle-1 evidence (all checked oracles agreed).

### Origin / cleanup / source compliance
Exact 7-origin union proven (5 aec + 2 ec3 blobs); lint-exclusion qualification preserved in the DB leaf rather than edited to manufacture selection; PLAN-EVAL: N/A recorded for fixed-behavior qualification; no inference/reservation; the continuation performs no merge action itself. Security conditional 1.7.8–1.7.14 compatibility notes, baseline 98/16, corrected-shell CRLF, and docs private-type-ref remain **unwaived parent qualification** — no source/sanitizer/assertion waiver introduced here.

### Scoped source acceptance vs repository merge readiness
This PASS is the independent same-session integration verdict for the exact combined checkpoint (source-qualified c243; evidence-only 88ae6fca with all 7 same blobs). It is **not** repository merge readiness: DB PR2425 stays open until the accepted combined main merge supersedes it; no main duplicate integration, closing keyword, or `status:ready-merge` is granted; close-gate remains red pending root's box updates and root final integration acceptance; later CI remains root's final gate.

Root alone qualifies coverage/relevance and accepts the verdict.