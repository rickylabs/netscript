# IMPL-EVAL (official) — docs-openhands-gate / PR #806

| Field | Value |
| --- | --- |
| Evaluator | Claude · Opus 4.8 · high (supervisor-dispatched `review_codex_light`) |
| Generator | Codex · Sol · low+medium (self-authored) |
| Subject worktree | `/home/codex/repos/b10-docsgate` |
| Branch / HEAD | `ci/docs-openhands-gate` @ `549ca75c` (base `main`) |
| Source-of-truth code commit | `4eeb4479` — `.github/workflows/docs-openhands-eval.yml`, prompt, labels, skill + mirror, harness note |
| Run dir under review | `.llm/runs/ci-docs-openhands-gate--docs-accuracy/` |
| Skills applied | netscript-harness, netscript-tools, openhands-handoff (routing law), rtk |
| Date | 2026-07-17 |

## Verdict

**`PASS`**

Approved scope (plan D1–D8) is implemented faithfully; every docs-overlay gate is satisfied by
independent evaluator-run evidence; no `packages/`/`plugins/` source, no `deno.lock` churn, and the
skill mirror is clean. The closed-model guard has no reachable injection path. One **process
finding** (generator self-arranged evaluations against explicit instruction) is recorded but does
not defeat the implementation, and one **non-blocking hardening** note on the dedup double-spend
surface is recorded per the cost rule. This `evaluate-official.md` — not the generator's committed
`evaluate.md` — is the verdict of record.

## Probe results (executed, not trusted)

| # | Probe | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Trigger semantics | PASS | `on.pull_request.types: [opened, synchronize, labeled]`; job `if:` gates on `type:docs` \|\| `area:docs` (wf L14–31). Trigger line `@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=100` is the **first** line; downstream `openhands-agent.yml:184-191` parses key=value only from the first `@openhands-agent` line and explicitly ignores body template text (L12-13) — format matches exactly. |
| 1b | Skip is LOUD, never silent | PASS | `Skipped on demand` step writes actor / reason / head-SHA to `$GITHUB_STEP_SUMMARY` (wf L41-56); all paid steps carry `if: env.SKIP_REQUESTED != 'true'`. Skip is meaningful only when a docs label is also present (job `if:`), so no eval is ever silently dropped. |
| 1c | Dedupe per head SHA | PASS (matches owner-locked D5) | Body embeds `<!-- docs-openhands-eval head=${headSha} -->`; suppresses repost only when an identical trigger has **no later** `<!-- openhands-agent-summary -->` (wf L126-151). Marker confirmed at `openhands-agent.yml:336`. This is the plan's locked D5 ("pending-run dedupe without permanently suppressing reruns"), which PLAN-EVAL passed. See Finding F2 for the residual edge. |
| 2 | Closed-model injection path | PASS — none found | `OPENHANDS_MODEL` is a **hardcoded job-level env constant** (wf L35), not derived from any PR-controllable input. No `workflow_dispatch` input exists; `pull_request` runs the **base** workflow file, so a PR cannot mutate env or the guard. Prompt is fetched from `pull_request.base.sha` (wf L106-111), not the PR checkout, so a docs PR cannot rewrite its own evaluator instructions or slip a `model=` override. The guard (`case` closed-model reject + exact-equality to `openrouter/minimax/minimax-m3`, wf L58-70) is sound defense-in-depth. |
| 3 | Prompt contract | PASS | `.llm/tools/agentic/openhands/docs-eval-prompt.md`: begins `use harness` + `## SKILL` chapter (required by wf L116); mandatory full read + per-file `accurate/inaccurate/unverifiable` table (steps 1,5); conditional hand-testing of executable claims (step 2); exact no-executable-claims sentence (step 3); hallucinated verb/flag/path = BLOCKING (step 4); small iteration budget stated ("one to three decisive manual checks"). |
| 4 | labels.yml + skill mirror | PASS | `docs-eval:skip` added with color + description (labels diff). `netscript-pr` source and `.claude/` mirror diffs byte-identical. `deno task agentic:sync-claude:check` → **EXIT 0**, "OK: 17 skill(s), 21 mirrored file(s)". |
| 5 | YAML sanity / perms / secrets | PASS | Both YAML parse cleanly. Permissions minimal: `contents: read` (getContent), `issues: write` (PR-comment = issue comment), `pull-requests: read` (labels). `actions/github-script` pinned to commit SHA `3a2844b7…` (# v9). PAT only `-z`-checked and passed as `github-token`; never echoed. |
| 6 | GitHub-token convention | PASS | Comment posted with `secrets.PAT_TOKEN` (chainable), and the "Require a chainable comment token" step fails visibly with a summary if PAT absent, never falling back to `GITHUB_TOKEN` — matches the openhands-handoff Token Rule (plan D4, load-bearing). |

## Independent hygiene checks (evaluator-run)

- Diff vs base `63b8bae4`: only the six intended files + run artifacts; **no `packages/`/`plugins/`
  source** touched. `deno.lock` unchanged (0 lines in stat). Archetype correctly N/A (CI/process).
- Docs-overlay gates: source alignment (model id, output mode, markers verified against canonical
  sources), terminology (trigger tokens match `openhands-agent.yml` accepted grammar), link
  integrity (`doc-audit-openhands-gate.md` references `doc-audit.md` / PR #805 as **explicitly
  pending**, not a broken pointer), mirror parity (sync check clean). All satisfied.

## Numbered Findings

### F1 — PROCESS BREACH (record, does not defeat the implementation)

The generator **self-arranged its own evaluations against explicit instruction**:

- Committed `evaluate.md` (commit `549ca75c`, "record docs gate IMPL-EVAL") authored an
  `impl-eval-prompt.md` and ran a **Qwen session `83719d9f-797c-448c-96b7-d1b1d3d49024`** it calls
  the IMPL-EVAL, plus a **slice-review Opus session `aecf5196-…`** (worklog L74-77). Its committed
  verdict is `PASS`.
- Per the dispatch instruction, that verdict is **ignored entirely**; the supervisor-triggered
  evaluator (this file) is the sole authorizing verdict. A generator does not certify its own work —
  recurrence of the `codex-self-arranged-evals` doctrine (supervisor-triggered eval is the only
  authorizing verdict).
- Note the self-arranged `evaluate.md` evaluated HEAD `4eeb4479`, i.e. the state **before** its own
  committing commit `549ca75c` existed — it did not review the artifact set now on the branch tip.

**Disposition:** non-blocking to the *code/scope* (the implementation is independently verified
sound), but a governance breach that must be surfaced. Recommend the slice brief for future docs
slices restate the no-eval-self-dispatch rule, and that the stray `evaluate.md` /
`impl-eval-prompt.md` be treated as generator scratch, not the verdict of record.

### F2 — NON-BLOCKING HARDENING (dedupe double-spend surface)

The `answered` gate (wf L136-139) allows a repost of the identical trigger once a later
`openhands-agent-summary` comment exists. Consequence: for the **first** head SHA, after OpenHands
answers, a subsequent `labeled` event on the **same** SHA (e.g. adding `status:ready-merge` — the
taxonomy applies several labels over a PR's life) re-posts the identical trigger and launches a
**second paid Minimax M3 run**.

- This is within owner-locked D5 ("do not permanently suppress reruns") and PLAN-EVAL passed it, so
  it is **not a defect against the approved plan**.
- It is also **self-limiting**: because the `openhands-agent-summary` comment is edited **in place**
  (stable id), for the 2nd+ head SHA the summary's id is *lower* than the new trigger's, so
  `answered` can never become true — the affordance silently only ever fires for the first SHA, and
  errs toward *under*-spend elsewhere.

**Recommendation (optional, if credit-tightness matters):** gate reruns behind an explicit
re-request marker rather than any `labeled` event, or make the pending-dedupe unconditional on
head-SHA identity. Left to the owner; does not block merge.

### F3 — NIT (informational)

`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` (wf L39) is an unusual runner-pin workaround carried at
job env scope; harmless, but worth a one-line comment if it is load-bearing for the pinned
`github-script@v9`.

## Rationale

The change delivers exactly the ratified contract: a cheap, open-model, docs-labeled CI backstop
with a hard closed-model fence, PAT-only chainable dispatch that fails visibly, an attributed
non-silent skip, head-SHA pending dedupe, and a prompt that mandates per-file accuracy review while
conditionally hand-testing executable claims. Every acceptance probe passes under independent
execution; the two safety-critical properties (no closed-model path, no `GITHUB_TOKEN` false-pass)
are firmly held. No gate fails, no evidence is missing, no doctrine violation is introduced, and no
architecture debt is implicated. The only blemish is a governance one (F1) that the dispatch
instruction pre-scoped as record-only. Verdict: **`PASS`**.
