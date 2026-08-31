use harness

# Slice: default open-model routing → GLM 5.3 Flash / Qwen 3.8 Flash

Issue #1791. Branch `chore/agentic-open-evaluator-routing`. Base `main` at
`a3ddcbb598f81180437e06f743e24d6ef137b101`. PLAN-EVAL: N/A per owner decision (prospective
infrastructure/config work). IMPL-EVAL is mandatory: separate opposite-family session, exact head.

## SKILL

Load `.agents/skills/netscript-harness` (harness workflow, gates, worklog discipline),
`.agents/skills/netscript-deno-toolchain` (model/version/config-authority conventions — this slice
edits the single source of truth for volatile model ids), and `.agents/skills/netscript-pr` (branch
already created, PR #TBD to be opened by you per that skill's process — labels/milestone/closing
keyword). Read `.llm/harness/workflow/lane-policy.md` fully before touching any routing binding.

## Why

Native Fable 5 IMPL-EVAL has repeatedly hit monthly spend limits this milestone. The sanctioned
OpenRouter fallback (`deepseek/deepseek-v4-flash-0731` for IMPL-EVAL, `qwen/qwen3.8-max` for the
complex-implementation review pairing) required three transport attempts across #1774's evaluation
before delivering a qualifying verdict — two attempts via the Claude-print transport ended with an
empty completion despite genuine tool use; a third via the hybrid/OpenCode transport eventually
delivered `PASS`, and the owner promoted an effort-`high` run as qualifying rather than continue
chasing the bound effort-`max`. The owner has selected a new default open-model pairing to replace
this fragile chain.

**Both ids independently verified live against the OpenRouter catalog before this leaf was
authorized** — do not re-litigate their existence, but do verify them again yourself as part of your
own research phase, since routing changes are exactly the class of change that must never rest on an
unverified claim:

- `z-ai/glm-5.3-flash` — new default for `formal_impl_evaluation` and the hybrid delegation default,
  effort `max`.
- `qwen/qwen3.8-flash` — new conditional PLAN-EVAL OpenRouter route, effort `max`. No `-next`-suffixed
  variant exists in the catalog; "Qwen3.8-Flash-Next" wording resolves to this plain id.

**Known hazard, must inform your canary design:** GLM-family models are reasoning models. A prior
host report observed `z-ai/glm-5.3-flash` returning HTTP 200 with **empty content** when the request's
output-token budget was too low (~10 tokens) — the reasoning tokens alone consumed it. Any canary or
live probe for this model MUST request a generous output budget (>=300 tokens) and MUST assert the
response is non-empty; a 200 status is not sufficient evidence of a working route.

## Scope

1. **`config/models.ts`** — update the allowlist/default/evaluator model-id constants to the two ids
   above. Old DeepSeek V4 Flash 0731 / Minimax M3 / Qwen 3.8 Max preset ids must remain **accepted for
   historical/persisted record deserialization only** (existing run artifacts, evaluator logs, etc.
   reference them) — never canonically selected for new routing decisions going forward.
2. **`runtime/provider-profiles.ts`** — add two new presets: `claude-evaluator-glm-5-3-flash` and
   `claude-evaluator-qwen-3-8-flash`, modeled on the existing `claude-evaluator-deepseek-v4-flash-0731`
   / `claude-evaluator-qwen-3-8-max` shape (`profileId: 'claude-openrouter'`, correct `model`,
   `effort: 'max'`, `purpose: 'evaluation'`, `agenticTurn`, `transport`).
3. **`runtime/routing-policy.ts`** — update the `formal_impl_evaluation` and `formal_plan_evaluation`
   OpenRouter bindings to the new presets. **Remove the DeepSeek-small/Qwen-complex split** — the
   `COMPLEX_FORMAL_IMPL_EVALUATOR_PRESET` (Qwen 3.8 Max) distinction is superseded by this single
   GLM/Qwen pairing; consolidate accordingly. Update `CANONICAL_ROUTE_POLICY` entries and any
   `condition` fields that referenced the old split.
4. **`hybrid-delegation.ts`** — `HYBRID_DELEGATION_DEFAULT_MODEL` → GLM 5.3 Flash preset id;
   `HYBRID_DELEGATION_MODEL_IDS` allowlist widened to include both new ids (keep old ids in the type
   union only if needed for historical deserialization — check actual usage before deciding); default
   effort → `max`.
5. **`remote-model-launcher.ts`** — default model/effort → GLM 5.3 Flash / `max`.
6. **Evaluator model guard** (`startEvaluatorModelGuard` in `claude-print.ts` or wherever the
   open-model allowlist lives) — approve both new ids.
7. **`deno.json`** — there are currently **two** `"agentic:claude-openrouter"` task entries (one
   binding `remote-model-launcher.ts`, the interactive gateway; one binding `openrouter-run.ts`, the
   formal print-turn transport). The second silently shadows the first in JSON parsing, making the
   gateway alias **unreachable**. Keep the formal `openrouter-run.ts` binding under
   `agentic:claude-openrouter`; rename the gateway task to a distinct name (e.g.
   `agentic:claude-openrouter-gateway`) so both are reachable, and update every doc/reference that
   assumed the old (broken) dual-binding.
8. **`runtime/preset-canary.ts`** — the Claude argv it builds for a canary probe does not currently
   pass `--effort`, so a canary cannot attest that `max` was actually used versus merely requested.
   Add it, and thread the attested effort through to the canary's recorded result.
9. **Docs/tests to update for parity, not just prose:**
   - Canonical routing tests (whatever asserts `routing-policy.ts` bindings).
   - `routing-state` (if a generated/checked snapshot exists — check for one).
   - The canary matrix (whatever enumerates presets to probe).
   - `.llm/tools/agentic/README.md`.
   - `.llm/harness/workflow/lane-policy.md` (the prose table must match the code bindings exactly —
     there is likely a policy/doc-parity assertion test; if not, that gap is itself worth flagging in
     drift, not silently left).
   - The evaluator protocol doc (PLAN-EVAL/IMPL-EVAL cycle vocabulary/routing doc — locate it).
   - `AGENTS.md`, `ROLLOUT.md` (repo root).
   - Source skills under `.agents/skills/` that reference the old default model or preset ids, then
     run the canonical sync so `.claude/skills/` mirrors match byte-for-byte — **never hand-edit the
     mirrors directly.**
10. **OpenHands workflow/labels** — update whatever routes OpenHands dispatch to Qwen Flash for
    PLAN-EVAL-class work and GLM Flash for IMPL/default work. **State honestly, in both the workflow
    comment/label text and this leaf's docs, that OpenHands cannot currently attest reasoning effort
    until its adapter exposes that capability — do not claim `max` for OpenHands anywhere.** This is a
    stated limitation, not a defect to work around.
11. **Preserve legacy preset deserialization** — any code path that reads a persisted run artifact,
    evaluator log, or routing-state snapshot referencing the old preset ids must still parse without
    throwing. Add/keep a test proving this.

## Non-Scope

- Retroactively re-gating #1774/PR #1775, which is already merged on the prior routing.
- OpenHands effort attestation implementation — explicitly deferred pending upstream adapter support;
  document the limitation, do not attempt to work around it.
- Any change to Claude-family (Fable/Opus/Sonnet) routing or the native Codex/Claude opposite-family
  evaluator pairing — this slice only touches the OpenRouter open-model layer.

## Gates (all required; structured wrappers per `.agents/skills/netscript-tools`)

- Full `.llm/tools/agentic` test/check/lint/fmt (structured wrappers, not raw `deno test`/`deno fmt`).
- `deno task agentic:sync-claude` / `agentic:check-claude` — skill mirrors byte-identical to sources.
- Whatever policy/doc-parity assertion exists (or is added) confirming `lane-policy.md` prose matches
  `routing-policy.ts` bindings exactly.
- Workflow syntax/static tests (for the OpenHands workflow file changes) — `actionlint` or equivalent
  if checked in; if none exists, at minimum valid YAML parse plus the repo's existing workflow lint.
- `no-hardcoded-volatile_test.ts` (or equivalent) stays green — no model-id string literal appears
  outside `config/models.ts` and the generated/checked-in config surfaces it exports through.
- `deno.lock` unchanged (`--no-lock` on every hook/canary invocation as elsewhere in this codebase).
- **Live canaries, run only after implementation, with a real credential sourced without printing it**
  (`GITHUB_TOKEN`/`OPENROUTER_API_KEY` pattern already established in this repo — never `cat` or log
  the credential file): for BOTH new presets, request >=300 output tokens, require a non-empty
  response, and record route attestation (tools/reasoning/streaming support) in the run worklog.
- A fresh, opposite-family, separate-session IMPL-EVAL for **this** slice may dogfood the new GLM/max
  route once implementation is complete and canaries pass — record that choice explicitly if made,
  since it is this leaf's own product being used to evaluate itself, and say so plainly rather than
  let it look like an independent route by default.

## PR

Open PR against `main`, `Closes #1791`, taxonomy labels (`type:chore`, `area:agentic`,
`area:tooling`, exactly one `status:`), milestone `0.0.7`, PLAN-EVAL noted N/A per owner decision.
Record thread id, worktree path, and route identity (requested vs. observed provider/model/effort) in
`worklog.md` per standing harness practice. Do not merge — hand the supervisor an exact-green packet
on IMPL-EVAL `PASS`.
