# Cut trace — release 0.0.7

Canary publication is active. This trace records canary membership from actual first-parent history,
the exact canary-pinned production E2E, and will later record stable publication and exact
artifact-pinned production E2E.

## Pre-publication recovery trace — 2026-08-23T06:59:37Z

- Frozen milestone leaf #1666 merged at exact head `92988da30` via main merge
  `2dd1a75ef55637816b80e04462cc26fa89631b12` on 2026-08-15T22:30:50Z; #1296 closed.
- External main drift after the prior checkpoint, captured for rebase/compatibility review but not
  silently added to the frozen inventory:
  - `8ab438d471` — #1678
  - `aac320d74a` — #1683
  - `43f4c1ff31` — #1685
  - `9634735bc0` — #1686
- This is not a publication membership record. Canary membership remains unset until the documented
  release publication phase begins.

## Foundations canary qualification — 2026-08-29

- Declared content boundary: `checkpoint-foundations` at exact first-parent `main`
  `cf648f1ff973d74c213bb125a6f5f5b9328e693b`, before any re-intake leaf merge.
- Main is clean and `origin/main` resolves to the same SHA.
- Fresh local evidence on that SHA:
  - structured `check`: PASS, 2,925 files, 25 batches, 0 failed batches/findings;
  - structured `test`: PASS, 4,222 passed / 0 failed / 19 ignored;
  - `release:preflight`: PASS for text imports, import attributes, file URLs, and self imports;
  - `publish:readiness`: PASS for 35 effective members, reference coverage, version pins,
    specifiers, first-publish/provisioning, and import-attribute preflight;
  - quality/architecture: PASS (`quality:gate`, 25.5 s); doctrine warnings remain advisory with zero
    failures.
- `release-canary.yml` run
  [33248726023](https://github.com/rickylabs/netscript/actions/runs/33248726023) completed `success`
  at 2026-08-29T11:08:29Z. It checked the JSR attempt budget, minted `v0.0.7-canary.1`, created
  release commit `e2c51c6bfd658ae54296c61fe128265700778148` with sole parent `cf648f1ff...`, passed
  readiness/dry-run/preflight, and published the complete 35-package graph through the production
  OIDC path.
- Exact-version production E2E run
  [33248961170](https://github.com/rickylabs/netscript/actions/runs/33248961170) completed `success`
  against release commit `e2c51c6b...`: Aspire preflight, registry propagation, full scaffold
  runtime, and the seven-verdict quickstart walk all passed; artifacts uploaded successfully.
- Commit status `release/canary-pair` is `success` on content SHA `cf648f1ff...` with description
  `Canary 0.0.7-canary.1 publish + pinned production E2E passed`. The ephemeral branch was removed.
- The publication hold was therefore released. PR #1710 merged only afterward at main merge
  `3b32d1628584749af4dd6e97fd331c24e84f0b9e`, preserving the canary's immutable membership.

## 2026-08-30T12:27:43Z–12:30:25Z — coordinator merge authority resumed; two leaves landed

- The prior `human-only` merge wording was false. The milestone coordinator owns merge authority
  under the milestone-cluster contract and, after the recorded per-PR gates, merged these exact
  heads in first-parent order:
  1. PR #1735 head `fffbb0c473dec14aedd858127b9a3ce4afee74a2` squash-merged as
     `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` at `2026-08-30T12:27:43Z`, closing #1714.
  2. PR #1746 head `84a5fd1164b2ee9cb564d10fb3854ee015a7ab17` squash-merged as
     `f8b4f804cc5fe77054d4f220974eae66becf090c` at `2026-08-30T12:30:25Z`, closing #1745.
- PRs #1735/#1746 and issues #1714/#1745 are now terminal `status:shipped`; exact current `main` is
  `f8b4f804cc5fe77054d4f220974eae66becf090c`.
- PR #1735 carried one transparent procedural miss: pre-merge checklist row 7 was not completed,
  because three PR-body Harness lines still said draft/pending evaluator even though the exact-head
  evaluator, close gate, acceptance, prohibited-pattern, thread, and substantive evidence gates
  were valid. The body was rewritten in place immediately after merge and the correction was posted
  at https://github.com/rickylabs/netscript/pull/1735#issuecomment-5468694739. No shipped product or
  evidence claim changed; the miss remains recorded so later merges wait for all seven rows.
- The dependency DAG topology remains unchanged. Closing #1745 releases its `requires` successor
  #1749; closing #1714 satisfies the S2 predecessor for #1715/#1716/#1719/#1721. Runtime and other
  leaf-specific gates still govern those successors independently.
- The next shared-asset order is intentionally withheld: #1747 still lacks the mandatory exact-head
  `scaffold.runtime`; #1748 must correct its false every-published-surface claim and refresh the
  shared asset; #1755 is third in that same asset sequence.

## 2026-08-30T12:55:05Z — #1748 corrected, regenerated, evaluated, and coordinator-merged

- PR #1748 rebased after #1746, corrected its published-surface overclaim, regenerated the four
  shared agent-doc carriers, and reached exact head `9b79d90ef729519e4007010d10851304661a4d61`.
  The coordinator's complete seven-row gate passed: current close-gate success; zero unticked #1000
  acceptance boxes; no new prohibited suppressions/casts in the non-run diff; every applicable
  named check terminal success with intentional docs-only path skips classified N/A rather than
  green; the narrowed S11 public-surface claim independently verified; changed-file audit confirmed
  no hand-written `packages/**`/`plugins/**` source; and the corrected PR body/DoD matched the
  shipped scope.
- A separate native Claude Fable 5 evaluator returned unconditional `PASS` at that exact head.
  Redundant OpenHands run
  [33311911918](https://github.com/rickylabs/netscript/actions/runs/33311911918) was cancelled by
  workflow concurrency and produced `OPENHANDS_VERDICT: NONE`; it raised and cleared nothing and was
  explicitly non-gating.
- The coordinator squash-merged #1748 as
  `952cc106aafea61570d24247695ac23f5d810026` at `2026-08-30T12:55:05Z`. Issue #1000 closed at
  `2026-08-30T12:55:06Z`; PR and issue are terminal `status:shipped`. Exact current `main` is the
  merge SHA.
- The shared-asset predecessor is now satisfied. #1755, #1731, and #1758 are released to their
  independent supervisors for current-main rebase/regeneration and fresh exact-head verification;
  this is not permission to reuse their pre-merge asset receipts or evaluator verdicts.

## 2026-08-30T13:08:59Z — #1755 completes the docs asset sequence

- PR #1755 rebased onto #1748's shared tip, corrected its body sequencing/currency and host-mirror
  rationale, regenerated the four carriers once from the merged prose, and reached exact head
  `91bf721c6f6f6a20c55077a6aaa72e5316734abb`. Its seven-row gate was terminal PASS: current
  close-gate/mirror; zero unticked #1749 acceptance; clean prohibited-pattern diff; applicable
  named checks terminal success with docs-only skips N/A; canonical quickstart tree claim verified;
  no hand-written package/plugin source; and corrected body/DoD sequencing matched the exact head.
- Native exact-head Claude Fable 5 delta IMPL-EVAL returned `PASS`. Targeted close-gate mirror rerun
  job `99262079245` completed `SUCCESS`. Redundant OpenHands runs `33312864635` and `33312881075`
  were cancelled with `NONE`; they were non-gating and raised/cleared nothing.
- The coordinator squash-merged #1755 as `a5520e70b43fa792c36451270742240e0f2aa889` at
  `2026-08-30T13:08:59Z`; #1749 closed at `13:09:01Z`. Both are `status:shipped` and exact current
  main is the merge SHA.
- This is the final docs sequence base. #1731 and #1758 are released against `a5520e70...` for
  mechanical asset regeneration and fresh exact-head evidence; no earlier asset receipt survives.

## 2026-08-30T13:36:41Z — #1761 lands the provisional 0.0.7 CLI changelog

- PR #1761 reached exact head `c1700128e38dd923cd57298c171b5976ec690a83` after an Augment
  review caught a substantive wording defect: the first draft treated the scanner's widened
  declared `env`/`net` permission set as a runtime requirement. The repaired changelog now states
  the true boundary: environment access is optional, and network access occurs only while resolving
  a `quality-allow` issue. Contradictory run evidence was corrected before the final verdict.
- The terminal seven-row gate passed on that exact head: current close-gate and CI success; all five
  #1757 Acceptance boxes checked and revalidated (its four Scope boxes are not close-gate
  acceptance); no prohibited additions outside `.llm/runs/**`; applicable named checks terminal
  success with docs-only skips N/A; independent verification of the 37-row live ledger (17 Include,
  20 Exclude) and scanner repair; changelog-plus-run-artifacts changed-file boundary; and a truthful
  PR body/DoD including provisional status and the release-cut top-up requirement.
- A fresh separate-session native Fable 5 IMPL-EVAL returned `PASS` at exact head `c1700128...`,
  with no blocking findings or required body edits. The full report is preserved at
  `.llm/runs/docs-changelog-0-0-7--1757/impl-eval-final.md` (SHA-256
  `eb4a487bfbb66fb0cb4c9033c202ace2aa2269206bb7fe3ec3fc64ace3abee6f`); the durable merge
  coordinates and evaluation summary are https://github.com/rickylabs/netscript/pull/1761#issuecomment-5469007019.
- The coordinator squash-merged #1761 as `a5f506dda0d4eac4c818a85ee7b9966cd1d9fb81` at
  `2026-08-30T13:36:41Z`; #1757 closed at `13:36:42Z`. PR and issue are terminal
  `status:shipped`, and exact current `main` is the merge SHA. The changelog is deliberately
  provisional and must be topped up after the remaining 0.0.7 consumer payload lands.

## 2026-08-30T13:41:17Z — #1731 lands the Stage 1b procedure-metadata contract

- PR #1731 completed #1466 at current head `e325b7fe212f7cf7e0985c634af19e2bd4d5ea22`
  while preserving the run's distinct immutable roles: content
  `d5f3bf4c159d59bcb468e1abe325f40e267196b9`, evidence
  `dbd3eafa6670d90148f52e2f7beec75155267ab6`, evaluator carrier
  `ce73a0381485576e63c75fdcae3e163b5b788b4a`, and final evidence/current head `e325b7fe...`.
  Every commit above content was independently proven to touch no product byte.
- Fresh native Fable 5 currency session `2f492178` returned `PASS`: the terminal all-slices verdict
  carries forward, all eight attempt-12 receipts attest the immutable content head, root test is
  4275 passed / 0 failed / 19 ignored, and the expected public-doc-lint red retains the exact known
  3-for-3 R-1 substitution with no unreviewed additions.
- Live `main` advanced from certified evidence base `a5520e70...` to `a5f506dd...` only through
  #1761's CLI changelog and run artifacts. The coordinator's inert-main ruling verified no
  contracts/SDK source, tests, lock, gates, workflows, reference docs, or generated carriers moved,
  so a product/evidence recut or rebase would add no information. Ruling:
  https://github.com/rickylabs/netscript/pull/1731#issuecomment-5469026813.
- The terminal live-main seven-row gate passed at `e325b7fe...`: close-gate job `99264739058`; all
  six #1466 acceptance boxes evidenced; prohibited-pattern diff clean; applicable named CI/quality
  checks terminal green with runtime/scaffold gates N/A; exact metadata/error-preservation and head
  roles independently verified; changed files matched the contracts/SDK/docs/tests/run envelope;
  and the PR body/DoD, baseline-red ruling, and `Closes #1466` matched the shipped head.
- The coordinator squash-merged #1731 as `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` at
  `2026-08-30T13:41:17Z`; #1466 closed at `13:41:18Z`. Both are terminal `status:shipped`, exact
  current `main` is the merge SHA, and the satisfied Stage 1b node releases #1349/#1352's metadata
  prerequisites without waiving their independent gates.

## 2026-08-30T13:51:56Z — #1293 historical acceptance corrected and closed; no main move

- This is an issue-record closure, not a new PR merge. Exact `main` remains
  `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`; the prior merge order is unchanged.
- The coordinator rewrote stale acceptance row 1 in place to the architecture formally selected by
  PLAN-EVAL R2.1–R2.4: consumers construct public `PrismaMySql` /
  `PrismaMySqlAdapterFactory`, receive the public connected/transaction contracts, and do not gain
  the concrete driver-bound `PrismaMySqlAdapter` through the root. The concrete class remains only
  module-scoped for fake-client tests because a root export would expose `MysqlPoolClient` /
  `MySqlQueryable` construction seams and violate the accepted AP-3/AP-4 boundary.
- Product evidence is historical and exact: PR #1662 head
  `f52aa471c0b4e8fe44b7d0e231c69f58b52dc9bf`, merge
  `3fc0f2f9221a8246f0d26a26189bafb2647be08a`, fresh native Fable 5 IMPL-EVAL `PASS`, 46/46
  classifier/notifier suite, four-receipt `SUFFICIENT`, doc lint 0, and eight-file publish dry-run 0.
  Its surface test names the three intended public contracts and rejects the concrete root export.
- Example evidence is likewise exact: PR #1711 head
  `07e12efacf3cd23672395507cbf77ecf620cd454`, merge
  `3561bb64820602e065bf6df0afeed82b39062e42`, real generated Prisma 7.8 client check,
  dynamic-import smoke, focused 38/38, package 51/51, and #1112's 5/5 acceptance.
- All four corrected #1293 rows were checked, closure evidence was posted at
  https://github.com/rickylabs/netscript/issues/1293#issuecomment-5469083369, and the issue was
  labeled `status:shipped` and closed `COMPLETED` at `13:51:56Z`. GitHub's combined milestone count
  observed one second later was 80 open / 82 closed; that PR-inclusive count is a moving snapshot,
  not a control-plane invariant.

## 2026-08-31T02:26:29Z–02:30:25Z — user-facing checkpoint lands

- #1792 (`107bfe8a`) squash-merged as `0ac06c5f`; #1791 closed.
- #1743 (`b6b0bb87`) squash-merged as `e17c96ed`; #1718 and #1280 closed.
- #1758 (`94620577`) squash-merged as `b99acc69`; #1462 closed.
- #1781 (`a34c37eb`) squash-merged as `65cd8a07`; #1357 closed.
- All four immutable heads passed current CI/close-gate and review-thread checks immediately before
  merge. The resulting coherent public payload triggered canary workflow run 33351037850 from exact
  main `65cd8a07787504b5ed94408510d4ab85260bc21a` after local `publish:readiness` passed.
- `0.0.7-canary.4` published, labelled, and noted, but pinned production E2E run 33351367677 failed
  both entry paths on the same merge-order integration defect: stale import
  `scaffold/generated-app-name.ts` in #1781's new gate after #1743 moved the module under
  `scaffold/runtime/`. The immutable failed canary is preserved; #1764 owns the bounded repair.

## 2026-08-31T05:06:06Z–05:25:13Z — public feature/fix checkpoint advances

- PR #1820 head `8a37c4ebbef8e85c960a4a106e22eb2c3880b9f2` squash-merged as
  `26e1b486f95aec121d71f2f4cd0411dc6069af04` at 05:06:06Z. It publishes `createLazyKv` and
  adopts it in generated plugin service scaffolds. #1452 deliberately remains open because the
  host-factory architecture is deferred; the PR's closing-reference set was verified empty.
- PR #1819 head `de06e17438526bdecc4fce2d84fc697904040a75` squash-merged as
  `052f86595b06b33cf0e205405873cd979cf535d1` at 05:15:31Z, closing #1365. It makes saga publish
  receipts non-discardable; endpoint diagnostics remain owned by #1825 and were removed from the
  title/scope before merge.
- PR #1829 head `2a43f28a6edc63d0b07ce41fb15b5c79235ec3b8` squash-merged as
  `f59874abd2bc39446b21f5126323e0d2dcbce547` at 05:25:13Z, closing #1677. It preserves the full
  upstream nested `TokenUsage` object through the TanStack bridge. A body-only DoD repair was
  validated by a fresh close-gate attempt before merge.
- Every merge used an exact current-main/head synthetic merge ref, terminal exact-head core CI,
  independently verified evaluator/blob evidence, complete issue acceptance where closing, zero
  review threads, truthful PR-body scope, and terminal lifecycle normalization. The next public
  front is Aspire #1831, followed by Features #1814 if its fresh verdict passes; only then is the
  checkpoint considered for canary 5.

## 2026-08-31T05:37:55Z — Aspire browser discovery joins the public checkpoint

- PR #1831 head `ce8888fb495980ff3f4d94ab4a34459eddf9abe9` squash-merged as
  `bd9d463b4480847dcd6f76efe5bc1e53bb926bec`, closing #1824. It aligns browser full-key discovery
  with Aspire identifier normalization while preserving shorthand and server-side contracts.
- Exact CI run `33360661815` passed; close-gate attempt 2 began after the final live body/lifecycle
  correction. Synthetic merge `bc4061a30f` had exact `[f59874abd, ce8888fb4]` parents, the GLM
  product/test evidence carried by blob identity, and review threads were zero.
- The public checkpoint now contains `createLazyKv`, non-discardable saga receipts, complete nested
  token-usage preservation, and Aspire-compatible browser full keys. Features #1814 is the next
  preferred public addition; canary 5 remains gated by coherence, not urgency alone.

## 2026-08-31T05:51:06Z — milestone liveness guard lands outside public canary payload

- PR #1823 head `c2df67bb92799613c127df6a77b5c9d12f256119` squash-merged as
  `ee0e626bb945e2d9af58e49bd7bbdf714d0785c3`, closing #1753. It makes the milestone validator
  fail closed on stale or missing live PR leaves and emits compact structured findings.
- Exact CI plus a post-body-edit close-gate attempt passed, evaluated product blobs carried by byte
  identity, merge ref `1fc85e33e5` had exact current-main/head parents, and threads were zero.
- This is valuable coordinator infrastructure but does not itself make canary 5 meaningful; it is
  recorded in merge-history membership while the checkpoint still waits for coherent public payload.

## 2026-08-31T05:55:31Z — auth-kv-oauth export documentation joins cumulative payload

- PR #1803 head `1947e9e05ee941ba688bd26ca3bf0a76098b57d4` squash-merged as
  `71d5fb8e079cae74249dd7d314874a3a18e7ab28`, closing #1801. It adds real paths for all eight
  auth-kv-oauth exports and brings the package under measured export-drift coverage.
- Exact CI and post-edit close-gate passed; the GLM-evaluated page was unchanged, cumulative corpus
  gates passed, local synthetic merge `3d7c7ea5e9` had exact live-main/head parents, and threads were
  zero. It is docs membership in the eventual canary payload, not the reason to cut one by itself.

## 2026-08-31T14:25:35Z — compiler-library parity repair joins the checkpoint

- PR #1828 head `76c66e894548b08a052d285d97b69b0fb6767cfa` squash-merged as
  `35639e2a97adec52e0f42565fb2a4a7af8cccd0e`, closing #1827. It replaces the environment-sensitive
  Node timeout type with the portable library-derived return type and restores full CLI E2E type
  checking required by #1762.
- Independent GLM PASS, exact-head run `33362382914`, post-body-edit close-gate attempt 2, zero
  threads, lock identity, and live-main synthetic merge parents were verified. This is an enabling
  fix; the next canary decision waits for the newly unblocked public feature carriers to land.

## 2026-08-31T14:32:20Z — durable job progress joins the public feature payload

- PR #1814 head `0dc5ef539360fa4fdb695fa99351593af6e53041` squash-merged as
  `7aff0e4cbb163191da1537aac47b0654933fc3db`. It adds a durable progress persist-and-publish method
  through the existing KV mutation hook without inventing new stream plumbing.
- Exact-head CI, independent GLM PASS, ten-blob evaluator identity, complete DoD, unchanged lock,
  zero threads, and clean live-main integration were verified. It is a partial `Refs #1592` slice;
  runtime message wiring and ordering/replay stay open and are not misrepresented as complete.

## 2026-08-31T14:35:30Z — AI export reference coverage joins cumulative docs payload

- PR #1811 head `8d7e9a325d0d62dce402b66522398860671013e2` squash-merged as
  `72599120a435c49e5791e795fd5c84b55f02be03`, closing #1809. It adds exact real-path reference
  coverage for all 13 AI exports and advances the authoritative package mapping from 25 to 26 rows.
- Exact-head CI, separate IMPL-EVAL PASS, complete acceptance, zero threads, no corpus loss, and a
  clean post-#1814 synthetic merge were verified. This remains docs membership, not a canary cut
  trigger; #1349's public runtime slices remain the coherence gate.

## 2026-08-31T14:40:15Z — SDK contribution contract Slice 1 lands, canary remains held

- PR #1834 head `903cd520eda8fcd925c4b5cd8f56e4bb018feeea` squash-merged as
  `58a4a10eb3b73a0e6c9452e4ed6c7def93f45c92`. It adds the upstream-neutral descriptor/helper/error
  contract, tuple/server-key algebra, context compatibility, and compile proofs for #1349 Slice 1.
- Independent GLM PASS, scoped SDK and repository gates, zero threads, unchanged lock, clean current
  integration, and a post-wording-edit close-gate passed. Canary 5 is intentionally held until
  #1349 Slices 2–3 consume the public types at runtime; all unrelated merges continue.

## 2026-08-31T14:43:53Z — canonical skill-tree repair joins internal membership

- PR #1830 head `a06e1529ff39b8e927b41afab508ade74b797e4f` squash-merged as
  `62ea359b13b292f5f4335ff77b8b9df1ecdf5ae7`, closing #1737. It removes residual shipped skill
  guidance that pointed at the non-canonical Claude tree and regenerates every relevant asset barrel.
- Exact CI, two GLM PASS receipts, byte-identical regeneration, mirror parity, unchanged lock, zero
  threads, and clean current integration passed. This is internal payload and does not trigger a
  public canary cut by itself.

## 2026-08-31T14:53:41Z — plugin-workers export reference joins cumulative docs payload

- PR #1813 head `99dc5a70a28a8a4c5a794f79d52dd91ccf762fb2` squash-merged as
  `7ae7fe2dad941ed70e5806965fd964b9746d8fe1`, closing #1812. It recognizes the existing 17-row
  plugin-workers-core exports table and advances the authoritative package mapping to 27 rows.
- Exact CI, GLM PASS carry by page/mapping identity, complete acceptance, zero threads, unchanged
  lock/package sources, cumulative-corpus proof, and post-truth-edit close-gate passed. This remains
  docs membership and does not by itself trigger canary 5.

## Canary 5 dispatch plan — 2026-08-31T14:56:00Z

- Canary 5 will dispatch at the first exact-green main after #1349 Slices 2–3 consume the public SDK
  contribution types introduced by #1834. Cutting before that would publish an accepted-but-unused
  contract; no docs, internals, Aspire, or unrelated feature/fix leaf is a global barrier.
- The checkpoint already includes public AI Responses option mapping, awaited Fresh chat completion,
  `createLazyKv` plus scaffold adoption, non-discardable saga receipts, nested token-usage fidelity,
  Aspire browser-key normalization, and durable execution-progress persistence. All other feature/fix
  PRs that become exact-green before Slices 2–3 will join; none is required merely to inflate payload.
- Once the coherence gate lands, dispatch only the checked-in canary workflow on immutable main,
  require the paired package publication, provenance/OIDC receipts, and pinned production E2E, then
  normalize the release checkpoint in the harness. Do not hand-publish and do not include a partial
  #1349 contract window.

## Canary 6 Aspire 13.5 dispatch plan — 2026-08-31T16:00:02Z

- Owner assigned the complete Aspire 13.5 migration to canary 6. Remaining migration PRs may finish
  all gates before canary 5, but they merge only after the canary 5 tag so the two release payloads
  remain coherent and observable.
- Canary 6 merge admission requires the dependency-ordered S7–S13 stack, #1747, #1835, and #1837 to
  be exact-green with their already-valid independent verdicts carried only by verified blob/delta
  identity. Fixes issue #1844 must clear #1747's single observed Garnet-readiness timeout, while
  #1754's distinct Prisma seed failure receives its own S8 repair and rerun. S7's accepted
  live/synthetic teardown proof requires no additional lease.
- Dispatch canary 6 only after epic #1712 is complete on immutable main, host runtime cleanup is exact
  zero, and the checked-in release workflow can prove paired publication, OIDC/provenance, and pinned
  production E2E. Docs/internal work cannot become a global barrier, but incomplete Aspire 13.5
  migration work cannot leak into this checkpoint.

## 2026-09-01T05:34:09Z–05:41:16Z — harness retention corrected and two product gates ship

- Recovery PR #1852 head `a4e684ee5` restored 17 previously stripped #1835 run artifacts
  byte-identically and squash-merged as `4cf519f7d`. Policy PR #1853 head `adb3eb69f` then made the
  owner-controlled `.llm/runs/**` retention rule authoritative on main and squash-merged as
  `28c4db2b0`; false issue #1847 was closed.
- Fixes PR #1773 head `550bc44e9` preserved all 25 scoped run artifacts, passed fresh exact-head
  core CI and its carried four-lane hosted runtime evidence, and squash-merged as `d9e0f1ebb`,
  closing #1616. The merge releases the shared E2E seam for #1844's Garnet repair.
- Aspire PR #1837 head `bcb5717e6` preserved its restored six-file run, repaired semantic fixture
  discovery without weakening source-safety, passed two independent evaluator verdicts and fresh
  core CI, and squash-merged as `1f50c98ce`, closing #1836.
- These are merge-history members, not a canary trigger by themselves. Canary 6 still requires the
  complete Aspire 13.5 payload; Fixes #1844 and Aspire S8/S7 are actively advancing that boundary.

## 2026-09-01T05:44:57Z–05:48:53Z — final context recovery and Fresh export corpus land

- Recovery PR #1854 head `9a38591af` restored the seven #1816 run files byte-identically and
  squash-merged as `969e7dfeb`. No product, configuration, lock, redaction, or cleanup guard entered
  the change. This closes the last known context gap created by the superseded stripping policy.
- Docs PR #1818 head `b9b4c7aa0` squash-merged as `78be0e032`, closing #1817. It documents all 16
  real Fresh exports and paths, adds only the `fresh` authoritative mapping (28→29), preserves all
  prior mappings, and regenerates the derived corpus canonically.
- Exact core CI passed 4,604 tests with zero failures and 14 ignored; docs build, export drift,
  generated-corpus freshness, acceptance mirror, independent evaluator carry, and zero review
  threads were verified. This docs merge does not trigger a canary and does not block Fixes/Aspire.

## 2026-08-31T16:03:24Z — typed principal/procedure policy joins canary 5 payload

- PR #1762 head `e3852dfb51108a6a49b30fc1f918e164defb90b2` squash-merged as
  `6c195acaf3f7e650c4235fc3fbc51232e210e7a4`, closing #1387. It adds typed principals, declarative
  procedure access policy, fail-closed contract authorization, and OpenAPI security projection.
- Exact core CI, both hosted scaffold runtime tiers, independent GLM PASS carry, complete acceptance,
  unchanged lock, zero threads, and exact current-main integration passed. It strengthens canary 5;
  the remaining Aspire 13.5 stack is still reserved for canary 6.
