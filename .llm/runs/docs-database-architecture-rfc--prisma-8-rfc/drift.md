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
- **Action:** recovered after both source audits finished. GIO no longer enumerated the intact trash
  item despite its file and metadata being present, so it was moved directly back to the exact
  recorded run-local path.
- **Evidence:** post-recovery `git -C .llm/tmp/prisma-v8-rc1 rev-parse HEAD` returned
  `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5`; `git cat-file` verified post-RC object
  `71e2e0d9ee1f306b5a11435cd1973023cb33866a`.

## 2026-08-13 — Opus bounded synthesis completed

- **What:** The resumed native Opus report was successfully written in three bounded, marker-joined
  sections after the monolithic write failure.
- **Source:** Native Claude Code session `f79af5bb-e953-4aae-9585-a1c83e73a00d`, observed model
  `claude-opus-5`, effort `high`.
- **Expected:** One independent architecture report that preserves route/workflow provenance and
  feeds plan lock without acting as PLAN-EVAL.
- **Actual:** `research/claude-opus-architecture-review.md` is complete at sixteen top-level
  sections with no continuation marker. It records incomplete specialist lanes honestly and marks
  carried Prisma claims that need the separate source-audit ledger.
- **Severity:** operational recovery
- **Action:** accept as a research input; reconcile its broader validation assumptions against the
  later pinned-source validation audit before plan lock.
- **Evidence:** report section index and native turn receipts for parts 1–3.

## 2026-08-13 — Raw RFC requires owner-directed consolidation

- **What:** The evidence-complete authoring pass produced a 28,194-word RFC, while the owner
  requires a short, specific decision document focused on API, DX, type safety, contract-first
  composition, and plugin contribution.
- **Source:** Raw RFC commit `05e5fbac2`; owner direction in the active session; root review
  `reviews/root-rfc-review.md`.
- **Expected:** The author brief required complete coverage but did not impose a reader-facing word
  ceiling.
- **Actual:** The draft correctly preserves research and decisions but duplicates run evidence,
  gates, process, and source traces that belong behind links.
- **Severity:** editorial/significant.
- **Action:** accept the raw document only as an evidence draft; resume Opus 5 high with a strict
  8,000–10,000-word target and 12,000-word hard ceiling, apply root findings R1–R10, then continue
  Qwen → Grok → dispositions → final Fable review order.
- **Evidence:** `briefs/claude-opus-rfc-consolidate.md`; no architecture decision is reopened.

## 2026-08-14 — Owner reinstated one final Fable refinement gate

- **What:** The owner superseded the prior no-Claude/Fable directive for exactly one fresh final
  Fable 5 high evaluation/refinement gate at the next midnight.
- **Expected:** The previous run-state override cancelled the originally planned Fable gate.
- **Actual:** A one-shot native Fable 5 high launch is scheduled for 2026-08-15 00:00 Europe/Zurich
  through systemd user unit `netscript-db-rfc-final-fable-20260815`.
- **Severity:** significant owner override.
- **Action:** run only the persisted final-evaluator brief; prohibit subagents, workflows, resumes,
  and fallback models; require a clean committed/pushed close gate. All other Claude use stays
  frozen.
- **Evidence:** `briefs/fable-final-evaluator.md` and `workflows/launch-final-fable.sh`.

## 2026-08-15 — Final Fable gate executed; verdict PASS with one refinement

- **What:** The owner-reinstated one-shot fresh native Fable 5 high evaluator/refiner ran as the
  absolute-final substantive gate, superseding the earlier Claude/Fable cancellation for exactly
  this gate. The cancellation remains historical provenance; all other Claude use stays frozen.
- **Source:** Owner directive 2026-08-14; unit `netscript-db-rfc-final-fable-20260815`;
  `briefs/fable-final-evaluator.md`; native session `3517a6d2-b0b5-47ec-a207-b3533657a90c`.
- **Expected:** Evaluate the checked-out RFC at the exact remote tip; refine only within D-01–D-47
  and `OWNER-DX-01`; no subagents, workflows, resumes, or fallback models.
- **Actual:** Starting commit `a7a6887c2` (verified equal to the fetched remote tip). The full RFC,
  run artifacts, three reviews, and three audits were read; the load-bearing pinned RC1 claims were
  independently re-verified (138 export keys, phantom type maps at `types.ts:207`, namespace
  flattening, demo helper spellings). One example-level defect was found and repaired: Step 1's
  `pgvector({ dimensions: 1536 })` invented an extension-level dimension option that pgvector and
  the pinned demo do not have; the call is now `pgvector()` and the Step 6 declaration takes
  `options?`. No decision was reopened. Verdict: **`PASS`** in `evaluate.md`; targeted fmt,
  `docs:links` (103 docs, 0 broken), `git diff --check`, and fence balance all green post-edit. The
  unit exited `Result=success`/status 0 with terminal reason `completed` and no permission denials;
  stream receipt SHA-256 is `9939f19d8c66981eadb2589ffdce0f2a3025f24e92ebfb5982a6f24d115cdff3`; gate
  `cc90ead70` was the pushed remote and live PR head at gate close.
- **Severity:** none — gate completed as authorized.
- **Action:** close the run; draft PR #1640 stays draft for owner review.
- **Evidence:** `evaluate.md`; this gate's commit on `docs/database-architecture-rfc`.

## 2026-08-31 — Acceptance-date repair: renumber, upstream re-baseline, artifact reconciliation

- **What:** The RFC sat eighteen days between draft (2026-08-13) and acceptance (2026-08-31). An
  independent audit ruled **repair, not close**. This entry records the repair, not a new design
  decision: no locked decision (D-01–D-47, `OWNER-DX-01`) was reopened, and the clean-break Prisma 8
  direction the owner ratified is unchanged.
- **Source:** Owner ratification of the clean-break direction; the independent audit's REPAIR
  verdict; upstream evidence re-fetched on 2026-08-31 (see `worklog.md` § Acceptance-date upstream
  re-baseline for the full citation table).
- **Expected:** The draft's pinned `v8.0.0-rc.1` observations still describe the current upstream
  surface.
- **Actual:** They do not, in six places. Prisma 8 is still **not GA** (`prisma` npm `latest` is
  `8.0.0-rc.12`, `prev` is `7.10.0`), the CLI and ORM version lines have separated
  (`prisma@8.0.0-rc.12` depends on `@prisma/orm-toolchain@8.0.0-rc.8`), the CLI package and config
  file were renamed, ORM pagination was renamed `.take`/`.skip` → `.limit`/`.offset` at `rc.7`, the
  whole-query raw-SQL lane moved from `db.sql.raw` to `db.raw.sql` at `rc.4`, and temporal fields
  now surface as `Temporal.Instant` rather than `Date`. Upstream's own per-transition upgrade notes
  itemise twenty-eight breaking changes across `rc.1 → rc.8`. Separately, upstream has since
  published an exit-code contract that independently converges on this RFC's own "an exit code is
  not a result" law.
- **Severity:** documentation accuracy — no architectural drift. Every correction strengthens the
  adapter-insulation argument the RFC already makes; none weakens or reverses a decision.
- **Action:** corrected in place. `rfcs/0006-database-architecture.md` gained a
  `§ Upstream
  re-baseline (2026-08-31)` section carrying the delta table, the
  re-verified-unchanged list, and the two things that could **not** be verified (no announced GA
  date; no Prisma 8 page stating a minimum PostgreSQL version — the `supported-databases` pages
  still serve Prisma 7 content). The `.take(limit)` example in Step 3 was corrected to
  `.limit(limit)`.
- **Evidence:** `worklog.md` § Acceptance-date upstream re-baseline; the `rc8-*`, `npm-*`, and
  `p8-*` link definitions at the foot of the RFC.

## 2026-08-31 — RFC number assigned; file renamed

- **What:** The RFC was assigned **0006** at acceptance and `status` moved `Draft` → `Accepted`, per
  `rfcs/README.md` § Numbering ("RFC numbers are assigned by a maintainer at acceptance").
- **Expected:** A drafting-time `0000-` filename is not a merged artifact.
- **Actual:** `git mv rfcs/0000-database-architecture.md rfcs/0006-database-architecture.md`;
  frontmatter `rfc: 0006`, `status: Accepted`; `rfcs/README.md` § Canonical location updated from
  "Numbered RFCs 0001 through 0005" to "0001 through 0006".
- **Severity:** process — expected at acceptance.
- **Action:** applied. Tracking issue **#313 stays open** and was rewritten in place to be the
  clean-break implementation epic RFC 0006 defines; it carries **no** closing keyword, and its
  labels and `Backlog / Triage` milestone are preserved.
- **Evidence:** `rfcs/0006-database-architecture.md` frontmatter and process note; `rfcs/README.md`;
  <https://github.com/rickylabs/netscript/issues/313>.
- **Not rewritten:** the historical `rfcs/0000-database-architecture.md` path in `plan.md`,
  `plan-eval.md`, `evaluate.md`, `reviews/`, and `briefs/`. Those record what each session actually
  evaluated at the time; retconning the path would falsify the review trail. Only forward-looking
  artifacts (`context-pack.md`, `worklog.md`, this log) name the accepted path.

## 2026-08-31 — Prohibited run artifact removed: `workflows/launch-final-fable.sh`

- **What:** The run dir carried an executable launcher, `workflows/launch-final-fable.sh`, committed
  alongside the design record.
- **Source:** `AGENTS.md` § Default Operating Workflow ("Drive lanes through the agentic suite …
  `.llm/tools/agentic/` is the only interface for launching/watching/steering Codex … never ad-hoc
  `wsl.exe`/PowerShell") and § Tooling ("reusable helper scripts belong in `.llm/tools/` or
  `tools/`"; "Temporary scratch/output belongs in `.llm/tmp/`"). `.agents/skills/netscript-harness`
  § Run Artifacts enumerates the run-artifact set; an operational launcher is not in it.
- **Expected:** A run dir holds plan, research, review, verdict, and drift records.
- **Actual:** The file was an ad-hoc lane launcher outside the sanctioned suite. It hardcoded one
  machine's layout — `repo='/home/codex/repos/netscript-db-rfc'`,
  `deno_bin='/home/codex/.deno/bin/deno'`, and an exported `HOME`/`PATH` under `/home/codex` — so it
  is unrunnable anywhere else and, once merged to `main`, would read as a sanctioned pattern. It
  also wrote captured stream logs into `.llm/tmp/`. Seven other tracked `.sh` files exist under
  `.llm/runs/` across 229 committed run directories — four benchmark harnesses, two evidence
  scripts, and one test fixture — so a shell script in a run dir is not itself anomalous; a script
  that _launches an agent lane_ outside `.llm/tools/agentic/` is, and this was the only one.
- **Severity:** repository hygiene — no evidence value lost. The script only _invoked_ the final
  gate; the gate's brief (`briefs/fable-final-evaluator.md`), its verdict (`evaluate.md`), and its
  drift entry are all retained.
- **Action:** removed with `git rm`. The earlier drift entry that cites the script as evidence is
  left exactly as written — this log is append-only, and that entry is a true record of what existed
  at the time.
- **Evidence:** the deletion in this PR's diff; the retained `briefs/fable-final-evaluator.md` and
  `evaluate.md`.

## 2026-08-31 — Artifacts reviewed and deliberately RETAINED

- **What:** The other 42 files in the run directory were reviewed against the same rules before
  anything was removed.
- **Actual:** Nothing else met the bar for removal, and three categories were explicitly kept rather
  than trimmed:
  - **Machine-specific paths in `supervisor.md`, `plan-eval.md`, and `briefs/`.** The harness
    template defines `supervisor.md` as "supervisor identity (model, session, host, **paths**,
    branch, baseline, lanes)". Host paths there are required content, not leakage.
  - **Session ids, PIDs, sub-agent handles, and the lost-subagent disclosure in
    `research/claude-opus-architecture-review.md` (166 KB).** This is a design/research report whose
    § 1 is a truthful provenance disclosure — five of six sub-agents returned nothing, and the
    report marks every carried-but-unreverified claim. Trimming that would delete the honesty that
    makes the rest of the report auditable. It is prose, not a captured transcript or log.
  - **The `2026-08-13` trash-path drift entries.** They cite `/home/codex/.local/share/Trash/…`
    because that is where the evidence checkout actually went. A drift log that launders the path
    stops being a drift log.
- **Scanned and found absent:** credentials, API keys, bearer tokens, connection strings with
  passwords, `.env` content, captured stream/stdout logs, gate-receipt JSON, and leak-check reports.
- **Severity:** none.
- **Evidence:** the 42 retained run-directory files; `.agents/skills/netscript-harness` § Run
  Artifacts.

## 2026-08-31 — Delta IMPL-EVAL findings remediated before merge

- **What:** A fresh delta IMPL-EVAL (`z-ai/glm-5.3-flash`, effort max, separate session) evaluated
  head `fcea90222` and returned **PASS** with six non-blocking accuracy findings against the
  repair's own prose. Because factual accuracy is the entire point of this repair, all six were
  corrected before merge rather than deferred.
- **Source:** IMPL-EVAL comment on PR #1640
  (<https://github.com/rickylabs/netscript/pull/1640#issuecomment-5480686823>).
- **Actual — the six corrections:**
  - **F-08 (low).** "22 breaking-change entries across `rc.1 → rc.8`" was a bad sum; the
    per-transition breakdown (14 + 0 + 4 + 2 + 4 + 2 + 2) is **28**. Corrected in the RFC,
    `worklog.md`, `drift.md`, `context-pack.md`, the PR body, and #313. The error **understated**
    upstream churn.
  - **F-09 (low).** The database-tier statement was attributed to `scorecard.md`; it is actually in
    the project `README.md` at both revisions — `scorecard.md` is the per-feature matrix. Citation
    corrected in the re-baseline and in the original Motivation bullet that inherited it. The facts
    were true; the citation was not.
  - **F-10 (medium).** "the only `.sh` file in any of the 228 committed run directories" was
    **false**: seven other tracked `.sh` files exist across 229 run directories. Restated
    accurately. The removal itself never rested on that count — it rests on the cited `AGENTS.md`
    and harness rules and on the script's own hardcoded `/home/codex` layout.
  - **F-14 (medium).** `worklog.md` still named `rfcs/0000-database-architecture.md` as the
    "Canonical RFC record", contradicting this log's own claim that forward-looking artifacts name
    the accepted path. Corrected to `rfcs/0006-database-architecture.md` with the draft path noted.
  - **F-24 (low).** "the other 43 files" was off by one: 43 files existed in the run directory at
    `d63a95e9a`, so **42** are retained. Corrected.
  - **F-27 (low).** The DoD claimed three unverifiable items were named "in the RFC and
    `worklog.md`"; the RFC named two (the SIGINT exit code was never claimed in the RFC, so there
    was nothing to mark there). Wording corrected in both the RFC and the PR body.
- **Severity:** documentation accuracy. No finding was a blocker, none touched a decision, and none
  changed the outcome of any gate.
- **Action:** all six corrected; the corrections are the only delta between the PASS-evaluated head
  `fcea90222` and the final head. Recorded here rather than silently folded in.
- **Evidence:** the IMPL-EVAL comment above; this PR's final diff.
