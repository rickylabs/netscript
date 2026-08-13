# Drift Log: NetScript Database Architecture and Prisma 8 RFC

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-13 — Issue #313 solution premise superseded

- **What:** The carried-in plan preserves classic Prisma and adds Prisma Next as an opt-in Postgres
  pilot. The owner now requires a clean architectural break with no backward-compatibility
  constraint.
- **Source:** GitHub issue #313 body and the current owner directive.
- **Expected:** Reuse #313's additive migration architecture.
- **Actual:** Reuse only its evidence/problem inventory; redesign the target architecture from
  current NetScript and Prisma 8 facts.
- **Severity:** architectural
- **Action:** rescope
- **Evidence:** <https://github.com/rickylabs/netscript/issues/313>

## 2026-08-13 — Final refinement lane override

- **What:** The final gate must use Fable 5 high and refine the RFC in place, not merely provide an
  adversarial report.
- **Source:** Current owner directive.
- **Expected:** Ordinary docs/evaluator routing would use Fable medium for final polish or formal
  evaluation.
- **Actual:** Owner-authorized Fable high is reserved as the absolute last substantive gate.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md` routes and override record.

## 2026-08-13 — Orchestration posture correction

- **What:** The root session performed too much of the research directly instead of using the
  harness as the orchestration layer.
- **Source:** Owner correction in the active session.
- **Expected:** Root research coordination followed by ordinary deep-analysis routing.
- **Actual:** The owner explicitly requires the root to orchestrate substantive independent work and
  requests Claude Code Opus 5 high with its workflow capabilities.
- **Severity:** significant
- **Action:** correct
- **Evidence:** native background session `3f8a9a69-5589-4b91-9a32-91f7770fe7c2`, observed as Opus 5
  high in `/home/codex/repos/netscript-db-rfc`; exclusive briefing at
  `briefs/claude-opus-architecture.md`.

## 2026-08-13 — Qwen child-route guard interruption

- **What:** The Qwen 3.8 Max falsification parent spawned read-only verification children; one child
  request attempted to use `claude-opus-5`, which is outside the evaluator child-model allowlist.
- **Source:** Evaluator HTTP-boundary audit and parent stream result.
- **Expected:** Parent and all child requests remain on the approved OpenRouter evaluator model set.
- **Actual:** The parent was observed as `qwen/qwen3.8-max` from provider `Alibaba`, but the denied
  child requested `claude-opus-5`; the guard aborted the run with exit code 78 before synthesis.
- **Severity:** significant
- **Action:** recover
- **Evidence:** `.llm/tmp/agentic/evaluator-policy/f5c1afd0-f89f-48e2-9dfc-3e8f5ade646b.jsonl`;
  parent session `f5c1afd0-f89f-48e2-9dfc-3e8f5ade646b`; recovery brief forbids every child-agent
  facility and requires single-parent synthesis on the same Qwen route.

## 2026-08-13 — Qwen recovery transport termination

- **What:** The single-parent Qwen recovery re-verified the NetScript claims and started the Prisma
  source audit, then its local exec/PTTY transport ended with signal 15 / exit 143 before report
  emission.
- **Source:** Unified exec session `30446` and the persisted recovery stream.
- **Expected:** One resumed turn completes the bounded falsification report.
- **Actual:** No second model-guard audit record exists; the run ended at a normal Qwen tool
  boundary while still on `qwen/qwen3.8-max`. All completed reasoning/tool results remain in session
  history.
- **Severity:** operational
- **Action:** recover
- **Evidence:** `.llm/tmp/qwen-prisma-risk-review-resume.jsonl`; evaluator audit remains a single
  earlier `claude-opus-5` denial; finish brief requires immediate single-parent synthesis with no
  broad re-audit.

## 2026-08-13 — Opus background-parent bridge exit

- **What:** The resumed native Opus background parent re-established specialist work, but the
  background service exited at a bridge/task-notification boundary before synthesizing the report.
- **Source:** Native sessions `3f8a9a69-5589-4b91-9a32-91f7770fe7c2` and
  `f79af5bb-e953-4aae-9585-a1c83e73a00d`, their subagent transcripts, and the unchanged placeholder.
- **Expected:** Parent remains attached after its read-only workflow fan-out and writes one report.
- **Actual:** Several specialist reports completed and are persisted, while several in-flight
  children were killed; the parent disappeared from `claude agents` at the bridge boundary.
- **Severity:** operational
- **Action:** recover
- **Evidence:** Resume the same Opus 5 high evidence chain in non-background print mode, forbid all
  further child facilities, and require immediate one-file synthesis.

## 2026-08-13 — Grok 4.6 adversarial lane override

- **What:** The owner requires Grok 4.6 high in the review loop.
- **Source:** Active owner directive and live OpenRouter model metadata.
- **Expected:** The initial optional-model note allowed Grok only if an observable compliant route
  already existed; the checked-in catalog currently stops at `x-ai/grok-4.5`.
- **Actual:** OpenRouter's live `/api/v1/models` response exposes `x-ai/grok-4.6`, 500k context, and
  `reasoning_effort`; the bounded OpenCode runner accepts an explicit model and high variant without
  changing production harness configuration.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Owner-directed post-draft adversarial lane using
  `openrouter/x-ai/grok-4.6 --variant high`; capture raw route receipt and observed identity. It
  runs before IMPL-EVAL and the absolute-final Fable refinement.

## 2026-08-13 — Prisma evidence checkout moved to trash and restored

- **What:** During terminal model synthesis, the untracked pinned Prisma source checkout was moved
  from `.llm/tmp/prisma-v8-rc1` to the desktop trash.
- **Source:** Freedesktop trash metadata recorded the exact original path and deletion timestamp
  `2026-08-13T18:43:58`; no matching explicit deletion command appears in the preserved lane
  transcripts.
- **Expected:** The source checkout remains available through report reconciliation and evaluation.
- **Actual:** Tracked run/research files were unaffected. The checkout was immediately restored with
  the recoverable trash restore operation and verified at RC tag commit
  `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5`; post-RC main pin `71e2e0d...` remains present.
- **Severity:** operational
- **Action:** recover
- **Evidence:** `gio trash --list` original-path record; post-restore `git rev-parse HEAD` and
  `git cat-file -t 71e2e0d9ee1f306b5a11435cd1973023cb33866a`.

## 2026-08-13 — Opus monolithic report write interrupted

- **What:** The attached non-background Opus synthesis reached “Writing the complete report now” but
  the transport received signal 15 before the large `Write` tool call was emitted or persisted.
- **Source:** Native print session `f79af5bb-e953-4aae-9585-a1c83e73a00d`, exit 143 after 497845ms;
  transcript ends before a report `Write` tool-use envelope.
- **Expected:** One bounded parent turn replaces the placeholder.
- **Actual:** Evidence and reasoning are preserved, but the all-or-nothing payload was not. The
  placeholder remained unchanged.
- **Severity:** operational
- **Action:** recover
- **Evidence:** Resume the same Opus 5 high session for three strictly bounded single-tool writes to
  one report, joined by explicit continuation markers; no additional research or subagents.

## 2026-08-13 — Prisma evidence checkout moved to trash a second time

- **What:** After the first safe restore, the same untracked pinned Prisma checkout was moved back
  to the desktop trash at `2026-08-13T18:47:23` while delegated source audits were active.
- **Source:** `/home/codex/.local/share/Trash/info/prisma-v8-rc1.trashinfo`; the recorded original
  path is `.llm/tmp/prisma-v8-rc1` and the intact checkout still resolves RC HEAD `a76a6c5...`.
- **Expected:** The restored evidence checkout remains at its run-local path.
- **Actual:** No tracked file was affected. Auditors can still read the intact recoverable trash
  copy, so moving it again during their reads would create avoidable disruption.
- **Severity:** operational
- **Action:** recover after active source audits finish, then verify RC HEAD and post-RC main object
  again. Treat the trash copy as read-only evidence until then.
- **Evidence:** filesystem path and `.trashinfo` above; `git -C` against the trash copy returned
  `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5`.
