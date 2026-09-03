use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md` and `.llm/harness/workflow/doc-audit.md`.

You are the **audit lane** for the `docs_audit` profile: Codex · OpenAI · GPT-5.6 Sol · medium,
**opposite-family** to the Claude session that authored this changeset. Effort is `medium`; this is
a small changeset (one source file plus its generated mirrors), so the `large_changeset` escalation
to `high` does not apply.

**One single pass over the entire changeset.** You are the accuracy gate, not a prose polisher — the
Fable polish lane is a separate later step. Do not rewrite prose for style.

Worktree `/home/agent/projects/netscript/worktrees/007-audit-1907`, detached at `3ef8db828`.
This is PR #1907 (`docs/aspire-event-doctrine`). Read it: `gh pr view 1907 --repo rickylabs/netscript`.

Record findings and a `## Gate log` in
`.llm/runs/docs-aspire-event-doctrine--audit/audit.md` (append below), and post your verdict as a PR
comment. Verdict must be exactly `PASS_IMPL` or `FAIL_IMPL` with per-claim results.

## What the changeset is

`.agents/skills/aspire/SKILL.md` (source) + `.claude/skills/aspire/SKILL.md` (generated mirror) gain
a section making Aspire's event system the required observation surface, plus one rule in
*Important rules*. `.claude/skills/netscript-harness/SKILL.md` is also regenerated.

Diff base: `git diff origin/main...HEAD`.

## Why this audit matters more than usual

The authoring session got Aspire's capabilities **wrong twice** in this run: it claimed no native
health-departure signal existed (based only on `aspire wait --help`), and it initially implied
`onResourceReady` was a general readiness signal. The repository owner caught both. This changeset is
the correction, and if it is also wrong it will institutionalise the error in a skill that every
future agent reads.

**Verify every factual claim independently against Aspire itself** — `aspire docs search` /
`aspire docs get`, `aspire <cmd> --help`, and the SDK surface in
`.aspire/modules/aspire.mts` inside any scaffolded project under `.llm/tmp/cli-e2e/`. Do not accept a
claim because the diff asserts it.

## Claims to verify (this is the gate)

1. `ResourceReadyEvent` is raised when a resource **initially** transitions to ready — i.e. one-shot,
   and therefore cannot observe a departure→recovery cycle.
2. The eventing system contains **no health-change event**.
3. `IDistributedApplicationEventingSubscriber` / `AddEventingSubscriber` changes **where** you
   subscribe from, not **when** events fire.
4. The per-resource event handles exist and are named correctly: `onResourceReady`,
   `onResourceStopped`, `onBeforeResourceStarted`, `onInitializeResource`,
   `onConnectionStringAvailable`, `onResourceEndpointsAllocated`; app-level via `builder.eventing()`.
5. `ResourceNotificationService` (via `builder.notifications()`) exposes `waitForResourceHealthy`,
   `waitForResourceStates(name, targetStates[])`, `waitForResourceState`, `tryGetResourceState`,
   `publishResourceUpdate`, and `ResourceEventDto` carries `healthStatus`.
6. `aspire describe --follow --format Json` streams NDJSON, one object per line, carrying state and
   health; snapshot mode wraps in `{ "resources": [...] }`.
7. `aspire wait --status` accepts only `healthy|up|down` and answers from the last completed
   evaluation. (The "1409 ms" figure is this run's own CI measurement, not an upstream claim —
   check it is presented as such and not as documentation.)
8. Any claim that is **stated more strongly than the evidence supports** is a FAIL finding. Flag
   anything asserted as documented that is actually inferred.

## Changeset-scope checks

- **No content lost.** Every heading, bullet and table row present before the change is still
  present. Compare against `git show origin/main:.agents/skills/aspire/SKILL.md`. The `#1855`
  DCP network/volume cleanup section must survive.
- **Table integrity.** A resource-command cell contains escaped pipes (`start\|stop\|restart`).
  Confirm it renders as one cell and survives `deno fmt` — i.e. `deno fmt --check` stays clean and
  the row is not truncated.
- **Mirror fidelity.** `.claude/skills/**` is generated from `.agents/skills/**`. Confirm the mirror
  matches its source and was not hand-edited.
- **Unrelated inclusion.** `.claude/skills/netscript-harness/SKILL.md` is included. Verify it is
  **reflow only** (no semantic change) and that the PR body declares it. If it carries a semantic
  change, that is a FAIL finding.
- **Internal consistency.** The doc must not contradict itself — in particular the ordering of the
  observation hierarchy versus the one-shot caveat.

## Do NOT re-run already-green implementation gates

Per coordinator directive. These are green at this head and must not be repeated:
`agentic:sync-claude:check`, `check:assets-barrel`, `validate-claude-surface.ts`, `deno fmt --check`
on the two skill files. Cite them as already-green; spend your budget on accuracy instead.

Documentation only — no `packages/` or `plugins/` source is touched. Do not fix anything yourself:
under `doc-audit.md` fixes are made by the resumed generator session, not the auditor.

---

# Audit result — 2026-09-02

FAIL_IMPL

Audit lane: `docs_audit` — Codex · OpenAI · GPT-5.6 Sol · medium. This was one single
opposite-family pass over `origin/main...3ef8db828`; the small changeset did not trigger the
`large_changeset` effort escalation.

## Findings

1. **FAIL — the TypeScript app-event subscription surface is documented incorrectly.**
   `.agents/skills/aspire/SKILL.md:168-169` says app-level events come from
   `builder.eventing()` and names `onBeforeStart`, `onAfterResourcesCreated`, `onBeforePublish`, and
   `onAfterPublish`. In a fresh Aspire 13.5.3 TypeScript scaffold, `builder.eventing()` returns
   `DistributedApplicationEventing`, whose generated public surface only exposes `unsubscribe`.
   Inline subscriptions are `builder.subscribeBeforeStart`, `builder.subscribeAfterResourcesCreated`,
   `builder.subscribeBeforePublish`, and `builder.subscribeAfterPublish`. The `on*` names exist on
   the registration context passed to `builder.addEventingSubscriber(...)`. The upstream
   `apphost-eventing-apis` page documents the same distinction.
2. **FAIL — the notification-service departure claim is stronger than its API.**
   `.agents/skills/aspire/SKILL.md:183-185` concludes that because
   `waitForResourceStates` accepts arbitrary target states and `ResourceEventDto` carries
   `healthStatus`, “both arrival and departure are natively expressible.” The generated SDK and
   Aspire API docs show that `targetStates` are lifecycle-state strings; `healthStatus` is output
   data, not a wait target. `waitForResourceHealthy` expresses health arrival, while the listed
   methods do not provide a health-departure subscription/wait. `publishResourceUpdate` likewise
   accepts state/stateStyle, not health. The later `describe --follow` stream can express repeated
   health transitions, but that does not make the section-2 claim true.
3. **FAIL — the resource-event order statement is false.**
   `.agents/skills/aspire/SKILL.md:151-166` says the resource events are raised “in the order listed
   below,” but the table lists Ready → Stopped → BeforeStarted → Initialize → ConnectionString →
   Endpoints. Aspire's own `apphost-eventing-apis` page gives the startup order as Initialize →
   EndpointsAllocated → ConnectionStringAvailable → BeforeResourceStarted → Ready; Stopped is a
   separate post-stop event.
4. **FAIL — “Every resource builder” overstates capability-specific handles.**
   `.agents/skills/aspire/SKILL.md:151-166` presents all six handles after saying every resource
   builder exposes them. The generated SDK's base `Resource` surface has the common lifecycle
   handles, while `onConnectionStringAvailable` is on `ResourceWithConnectionString` and
   `onResourceEndpointsAllocated` is on `ResourceWithEndpoints` (and concrete types with those
   capabilities). The handle names exist, but they are not uniformly present on every builder.
5. **FAIL — the observation hierarchy contradicts itself.** The introduction says to descend only
   when the higher layer cannot express the observation (`:146-147`); section 1 correctly sends
   repeated transitions to section 3 (`:154-157`), while section 2 later claims it can express
   health departure (`:183-185`). Correcting finding 2 resolves this contradiction.
6. **FAIL — the unrelated harness mirror is not reflow-only.** Relative to `origin/main`,
   `.claude/skills/netscript-harness/SKILL.md:189-194` adds a seven-line semantic policy paragraph
   covering run-artifact retention, secrets, and cleanup ownership. The current mirror exactly
   matches `.agents/skills/netscript-harness/SKILL.md`, so this is real stale-mirror synchronization,
   not a hand edit; however, the PR body explicitly calls the delta “reflow only — no content
   change,” which is false under the requested changeset-scope gate.

## Per-claim results

| # | Result | Evidence |
| - | ------ | -------- |
| 1 | PASS | Aspire docs and generated SDK say `ResourceReadyEvent` is raised on the initial ready transition and is fired only the first time after starting; it cannot represent a departure→recovery cycle. |
| 2 | PASS | The built-in event list and all exported event interfaces in Aspire 13.5.3 contain no health-change event. Health is represented on notification/resource snapshots instead. |
| 3 | PASS | `apphost-eventing-apis` says the subscriber approach responds to the same lifecycle moments; `AddEventingSubscriber` / `addEventingSubscriber` relocates registration into a service/callback and does not redefine dispatch timing. |
| 4 | FAIL | All six resource handle names exist, but the app-level `builder.eventing() → on*` claim is wrong for the generated TypeScript SDK. Inline app subscriptions use `builder.subscribe*`; `on*` belongs to the `addEventingSubscriber` registration context. The surrounding “every resource builder” statement is also overbroad. |
| 5 | PASS | The generated `ResourceNotificationService` exposes all five named methods; `ResourceEventDto` has `resourceName`, `resourceId`, `state`, `stateStyle`, `healthStatus`, and `exitCode`. This PASS is only for the enumerated surface, not the separate departure inference in finding 2. |
| 6 | PASS | A live Aspire 13.5.3 TypeScript starter showed snapshot mode as one `{ "resources": [...] }` document and follow mode as newline-delimited single-resource JSON objects; observed lines carried `state` and, after evaluation, `healthStatus`. |
| 7 | PASS | `aspire wait --help` and `aspire docs get aspire-wait-command` restrict status to `healthy`, `up`, or `down`. The command evaluates the current completed resource snapshot before continuing on its real-time state stream, so a previously satisfied health evaluation can win before a newly induced health change is evaluated. The `1409 ms` sentence is presented as a measured real case, not as an upstream quotation. |
| 8 | FAIL | Findings 1–6 identify claims stronger than the primary evidence, including the notification departure inference, universal-builder wording, event order, and “reflow-only” characterization. |

## Changeset-scope checks

- **No content lost — PASS.** A structural comparison against
  `git show origin/main:.agents/skills/aspire/SKILL.md` found 0 missing headings (12/12), bullets
  (12/12), or table rows (29/29). The `#1855` DCP network/volume cleanup section remains.
- **Table integrity — PASS.** The `start\|stop\|restart` row parses as exactly two cells and retains
  the complete command. The coordinator-provided scoped `deno fmt --check` result at this head is
  already green and was not rerun.
- **Mirror fidelity — PASS.** Byte comparisons show the Aspire source/mirror and harness
  source/mirror are each identical at this head.
- **Unrelated inclusion — FAIL.** The PR body declares the harness mirror, but incorrectly calls it
  reflow-only; it adds the semantic retention/secret/cleanup paragraph described above.
- **Internal consistency — FAIL.** Section 1 directs repeated transitions to section 3, while
  section 2 claims health departure is expressible through APIs that cannot await health departure.

## Already-green implementation gates (not rerun)

Per coordinator directive: `agentic:sync-claude:check`, `check:assets-barrel`,
`validate-claude-surface.ts`, and scoped `deno fmt --check` on the two skill files were cited from
the green head evidence and not repeated.

## Gate log

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
| ---- | ---------- | ----- | ------ | -------- | --------- |
| `deno task docs:links` | `deno task docs:links` | Repository internal links/anchors; 103 docs | PASS | 0 broken links, 0 broken anchors; no site pages changed | Recorded; no fix |
| Site build (Lume) clean | `git diff --name-only origin/main...HEAD` | Site-build applicability | PASS | Only `.agents/skills/**` and `.claude/skills/**` changed; no Lume/site input exists in the changeset | Marked not applicable; no build invented |
| Internal-wording grep | `git diff --unified=0 origin/main...HEAD -- <three changed files> \| rg '^\\+[^+]' \| rg -n 'jsr:@netscript/\|#(?:[0-9]+)\|D-101\|beta\\.\|harness run\|PLAN-EVAL\|IMPL-EVAL'` plus base comparison | Added lines in all three internal skill files | PASS | Matches were pre-existing issue references or harness wording exposed by reflow/sync; no new public page or public-doc leakage | Recorded; no prose polish |
| Versionless-specifier scan | Same changed-line scan for `jsr:@netscript/` | Added lines | PASS | No versionless NetScript specifier added | Recorded; no fix |
| Command/API accuracy sampling | `aspire --version`; `aspire describe --help`; `aspire wait --help`; `aspire docs search/get`; `aspire docs api search/get`; generated-SDK `rg`/`sed`; live `aspire start`, `describe`, `describe --follow`, `wait`, resource stop/start | Every documented Aspire command/API family added by the changeset | FAIL | Incorrect app-event access path; unsupported health-departure inference; false event ordering; universal-builder overstatement | Flagged for resumed generator; auditor made no source fix |
| Template ↔ generated drift | `cmp -s .agents/skills/aspire/SKILL.md .claude/skills/aspire/SKILL.md`; equivalent harness comparison | Both generated mirrors | PASS | Both mirrors byte-match their sources; already-green generator checks were not rerun | Recorded semantic stale-sync finding separately |
| Nav / front-matter wiring | `git diff --name-only origin/main...HEAD`; front-matter inspection in whole-diff pass | Three existing skill files; no new page | PASS | Existing skill front matter retained; no nav/page wiring applies | Recorded; no fix |
| Prose-quality pass | Whole changeset read; structural heading/bullet/table comparison | Changed skill prose, accuracy only | FAIL | Event-order sentence and hierarchy are logically inconsistent; style rewriting intentionally deferred to Fable | Flagged for generator; no prose rewrite |
| Cross-page contradiction check | Whole-diff comparison, Aspire docs, generated SDK, source↔mirror comparisons | Source skill, mirrors, PR declaration, upstream Aspire surfaces | FAIL | Skill conflicts with generated TypeScript SDK and contradicts its own section ordering; PR's reflow-only declaration conflicts with its diff | Flagged for generator; blocked PASS |

---

# Re-anchored audit result — 2026-09-02

FAIL_IMPL

Exact audited head: `bf251bf0ead3fe282f9917ecaf3eca8a58552c4d` (`bf251bf0e`). The worktree was
re-anchored with `git fetch origin docs/aspire-event-doctrine` and
`git checkout --detach bf251bf0e` before this verdict. Audit lane remains `docs_audit` — Codex ·
OpenAI · GPT-5.6 Sol · medium, opposite-family to the Claude generator; the changeset remains small,
so `large_changeset` escalation does not apply.

This entry supersedes the verdict at `3ef8db828` for head currency. It preserves that entry as the
historical first pass rather than rewriting it.

## Re-anchor finding

**PASS — the section-4 `aspire wait` correction is accurate at `bf251bf0e`.**
`.agents/skills/aspire/SKILL.md:210-234` now agrees with `aspire docs get aspire-wait-command`:

- the command connects through the AppHost backchannel and streams resource-state changes in real
  time;
- it validates the resource name before entering the wait loop;
- `healthy` means running-and-healthy **or** running with no configured health checks, so exit 0
  does not prove a health check ran;
- exit codes are 0 (target reached), 7 (no running AppHost), 17 (timeout), and 18 (failed/terminal
  while awaiting `up`/`healthy`);
- the repo's 1409 ms observation is explicitly presented as a local measurement and attributed to
  periodic health-evaluation lag, not to stale-cache mechanics.

The operational warning remains proportionate: the state stream is real-time, while a health value
cannot change until the next health evaluation. It is therefore valid to use `wait` for arrival and
the transition stream for an induced departure/recovery assertion.

## Blocking findings still present at `bf251bf0e`

1. **Incorrect TypeScript app-event access path:** `.agents/skills/aspire/SKILL.md:168-169` still
   says `builder.eventing() → onBeforeStart/onAfterResourcesCreated/onBeforePublish/onAfterPublish`.
   The generated 13.5.3 SDK exposes inline subscriptions as `builder.subscribe*`; the `on*` methods
   belong to the `addEventingSubscriber` registration context. `builder.eventing()` itself exposes
   `unsubscribe`, not those subscription methods.
2. **Unsupported notification-service health-departure inference:** lines 183-185 still infer that
   lifecycle `targetStates[]` plus returned `healthStatus` makes health departure awaitable. The
   listed API has a health-arrival wait, not a health-departure wait.
3. **False resource-event ordering:** lines 151-166 still claim the table is chronological, but the
   documented startup order is Initialize → EndpointsAllocated → ConnectionStringAvailable →
   BeforeResourceStarted → Ready; Stopped is separate.
4. **Universal-builder overstatement:** lines 151-166 still imply all builders have all six handles;
   connection-string and endpoint callbacks are capability-specific.
5. **Internal hierarchy contradiction:** section 1 routes repeated transitions to section 3 while
   section 2 still claims health departure is expressible through its listed waits.
6. **Harness mirror is still mischaracterized:** `.claude/skills/netscript-harness/SKILL.md:189-194`
   still adds semantic retention/secrets/cleanup policy relative to `origin/main`, although the PR
   body calls the delta reflow-only.
7. **PR body is stale against the corrected head:** it still says `aspire wait` “answers from the
   last completed evaluation” and presents the old cache framing, contradicting both `bf251bf0e` and
   the Aspire command reference. It also retains the incorrect `builder.eventing()` and
   reflow-only summaries.

## Per-claim results at `bf251bf0e`

| # | Result | Evidence |
| - | ------ | -------- |
| 1 | PASS | `ResourceReadyEvent` remains documented/generated as the initial, first-only ready transition. |
| 2 | PASS | Aspire's built-in event list and generated exported events still contain no health-change event. |
| 3 | PASS | Subscriber registration changes the subscription location, not the lifecycle moments. |
| 4 | FAIL | Resource handle names exist, but the app-level `builder.eventing() → on*` path is wrong and “every resource builder” is overbroad. |
| 5 | PASS | All five named notification APIs and `ResourceEventDto.healthStatus` exist; this does not validate the separate health-departure inference. |
| 6 | PASS | The same-session live Aspire 13.5.3 sample established snapshot wrapper and follow-mode NDJSON/state/health behavior; this API-independent result is unchanged by the prose-only head move. |
| 7 (superseded contract) | PASS | New text correctly documents real-time backchannel streaming, name validation, `healthy` semantics, and exit codes 0/7/17/18; 1409 ms is local evaluation-lag evidence, not upstream/cache doctrine. |
| 8 | FAIL | The unchanged app-event, notification-departure, ordering, universal-builder, hierarchy, mirror-characterization, and stale-PR-body statements remain stronger than evidence or contradict it. |

## Changeset-scope checks at `bf251bf0e`

- **No content lost — PASS.** Structural comparison against `origin/main` again found 0 missing
  headings (12/12), bullets (12/12), or table rows (29/29); `#1855` remains.
- **Table integrity — PASS.** The escaped resource-command row still parses as exactly two cells.
  The already-green scoped format gate was not rerun.
- **Mirror fidelity — PASS.** Both Aspire and harness source/mirror pairs byte-match.
- **Unrelated inclusion — FAIL.** The semantic harness-mirror addition is still described as
  reflow-only in the PR body.
- **Internal consistency — FAIL.** The section-2 departure claim still conflicts with section 1's
  direction to use section 3 for repeated transitions; the PR body additionally conflicts with the
  corrected section 4.

## Already-green implementation gates (not rerun)

Per coordinator directive: `agentic:sync-claude:check`, `check:assets-barrel`,
`validate-claude-surface.ts`, and scoped `deno fmt --check` on the two skill files were not repeated.

## Gate log — `bf251bf0e`

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
| ---- | ---------- | ----- | ------ | -------- | --------- |
| `deno task docs:links` | `deno task docs:links` | Repository internal links/anchors at exact head | PASS | 103 docs; 0 broken links, 0 broken anchors | Recorded; no fix |
| Site build (Lume) clean | `git diff --name-only origin/main...HEAD` | Site-build applicability at exact head | PASS | Only existing internal skill files changed; no Lume/site input | Marked not applicable |
| Internal-wording grep | Changed-line `git diff` piped to `rg` for issue/process/specifier markers, with base comparison | All three changed internal skill files | PASS | Matches are pre-existing/reflowed internal skill material; no public page changed | Recorded; no prose edit |
| Versionless-specifier scan | Changed-line scan for `jsr:@netscript/` | Added lines | PASS | No versionless NetScript specifier | Recorded |
| Command/API accuracy sampling | `aspire wait --help`; `aspire docs get aspire-wait-command`; `aspire docs search/get health-checks`; generated 13.5.3 SDK `rg`; whole-diff read; prior same-session live `describe`/`--follow` sample | Revised wait section plus every Aspire claim in the exact-head changeset | FAIL | Wait correction passes; unchanged app-event path, health-departure inference, event order, and universal-builder claim fail | Flagged for resumed generator |
| Template ↔ generated drift | `cmp -s` on Aspire and harness source/mirror pairs | Both mirrors at exact head | PASS | Both pairs byte-identical; prohibited generator gates not rerun | Recorded |
| Nav / front-matter wiring | Whole diff and changed-file list | Three existing skill files | PASS | Front matter retained; no new nav/page | Recorded |
| Prose-quality pass | Whole changeset read, structural comparison | Accuracy/coherence only | FAIL | Internal hierarchy and PR/head summaries contradict; style polish remains deferred | Flagged; no rewrite |
| Cross-page contradiction check | PR body + exact-head diff + Aspire reference + generated SDK | PR review surface, skill source/mirrors, upstream surfaces | FAIL | PR body retains superseded cache claim; source retains the other blocking inaccuracies | Flagged; blocked PASS |

This is the second head-specific `FAIL_IMPL` cycle recorded by the audit lane. Per `doc-audit.md`,
the unresolved findings now require supervisor escalation rather than an indefinite auditor loop.

---

# Re-audit cycle 2 — 2026-09-02

FAIL_IMPL

Exact audited head: `39f54ac5b3c44178f448927c415bfd759b4dd6a9` (`39f54ac5b`). The
worktree was re-anchored with `git fetch origin docs/aspire-event-doctrine` and
`git checkout --detach 39f54ac5b` before review. This pass verified the six stated remediations and
looked only for regression/overstatement in the rewritten sections 1–2 and updated rule. Previously
passing claims 1, 2, 3, 5, 6, and 7 were not re-derived. The already-green generator gates were not
rerun.

## Remediation results

| # | Result | Evidence at `39f54ac5b` |
| - | ------ | ----------------------- |
| 1 | PASS | Lines 174-183 now give the four inline `builder.subscribe*` APIs, place `on*` on the `addEventingSubscriber(...)` registration context, explicitly state that `builder.eventing()` is not the subscription path, and accurately limit `DistributedApplicationEventing` to `unsubscribe`. Focused comparison with the already-generated Aspire 13.5.3 SDK agrees. |
| 2 | PASS | Lines 185-204 retitle the service as lifecycle-state waits plus health arrival only, distinguish `targetStates` from DTO output, state that `publishResourceUpdate` takes state/stateStyle, expressly deny a health-departure wait, and route departure/repeated cycles to section 3. No stronger inference remains. |
| 3 | PASS | Lines 151-157 now give Initialize → EndpointsAllocated → ConnectionStringAvailable → BeforeResourceStarted → Ready and put Stopped outside the startup sequence. This matches the primary evidence already established in cycle 1. |
| 4 | PASS | Lines 164-172 remove “every resource builder,” add an `Available on` column, place the four common callbacks on the base resource, and assign connection-string/endpoints callbacks to `ResourceWithConnectionString` / `ResourceWithEndpoints`. This matches the generated SDK. |
| 5 | PASS | The hierarchy is now consistent: lifecycle first-occurrence events → notification lifecycle-state/health-arrival waits → follow stream for health departure/repeated cycles. |
| 6 | PASS | The PR body now retracts “reflow only,” describes the seven-line semantic retention/secrets/owner-cleanup paragraph, identifies it as genuine stale-mirror synchronization, and states that the harness mirror is byte-identical to source. Byte comparison passes. |

## New-overstatement scan

**Source rewrite — PASS.** No old false wording remains in either Aspire source or mirror. The new
section 1/2 distinctions are supported by the generated SDK, and the updated Important rule routes
first occurrence, state/health arrival, and repeated health transitions to the correct surfaces.

**PR review surface — FAIL.** The opening `## What the skill now documents` section of the current
PR body still says:

- “every resource builder carries” all six handles; and
- “App-level events come from `builder.eventing()`.”

Those assertions are contradicted by the corrected source and by the later audit table in the same
PR body, which says both were fixed. This is not a source regression, but it is an unresolved factual
claim and an internal contradiction on the required PR review surface. Under the brief's rule that
any claim stronger than evidence is a FAIL, the exact-head verdict cannot be `PASS_IMPL` until the
opening summary is updated or removed.

## Carried-forward claim status

Claims 1, 2, 3, 5, 6, and 7 remain PASS from the prior audit as directed; they were not re-derived.
Claim 4's previously failing documentation is fixed in source. Claim 8 remains FAIL solely because
the PR body still asserts the superseded universal-builder and `builder.eventing()` claims.

## Gate log — `39f54ac5b`

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
| ---- | ---------- | ----- | ------ | -------- | --------- |
| Exact-head anchor | `git fetch origin docs/aspire-event-doctrine`; `git checkout --detach 39f54ac5b`; `git rev-parse HEAD` | Worktree/PR head | PASS | Resolved exact SHA `39f54ac5b3c44178f448927c415bfd759b4dd6a9` | Continued |
| Remediation diff | `git diff --unified=50 bf251bf0e...HEAD -- .agents/skills/aspire/SKILL.md .claude/skills/aspire/SKILL.md .claude/skills/netscript-harness/SKILL.md`; numbered source read | All six requested fixes and updated Important rule | PASS | All five source fixes present; no unrelated tracked file entered the remediation commit | Continued |
| API regression/overstatement | Focused `rg` over `.llm/tmp/cli-e2e/audit-1907-sdk/.aspire/modules/aspire.mts`; old-wording `rg` over Aspire source/mirror | Rewritten sections 1–2 only | PASS | Subscription locations, capability ownership, notification limits, and update parameter claims match SDK; old false source wording absent | Continued |
| Mirror fidelity | `cmp -s` on Aspire source/mirror and harness source/mirror | Both generated mirror pairs | PASS | Both pairs byte-identical | Continued; generator gates not rerun |
| Diff integrity | `git diff --check bf251bf0e...HEAD`; `git diff --name-only bf251bf0e...HEAD` | Cycle-2 tracked remediation | PASS | No whitespace errors; only Aspire source and mirror changed | Continued |
| PR-body declaration/consistency | `gh pr view 1907 --repo rickylabs/netscript --json headRefOid,body,commits,url`; focused body scan | Current PR body at exact head | FAIL | Harness semantic-mirror disclosure is fixed, but opening summary still asserts universal-builder ownership and `builder.eventing()` subscription while later body says those were corrected | Flagged for generator; auditor made no fix |
| Previously-green generator gates | Not rerun per coordinator directive | `agentic:sync-claude:check`, `check:assets-barrel`, `validate-claude-surface.ts`, scoped format | PASS (carried) | No new execution; cited only | Preserved budget/instruction |

No source or PR-body fix was made by the auditor. This is the cycle-2 FAIL condition; per
`doc-audit.md`, it escalates to the supervisor rather than opening an indefinite audit loop.

---

# Re-audit cycle 3 — PR review surface only — 2026-09-02

PASS_IMPL

Exact audited head: `39f54ac5b3c44178f448927c415bfd759b4dd6a9` (`39f54ac5b`). The
live PR head reported by GitHub is the same SHA. Per the cycle-3 directive, this pass re-read only
the live PR body; the unchanged source verdict from cycle 2 was carried forward and no Aspire claim
was re-derived. The already-green generator gates were not rerun.

## PR-body claim results

| # | Result | Review-surface evidence |
| - | ------ | ----------------------- |
| 1 | PASS | The opening summary gives the corrected startup order Initialize → EndpointsAllocated → ConnectionStringAvailable → BeforeResourceStarted → Ready and treats Stopped as separate. |
| 2 | PASS | It limits `ResourceReadyEvent` to the initial ready transition and explicitly says that it cannot observe recovery. |
| 3 | PASS | It replaces the universal-builder claim with capability-scoped ownership: four common handles on the base resource, `onConnectionStringAvailable` on `ResourceWithConnectionString`, and `onResourceEndpointsAllocated` on `ResourceWithEndpoints`. |
| 4 | PASS | It names `builder.subscribe*` as the app-level subscription path, limits `builder.eventing()` to `unsubscribe`, and places `on*` on the `builder.addEventingSubscriber(...)` registration context. |
| 5 | PASS | It characterizes `builder.notifications()` as lifecycle-state waits plus health arrival, distinguishes lifecycle states from health, and expressly says the service cannot express health departure. |
| 6 | PASS | It routes repeated health transitions to `aspire describe --follow --format Json`; this is the same hierarchy approved in the unchanged cycle-2 source, not a stronger claim. |
| 7 | PASS | The superseded phrases “every resource builder carries” and “App-level events come from `builder.eventing()`” are gone. The rewritten opening summary and the lower opposite-family audit table now agree, so the former internal contradiction is resolved. |

## Verdict

`PASS_IMPL` for exact head `39f54ac5b`. The sole cycle-2 blocker was the stale PR review surface;
that blocker is resolved, and the rewritten summary introduces no claim stronger than the already
approved source contract.

## Gate log — `39f54ac5b` cycle 3

| Gate | Command(s) | Scope | Result | Findings | Proceeded |
| ---- | ---------- | ----- | ------ | -------- | --------- |
| Live PR head/body | `gh pr view 1907 --repo rickylabs/netscript --json number,url,headRefOid,body` | Current GitHub review surface | PASS | GitHub reports exact head `39f54ac5b3c44178f448927c415bfd759b4dd6a9`; the complete current body was read | Continued |
| Superseded-claim removal | Focused read of `## What the skill now documents` in the live PR body | The two cycle-2 PR-body blockers | PASS | Universal handle ownership and `builder.eventing()`-as-subscription wording are absent | Continued |
| Summary-to-contract comparison | Live opening summary compared with the six cycle-2 PASS remediation results recorded above | Event order, one-shot readiness, capability ownership, app subscription, notification limits, repeated-health routing | PASS | Every rewritten claim matches the approved source contract; no new overstatement found | Continued |
| Whole-body consistency | Complete live PR-body read, including the lower opposite-family audit table | Review-surface internal consistency | PASS | Opening summary and audit disclosure now agree; no remaining contradiction found | Verdict unblocked |
| Source and generator gates | Not run per cycle-3/coordinator directive | Unchanged source; `agentic:sync-claude:check`, `check:assets-barrel`, `validate-claude-surface.ts`, scoped format | PASS (carried) | Cycle-2 source findings and prior green implementation gates carried forward without re-derivation | Instruction honored |

The auditor made no source or PR-body changes.
