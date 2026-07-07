# Worklog — beta6-nondash--supervisor

## 2026-07-06 · Bootstrap (Tier A, Fable 5)

- Activated `netscript-harness`; read `lane-policy.md`, `workflow/supervisor.md`, beta.5 run
  artifacts as format precedent; `openhands-handoff` trigger mechanics.
- Re-verified live board via WSL gh (`codex` user; Windows has no gh — recorded in supervisor.md
  host row). 16 non-dashboard beta.6 issues confirmed; dashboard block confirmed excluded.
- Re-baselined: fast-forwarded local main to origin/main `a1669f60`.
- Fetched 20 issue bodies → `issues/board-snapshot.md`; verified dependency states (T1/T2/FB0/E4/
  FA3/E5 all CLOSED); discovered phantom FAI-5/6/8 handles → drift D1.
- Wrote `supervisor.md`, `charter.md`, `research.md`, `plan.md` (incl. Design D-1…D-7),
  `phase-registry.md`, `drift.md`.
- Landmine hit + confirmed during bootstrap: `wsl.exe bash -lc` inline `$var` emptying (loop var
  vanished) — switched to script-file dispatch for all WSL gh work.

## Design checkpoint · 2026-07-06

Plan committed with locked decisions D-1…D-7 (see `plan.md` § Design). **No implementation slice
before PLAN-EVAL PASS.**

## 2026-07-06 · Plan-Gate dispatch (Tier A)

- Run dir committed `c9ba36a5` on `chore/beta6-nondash-supervisor-run`; pushed via WSL
  (`gh auth setup-git` + explicit `HEAD:refs/heads/<branch>`; Windows git has no credentials —
  recorded for future slices).
- Draft PR **#548** opened (base main), labels `type:chore` + status stage label, milestone
  `0.0.1-beta.6`. PR body = Plan-Gate surface, no closing keywords.
- PLAN-EVAL dispatched via `.llm/tools/agentic/dispatch-openhands.ts` (contract-validated dry-run
  first): PR #548 comment 4895235162, `@openhands-agent model=openrouter/minimax/minimax-m3
  output=pr-comment iterations=600`. Evaluator writes `plan-eval.md` on the PR branch; verdict
  contract line enforced.
- Awaiting verdict; supervisor watches and acts on it (implementation waves launch only on PASS).

## 2026-07-06 · PLAN-EVAL PASS → wave-1 launch (Tier A)

- PLAN-EVAL verdict: **PASS** (minimax-M3, PR #548; all 8 plan-gate boxes, 3 spot-checks incl.
  independent D1 confirmation). Evaluator commit-back verified clean: single file `plan-eval.md`
  (91304fcb), no lock churn. Implementation unlocked.
- Wave-1 Codex prep: 3 fresh WSL clones (`netscript-404-t3`, `netscript-405-t4`,
  `netscript-494-perturn`) at base `a1669f60`, slice branches, no upstream. Briefs committed under
  `briefs/`.
- Launch failures (all recovered, see drift D5): (1) MSYS pathconv mangled `/home/codex/...` argv
  → exit 5; (2) relaunch crashed post-`thread/start` on missing `slices/<n>/` dir, aborting the
  daemon turns (pipe-kill) — tool fixed on this branch (mkdir-recursive); (3) third launch reached
  Codex and hit the **usage quota** (resets 2026-07-07 03:52). Six zero-turn orphan threads
  abandoned; verified no rollout content → no rival-send risk.
- Reroute (drift D5): TEL-T3/TEL-T4/AI-494 → Tier B Opus 4.8 high worktree sub-agents; supervisor
  owns push + draft-PR (Windows agents have no git credentials). #463/#511/wave-2 Tier-D held for
  quota reset.
- PROG-389 bookkeeping done → `owner-batch.md` §1 (recommend close after #306).

## 2026-07-06 — PROG-306 slice landed (first wave-1 completion)

- Opus sub-agent returned `chore/306-harness-skills-revamp` (3 commits: d6a4b0db, 5b2cd93c,
  68353c59 on base a1669f60). Key finding: #306 bullets 2 (release-gates wiring), 3 (gotcha folds,
  minus one clause), 4 (arch-debt reconcile) and 5 (SCOPE-frontend fresh/ai) were ALREADY merged on
  main via 52cf7ec7 (#486) — agent verified per-bullet against current text and implemented only
  the true remainder: doctrine-06 archetype-5 folder-shape reconciliation (+05 note, ARCHETYPE-5
  deferral flip), gh-watch/gh-token rows in the agentic README, IMPL-EVAL file-set-reconcile clause
  in openhands-handoff (mirror regenerated via sync tool).
- A1 review (Tier-A, substantive): PASS. Diff read in full; doctrine shape cross-checked against
  live `plugins/workers` + `plugins/triggers` listings; thinness-law text matches the recorded
  owner law (auth-core reference); sibling names corrected to `@netscript/plugin-<kind>-core`;
  already-folded claims spot-checked on main (release-gates.md exists, SCOPE-frontend line 9).
- Gates: `sync-claude-skills --check` OK, `validate-claude-surface` ok (5/5). No lock churn.
- Pushed via WSL (explicit refspec) + draft **PR #549** (`Closes #306`, milestone 0.0.1-beta.6,
  labels copied from issue + status:impl). Landmine note: `gh pr create` aborts the whole create on
  an unresolvable label — correct status label is `status:impl`, not `status:in-progress`.
- Next for this slice: adversarial WSL Codex review post-quota-reset, then one IMPL-EVAL
  (qwen-3.7-max), then merge on green (re-read charter.md first) → owner closes epic #389.

## 2026-07-06 — AI-257 slice landed (wave-1 #2)

- Opus sub-agent returned `feat/257-fresh-ui-mcp-ui-widget` (3 commits: 48e5c2f5 island,
  10381695 manifest wiring, 64fa5364 tests, on base a1669f60). Survived two transient API drops
  (resumed in place both times; refs intact, no state loss).
- A1 review (Tier-A, substantive): PASS. Read island source, manifest diff, and all 7 test names
  in full. Confirmed: (a) sandbox is `allow-scripts` only via `sanitizeSandbox` which strips
  `allow-same-origin` case-insensitively on EVERY render path incl. hostile override (test-covered);
  opaque origin + `no-referrer`; (b) keyed remount uses `h('iframe',{key})` deliberately because
  precompile-JSX drops `key` on intrinsic literals (correct, documented, test asserts distinct key
  light vs dark); (c) manifest is APPEND-ONLY (+23, no deletions), item lands in the `ai` collection
  (verified collection.name==='ai' at L1260; test also asserts it) — clean rebase surface for #258;
  (d) F-6 `deno publish --dry-run` WITHOUT `--allow-slow-types` exit 0.
- Gates: scoped check/lint/fmt 126 files 0 findings; `deno test -A packages/fresh-ui` 129 pass;
  assets barrel regenerated LF-clean (avoided PR #547 CRLF trap); no lock churn. Shared checkout
  verified uncontaminated.
- Pushed via WSL (explicit refspec) + draft **PR #550** (`Closes #257`, milestone 0.0.1-beta.6,
  issue labels + status:impl). Next: adversarial Codex post-reset → one IMPL-EVAL → merge on green.
- Note for #258 (wave 2): rebase its manifest edit on PR #550 — append after the `mcp-ui-widget`
  entries, do not conflict with the `ai` collection list.

## 2026-07-06 — AI-494 slice landed (wave-1 #3)

- Opus sub-agent returned `feat/494-ai-perturn-options` (4 commits 18dd9732/f6c94965/9e0042c2/
  82874ee8 on base a1669f60; 16 files, +520). Survived one transient API drop (resumed in place).
- A1 review (Tier-A, substantive): PASS. Verified the three load-bearing points directly:
  (1) zod lockstep is REAL and symmetric — ai-core `ReasoningChunk {type:'reasoning',delta}` +
  plugin-ai-core `reasoningChunkZodSchema` with matching shape, both unions gain the member in the
  same position (after text); runtime lockstep test asserts `chatChunkZodSchema` validates the
  reasoning frame. (2) NO new casts — diff cast-scan empty; `AnyTextAdapter` erasure keeps the 2
  accepted casts untouched. (3) Anthropic mapper uses `output_config:{effort}` + `thinking:
  {type:'disabled'}` for off, deliberately NOT deprecated `budget_tokens`. Owned GenerationOptions
  is provider-neutral, all-optional/additive, with a `providerOptions` escape hatch (layered merge:
  static < per-turn < raw). eis-chat per-message effort probe passes.
- Flagged for adversarial/IMPL-EVAL (not an A1 block): the Anthropic `output_config.effort` wire
  shape is an external-API assertion — reversible via providerOptions, but confirm vs live docs.
- Gates: scoped check/lint/fmt 0 findings both roots; `deno test` ai 84 / plugin-ai-core 2;
  doc-lint 7 entrypoints 0 attributable; publish dry-run both pkgs Success; no lock churn;
  runtime/mod.ts + packages/fresh untouched (later telemetry slice owns runtime).
- Pushed via WSL + draft **PR #558** (`Closes #494`, milestone 0.0.1-beta.6, labels + status:impl).

## 2026-07-06 — TEL-T4 slice landed (wave-1 #4)

- Opus sub-agent returned `fix/405-telemetry-t4-w3c-parenting` (4 commits d5ea65d9/134676de/
  d8d46d3a/087d01c0 on base a1669f60; 9 files, +749/-74).
- A1 review (Tier-A, substantive): PASS. Verified: (1) W3C fallback fix real — parseTraceState
  preserves tracestate (immutable TraceState, W3C move-to-front + 32-cap), parseTraceparent
  validates exact-width lowercase hex + rejects reserved `ff` + all-zero ids; (2) regression test
  `trigger-runtime-parenting_test.ts` is genuinely load-bearing — ParentAwareRecorder derives each
  span's traceId from parent context, so broken threading yields fresh random ids and fails;
  asserts ingress(SERVER)/detect/process all share inbound traceId aaaa…; agent verified FAIL
  pre-fix; (3) TEL-T3 boundary CLEAN — diff touches no provider-adapter/enabled/registry files.
- Plan-divergence (recorded for IMPL-EVAL, not an A1 block): SERVER ingress span placed in the
  plugin PROCESSOR, not core `create-trigger-ingress.ts` as the brief anticipated — processing runs
  in a detached microtask after the 202 ack so the request span's async context is gone; durable
  link is the captured traceparent re-established via extractFromTraceContext. plugin-triggers-core
  stays telemetry-dep-free (matches plugin-workers-core reference); only namespacing constants
  changed there. Sound rationale.
- Gates: `deno task check` full plugins/triggers + scoped runtime/tests; lint 0 all three roots;
  fmt 0; telemetry 27/27, triggers-core telemetry 5/5, triggers runtime 4/4; no lock churn.
- Pushed via WSL + draft **PR #559** (`Closes #405`, milestone 0.0.1-beta.6, labels + status:impl).
- Merge-order note (D-2): T3 #404 and T4 #405 are parallel; whoever merges second rebases.

## 2026-07-06 — TEL-T3 slice landed (wave-1 #5) → WAVE 1 COMPLETE

- Opus sub-agent returned `feat/404-telemetry-t3-provider-adapters` (4 commits d6c04507/078aaf26/
  68b1be04/16a5866f on base a1669f60; 20 files, +1161/-52).
- A1 review (Tier-A, substantive): PASS. Verified the linchpin claims directly:
  (1) ZERO-DEP proven at source — otel-sdk.ts top imports only `@opentelemetry/api`; all four
  sdk-*/exporter-* packages come via dynamic import() only (lines 98-102), absent from static
  resolved graph; agent confirmed via `deno info` + `publish --dry-run` success without declaring
  them; deno.lock unchanged. (2) enabled decoupled = resolveEnabled() three-signal OR
  (OTEL_DENO ‖ NETSCRIPT_TELEMETRY_ENABLED ‖ isProviderRegistered()), used in both
  getTelemetryConfig + isTelemetryEnabled; enabled_matrix_test covers all 4 paths + provider
  selection. (3) NO new casts (cast-scan empty; structural api-boundary delegation). (4) TEL-T4
  boundary CLEAN (no w3c/extractContext/triggers files).
- Deferred to merge-readiness (agent recommendation, not A1 block): `deps:prod-install`
  (workspace-wide `deno ci --prod`) as the formal zero-dep cross-check — heavy/network gate; the
  deno info + dry-run proof stands for A1.
- Gates: scoped check 81 / lint 83 / fmt 83 all 0; doc-lint 11-entry export map 0 (1 slow-type
  fixed); `deno test` 35 pass incl. SDK link-attrs + flush-order + layering fitness scan.
- Pushed via WSL + draft **PR #560** (`Closes #404`, milestone 0.0.1-beta.6, labels + status:impl).

### Wave 1 complete — all five slices impl-done on draft PRs (A1 PASS each):
- PROG-306 #306 → PR #549   | AI-257 #257 → PR #550   | AI-494 #494 → PR #558
- TEL-T4 #405 → PR #559     | TEL-T3 #404 → PR #560
All five: base a1669f60, no lock churn, scoped gates green, boundaries respected. Next: adversarial
WSL Codex review per PR + one IMPL-EVAL (qwen-3.7-max) each, after Codex quota reset (07-07 03:52).
Merge-order dependencies: T3#404 before T5#406/T6-ai; #257 before #258; T3/T4 parallel (D-2 second
rebases). Merge on green — RE-READ charter.md first (grant lost on compaction).

### Wave 1 IMPL-EVAL — dispatched + outcome (owner override: "skip adversarial, launch IMPL eval")
2026-07-07. Per explicit owner instruction, skipped the per-PR adversarial WSL Codex pass and went
straight to IMPL-EVAL (OpenHands qwen-3.7-max, `--iterations 1000`, `--output pr-comment`), one per
PR. Dispatch comments: #560→4896031663 · #559→4896033675 · #558→4896034205 · #550→4896034823 ·
#549→4896035342. Outcomes:
- **PASS → MERGED by owner:** #560 (#404 TEL-T3), #559 (#405 TEL-T4), #549 (#306 PROG-306). Three
  slices landed on main.
- **#558 (#494 AI-494) → NONE (incomplete, not a verdict).** The eval exhausted its iteration budget
  enumerating a 9-step verification plan without executing any of it (`OPENHANDS_VERDICT: NONE`, no
  `evaluate-494.md`, no code touched). Re-dispatched 2026-07-07 with a tightened verdict-first prompt
  (`impl-eval-494-v2.md`: cheapest-decisive-checks-first ordering, post verdict after checks 1–4,
  deep adapter-vs-live-API check moved to optional tail, `--iterations 1500`) → comment 4901284973.
  Re-dispatch is consistent with the single-eval-round rule: NONE is a failed run, not a verdict.
- **#550 (#257 AI-257) → IMPL-EVAL PASS on code, but `close-gate` CI FAILED.** `evaluate-257.md`
  verdict PASS (sandbox rigorous/un-bypassable, keyed remount, manifest append-only, no casts, F-6
  dry-run exit 0, 129/129 tests). BUT the evaluator misread the merge close-gate: its §9 checked only
  that `Closes #257` is present in the PR body, whereas `check-close-gate.ts` enforces that issue
  #257's acceptance/`gate:` checkboxes are checked with evidence. CI correctly failed on 6 unchecked
  boxes. See drift D8.

## Wave-1 close-out + AI-stack #463 dispatch (2026-07-07)

### #558 (AI-494 per-turn options) — IMPL-EVAL re-run PASS
- First run returned NONE (enumerated a check plan without executing it). Re-dispatched verdict-first
  prompt (`impl-eval-494-v2.md`, iterations 1500): cheapest-decisive-checks-first, post verdict after
  check 4, deep adapter-vs-live-API cross-check moved to optional tail.
- Verdict: **OPENHANDS_VERDICT: PASS** (Actions run 28849529272). Checks 1–4 green — owned
  `GenerationOptions` (reasoningEffort/maxOutputTokens/providerOptions, readonly+optional) re-exported
  via `contracts/mod.ts` and threaded loop→chat-client→adapter; `ReasoningChunk` union symmetric
  TS↔zod with `_chunkMembersMatches` drift-guard + test; 84 (@netscript/ai) + 2 (plugin-ai-core)
  tests; `publish --dry-run` exit 0 both, `deno.lock` clean (a1669f60..HEAD empty), zero casts.
  Check 5 (adapter native maps vs live API) skipped for budget = non-blocking caveat.
- Plan row 42: #494 is **DISJOINT (∥) from #463** — NOT gated behind pooling. Independently
  merge-ready. → owner batch.

### #550 (AI-257 McpUiWidget) — close-gate resolved via follow-up split
- IMPL-EVAL PASS on code; `close-gate` CI failed on 6 unchecked #257 acceptance boxes (evaluator §9
  had misread the close-gate as "PR body has a closing keyword"; corrected in the re-dispatched #558
  prompt and to fold into the standing template).
- 5 boxes carry real A1+eval evidence → checked (F-5, F-6, keyed remount, sandbox provably
  un-bypassable, check/lint). `gate:e2e` is genuinely **UNBUILT** (packages/cli/e2e has zero `ui:add`
  coverage) → NOT falsified (avoids the #260 antipattern). Split to follow-up issue **#561**
  (test(cli-e2e) scaffold.runtime `ui:add` coverage), deferred from #257 as a non-merge-gate for the
  island.
- `check-close-gate.ts` → **close-gate PASS rickylabs/netscript#550**. Merge gated behind #463
  (charter upstream-first).

### #463 (AI FAI-7 MCP pooling primitive) — dispatched to WSL Codex (Tier-D)
- Upstream AI-stack primitive (charter line 67: #463 before #257/#379). In the PLAN-EVAL-approved plan
  (row AI-463, Lane D/Codex-high) — implementation dispatch authorized, no separate PLAN-EVAL needed.
- Launched via `.llm/tools/agentic/launch-codex-slice.ts` (brief validated `use harness`+`## SKILL`;
  push-safety gate; CRLF-stripped stage). Daemon healthy (0.142.5, managed, 0 active procs at launch).
- Worktree `/home/codex/repos/netscript-463-mcp`, branch `feat/463-ai-mcp-pool` @ base **c9a703bf**
  (origin/main post-wave-1), NO upstream by design (explicit-refspec push mandated in brief).
- Thread **`019f3b96-0f41-7a30-9759-f0d84d3878d6`** — daemon-managed, mobile-visible (newest rollout
  matches). Steer same thread only: `codex exec resume 019f3b96-0f41-7a30-9759-f0d84d3878d6 -- "…"`.
- Brief `slices/463/implement.md` (5635B staged, all 7 sections incl. `## SKILL`). Scope: multi-server
  pool keyed by id over existing StdioMcp/StreamableHttp transports (pool, not rewrite), keep-alive
  across turns, tool-name prefixing, `ui://` extraction to the render-ui seam, `@netscript/ai/mcp`
  export, `gate:jsr` (doc-lint + publish dry-run). IMPL-EVAL is a separate OpenHands session after.

### #463 (FAI-7 MCP pooling) — Codex slice landed, A1 PASS, IMPL-EVAL dispatched (2026-07-07)
- Codex thread `019f3b96` completed its turn (688s, idle). Commit **39f50c2b** pushed; **draft PR
  #562** open ("feat(ai): add MCP transport pool", `Closes #463`, `Part of #238` no-keyword-on-epic).
- Files: `packages/ai/mcp.ts` (barrel +25/-9), `packages/ai/src/mcp/application/pool.ts` (+341, the
  `McpTransportPool`), `packages/ai/tests/mcp_test.ts` (+169). Codex gate evidence (wrapper-backed):
  check / scoped check+lint+fmt / doc-lint (`./mcp.ts` total=0) / `publish --dry-run` (no
  `--allow-slow-types`) all PASS; 78 + 11 tests; no `deno.lock` diff; no new casts. Verdict
  `READY_FOR_IMPL_EVAL` (did NOT self-certify).
- **A1 slice review (Tier-A supervisor) = PASS** — substantive read of `pool.ts` + barrel confirmed a
  real impl: keyed `Map<serverId,transport>` (dup id throws), pool `implements McpTransportPort`
  (drop-in), keep-alive proven by `connectCount===1` test, `${serverId}__${remote}` prefixing with
  collision guard, data-only `ui://` `{uri,src,…}` extraction + standalone `extractMcpUiResources`,
  pools OVER existing transports (not a rewrite), no casts. Sign-off comment posted PR #562
  (issuecomment-4901591066).
- **A1 carry-forward (non-blocking) → folded into IMPL-EVAL prompt:** `withUiResources` parses
  `McpToolResult.content` as a JSON string; IMPL-EVAL check 5 must confirm the real stdio/HTTP
  transports actually put a JSON string in `.content` (else `ui://` extraction is a prod no-op =
  FAIL_FIX).
- **IMPL-EVAL dispatched** (OpenHands qwen-3.7-max, verdict-first, iterations 1500) →
  issuecomment-4901593055. Verdict target file `evaluate-463.md`. Merge held until PASS; #463 is
  upstream of #257(#550)/#379.

### Merges — #463 + #558 landed; #550 unblocked (2026-07-07, owner re-granted merge-on-green)
- Owner re-confirmed merge-on-green for this session (post-compaction grant re-issued).
- **#463 (PR #562) MERGED** — squash + delete-branch; issue #463 auto-CLOSED. Upstream MCP pooling
  primitive is now on `main`. IMPL-EVAL PASS (issuecomment 08:17Z) + all CI green (close-gate,
  scaffold-runtime, quality, check-test).
- **#558 (PR #558 / #494) MERGED** at 08:33:26Z — squash + delete-branch; issue #494 auto-CLOSED.
- **#550 (#257 McpUiWidget) unblocked + branch-updated to main.** Its `close-gate` check was a stale
  FAIL from run 28813223785 (pre-dating the #257 box edits + `gate:e2e`→#561 defer). Ran
  `gh pr update-branch 550` → rebases in the #463 pool + triggers fresh CI (close-gate should now
  PASS). Awaiting green, then merge (grant active).
- **Next unblocks:** #379 (FA4 createMcpAppCallHandler) deps = #257 + #463 — #463 done, #379 becomes
  dispatchable once #550 merges. PM-0 #511 independent (queued). #561 = backlog follow-up (ui:add e2e).
- Housekeeping TODO: remove merged WSL worktree `netscript-463-mcp` (branch deleted).

### AI-stack W2 dispatched — #379 + #258 (2026-07-07, owner "proceed with remaining items")
W1 fully landed (#494, #463, #257 all merged). W2 = the two slices whose deps are now all on main.

- **#379 (FA4 `createMcpAppCallHandler`)** — deps FA3 #252 + E5 #244 + FB4 #257 all MERGED. Lane D
  (Codex, its planned lane). Worktree `/home/codex/repos/netscript-379-callroute`, branch
  `feat/379-mcp-app-call-handler` @ b5d09693, upstream NONE (push-safety gate passed after unset).
  Thread `019f3bca-26fc-7ff2-b857-35ad2af07159` (started 10:55Z). Brief: sibling route factory to the
  merged FA3 `createMcpSandboxHandler`; consumes the #463 `McpTransportPool` (not re-hand-rolled);
  same-server allowlist re-enforced server-side; stdio warm-client fallback; OTel `mcp.tool.call`
  span continuing the browser trace; gate:jsr (no --allow-slow-types) + arch:check.
- **#258 (FB5 fresh-ui generative-ui-renderer)** — deps FB0 #253 + E4 #243 both MERGED/`[x]` in the
  #238 DAG. Worktree `/home/codex/repos/netscript-258-genui`, branch
  `feat/258-fresh-ui-genui-renderer` @ b5d09693, upstream NONE. Brief: recursive JSON-tree renderer
  consuming E4's `render_ui` schema; curated 3-category vocabulary (layout/viz/data) mapped 1:1 to
  fresh-ui primitives; **security-critical depth guard + tag whitelist guard** with NON-deferrable
  unit regressions; extends the existing `ai` collection; gate:e2e (scaffold.runtime) deferrable via
  follow-up if a separate lift (guard unit tests are not).
- **Both:** draft PR, `Closes #N`, `Part of #238` (no keyword on epic), milestone `0.0.1-beta.6`,
  explicit-refspec push, no deno.lock mutation, no new casts, READY_FOR_A1_REVIEW marker (no
  self-certify).
- **Next unblock:** #464 (FAI-2 e2e --mcp, the LAST AI-stack merge gate) becomes dispatchable once
  #379 + #258 merge.

### DRIFT — #258 lane override B→D (2026-07-07)
plan.md row 44 assigns #258 to Lane B (Opus 4.8 high) as a design-sensitive fresh-ui UI slice.
Overridden to **Lane D (WSL Codex)**. Rationale: (1) Lane B (Opus) is weekly-limited until Jul 11 and
the Anthropic budget is on life-support until Saturday; (2) the owner explicitly directed resuming WSL
Codex dispatch and extreme token caution. Quality mitigation: the security-critical depth/whitelist
guards are specified as HARD non-deferrable unit regressions in the brief, and this slice gets a
mandatory adversarial Codex review before IMPL-EVAL (per the adversarial-impl-review rule). Severity:
moderate (lane reassignment, scope unchanged).
