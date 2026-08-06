# Worklog — chore-deepseek-v4-formal-impl-evaluator--1338

## 2026-08-06 — Orchestrator bootstrap

- Re-queried live state: issue #1331 is closed by merged PR #1336; `origin/main` and `origin/canary/0.0.5-canary.14` both resolve to `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`.
- Created issue #1338 in milestone 0.0.5 with `type:chore`, `area:tooling`, `area:agentic`, `priority:p0`, `wave:v1`, and exactly one `status:plan` label.
- Created branch/worktree `chore/deepseek-v4-formal-impl-evaluator-1338` at the exact canary baseline.
- Runtime doctor observed native ext4, Codex 0.146.1, app-server ready, Deno 2.9.3, and the required local toolchain.
- Scoped the prerequisite to maintainer tooling/harness/docs/tests/generated surfaces. Package/plugin and release publication scope is excluded.
- Next: dedicated Codex supervisor produces research/plan only; separate Minimax M3 PLAN-EVAL must pass before implementation.

## 2026-08-06 — Research and locked plan

- Verified branch, exact canary base, bootstrap head, remote head, issue #1338, and draft PR #1339.
- Read the requested harness, milestone, tooling, PR, Deno, OpenHands, Codex WSL, and RTK operating
  contracts plus Plan-Gate/evaluator workflow sources.
- Mapped the typed model/preset/formal-route sources, focused tests, provider-canary gap, canonical
  docs/skills, generated ownership, consumer dogfood surface, and immutable #1331 boundary.
- Inspected the active milestone artifacts read-only through branch
  `orchestrator/0.0.5-continuation` at `81d32354d...`: preserved T1-B Qwen PASS and locked a
  prospective fresh DeepSeek max handoff for pending T1-A after prerequisite landing.
- Initial lock provenance was recorded incorrectly and is superseded by the same-thread correction
  below.
- Wrote `research.md`, `plan.md`, and `plan-eval-prompt.md`; updated the resumable identity/state
  artifacts. No route code, tests, generated mirror, package/plugin source, evaluator launch,
  release action, or merge was performed.

## Design checkpoint

Status: **LOCKED BY GENERATOR; NOT APPROVED**.

- S1 owns the typed DeepSeek evaluation preset/allowlist/formal IMPL binding and explicit retired
  Qwen rejection while pinning Minimax PLAN unchanged.
- S2 owns the bounded evidence schema and exact live DeepSeek max proof, with unknown/mismatch/cost
  absence represented fail-closed.
- S3 owns canonical prose first, generated mirrors second, exact retained-Qwen ledger, and the
  orchestrator-only active-milestone handoff.
- Package/plugin doctrine, JSR, release publication, and full CLI E2E are N/A unless scope drifts;
  drift requires a stop and rescope, not silent gate expansion.
- A fresh separate Minimax M3 high PLAN-EVAL is the next hard gate. This session cannot approve it.

## 2026-08-06 — Same-thread launch evidence correction

- Corrected the first-launch account: it explicitly emitted Remote Control status `disabled`, so
  thread `019fd897-cf69-75d3-9e46-bb87cc62c226` was phone-not-attached. No phone attachment is
  claimed.
- The milestone orchestrator ran the supported agentic runtime repair dry-run. It safely refused
  mutation with status `blocked`, state `disconnected`, diagnostic `active_session`, because
  foreign/other active sessions made repair unsafe.
- Continued the same thread through the repository `codex-resume` tool and actual Codex CLI in tmux
  session `ns1338-deepseek-supervisor`. Attach command:
  `tmux attach-session -t ns1338-deepseek-supervisor`.
- Cost remains `unavailable`, not zero.
- Corrected lock provenance: this worktree was clean before launcher execution; the app-server
  launch subprocess caused `deno.lock` resolution churn. After the supervisor turn, the milestone
  orchestrator verified it unstaged and restored only this worktree lock to exact HEAD blob
  `ef28b1b056705b456a66601ceeb46eede9def7b0`. Root and T1-B protected lock states were untouched.
- Promoted launcher-owned `codex-thread-ids.md` into the planning evidence set. No route code or
  evaluator phase work was performed.

## 2026-08-06 — Formal PLAN-EVAL PASS

- Verified exact clean target `258034b1f9842bae781ca7e5eecffc2c61af13e4` across local HEAD,
  authoritative remote branch, and PR #1339; base remained
  `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` and `deno.lock` remained exact HEAD blob
  `ef28b1b056705b456a66601ceeb46eede9def7b0`.
- Launched a fresh, separate formal PLAN-EVAL session through the canonical OpenRouter runner:
  session `a583f0da-69b3-4717-8271-bca95d9cd2db`, requested/observed model
  `minimax/minimax-m3`, effort `high`, permission mode `bypassPermissions`, transport
  `claude-openrouter`; provider-reported cost was not exposed and is `unavailable`.
- The evaluator returned `PASS` and authorized implementation. Its complete stdout-authored body
  is recorded verbatim in `plan-eval.md`; raw stream JSON remains in the gitignored
  `.llm/tmp/ns1338-plan-eval-raw.txt`.
- Lifecycle labels had already advanced from `status:plan` to `status:plan-eval` immediately before
  evaluation; the evaluator's immutable body reflects the earlier planning metadata. This does not
  alter its exact-head identity or verdict.
- Next: advance issue/PR #1338/#1339 to `status:impl` and resume the same Codex supervisor thread
  for S1 only. PLAN-EVAL remains Minimax M3 high; IMPL-EVAL remains pending as a future fresh
  DeepSeek V4 Flash 0731 max session.

## 2026-08-06 — S1 typed formal-route contract

### Preflight

- Verified local HEAD, authoritative remote branch, and PR #1339 head were identical at
  `3b5cfbc45298f62da5f2d354c375fc01c989c3ea`; PR base remained
  `canary/0.0.5-canary.14`.
- Verified HEAD, index, and worktree `deno.lock` all resolved exact blob
  `ef28b1b056705b456a66601ceeb46eede9def7b0`; worktree was clean before S1 edits.

### Implementation

- Replaced the active formal IMPL evaluator preset with
  `claude-evaluator-deepseek-v4-flash-0731` on `claude-openrouter`, model
  `deepseek/deepseek-v4-flash-0731`, effort `max`, purpose `evaluation`.
- Replaced Qwen with DeepSeek in `OPEN_EVALUATOR_MODEL_IDS`; formal PLAN remains exactly
  `claude-evaluator-minimax-m3`, `minimax/minimax-m3`, effort `high`.
- Updated the canonical routing-state renderer fixture and focused provider/routing contracts.
- Added an explicit fail-closed regression for an otherwise canonical formal IMPL route whose
  model is retired Qwen 3.8; retained the existing stale-Qwen-3.7 and cross-phase rejection tests.

### Qwen S1 occurrence decisions

- **Retain** `OPENROUTER_MODEL_IDS.qwen` in `config/models.ts`: current non-formal consumers still
  use it for generic OpenHands dispatch/help and agentic command/fixture coverage. S1 does not
  remove a valid generic model id.
- **Remove** Qwen from `OPENROUTER_PRESET_MODELS`: no current non-formal consumer requires Qwen
  membership in this finite active-preset registry, and the sole Qwen preset was the retired formal
  evaluator. DeepSeek replaces that active preset-model slot.
- **Retain rejection-only test occurrences**: `provider-profiles_test.ts` keeps Qwen as an
  intentionally mismatched Minimax-preset model; `routing-policy_test.ts` keeps stale Qwen 3.7 and
  retired Qwen 3.8 solely as fail-closed inputs. No active S1 route/preset resolves Qwen.
- The complete repository-wide historical/generic residue ledger remains S3 scope and was not
  started here.

### Gate evidence and lock stop

- Focused contracts:
  `deno test --no-lock -A .llm/tools/agentic/config/no-hardcoded-volatile_test.ts .llm/tools/agentic/runtime/provider-profiles_test.ts .llm/tools/agentic/runtime/routing-policy_test.ts .llm/tools/agentic/runtime/cli/routing-state_test.ts`
  → exit 0, 46 passed, 0 failed; lock unchanged.
- First scoped check invocation omitted the wrapper child argument:
  `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx`
  → type verdict green (149 files, 2 batches, 0 failed), but its spawned `deno check` resolved the
  lock from `ef28b1b...` to `e66d0339...`. The supervisor stopped immediately; lint/fmt, artifact
  edits, staging, commit, and push did not run.
- The milestone orchestrator inspected and attributed the unstaged delta to that scoped-check
  subprocess, then restored only this prerequisite worktree lock to exact HEAD blob `ef28b1b...`.
  Root and T1-B protected locks remained untouched.
- Corrected scoped check:
  `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx --deno-arg --no-lock`
  → spawned `deno check --unstable-kv --no-lock`; exit 0, 149 files, 2 batches, 0 failed, 0
  occurrences; lock unchanged.
- Scoped lint:
  `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx`
  → exit 0, 149 files, 1 batch, 0 findings; lock unchanged.
- Scoped fmt first reported one owned formatting finding in `runtime/routing-policy.ts`; a
  mechanical line-wrap repair was applied. Rerun:
  `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx`
  → exit 0, 149 files, 1 batch, 0 failed, 0 findings; lock unchanged.
- Final S1 lock identity before staging: HEAD/index/worktree
  `ef28b1b056705b456a66601ceeb46eede9def7b0`.

S1 automated gates are green, but S1 is **not reviewed or self-certified**. No ordinary review,
formal evaluation, Actions, S2/S3, merge, canary, publication, or issue closure was launched.

## 2026-08-06 — Owner policy update and direct completion path

- Owner halted OpenHands use until its trigger path is repaired and classified this prerequisite as
  a simple PR. The earlier PLAN-EVAL remains valid completed evidence but is not a template for
  future small/mechanical issues.
- Canonical policy now makes PLAN-EVAL conditional, keeps IMPL-EVAL mandatory absent explicit owner
  waiver, pauses OpenHands, and machine-binds the OpenRouter-limit fallback for both formal phases
  to fresh AGY / Google / `gemini-3.6-flash-high` / high sessions.
- Replaced forward formal IMPL-EVAL prose with the DeepSeek V4 Flash 0731 max preset across harness
  policy/protocol, canonical skills, generated Claude mirrors, and the authoring index. Historical
  Qwen evidence and generic cloud-only Qwen examples remain untouched.
- Owner rescoped the planned broad canary-evidence-envelope S2 out of this prerequisite. The
  completion path uses the existing bounded provider canary, focused typed/docs/generated gates,
  one mandatory local IMPL-EVAL, existing pre-merge gate, and merge. No package/plugin or release
  publication surface is added.
- Updated the typed policy with two explicit `fallback_on_openrouter_limit` formal routes:
  Antigravity / Google / `gemini-3.6-flash-high` / high. The formal resolver requires the explicit
  fallback reason and an Antigravity evaluator session; without it, Minimax high and DeepSeek max
  remain the canonical primaries.
- Policy/generator gate set is green: 47 focused tests; lockless scoped check 149 files in two
  batches; scoped lint/fmt 149 files with zero findings; Claude skill mirror parity and surface
  validation green; internal links and docs accuracy green. Docs accuracy's child Deno process
  again resolved the prerequisite lock to `e66d0339...`; after the green verdict the orchestrator
  restored only this known run-owned delta to exact HEAD `ef28b1b...`. Root/T1-B locks were not
  touched.

## 2026-08-06 — Exact local DeepSeek canary PASS

- Static preset canary passed with the new preset present, launch-valid, live-eligible, agentic-turn
  supported, and no diagnostics.
- The existing bounded live canary ran locally against exact clean head
  `bac60805a7964b297329daa362271d6b6b89894c` with profile `claude-openrouter`, preset
  `claude-evaluator-deepseek-v4-flash-0731`, requested/observed model
  `deepseek/deepseek-v4-flash-0731`, effort `max`, and canonical credential available.
- Result: `passed`, fan-out eligible, exit 0, no timeout, tools/reasoning/streaming all supported;
  event counts 5/13/18; no incompatibility or diagnostics. Remote Control is unavailable on this
  print transport by design. `deno.lock` remained exact HEAD blob `ef28b1b...`.
- Next: mandatory fresh local IMPL-EVAL against the exact pushed completion head. The AGY fallback
  is not used because OpenRouter is healthy.

## 2026-08-06 — S1 ordinary adversarial REVIEW PASS

- The canonical OpenHands dispatcher posted owner-authorized Grok trigger comment `5208807248`,
  but GitHub materialized no Actions run/status comment during bounded observation. No evidence was
  accepted from that trigger.
- A fresh Codex OpenRouter launcher attempt in the isolated review worktree failed before inference:
  thread `019fd8b7-d5a7-7ec2-a255-0e10276d9ade` lacked child credential injection and observed
  `on-request`/`readOnly`, so it failed the bypass launch contract and is excluded. Its run-owned
  lock churn was restored only in that review worktree.
- Launched the same owner-authorized route through the checked-in credential-isolated gateway in
  tmux `ns1338-grok-review-gateway`: fresh session
  `bad4a807-6399-4af8-b97b-2cbbb8d0cdb5`, requested/observed OpenRouter/xAI
  `x-ai/grok-4.5`, effort `medium`, `bypassPermissions`, exact clean PR head
  `f2bc222667b369b1749248a7b74befa2e08e9da8`; cost `unavailable`.
- The reviewer returned advisory `REVIEW PASS` with no blocking findings. It independently verified
  Minimax PLAN high, DeepSeek IMPL max, active-formal Qwen removal, fail-closed negative coverage,
  typed guard integrity, and bounded diff scope. The complete evaluator-authored body is
  `review-s1/review.md`; two trailing Markdown hard breaks were normalized to blank lines so the
  repository whitespace gate remains clean.
- Reviewer gates: focused provider/routing/routing-state tests 42 passed/0 failed; scoped check 149
  files/0 errors. An intermediate review-local check resolved its isolated lock; the reviewer
  restored only that lock and finished clean at exact blob `ef28b1b...`. Implementation/root/T1-B
  worktrees were untouched.
- S1 is signed off for S2. This advisory PASS is not formal IMPL-EVAL and does not authorize merge,
  lifecycle `ready-merge`, canary publication, or issue closure.

## 2026-08-06 — Formal local IMPL-EVAL PASS

- Evaluated exact clean local/remote/PR head
  `d452f1fa514af3e98066dd6aeaa69aaf3e3355f0` in a fresh independent local session
  `504a078c-5ed6-4891-8c7a-00aa41abd78f`.
- Requested/observed route: OpenRouter/DeepInfra `deepseek/deepseek-v4-flash-0731`, effort `max`,
  `bypassPermissions`; implementation supervisor thread remained separate. The terminal transport
  result reported cost `$2.623356` (`302657` input, `1299712` cache-read input, `18005` output
  tokens); this corrects the earlier lifecycle draft that treated cost as unavailable.
- Verdict: **PASS**. Independent gates confirmed 47 focused tests, scoped check/lint/fmt across 149
  files, generated mirror parity, zero unanswered review threads, exact DeepSeek provider canary,
  immutable #1331 evidence, and no package/plugin/release scope.
- Complete evaluator-authored artifact: `evaluate.md`; raw transport artifact:
  `.llm/tmp/ns1338-impl-eval-raw.txt` (local, intentionally uncommitted).
- A post-evaluation read exposed run-owned lock resolution in this worktree; the orchestrator
  restored only this prerequisite lock to exact HEAD blob `ef28b1b...`. Root and T1-B locks were
  untouched. Ready-for-review and milestone pre-merge checks are next.
