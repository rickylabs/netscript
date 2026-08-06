# Locked implementation plan — DeepSeek formal IMPL-EVAL default

## Run metadata

| Field | Value |
| --- | --- |
| Run | `chore-deepseek-v4-formal-impl-evaluator--1338` |
| Issue / draft PR | #1338 / #1339 |
| Branch | `chore/deepseek-v4-formal-impl-evaluator-1338` |
| Base | `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` (`canary/0.0.5-canary.14`) |
| Bootstrap head | `cd3dc77cea5d9053d0b0a17b1d08121a67a36fa1` |
| Surface | N/A maintainer agentic tooling + docs/generated-skills overlay |
| Phase | `plan`; implementation hard-stopped pending independent PLAN-EVAL `PASS` |

## Goal

Make every active pending/future local formal IMPL-EVAL resolve the centralized
`deepseek/deepseek-v4-flash-0731` evaluator preset at `max` effort while formal PLAN-EVAL remains
`minimax/minimax-m3` at `high`. Preserve completed valid Qwen evidence, retire Qwen as an active
formal IMPL preset/default, and prove the exact DeepSeek route live before formal use.

## Scope

- Typed model allowlist, preset, and phase-specific formal route contract.
- Fail-closed formal-route and provider-preset regressions, including explicit Qwen 3.8 rejection.
- Bounded provider-canary/runtime evidence contract and exact DeepSeek max live proof.
- Canonical harness policy/evaluator docs, runtime operator docs, and canonical skills.
- Repository-generated Claude mirrors and consumer dogfood bundle.
- A precise milestone-orchestrator handoff for pending/future 0.0.5 evaluator artifacts.
- Run artifacts, per-slice PR comments, exact git/lock evidence, residue ledger, and final gates.

## Non-scope

- No package/plugin source, public API, dependency, version, `deno.lock`, publication, release
  canary, merge, or issue closure.
- No rewrite or rerun of completed #1331 or milestone T1-B evaluator evidence solely due to policy.
- No resumption of an interrupted Qwen session under DeepSeek; future DeepSeek formal use starts a
  fresh separate session against an exact clean target.
- No cloud OpenHands substitution for a local formal evaluator.
- No ordinary-review/formal-evaluation conflation and no supervisor self-certification.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Keep `OPENROUTER_MODEL_IDS.deepseekV4Flash0731` as the single model literal and extend the typed open-evaluator contract to Minimax + DeepSeek. Retain Qwen centrally only if generic/historical/rejection consumers still require it. | Volatile values have one home; removing Qwen globally would corrupt legitimate non-default coverage. |
| D2 | Replace `claude-evaluator-qwen-3-8-max` with a new finite preset `claude-evaluator-deepseek-v4-flash-0731`, model DeepSeek, effort `max`, purpose evaluation, Claude OpenRouter transport, and capability fields proven by canary. Do not keep an active Qwen evaluator preset alias. | The preset id, model, effort, and capability record form one typed launch contract. |
| D3 | Bind only `formal_impl_evaluation` to the DeepSeek preset. Leave `formal_plan_evaluation` exactly Minimax M3 high. | Owner-authorized phase-specific replacement. |
| D4 | Preserve the existing fail-closed phase/session/open-only/profile/preset/model/capability guards and add a direct regression that an otherwise well-formed Qwen 3.8 formal IMPL route throws the canonical-phase-route error. | Absence is weaker than a tested rejection boundary. |
| D5 | The live proof must be a bounded read-only DeepSeek max turn and record requested and observed model/effort, bypass, session id, start/end/timeout, cost/usage if the provider exposes it (explicit `unavailable` otherwise), reasoning/tool event behavior, terminal output, exit code, raw capture, normalized evidence, and artifact hashes/paths. Requested argv alone is not provider observation. | Acceptance requires auditable exact-route behavior, not a static configuration claim. |
| D6 | A live canary may run only after S1’s static/focused gates are green and only under milestone-orchestrator authority. A failed/mismatched/unknown observation blocks formal use; there is no fallback. | Prevent spend or formal dispatch on an unproven route. |
| D7 | Canonical code and prose change before generated mirrors. `.claude/skills` and consumer bundle are generator-owned and never hand-edited. | Repository ownership contract. |
| D8 | Completed Qwen PASS evidence—including T1-B session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7`—is immutable history. Active T1-A future prompt/default changes to fresh DeepSeek max only after this PR lands; previous Qwen attempts remain historical and ineligible/valid exactly as recorded. | A route policy change is prospective, not retroactive evidence invalidation. |
| D9 | The active milestone artifacts live on a different orchestrator branch. This PR must not edit that worktree. S3 produces the exact convergence ledger; the orchestrator applies it after landing and owns all evaluator/merge/canary actions. | Cluster ownership and exclusive authority. |
| D10 | `deno.lock` is excluded from every command’s intended writes and every pathspec staged. Its clean baseline is exact HEAD blob `ef28b1b056705b456a66601ceeb46eede9def7b0`; snapshot identity before and after each mutating generator/gate and stop on any delta. | The launcher previously caused accidental resolution churn, which the orchestrator restored only in this worktree. |

## Open-decision sweep

| Question | Disposition |
| --- | --- |
| Is Qwen retained in generic OpenHands examples/allowlists? | Resolve in S3 occurrence-by-occurrence. It may remain only where the behavior is still supported and non-formal; the allowed residue classes are already locked, so this cannot force architecture rework. |
| How is provider cost represented when absent? | Locked: normalized `unavailable`, never zero or inferred. |
| Does the prerequisite directly update `release-0.0.5--orchestration`? | Locked: no. The run is outside this branch; the milestone orchestrator applies the exact S3 handoff after landing. |
| May package/plugin code be touched to green a gate? | No. Stop and rescope; doctrine and JSR gates become mandatory only after owner approval. |

## Risk register

| Risk | Mitigation |
| --- | --- |
| DeepSeek is added to an allowlist but the Qwen preset remains launchable. | Remove the active preset id and add an explicit Qwen formal-IMPL rejection test. |
| PLAN-EVAL accidentally changes with the IMPL route. | Exact Minimax high assertions remain in focused routing/provider tests and residue audit. |
| Capability metadata claims support before evidence. | S2 canary is a hard gate; mismatched/unknown model, reasoning, tool, session, bypass, or terminal status blocks formal use. |
| Canary output leaks credentials or invents observed identity/cost. | Store credential-blind normalized evidence, bounded raw output, redaction assertions, explicit observation source, and `unavailable` fields. |
| Broad replacement corrupts historical evidence. | Immutable path exclusions plus an exact retained-Qwen ledger reviewed before S3 sign-off. |
| Generated surfaces drift or are hand-edited. | Canonical-first commits, repo-native sync/dogfood commands, parity checks, and generated diff audit. |
| Other-branch milestone artifacts silently remain stale. | Exact path/line/action handoff recorded and acknowledged by the orchestrator before DeepSeek formal launch. |
| Tests, generators, or launchers mutate the clean lock. | Blob/hash snapshots around each command; stop on delta; explicit pathspec staging excludes `deno.lock`. |
| A green suite is mistaken for review/evaluation. | Separate opposite-family slice review, fresh Minimax PLAN-EVAL, fresh DeepSeek IMPL-EVAL, and orchestrator-only launch records. |

## Commit slices

### S1 — typed model/preset/formal-route contract and negative tests

Proves: formal PLAN resolves Minimax high; formal IMPL resolves DeepSeek V4 Flash 0731 max; retired
Qwen formal IMPL and cross-phase/wrong-profile/closed/reused-session routes fail closed.

Primary files:

- `.llm/tools/agentic/config/models.ts`;
- `.llm/tools/agentic/runtime/provider-profiles.ts`;
- `.llm/tools/agentic/runtime/routing-policy.ts`;
- focused config/provider/routing tests and only directly affected static fixtures;
- this run’s `worklog.md`, `context-pack.md`, and drift evidence.

Gates:

```text
deno test --no-lock -A \
  .llm/tools/agentic/config/no-hardcoded-volatile_test.ts \
  .llm/tools/agentic/runtime/provider-profiles_test.ts \
  .llm/tools/agentic/runtime/routing-policy_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx
```

Then raw exact diff/status/lock verification, substantive opposite-family review, supervisor sign-off
commit, explicit push, and one structured `[PHASE: IMPL]` slice comment on PR #1339.

### S2 — runtime/canary/fixture proof with exact DeepSeek max live evidence

Proves: the bounded runtime canary records the full required evidence schema, fixtures distinguish
requested from observed identity, mismatches and absent observations fail closed, and the exact live
DeepSeek max route succeeds before formal use.

Primary files:

- `runtime/provider-canary.ts`, adapter and CLI only as required by the evidence contract;
- focused canary/runner/guard tests and current-output fixtures;
- credential-blind canary evidence under this run directory (raw sensitive scratch remains under
  `.llm/tmp/` and is not committed if it cannot be safely normalized);
- run artifacts.

Gates:

```text
deno test --no-lock -A \
  .llm/tools/agentic/runtime/provider-canary_test.ts \
  .llm/tools/agentic/runtime/cli/provider-canary_test.ts \
  .llm/tools/agentic/runtime/preset-canary_test.ts
deno task agentic:provider-canary
deno test --no-lock -A .llm/tools/agentic/
```

After focused/static gates pass, the milestone orchestrator—not this implementation lane—runs one
bounded live command equivalent to:

```text
deno task agentic:provider-canary --live \
  --profile claude-openrouter \
  --preset claude-evaluator-deepseek-v4-flash-0731 \
  --model deepseek/deepseek-v4-flash-0731 \
  --effort max \
  --worktree <exact-native-clean-worktree>
```

The artifact must identify the exact clean commit and all D5 fields. No formal evaluator launches
unless the normalized verdict is PASS and requested/observed route identities match. Finish with
lock verification, opposite-family review, supervisor sign-off commit, push, and slice comment.

### S3 — harness/docs/skills/generated/milestone convergence

Proves: every active canonical description agrees with the executable policy, generated surfaces
are repository-produced and current, historical Qwen evidence is untouched, and the active 0.0.5
orchestrator has an exact prospective convergence handoff.

Primary files:

- `.llm/harness/workflow/lane-policy.md` and evaluator protocols;
- `.llm/tools/agentic/README.md` and focused tooling help/docs;
- `.agents/skills/{netscript-harness,openhands-handoff}/SKILL.md` and any canonical skill found by
  the residue scan;
- generated `.claude/skills/**` and `.agents/generated/consumer-skills/**` via native generators;
- run artifacts containing the residue ledger and exact orchestrator handoff.

Required generator/gates:

```text
deno task agentic:sync-claude
deno task agentic:sync-claude:check
deno task agentic:check-claude
deno task agentic:dogfood-skills
deno task docs:maintenance
deno test --no-lock -A .llm/tools/agentic/
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx
```

Run exact tracked and working-tree searches for Qwen model/preset/prose. The ledger lists every
retained occurrence with class and rationale, explicitly reports zero edits under #1331 and
completed milestone evidence, and names the exact `release-0.0.5--orchestration` paths/actions:

- retain T1-B PASS/session/evaluated-head records unchanged;
- preserve all failed/interrupted Qwen attempt history unchanged;
- replace active/pending T1-A Qwen launch/prompt/default wording with a fresh DeepSeek max session
  against its exact clean target, only after prerequisite landing and live canary PASS;
- update future route summaries without rewriting past-tense facts.

Finish with lock verification, ordinary review, supervisor sign-off commit, explicit push, and slice
comment.

## Final validation and handoff gates

After S3, rerun the full focused/agentic/scoped/generated/docs gates above at the final head, then:

1. Run `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1339 --pretty`; every
   current thread must have a reply, including reasoned declines.
2. Run `deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1339 --pretty`; distinguish
   current failures from skipped/cancelled/superseded results and require named gates to have run.
3. Apply the milestone pre-merge gate: green close-gate; all #1338 acceptance and PR DoD boxes
   checked with linked evidence; prohibited-diff scan excluding run artifacts; named expensive
   gates `SUCCESS` rather than silence/skip/cancel; independent re-verification of the decisive
   route/canary claim; package/plugin changed-file audit; PR body matches shipped scope.
4. Verify exact base/head/local/remote/PR equality, clean owned paths, `deno.lock` still equals exact
   HEAD blob `ef28b1b056705b456a66601ceeb46eede9def7b0`, no package/plugin changes, and a complete
   residue ledger.
5. A fresh separate DeepSeek max IMPL-EVAL reads the exact clean target and writes the formal verdict.
   The implementation supervisor does not launch or self-certify it.
6. Only after IMPL-EVAL PASS may the orchestrator complete evidence mirroring, update PR lifecycle
   state, apply the milestone artifact handoff, and decide merge/canary timing.

The full CLI E2E and package/plugin Doctrine/JSR gates are N/A for this maintainer-only route change.
If implementation touches scaffold output, packages, or plugins, stop and rescope; do not silently
expand this gate set.

## Deferred scope

- General OpenRouter model catalog cleanup beyond this formal route.
- Retiring Qwen from generic cloud OpenHands support if it remains a valid explicit model.
- Release publication and canary cadence execution.
- Any package/plugin architecture or JSR changes.

## Architecture-debt implication

No entry is expected in `.llm/harness/debt/arch-debt.md`: this changes an owner-authorized active
maintainer routing default and adds proof, rather than accepting a doctrine or fitness-gate
violation. If implementation can only proceed by weakening a fail-closed guard, skipping required
evidence, or touching package/plugin architecture, stop and classify that as rescope/debt before
continuing.

## Plan-gate status

Locked by the generator, not approved. A fresh separate Minimax M3 high PLAN-EVAL must inspect the
exact pushed planning head and emit `PASS` before S1 begins. Two `FAIL_PLAN` cycles trigger
escalation; this session never certifies its own plan.
