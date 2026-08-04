# Drift log — docs-mainpages--orchestrator

- **D-1 (owner override, 2026-08-04).** #1209 finishing lane switched from agy
  (plateaued after 3 rounds — round-3 diff identical to round 2) to the **Claude-workflow
  documentation-authoring exception** (CLAUDE.md § Documentation-authoring exception).
  Validation stays opposite-family (Sol `docs_audit`).
- **D-2 (owner override).** Charter A lanes are owner-routed, not the default
  `documentation_authoring` lane: Sol·low ⇄ agy gemini-3.6-flash·high adversarial generator
  pair; final evaluator + polish OpenCode · Grok 4.5 max (overrides `docs_polish` Fable route).
- **D-3 (owner correction, on record at launch).** Inherited PR #1209 contains AI slop: an
  auth block force-fitted into the live-dashboard tutorial with no preceding auth step.
  Corrected bar: **narrative consistency over feature checklists**; homeless features route to
  #1210 deep-dives; slop-audit the diff before any further authoring.
- **D-4 (owner correction).** Orchestrator effort is LOW; two prior launches came up high
  against instruction. Confirmed in supervisor.md.

## Slop-audit of PR #1209 diff (f7558aa1c..38009a962), 2026-08-04

Confirmed findings:

1. **Auth force-fit (owner's finding, verified).** `live-dashboard/04` Step 2 injects
   `resolveAuthSession(ctx.headers)` / `@app/lib/auth.ts` / `auth.tenantId` / 401 throws into a
   tutorial whose earlier chapters never scaffold auth or tenancy. No `@app/lib/auth.ts` exists
   in the tutorial's app. Numbered feature-checklist comments (`// 1. Cross-layer
   Request-Dedup…` … `// 5. Partials & Deferred-Loader composition`) are checklist slop, not
   narrative.
2. **Contract regression.** The rewritten `ordersData` resource drops the `status` filter that
   Step 1's route contract defines, replacing it with the invented `tenantId` — the page no
   longer honors its own contract.
3. **Good prose deleted.** The `definePage` builder apiTable and the honest "this is the dense
   part — and it earns its weight" callout were deleted and replaced with generic feature tour
   prose.
4. **Unverified APIs.** `dehydrateQueryClient` / `hydrateFromDehydrated` /
   `getIslandQueryClient` / `createNetScriptQueryClient` / `ordersQueryUtils.updateStatus`
   (was `.update`) / `baseQueries.orders.getStats` / `baseQueries.orders.updateStatus.mutate`
   must be verified against `deno doc` before any of it survives.
5. **Lock hygiene.** `deno.lock` gains `jsr:@netscript/queue@0.0.4` (+1 line) in a docs PR —
   drop unless the type fixture genuinely requires it.
6. **Measured gaps stand.** traces 0 occurrences; withForm 1 (token); Partials 1 (token); no
   out-of-scope note on the PR for workspace/erp-sync tutorials.

- **D-5 (blocked launch, 2026-08-04 10:32).** agy S1 launch failed: "Individual quota
  reached… resets in 1h38m". Judged by artifact (`agy-launch.json` status ERROR, no
  outline-agy.md). Codex half of the pair delivered `outline-codex.md` (34KB). Retry
  scheduled ~10:35+105min; the adversarial cross-critique waits for the agy artifact —
  the pair protocol is not degraded to single-generator without owner say-so.

- **D-6 (owner exception, 2026-08-04).** Owner reviewed PR #1209 change 5d75c07f (the 0.0.5
  orchestrator's gate-driven removal of the package-scoped type fixture from the docs lane)
  and granted an explicit exception: the fixture is genuinely useful and may live at
  packages/fresh/tests/type-fixtures/. Restored at 2706fdb53's content, re-verified green,
  pushed as e6ba61690. Lock churn kept out (deno.lock reset to HEAD before commit). The
  docs-lane no-packages boundary otherwise stands; permanent fixture tooling still routes
  to #1210.

- **D-7 (owner override, 2026-08-04 ~11:15).** agy quota block persists; owner directed
  replacing the blocked pair half with "codex or claude opus sub agent". Since Codex authored
  outline-codex.md, the rival lane is a **Claude Opus subagent** (keeps the pair cross-family).
  Scheduled agy retry killed; Opus subagent dispatched blind to the Codex outline, writing
  outline-opus.md.

- **D-8 (blocked launch, 2026-08-04 ~12:00).** The owner-directed S5 evaluator lane
  (OpenCode · Grok 4.5 max) is down: `opencode run` returns "Unexpected server error"
  (refs err_03f344ae / err_dd874a3b / err_0c20fb8f) for the full brief, without --variant,
  and for a trivial probe alike — transport failure, not brief-related. The agentic wrapper
  additionally crashes on an internal Node assert. S5 waits for owner fallback direction
  (precedent D-7 suggests a Codex/Opus substitute is acceptable, but S5 was owner-routed to
  Grok explicitly — not substituting without say-so). Sol docs_audit (S6) proceeds in
  parallel; it does not depend on the polish verdict.

- **D-9 (lane correction, 2026-08-04).** Planned "Sol docs_audit" for PR #1216 was wrong:
  the pages are Codex-authored, so opposite-family review is Claude-family
  (`review_codex` ladder), which the Opus FIX_FIRST review already performed. Final audit
  runs on Opus (Claude family), not Sol. The launcher's duplicate-sender guard on
  ns-mainpages surfaced this before a same-family audit happened.

- **D-10 (owner fallback, 2026-08-04).** Owner directed Kimi K3 as the S5 fallback. OpenCode
  transport remains down for Kimi too (err_a96367fc — transport-level, model-agnostic), so S5
  runs Kimi K3 (`moonshotai/kimi-k3` · high) over the proven claude-openrouter transport
  (`claude-print`). Same brief and artifact path (slices/mainpages-s5/grok-eval.md name kept
  for continuity of the slice, content authored by Kimi).

- **D-11 (owner redirect, 2026-08-04 ~12:15).** Kimi K3 is unavailable on OpenRouter via
  claude-print (404 model not found). Owner redirected S5 to Gemini (agy) as its quota resets.
  S5 evaluator: agy · gemini-3.6-flash · effort high, same brief; artifact
  slices/mainpages-s5/gemini-eval.md. Opus final audit (D-9) continues unaffected.

- **D-12 (owner correction, 2026-08-04).** Gemini's S5 praise wording ("elite",
  "exceptionally fair", "massive upgrade") is itself AI slop — hollow superlatives with no
  information content. Corrected weighting: an evaluator's praise is noise; only its concrete,
  checkable adjustment proposals count, and ship-confidence rests on executed-evidence audits
  (the Opus audit that ran the scaffold), never on flattering verdict prose. Do not relay
  evaluator praise in PR comments or reports.

- **D-13 (owner addition, 2026-08-04).** Owner added a dedicated anti-slop / terminology /
  consistency prose gate on #1216: Minimax M3. OpenCode transport still down (err_be8ff72e on
  a trivial probe), so M3 runs over claude-print (OpenRouter), effort high — an approved open
  model on the proven transport. Merge of #1216 waits on this pass + CI settle.

- **D-14 (owner correction, 2026-08-04).** The M3 anti-slop pass was word/terminology-level
  only; owner requires WHOLE-text review — page-level prose architecture, full-set
  consistency, syntactic craft, structural AI tells — on **Qwen 3.7 Max at highest effort**.
  S8 launched over the new agentic:claude-openrouter transport (its first production use),
  effort max. #1216 merge waits on S8 + CI.

- **D-15 (owner rejection + remap, 2026-08-04 afternoon).** Owner reviewed the merged #1216 set:
  REJECTED. Root causes owned by the orchestrator: (a) the synthesis swapped one feature
  (CRUD) for another (saga, a plugin) instead of presenting the meta-framework; (b) the
  condemned architecture-overview diagram survived on concepts; (c) seven review passes gated
  accuracy, none gated the thesis. Corrected bar (owner verbatim intent): enterprise-grade
  entry point for experienced devs, stakeholders, tech enthusiasts; TRUE to NetScript the
  meta-framework; storyline + cross-linking; meaningful good-looking diagrams AND code
  snippets; quality parity with the inner site. Remap authored BY THE ORCHESTRATOR ITSELF
  (owner instruction "revamp that yourself") on branch docs/main-pages-remap: homepage
  presents the contract-carried-end-to-end principle with a new contract-flow Mermaid→SVG
  diagram and a 3-tab contract→service→page code moment mirroring the site's verified
  examples; concepts loses the giant diagram, gains the focused aspire-resource-graph on
  layer 5; quickstart rebuilt with promise → scaffold-anatomy → dashboard payoff → honest
  first change; why reframed around what a meta-framework changes. Owner-ordered adversarial
  pass: Sol · HIGH (explicit effort override on resume) against the owner's exact criticisms.

- **D-16 (owner lane instruction, 2026-08-04 evening).** Authoring lanes for all further
  docs work: **agy · gemini-3.6-flash · high** and **Codex · GPT-5.6 Sol · medium** as the
  writing sub-agents; the orchestrator (Fable 5 · low) stays orchestrator + validator/evaluator
  and does not author. Supersedes the Opus docs-exception authoring used for #1222/#1241/#1272.
  Opposite-family review invariant unchanged: a Codex-authored page is reviewed Claude-family
  or by agy; the orchestrator owns the final gate.
