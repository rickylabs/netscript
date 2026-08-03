# Drift Log: OMB wave-0 proofs

Drift is append-only.

## 2026-08-03 — User-addressed Codex supervisor

- **What:** The current Codex root session supervises planning instead of launching the default
  Fable `planning_decisions` route.
- **Source:** User directive: “You are the implementation supervisor”.
- **Expected:** Lane policy defaults orchestration to Fable with Codex as fallback.
- **Actual:** The existing user-addressed Codex session remains supervisor; separate canonical
  implementation, review, and formal evaluator sessions are still required.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table.

## 2026-08-03 — Service overlay read paths absent

- **What:** `SCOPE-service.md` points to `.claude/04-services.md` and
  `.claude/06-infrastructure.md`, which are absent on the current branch.
- **Source:** Direct filesystem lookup after reading the overlay.
- **Expected:** Both additional-read files exist.
- **Actual:** Neither path resolves; focused package/service/Aspire source and official Aspire docs
  are used instead.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `rg --files` produced no matching paths.

## 2026-08-03 — Evaluator credential not inherited by first canary

- **What:** The first canonical Qwen live provider canary returned `auth_required` because
  `OPENROUTER_API_KEY` was not exported into the invoking shell.
- **Source:**
  `deno task agentic:provider-canary --live --profile claude-openrouter --model
  qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns005-proofs`.
- **Expected:** The canonical evaluator route has a credential in its isolated child environment.
- **Actual:** The documented `$HOME/.config/netscript-agentic/openrouter.env` file exists, but the
  provider canary does not auto-load it (the OpenCode launcher does). No secret was read into logs.
- **Severity:** minor unless the documented parser-backed retry fails.
- **Action:** retry once using the repository's `parseOpenRouterApiKey()` and child-environment
  policy; if it does not pass, block before implementation and request owner action.
- **Evidence:** structured canary diagnostic `auth_required`; file-presence check only.

## 2026-08-03 — Evaluator credential route resolved

- **What:** The parser-backed retry passed on the exact canonical formal-evaluator route.
- **Source:** The documented `parseOpenRouterApiKey()` loaded only the named assignment into the
  isolated provider-canary child; no credential value was logged or written to the run.
- **Expected:** Qwen 3.7 Max at high effort reports an available credential and live agentic
  capabilities before PLAN-EVAL.
- **Actual:** `status=passed`; tools, reasoning, and streaming all `supported`; exit code 0.
- **Severity:** resolved.
- **Action:** proceed to a separate local PLAN-EVAL session on the same canonical route.
- **Evidence:** structured provider-canary result in the supervisor turn; no secret-bearing output.

## 2026-08-03 — Formal evaluator attempted a closed default child model

- **What:** The first full Qwen PLAN-EVAL retry attempted to delegate through the Claude CLI's
  default `claude-opus-5` child model.
- **Source:** Formal-evaluator request-guard audit event; the top-level route remained Qwen 3.7 Max.
- **Expected:** Every model-bearing request in the evaluator turn uses an approved open model.
- **Actual:** The loopback guard denied the child request before it reached OpenRouter, terminated
  the evaluator with exit 78, and no `plan-eval.md` was written.
- **Severity:** minor prompt-routing drift; no policy or cost breach occurred.
- **Action:** add an explicit no-Agent/no-subagent constraint to the evaluator brief and retry in a
  fresh top-level Qwen session. Do not weaken the guard or widen the model allowlist.
- **Evidence:** credential-blind audit event under `.llm/tmp/agentic/evaluator-policy/` naming only
  the denied model, requesting session, and timestamp.

## 2026-08-03 — Generic evaluator adapter bound too short

- **What:** The repository's generic Claude/Codex process adapter uses a 30-second timeout, which
  expired before a full plan evaluator could read the required files and write an atomic verdict.
- **Source:** `AGENT_COMMAND_TIMEOUT_MS = 30_000` in the agentic adapter and the first full-turn
  `timeout` diagnostic.
- **Expected:** A bounded formal evaluator turn completes and writes `plan-eval.md`.
- **Actual:** No partial artifact was written at 30 seconds. A fresh session using the same planned
  command, isolated environment, Qwen model, high effort, and model guard completed in under the
  supervisor's 240-second bound and wrote PASS.
- **Severity:** minor orchestration drift; provider and evaluation policy were unchanged.
- **Action:** accept for this proof run and retain both failed-attempt evidence and the successful
  separate-session verdict. Do not modify agentic runtime product code in this slice.
- **Evidence:** first outcome `timedOut=true`; successful retry outcome exit 0; `plan-eval.md`.

## 2026-08-03 — Implementation brief activation line reordered

- **What:** The committed implementation brief contained `use harness` after its Markdown title; the
  agentic launcher requires that exact activation text on the first line.
- **Source:** `agentic:launch-codex-slice --dry-run` brief-contract validation.
- **Expected:** The launcher accepts the committed brief before any child turn is sent.
- **Actual:** Dry-run failed closed and launched nothing.
- **Severity:** minor.
- **Action:** move `use harness` to line 1 without changing assignment content; reformat, commit,
  and repeat dry-run before live launch.
- **Evidence:** dry-run diagnostic `must begin with use harness`.

## 2026-08-03 — Separate implementation worktree required by sender ownership

- **What:** The supervisor's API session is also the durable app-server sender for the provided PR
  worktree, so the agentic suite refused a second implementation sender there.
- **Source:** `agentic:launch-codex-slice` returned `duplicate_sender_risk`; session metadata proved
  the recorded owner was this user-addressed supervisor turn.
- **Expected:** PLAN-EVAL and implementation run in sessions separate from the supervisor without
  violating one-sender-per-worktree.
- **Actual:** A local no-upstream implementation branch/worktree was created at the approved commit:
  `/home/codex/repos/ns005-proofs-impl`, `test/openapi-mcp-wave0-proofs-impl`. The child may draft
  only; it cannot commit, push, or edit GitHub. Supervisor integration remains on the PR branch.
- **Severity:** minor orchestration drift; role/model/effort and commit authority are unchanged.
- **Action:** accept; use only thread `019fc95d-ce57-7893-98b3-36977bec0cf1` at that worktree and
  transfer reviewed drafts into the PR worktree with explicit scope checks.
- **Evidence:** `codex-thread-ids.md`; live launch observed provider/model/effort match.

## 2026-08-03 — P1 generated SQLite runtime lacks FFI permission

- **What:** The prepared SQLite scaffold's generated users resource exits because its Deno command
  omits `--allow-ffi`, which the generated `libsql` dependency requires.
- **Source:** Owned Aspire `users` console log and description from the final P1 run.
- **Expected:** After documented DB initialization, the generated users service becomes healthy so
  the manifest, Aspire description, and live request can agree.
- **Actual:** The allocation callback wrote a complete manifest, but Aspire described `users` as
  `Finished` / exit 1 with no URL. A later HTTP 200 was not tied to a listener owner or precise
  timing and therefore cannot satisfy D5's coherent same-run evidence bar.
- **Severity:** significant; product/template change required for a healthy repeat.
- **Action:** Record explicit P1 `FAIL` and qualified F1(b); recommend eventual `FAIL_RESCOPE` only
  for the DB-backed product path. Leave product/template source unchanged.
- **Evidence:** `proofs/evidence/P1-runtime.json`, `proofs/evidence/P1-attempts.md`, and
  `proofs/P1-verdict.md`.

## 2026-08-03 — S1 Fable evidence/disposition amendment

- **What:** Separate Fable review found the initial S1 wording over-attributed an unexplained HTTP
  200, under-qualified F1(b), and made the DB-path rescope appear to halt independent proofs.
- **Source:** `reviews/S1-fable.md` findings M1–M3 and m1–m3.
- **Expected:** P1 remains explicit `FAIL` under D5/D6 while evidence attribution, decision cause,
  evaluator authority, and independent downstream work are stated precisely.
- **Actual:** The same Codex thread amended evidence and wording without rerunning Aspire. Separate
  native Fable re-review approved every disposition and found no new blocker.
- **Severity:** major evidence/decision-record clarification; no runtime or product change.
- **Action:** Keep P1 `FAIL` and qualified/revisitable F1(b); only a separate evaluator may issue
  `FAIL_RESCOPE`. Permit the supervisor to authorize independent no-DB P2 and P3 work.
- **Evidence:** `reviews/S1-fable.md`, `reviews/S1-fable-rereview.md`, and amended P1 artifacts.

## 2026-08-03 — S2 detached-start controlling-session behavior

- **What:** Two initial owned `aspire start` attempts reported success but disappeared when their
  command sessions ended, before the no-DB service listened. A retained controlling shell kept the
  third serialized start alive for attribution, measurement, and exact stop.
- **Source:** Owned `aspire ps`, port, process-tree, and startup-log observations.
- **Expected:** A detached start remains discoverable after the launching command returns.
- **Actual:** The first two starts left no AppHost or listener and produced no fetch. The third used
  the same fresh unmodified scaffold and remained healthy while its controlling session stayed open.
- **Severity:** minor environment/transport behavior; no product or evidence-bar change.
- **Action:** Preserve failed attempts, attribute only the retained run, and stop its exact path.
- **Evidence:** `proofs/evidence/P2-attempts.md` and `proofs/evidence/P2-runtime.json`.

## 2026-08-03 — P2 split fetch/measurement command

- **What:** The locked validation row named `p2-measure-spec.ts` with network permission. S2 instead
  used `p2-measure-live-spec.ts`: a separately recorded bounded fetch wrote a retained raw spec,
  then a file-only measurement command used `--no-lock --allow-read --allow-write` and no network.
- **Source:** Plan validation row 4 and executed S2 command record.
- **Expected:** One measurement filename/command with `--allow-read --allow-net`.
- **Actual:** Fetch and measurement were split; the measurement filename and permissions differ.
- **Severity:** minor; narrower measurement authority and more auditable retained input.
- **Action:** Retain the exact 3657-byte raw input and regenerate evidence without network access.
- **Evidence:** `proofs/evidence/P2-no-db-live-spec.json`, `proofs/evidence/P2-runtime.json`, and
  `proofs/experiments/p2-measure-live-spec.ts`.

## 2026-08-03 — Resumed Codex thread reports low effort

- **What:** The agentic suite resumed the approved implementation thread and preserved its thread,
  model (`gpt-5.6-sol`), provider, approval, and sandbox identity, but the resumed CLI transcript
  reported reasoning effort `low` rather than the launch-time `medium` route.
- **Source:** `agentic:codex-resume` S2 and amendment transcripts versus `codex-thread-ids.md`.
- **Expected:** Same-thread resume preserves the recorded implementation route including effort.
- **Actual:** The resume interface exposes no effort flag and the transcript reports `low`.
- **Severity:** minor route drift; S2 was separately reviewed twice and supervisor-integrated.
- **Action:** Do not use another low-reported resume for P3. Re-establish the required medium route
  through the agentic suite before authorizing new implementation work.
- **Evidence:** supervisor turn command records; `reviews/S2-fable.md` and
  `reviews/S2-fable-rereview.md`.
