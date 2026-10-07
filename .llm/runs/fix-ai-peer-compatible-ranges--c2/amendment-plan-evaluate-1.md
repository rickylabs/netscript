# Amendment PLAN-EVAL — AI peer correction plan (issue #2036 / PR #2087)

- Evaluator session: independent GLM max (opencode-go/glm-5.3-flash), 2026-10-08. Owner-directed route
  per brief ("Owner route GLM max"); generator family (gpt-6.1-sol lane record) differs — session and
  vendor-family separation satisfied.
- Run: `fix-ai-peer-compatible-ranges--c2`
- Plan under evaluation: the amendment ("AI peer correction plan"), both as the private
  `amendment-plan.md` and as the appended section in the run `plan.md` at `13c0256bf`
- Surface / archetype: Archetype 2 integration (source dependency tooling); packages/ai +
  packages/fresh + packages/fresh-ui lock; no scope overlays
- Mode: PLAN-EVAL only. Implementation hard stop honored. No branch switch, no history/source/config/
  lock/public-metadata change, no delegates/inference, no CI polling or sleeps, no broad
  implementation reruns.

## Immutable source identity

| Item | Value |
| ---- | ----- |
| Immutable AI source commit (per brief) | `76381639db9061222c517e2260d91daab1473ae3` — "docs(harness): record independent AI peer resolution pass" (records the original IMPL-EVAL PASS; **superseded for the amended scope**) |
| Evaluated AI source tree | `b03385dc31cfee4df098639d5c22cd616db38d00` — "fix(ai): reject peer-incompatible published adapter resolutions" |
| Original plan commit | `13f74a54574a54b2eca30068643f27e46e8ef229` |
| Original evaluator briefing commit | `987048499e80d42b8f8aa65905d8f8558c818672` |
| Amendment plan commit | `13c0256bf755152e88151998f9ed30a72ea4caf3` (private evidence + run-dir plan/worklog/drift only) |
| Baseline (main) | `872df8e21e0a8bf06cd0796c7808068dd67e2c4e` |
| CI head of the failing run (receipt in ci-fresh-ui-failed.log; not retrievable from this object store) | `f2bbce3e8341a9959380b8e63a2cf686d675f7f7` |
| Checkout state during evaluation | Session started with the shared checkout holding the worker plan branch (`fix/worker-job-cancellation` @ `6d6bca2cd`, clean); a concurrent lane switched it to `fix/ai-peer-compatible-ranges` @ `13c0256bf` mid-session. **This evaluator performed no branch switch and no writes to tracked source**; every load-bearing read used `git show` against the immutable commits above, so all findings are checkout-state independent. |

## Upstream registry verification (npm stable channel, queried 2026-10-08, evidence kept private)

| Package | npm `latest` | Proposed | Match | AI-core peer at proposed version (meta) | Other peers/deps relevant to coherence |
| ------- | ------------ | -------- | ----- | --------------------------------------- | -------------------------------------- |
| @tanstack/ai | 0.65.1 | 0.65.1 | yes | peers only `@opentelemetry/api >=1.9.0` (optional) | deps: @tanstack/ai-utils ^0.4.1, @tanstack/ai-event-client ^0.13.1, @ag-ui/core 1.0.0, partial-json, fast-json-patch, @standard-schema/spec |
| @tanstack/ai-anthropic | 0.19.5 | 0.19.5 | yes | `^0.65.0` (required) | peer `@anthropic-ai/vertex-sdk ^0.19.0` (**optional**); deps @anthropic-ai/sdk ^0.97.1, @tanstack/ai-utils ^0.4.1 |
| @tanstack/ai-openai | 0.27.0 | 0.27.0 | yes | `^0.65.0` (required) | deps openai ^6.41.0, @tanstack/ai-utils ^0.4.1, **@tanstack/openai-base ^0.12.4** |
| @tanstack/ai-mcp | 0.8.0 | 0.8.0 | yes | none | dep `@tanstack/ai ^0.65.0` (dependency, not peer — plan states this correctly); deps jose, @modelcontextprotocol/client ^2.0.0, @modelcontextprotocol/server ^2.0.0 |
| @tanstack/ai-preact | 0.20.0 | 0.20.0 | yes | `^0.65.1` (required) | peers preact >=10.11.0, `@mcp-ui/client ^7` (**optional**); dep @tanstack/ai-client ^0.38.0 |
| @tanstack/openai-base | 0.12.4 | 0.12.4 | yes | `^0.65.0` (**required**) | deps openai ^6.41.0, @tanstack/ai-utils ^0.4.1 |
| @tanstack/ai-client | 0.38.0 | 0.38.0 | yes | none | dep `@tanstack/ai ^0.65.1` |

Verified derived facts:

1. **The proposed family is the current npm stable-channel latest for every member** and is
   internally coherent: all AI-core peers (`^0.65.0`; preact's tighter `^0.65.1`) are satisfied by
   the single pinned core 0.65.1; mcp 0.8.0 and ai-client 0.38.0 consume the core via dependencies,
   which dedupe to 0.65.1 — the guard's exact-one-core enforcement therefore can and should hold.
2. **The only required transitive core peer in the new family is `@tanstack/openai-base@0.12.4 →
   ^0.65.0`**, satisfied by the pinned core. This is exactly the package class the first guard
   omitted.
3. **No new required peers versus the currently pinned family**: core's `@opentelemetry/api >=1.9.0`,
   anthropic's `@anthropic-ai/vertex-sdk ^0.19.0`, and preact's `@mcp-ui/client ^7` are all optional
   (peerDependenciesMeta) and were already declared at the currently pinned versions
   (0.52.3 / 0.18.3 / 0.14.4 register the same optional peers). Current locks resolve without them;
   status-quo absence is the safe default and does not force manifest changes.
4. **The old-family incoherence is real and unfixable by pins alone**: `ai-openai@0.22.3` depends on
   `@tanstack/openai-base` (recorded in the fresh-ui private lock at `b03385dc3`), and
   `openai-base@0.10.16` requires core `^0.59.0` as a required peer against pinned 0.52.3
   (ci-fresh-ui-failed.log peer-warning tail). The second CI failure (frozen-mode
   "Fresh UI private lock is stale") is independently recorded in the same receipt. Upgrading the
   family is the correct minimal repair; expanding the guard is the correct durable fix.

## Source-tree verification (git show @ `b03385dc3`, corroborating the amendment's claims)

- Guard selection bug confirmed: in `.llm/tools/deps/check-ai-peers.ts` both the manifest declaration
  scan (`name === '@tanstack/ai' || name.startsWith('@tanstack/ai-')`) and the cold-resolution
  adapter selection (`packages.filter(name.startsWith('@tanstack/ai-'))`) exclude
  `@tanstack/openai-base`; the cold single-core check is sound but the peer sweep never saw the
  transitive holder. Amendment claim verified.
- `.llm/tools/deps/check-ai-peers_test.ts` covers only the exported `findAiPeerConflicts` policy
  function; the buggy selection layer is unexported and untested. The amendment's
  "existing policy test or new graph-selection regression" **or**-choice is therefore live.
- Pins at plan time are unchanged (0.52.3-family: packages/ai ai/anthropic/mcp/openai; packages/fresh
  ai/ai-preact); the amendment branch contains plan docs only — no premature implementation.
- packages/fresh-ui private lock carries the AI-family edges (including 2 openai-base occurrences)
  with stale `~`-range specifiers and 0.52.0 core keys — consistent with "Fresh UI private lock
  stale" and with the selective-refresh requirement spanning root + fresh-ui.
- Existing debt row `ai-doc-private-ref-baseline-2036` (F-7 doc-lint, packages/ai) is open in
  `.llm/harness/debt/arch-debt.md`; this wave re-touches packages/ai, so IMPL-EVAL must adjudicate
  F-7 against that row again. The retained plan text ("Existing doctrine/debt applies") covers it;
  the amendment need not restate it, but the IMPL-EVAL must not silently re-run doc-lint as green.

## Checklist results (plan-gate, box by box)

| Plan-Gate item | Result | Evidence / location |
| -------------- | ------ | ------------------- |
| Research present and current | PASS | `research.md` present (run dir + evidence copy); amendment re-baselines against the newer CI evidence that supersedes the evaluated tree and says so explicitly; spot-checks this session confirmed the guard bug, pin state, transitive openai-base edge, and npm metadata above. |
| Decisions locked | PASS | Exact family named with rationale ("Pins alone cannot freeze future transitive patches" — verified fact 4); guard policy locked (every AI-core peer holder regardless of name prefix + exactly one core); lock policy locked (selective refresh, preserve unrelated versions, no new advisory baseline); bridge adaptation bounded to the owning bridge; causal mutations required. All seven versions independently verified as the coherent latest (facts 1–3). |
| Open-decision sweep | PASS (by evaluator sweep; see below — the plan omits its own list, folded into required fix 3) | No rework-forcing open decision found. |
| Commit slices (< 30, gate + files each) | **FAIL** | The amendment enumerates no slices; the retained S1–S3 describe the first round and do not enumerate the amendment round's work (guard selection rewrite, selection regression + mutations, dual-lock selective refresh, possible bridge adaptation, docs). |
| Risk register | **FAIL** | No explicit amendment risks with mitigations (upstream API drift, selective-lock drift, optional-peer treatment, guard cost) — only the first round's release-acceptance risk line remains. |
| Gate set selected | PASS | Retained plan "Gates" paragraph + amendment sentence: frozen provider/Fresh/FreshUI checks, provider suite, production bundles, quality/JSR/publish gates, causal mutations, IMPL-EVAL. Archetype-2 required consumer-import validation is covered by the cold guard + frozen checks; runtime/Aspire optional and untouched. |
| Deferred scope explicit | PASS | "no release claims"; "Refs #2036 until a fixed published consumer exists"; fresh independent IMPL-EVAL on final source after PASS; no merge/publish on plan approval. |
| jsr-audit (package/plugin waves) | **FAIL** | A package wave is in play and the amendment's own premise is a multi-upstream API upgrade (reversing the original plan's "exact pins avoid a framework/API upgrade decision" N/A basis), but the jsr-audit publishability rubric is not applied and no slow-type/surface risks are named before slicing. |

## Open-decision sweep (evaluator-run)

- **Regression host** ("existing meaningful policy test or new graph-selection regression"): safe to
  defer to implementation, but only with the invariant stated — a causal mutation of the graph
  *selection* step can be killed by nothing except a test exercising selection, so the mutation
  requirement itself forces selection coverage regardless of host. The plan currently allows an
  implementation to satisfy it with a policy-only test + policy-only mutation, which would green a
  still-buggy selector. Recorded as required fix 4.
- **Optional unmet peers** (`@anthropic-ai/vertex-sdk`, `@mcp-ui/client`): safe to defer — verified
  optional, already declared at current versions, current locks resolve without them; frozen checks
  detect any forced change. Status-quo absence is the safe default.
- **Selective-lock refresh mechanism**: safe to defer — contract (only required graph edges,
  preserve unrelated versions, no new advisory baseline), detector (frozen provider/Fresh/FreshUI
  checks), and precedent (round-1 restore of non-AI entries recorded in the run drift.md) all exist.
- None found that would force rework when deferred.

## Verdict

`FAIL_FIX` (Plan-Gate FAIL_PLAN analog — plan fixable; **no implementation may begin until the
amendment text below is applied and, if the material design changes further, the amendment loop is
re-run**).

### If FAIL_FIX — required fixes (text-level; no rescope needed)

1. **Slices.** Enumerate the amendment round, ordered, each naming what it proves, its gate, and its
   files (all well under 30 files). Minimum set:
   - A1 manifest family bump — `packages/ai/deno.json`, `packages/fresh/deno.json` pins to the
     verified family; proof: package frozen check + guard registry-metadata receipts.
   - A2 guard expansion + regression — prefix-independent selection of every AI-core peer holder in
     the resolved graph plus exact-one-core enforcement in `.llm/tools/deps/check-ai-peers.ts`;
     selection-exercising regression in `.llm/tools/deps/check-ai-peers_test.ts` (or via an exported
     selection helper) with a causal mutation kill/restore pair; proof: structured test + mutation
     receipts.
   - A3 selective lock refresh — root `deno.lock` + `packages/fresh-ui/deno.lock` AI-family edges
     only, unrelated entries preserved; proof: frozen provider/Fresh/FreshUI checks, exit 0, no new
     advisory baseline.
   - A4 bridge/API-drift adjudication + docs — inspect upstream API (core 0.52.3→0.65.1, openai
     0.22.3→0.27.0, preact 0.14.4→0.20.0 paths used by the owning bridge), adapt only owning bridge
     files if changed; update documented family and guard description; proof: provider suite,
     production bundles, quality:scan, arch:check, JSR/publish gates, doc-lint adjudicated against
     `ai-doc-private-ref-baseline-2036`.
   - A5 fresh independent IMPL-EVAL on final source.
2. **Risk register.** Add amendment risks with mitigations: (a) upstream API drift across
   core/openai/preact majors-of-minor — inspect-then-adapt owning bridge; provider suite + bundles +
   frozen typechecks prove behavior; (b) selective-lock drift — round-1 restore approach as
   fallback, frozen checks as detector; (c) peer surprises — verified optional peers permit
   status-quo absence; exactly-one-core catches accidental dual cores from the mcp/ai-client
   dependency edges; (d) guard cost — one registry query per resolved AI-peer package (bounded,
   cold mode), single structured output line preserved.
3. **Open-decision list.** Reproduce the sweep above in the plan, each item marked safe-to-defer or
   must-resolve-now (all three current items are safe to defer as stated).
4. **Mutation invariant.** State that whichever regression hosts the transitive-holder coverage, the
   causal-mutation set must include a mutation of the graph-selection step (not only of the
   peer-satisfies policy), since the policy layer was already covered by the existing test and the
   bug-live layer is selection.
5. **jsr-audit**. Apply the publishability rubric to the planned public surface and name the risks
   now: bridge re-exports/types derived from the upgraded `@tanstack/*` packages may shift
   `@netscript/ai` / `@netscript/fresh-ui` surface contracts or produce slow-types; state that
   `deno doc --lint` / publish dry-run + the jsr-audit surface scan run as IMPL-EVAL gates and that
   any surface change is re-audited before release qualification.

### Verified facts backing the amended decisions (recorded so implementation need not re-derive them)

- All seven proposed versions are the npm `latest` stable-channel versions as of 2026-10-08, and the
  family is peer-coherent on a single core 0.65.1 (facts 1–3 above).
- Required transitive peer: only openai-base 0.12.4 → `^0.65.0` — satisfied.
- No new required peers vs the current family (all three optional peers pre-exist at current
  versions).
- The 0.52.3-family pins cannot be repaired without the upgrade (required peer `^0.59.0` of
  openai-base 0.10.16 vs core 0.52.3), and pins alone cannot prevent future transitive drift — the
  guard expansion (name-independent peer-holder sweep + single-core enforcement) is the durable fix.
- Fresh/FreshUI frozen checks + dual lock refresh are the correct CI-repair surface (stale
  fresh-ui private lock receipt).

## Notes

- Process hygiene: no branch switch or history change performed; no source/config/lock/public
  metadata change; no delegates or external inference invoked; no CI polling or sleeps; registry
  verification used direct npm stable-channel metadata reads and a temporary fetch script in
  `.llm/tmp/` (removed after use); scratch evidence stays private per brief.
- The original AI source PASS at `76381639…` remains superseded for the final amended scope, as the
  brief states; it was used only as immutable identity/context, not as verdict precedent.
- After the plan fixes are applied, this amendment is expected to be re-evaluable to PASS without
  rework: the technical core (family selection, guard expansion, lock policy, gate set) is verified
  sound; only plan-completeness items (slices, risks, open-decision list, mutation invariant,
  jsr-audit naming) are missing.
- No release, merge, or publication is authorized or implied by this evaluation.
