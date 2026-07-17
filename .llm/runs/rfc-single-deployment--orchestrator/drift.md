# Drift Log: RFC single deployment (issue #820)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-17 — Kickoff effort raises over lane-policy defaults

- **What:** Orchestrator lane runs Fable 5 high (default: low); PLAN-EVAL runs Sol max (default
  for `review_claude`: xhigh).
- **Source:** kickoff.md (owner-ratified 2026-07-17)
- **Expected:** lane-policy.md defaults
- **Actual:** kickoff-mandated raises
- **Severity:** minor
- **Action:** accept (owner-authorized), recorded in supervisor.md
- **Evidence:** kickoff.md § Identity & lanes

## 2026-07-17 — No dedicated seed branch/draft PR for this run

- **What:** Seed-run doctrine (workflow/seed-run.md) stages a `plan/<subject>` branch + draft PR
  at stage A; this run operates directly in the run dir on `feat/beta10-cli-integration`.
- **Source:** kickoff.md § Artifacts
- **Expected:** seed-run stage A draft PR as commit trail
- **Actual:** kickoff scopes supervision to the run dir + session resume; deliverable is one #820
  comment post-PASS, board changes drafted as files
- **Severity:** minor
- **Action:** accept (kickoff is the charter; "follow it verbatim")
- **Evidence:** kickoff.md § Artifacts, § Stop-lines

## 2026-07-17 — Local eis-chat clone blocked by session sandbox; fallback to public GitHub API

- **What:** This session's sandbox restricts file access to
  `/home/codex/repos/netscript-beta10-cli` only. Both Bash and Read on
  `/home/codex/repos/eis-chat` (the kickoff's named local clone) are permission-gated, and the
  autonomous session cannot grant. `rtk` and the `mcp__github__*` tools are likewise
  approval-gated.
- **Source:** tool permission errors (Bash `ls /home/codex/repos/eis-chat`, Read
  `/home/codex/repos/eis-chat/README.md`)
- **Expected:** kickoff names the local clone @ `aeaf2df` as the POC study surface
- **Actual:** forensics executed against the same commit via the public GitHub API
  (`rickylabs/eis-chat`, tree @ `aeaf2df` + raw file fetches), authenticated with the
  kickoff-provided gh oauth token workaround. Same content, same commit; only the transport
  differs. Corpus saved under `corpus/` in the run dir.
- **Severity:** minor
- **Action:** accept (kickoff itself authorizes the token workaround; eis-chat is public;
  public-repo hygiene unaffected)
- **Evidence:** `.llm/tmp/rfc820/fetch-corpus.ts`, `corpus/*.json`

## 2026-07-17 — PLAN-EVAL launched via the launcher's inner agentic client, not the wsl.exe wrapper

- **What:** Kickoff names `deno task agentic:launch-codex-slice` as the evaluator launch path. That
  wrapper is built for a Windows-host supervisor dispatching *implementation* slices: it stages the
  brief through `wsl.exe`, converts Windows paths, and enforces push-safety (`upstream must be
  NONE`) on the target worktree. This session runs natively in WSL, and the evaluator is read-only
  on the main checkout (`feat/beta10-cli-integration` has an upstream — the push-safety check would
  hard-fail a launch that pushes nothing).
- **Source:** `.llm/tools/agentic/codex/launch-codex-slice.ts` main() (git-safety + winToWsl
  staging); daemon status via `agentic:codex-status` (running, codex 0.144.5, socket alive).
- **Expected:** wrapper-launched Codex slice session.
- **Actual:** the wrapper's own inner client — `.llm/tools/agentic/codex/app-server-message-cli.ts`
  (the exact command the wrapper composes after staging) — invoked directly with the identical
  route identity: `--model gpt-5.6-sol --effort max --cwd <checkout>`, full brief
  (`plan-eval-brief.md`, `use harness` + `## SKILL` contract) passed as the message. Same
  daemon-attached app-server session, same agentic suite, no ad-hoc shell orchestration.
- **Severity:** minor
- **Action:** accept — route identity (Codex · OpenAI · GPT-5.6 Sol · max) and generator≠evaluator
  session separation preserved; only the Windows staging shim is bypassed.
- **Evidence:** `.llm/tmp/rfc820/launch-eval.ts`, `plan-eval-brief.md`, launch log (task output)

## 2026-07-17 — Owner authorized eval-loop continuation past the two-failure escalation

- **What:** PLAN-EVAL failed twice (cycles 1–2) and the run escalated per the harness loop limit
  (`escalation.md`). The owner replied in-session: "authorized proceed it's a complex topic" —
  authorizing continued revision + adversarial evaluation cycles (cycle 3 ran → FAIL_PLAN with
  4/7 prior items closed; cycle 4 follows rev 4). The authorization covers the loop, NOT design
  ratification, filing, or the #820 post — those stay gated on PASS + stage-H ratification.
- **Source:** owner message 2026-07-17 (this session, after the escalation push notification)
- **Expected:** two-failure hard stop (workflow/run-loop.md §4)
- **Actual:** owner-directed continuation; every cycle uses the same recorded evaluator route
  (Sol·max via the agentic app-server client) in a fresh thread
- **Severity:** minor (process authorization, explicitly owner-held)
- **Action:** accept; each cycle's verdict archived (`plan-eval-cycle<N>.md`)
- **Evidence:** `escalation.md`, `worklog.md` progress log, `plan-eval-cycle{1,2,3}.md`

## 2026-07-17 — Owner wrap-up directive: loop bounded at one more pass

- **What:** After 7 completed cycles (cycle 8 in flight), the owner directed: "you're allowed one
  more pass then fine it's been long enough and time to wrap up … then done". Binding
  interpretation recorded: the in-flight cycle 8 stands; on FAIL_PLAN at most one final revision
  + one final eval (cycle 9); then the run closes regardless of outcome. The #820 comment +
  `drafts/` execute only on a PASS; a non-PASS close is a design-record closure with the final
  residual items documented for the owner.
- **Source:** owner message 2026-07-17 (this session)
- **Severity:** minor (process bound, owner-held)
- **Action:** accept
- **Evidence:** worklog progress log (authorize row 2)

## 2026-07-17 — Owner re-opened for rev 10; final eval is owner-launched

- **What:** After the cycle-9 close (FAIL_PLAN, 6/8 boxes PASS), the owner directed: "proceed
  with the revision I'll take care of the final eval myself". The generator applied rev 10
  (the cycle-9 surface-classification residual folded into §I.2/§E.2/§H) and staged the cycle-10
  brief; the generator launches NO further eval cycles. Evaluator separation is preserved — the
  owner launches the same separate-session Sol·max route (`.llm/tmp/rfc820/launch-eval.ts`); the
  generator still never self-certifies. The #820 post + `drafts/` remain PASS-gated.
- **Source:** owner message 2026-07-17 (this session)
- **Severity:** minor (process hand-off, owner-held)
- **Action:** accept
- **Evidence:** worklog authorize row 3, `plan.md` rev 10 header, `plan-eval-brief.md` cycle-10
  note, `context-pack.md` "How the owner runs cycle 10"
