# GitHub board conventions — rickylabs/netscript (ground truth, 2026-08-08)

Scope: milestones, labels, issue forms, house issue body shape, RFC process. All GitHub reads via
`gh api` / `gh issue view` (read-only) on 2026-08-08; all file citations are the local worktree at
`/home/codex/repos/netscript-fable5-remediation-plan` (branch `plan/fable5-remediation-roadmap`,
HEAD `fac9e3390`).

Canonical prose authority: `.agents/skills/netscript-pr/SKILL.md` (384 lines) — it self-declares as
"the single canonical reference for NetScript's GitHub process" (line 374). `.github/labels.yml` is
the machine-readable mirror; `CONTRIBUTING.md` is the human mirror.

---

## 1. Milestones (live, `gh api repos/rickylabs/netscript/milestones`)

**No milestone in the repo has a due date** — `due_on` is `null` for all 25 (open and closed).
Milestone *numbers* are API ids, not the titles; the board addresses milestones by **title**.

### Open milestones (13)

| # | Title | Open | Closed | Description (verbatim, trimmed) |
|---|---|---|---|---|
| 3 | `Backlog / Triage` | 58 | 15 | "Holds only upstream-blocked or undecided work plus epic/umbrella issues; children carry the beta.12–beta.18 train milestones." |
| 14 | `0.0.2` | 5 | 53 | "Stabilisation release. Defects found by the four-agent build experiment (#951-#972) plus release and tooling fixes. No feature work — the Process Manager epic moved to beta.13." |
| 15 | `0.0.3` | 0 | 38 | "Fixes-only stabilisation release. Defects found by the round-two agent build experiment plus release and tooling fixes. No feature work — Process Manager core, the frontend contribution layer and deploy plugin W1-W3 moved to 0.0.4." |
| 22 | `0.0.4` | 0 | 63 | "Stability, documentation and agent-harness release. Everything needed for reliable agent demo runs: no known-broken primitives, accurate docs, and an agent harness that earns its place. Cut before wave-five agent runs." |
| 23 | `0.0.5` | 22 | 160 | "Agent-surface release. Capability discovery and tooling that make the framework legible to autonomous agents — building on 0.0.4 stability. Includes a tailored OpenAPI-to-MCP projection so agents can query their own scaffolded API surface instead of hand-rolling requests." |
| 25 | `0.0.6` | 23 | 0 | "Post-0.0.5 follow-up release: deferred agent-surface work and non-frontend items re-triaged from the former mixed 0.0.6 milestone." |
| 24 | `0.0.7` | 20 | 6 | "Frontend Contribution Layer — plugins that ship UI. RFC #890, epic #922. Waves 0-2: disposable proofs, contracts + spine, DX + lifecycle. Wave 3 consumers (auth v1, AI chat, panels, auth-org, convention generator) follow in later milestones." |
| 16 | `0.0.8` | 50 | 4 | "Enterprise auth wave-1 (Entra OIDC, multi-backend routing)" |
| 17 | `0.0.9` | 15 | 0 | "Deploy containers W4 + auth WorkOS broker wave (SSO/SCIM/Audit) + frontend-contrib polish" |
| 18 | `0.0.10` | 2 | 0 | "Deploy clouds W5 (CF/Vercel/AWS + thin adapters) + auth machine/agent/Better Auth track" |
| 19 | `0.0.11` | 10 | 0 | "Desktop graph (#830) + Aspire packaging/Windows tier + WorkOS RBAC/FGA" |
| 20 | `0.0.12` | 11 | 0 | "Dev dashboard (thin, contribution-based) + auth/deploy tail" |
| 21 | `0.0.13` | 44 | 0 | "Cascaded from beta.18 when beta.12 became the stabilisation release." |

### Closed milestones (12) — the pre-rename `0.0.1-beta.N` train

`0.0.1-beta.1` (#1, 38 closed), `0.0.1-stable` (#2, 6), `0.0.1-beta.2` (#4, 10), `0.0.1-beta.3`
(#5, 24), `0.0.1-beta.4` (#6, 6), `0.0.1-beta.5` (#7, 21), `0.0.1-beta.6` (#8, 40), `0.0.1-beta.7`
(#9, 60), `0.0.1-beta.8` (#10, 48), `0.0.1-beta.9` (#11, 50), `0.0.1-beta.10` (#12, 53),
`0.0.1-beta.11` (#13, 35). All have 0 open issues. `0.0.1-beta.1`/`0.0.1-stable` carry long LOCKED
acceptance-bar descriptions (cut criteria enumerated in the milestone description itself) — evidence
that milestone descriptions are used as **cut bars**, not just labels.

### Rules from the skill (`netscript-pr/SKILL.md` §Milestones, lines 353-359)

- "Assign **every** open issue and PR to the explicit release that owns it: `0.0.2` through `0.0.9`,
  or `Backlog / Triage` when it is accepted but unscheduled."
- "The `wave:*` labels are scheduling bands and may span several releases; they do **not** determine
  a milestone."
- "Epics and umbrellas use the cut in which their coordinated scope is expected to complete."

**Conflict (live > skill):** the skill's stated milestone range is `0.0.2`…`0.0.9` (also stated in
`AGENTS.md` obligation 2), but the live board has `0.0.10`–`0.0.13` as well. Live wins: a new issue
may legitimately target `0.0.10`+.

**Drift note (fact):** `Backlog / Triage`'s description claims children carry "beta.12–beta.18 train
milestones" — those milestone titles no longer exist (renamed to `0.0.6`–`0.0.13`). Stale text.

**Practical target for a Fable-5 remediation plan (hypothesis):** near-term defect/docs work lands
`0.0.5` (still open, 22 open) or `0.0.6` (23 open, 0 closed — the live "next" bucket); epics/umbrellas
without a scheduled cut land `Backlog / Triage` (e.g. #1335, an umbrella, sits there).

---

## 2. Labels

### 2.1 File: `.github/labels.yml` (249 lines) — declared taxonomy

Header rules (lines 8-14), verbatim intent:

- Exactly **ONE** `status:` label on an open issue/PR at a time (it is the board column).
- On completed closure, replace the phase label with `status:shipped`; for not-planned/wontfix
  closure, remove the `status:` label entirely.
- `type:`/`area:`/`priority:` are additive.
- "Add new labels here first, then create them; do **NOT** delete existing labels (that strips them
  off live issues) — deprecate in this file and propose removal to the maintainer."

Declared sets (name → color → description):

- **type:** (`c5def5` unless noted) `type:feat`, `type:fix`, `type:docs`, `type:chore`,
  `type:refactor`, `type:perf`, `type:test`, `type:umbrella` (`5319e7`, "Coordinating PR for a
  multi-slice effort"), `type:sub-pr` (`0e8a16`).
- **status:** (`fbca04` unless noted) `triage`, `research`, `plan`, `plan-eval`, `impl`, `impl-eval`,
  `augment-review`, `ci-fail`, `ready-merge` (`0e8a16`), `shipped` (`5319e7`, terminal),
  `close-gate-override` (`b60205`, "Audited exception to the closing-keyword acceptance gate").
- **priority:** `p0` (`b60205`, "Critical / release blocker"), `p1` (`d93f0b`), `p2` (`fbca04`),
  `p3` (`0e8a16`).
- **area:** (`bfdadc` unless noted) `cli`, `fresh`, `fresh-ui`, `plugins` (`5319e7`), `auth`,
  `aspire`, `deploy`, `database`, `kv`, `sdk`, `service`, `config`, `telemetry`, `ai-core`
  (`1d76db`), `plugin-ai` (`1d76db`), `tooling`, `deps`, `docs`.
- **ci:** `ci:full`, `ci:skip-e2e`, `ci:skip-scaffold`, `docs-eval:skip`, plus `gate:e2e`, `gate:jsr`
  (all `d4c5f9`). Precedence comment (lines 151-154): "`ci:full` > `ci:skip-*` > docs-only
  auto-detection. Skip labels NEVER affect the cheap required trio (quality / check-test /
  deps-report) in ci.yml, nor the release gates (publish / e2e-cli-prod*)." Consumed by the
  `classify` job in `.github/workflows/e2e-cli.yml`.
- **epic:** (`5319e7`) `ai-stack`, `telemetry-revamp`, `dev-dashboard`, `docs-cut`, `deployment`,
  `roadmap-reforecast`, `harness-v3`, `process-manager`, `agentic-combo`, `frontend-contrib`
  (`1d76db`), `openapi-mcp`.
- **wave:** (`c2e0c6`) `wave:v1`, `wave:v1-min`, `wave:defer`.
- **flags:** `rfc` (`5319e7`), `breaking` (`b60205`), `good first issue`, `help wanted`.
- **GitHub-standard retained:** `bug`, `enhancement`, `documentation`, `duplicate`, `wontfix`.

### 2.2 Live label set: 123 labels total

**In `labels.yml` but NOT live (2)** — declared, never created:

- `docs-eval:skip`
- `status:close-gate-override`

Consequence (fact): the audited close-gate escape hatch documented in `netscript-pr/SKILL.md`
lines 222-225 **cannot be applied today** without first creating the label.

**Live but NOT in `labels.yml` (33, excluding canaries)** — the file is materially out of date:

- Extra `area:` labels: `area:agentic`, `area:ai`, `area:contracts`, `area:db`, `area:packages`,
  `area:queue`, `area:release`, `area:runtime-config`, `area:sagas`, `area:services`,
  `area:streams`, `area:triggers`, `area:workers`. Several are actively used on recent issues:
  `area:agentic` (#1330, #1331, #1343), `area:contracts` (#1332, #1263), `area:release`.
- Extra `epic:` labels: `epic:deploy-plugin`, `epic:desktop-frontend`, `epic:enterprise-auth`,
  `epic:road-to-stable`, `epic:unified-runtime`.
- Extra `status:` labels (duplicate/legacy columns, a single-status hazard): `status:blocked`
  (in live use — #1320, #1280), `status:in-progress`, `status:in-review`, `status:review`.
- Extra `type:` labels: `type:feature` (duplicate of `type:feat`; live-used on #1306),
  `type:release`.
- Extra gates/flags: `gate:ci`, `e2e-cli-gate` ("Run the toolchain-heavy e2e-cli workflow
  (scaffold-static + scaffold-runtime) on this PR."), `priority:high` (duplicate of `priority:p1`),
  `codex`, `dx`, `prime-time`, `sagas`, `service`, `question`, `invalid`.
- **Also live: `area:db` vs `area:database`, and `area:sagas`/`area:streams`/`area:triggers`/
  `area:workers` vs the single `area:plugins`** — pick the one used on recent comparable issues.

**Duplicate-pair guidance (derived, from recent-issue usage):** prefer `type:feat` (not
`type:feature`), `priority:p1` (not `priority:high`), `area:database` (not `area:db`),
`area:plugins` (used on #1325/#1326/#1329 for streams/triggers work).

**`canary:*` labels (20 live)** — machine-generated, do NOT hand-apply. Created by
`.llm/tools/release/canary-label.ts:361` with description
`` `Published NetScript prerelease ${version}` ``. Range live: `canary:0.0.4-canary.1..4`,
`canary:0.0.5-canary.1..16`. Applied to shipped issues/PRs at publish (#1328 → `canary:0.0.5-canary.15`;
#1331 → `canary:0.0.5-canary.14`).

### 2.3 Minimum label contract for a new issue

From `netscript-pr/SKILL.md` line 320: "**Every open issue and PR carries at least one `type:` and
one `area:` label, and every open issue carries a milestone.** New issues land with `status:triage`
(the issue forms apply it automatically) until triaged."

Observed on all 11 issues sampled in 1325-1335: every one carries `type:*` (or `type:umbrella`) +
≥1 `area:*` + `priority:p0..p3` + exactly one `status:*` + a milestone. `priority:` is de-facto
mandatory in practice even though the skill only says type/area/milestone.

Stage-label lifecycle (`SKILL.md` lines 328-344):
`status:research → status:plan → status:plan-eval → status:impl → status:impl-eval →
status:augment-review (optional) → status:ready-merge`, then atomically swap to `status:shipped` on a
completed close. A merged PR still sitting at `status:plan` is called out as a real observed failure
(~50% non-compliance audit).

---

## 3. Issue forms — `.github/ISSUE_TEMPLATE/`

`config.yml`: `blank_issues_enabled: false` (**raw blank issues are disabled in the UI**; API
creation still works). Contact links: Discussions → Q&A, Ideas, RFCs, and private security advisory.

| File | `name` | `title` prefix | auto `labels` | Required fields |
|---|---|---|---|---|
| `bug_report.yml` | Bug report | `bug: ` | `bug`, `status:triage` | Summary (textarea), Area (dropdown), Reproduction steps, Expected behavior, Actual behavior, Environment (`render: shell`), 2 required checkboxes |
| `feature_request.yml` | Feature request | `feat: ` | `type:feat`, `status:triage` | Problem / motivation, Proposed solution, Area (dropdown); Alternatives optional; 2 required scope checkboxes |
| `documentation.yml` | Documentation issue | `docs: ` | `documentation`, `status:triage` | Location, Kind of issue (dropdown), Details |
| `rfc_proposal.yml` | RFC proposal (tracking issue) | `rfc: ` | `rfc`, `status:triage` | RFC title (input), Summary, Motivation; "Why this needs an RFC" checkbox group; RFC PR link optional; 1 required checklist box |

Shared **Area dropdown** option list (identical in bug + feature forms, "maps to the `area:*`
labels"): `cli, fresh, fresh-ui, plugins, auth, aspire, database, kv, sdk, service, config,
telemetry, ai-core / plugin-ai, tooling, docs, unsure`. Note it does **not** include the live-only
areas (`agentic`, `contracts`, `release`, …) — another form/live drift.

`feature_request.yml` embeds the epic standard in its markdown preamble (verbatim): "**Multi-slice /
epic work:** file a program epic as `Epic: <name>` (`type:umbrella` + `epic:<slug>`) with a sub-issue
checklist, and file each slice as its own `[<epic-slug> S<n>] <slice>` issue linked by
`Part of #<epic>`."

`rfc_proposal.yml` "Why this needs an RFC" options: public API/export surface change; breaking or
release/publish surface; plugin contracts / service seam / architecture doctrine; cross-cutting
across multiple packages/plugins.

**Field → body mapping:** issue-form field *labels* become `## <Label>` headings in the rendered
issue body. This is directly visible in the sampled issues: #1326 renders `## Summary`, `## Area`,
`## Reproduction steps`, `## Expected behavior`, `## Actual behavior`, `## Environment`;
#1332 renders `## Location`, `## Kind of issue`, `## Details` (the documentation form). **When
hand-authoring an issue via the API, reproduce those exact headings** so it reads as form-filed.

---

## 4. House issue body shape (sampled 1325-1335, all live 2026-08-08)

Sample metadata:

| # | State | Milestone | Labels | Title |
|---|---|---|---|---|
| 1325 | OPEN | 0.0.5 | type:fix, area:plugins, area:aspire, status:triage, priority:p1 | `fix(triggers): generated background runtime omits the Redis adapter and crash-loops on the default Aspire cache` |
| 1326 | OPEN | 0.0.5 | type:fix, area:plugins, status:triage, priority:p0 | `fix(streams): DurableStreamProducer permanently drops writes after an initial connection failure; reconnect is never attempted` |
| 1327 | OPEN | 0.0.5 | type:fix, area:cli, area:database, status:triage, priority:p1 | `fix(cli): db migrate reports success in headless mode without creating the migration implied by the command` |
| 1328 | CLOSED | 0.0.5 | type:fix, area:cli, area:tooling, priority:p1, status:shipped, canary:0.0.5-canary.15 | `fix(scaffold): generated check misses TSX/plugin runtimes while bare lint/fmt report 154 scaffold-owned findings` |
| 1329 | OPEN | 0.0.5 | type:fix, area:docs, area:plugins, area:telemetry, status:triage, priority:p0 | `fix(streams): documented SSE consumer shape differs from the wire protocol …` |
| 1330 | CLOSED | 0.0.5 | type:fix, area:tooling, area:agentic, priority:p1, status:shipped, canary:0.0.5-canary.15 | `fix(agentic): OpenCode resume forwards empty assistant turns that OpenRouter rejects` |
| 1331 | CLOSED | 0.0.5 | type:chore, area:tooling, area:agentic, priority:p0, status:shipped, canary:0.0.5-canary.14 | `chore(agentic): make qwen/qwen3.8-max the canonical IMPL-EVAL model …` |
| 1332 | OPEN | 0.0.5 | type:docs, area:docs, area:database, area:contracts, status:triage, priority:p1 | `docs(data/contracts): show generated DB schemas as the normative predecessor to API contracts …` |
| 1333 | OPEN | 0.0.5 | type:fix, area:cli, area:fresh-ui, area:fresh, status:triage, priority:p0 | `fix(scaffold/frontend): make the default app an idiomatic eis-chat-grade reference …` |
| 1334 | OPEN | 0.0.5 | type:docs, area:docs, status:triage, priority:p1 | `docs(home): complete the capability story beyond end-to-end typesafety …` |
| 1335 | OPEN | Backlog / Triage | type:umbrella, area:cli, area:tooling, status:triage, priority:p1 | `Epic: Scaffold conformance — generated surfaces match current docs, exports and idiomatic usage` |

Body length range 1901–3054 chars. **Dense, ~2-3k chars — not a paragraph, not an essay.**

### 4.1 Title convention (observed, strong)

- Defect/change issues: **conventional-commit title** `type(scope): <declarative failure statement>`
  — `fix(streams):`, `fix(cli):`, `fix(scaffold/frontend):`, `docs(data/contracts):`,
  `chore(agentic):`, `verify(0.0.6):` (#1343). Scope is a package/plugin/domain, sometimes a
  slash-path (`scaffold/frontend`, `data/contracts`) or a milestone (`0.0.6`).
- Titles state **the observed wrong behavior**, not the desired fix: "generated background runtime
  omits the Redis adapter and crash-loops…", "db migrate reports success … without creating the
  migration implied by the command", "db seed is a placebo — SELECT 1 plus a success banner, no rows
  seeded" (#1262). Long titles are normal (up to ~140 chars).
- Epics: `Epic: <name> — <clarifier>` (#1335). RFCs: `RFC: <name>` (#1123, #820).
- Epic sub-issues: `[<epic-slug> S<n>] <slice>` — live examples `[frontend-contrib S13] plugin new
  --with frontend` (#935), `[openapi-mcp S12] Docs: agent-facing OpenAPI→MCP reference` (#1138),
  `[deploy-plugin DPB-18] Story-0 scaffold.runtime E2E` (#910), `[dashboard DDX-4] plugins/dashboard
  thin plugin + E2E join` (#414). Note the sub-index is not always `S<n>` — `DPB-<n>`, `DDX-<n>` are
  live variants. A minority use a trailing bracket instead: `feat(deploy): first-run provisioning
  phase [SD-5]` (#835).

### 4.2 Defect issue body skeleton (bug-form shape; #1325/#1326/#1327/#1329)

```markdown
## Summary

<1-2 paragraphs: the mechanism of the defect, then its consequence. Names the exact
symbol/file that misbehaves.>

## Area

<plugins / streams>          <!-- free text mirroring the form dropdown -->

## Reproduction steps

1. …
6. Observe <exact log line or exit code>.

<Source evidence in `packages/<pkg>/src/<path>.ts`: <mechanism, one sentence>.>

## Expected behavior

<What a correct system does — often phrased as a disjunction of acceptable designs.>

## Actual behavior

<What happens instead.>

## Environment

```shell
WSL2 / Linux
NetScript: 0.0.5-canary.13
Package: @netscript/plugin-streams-core
```

## Acceptance

- [ ] <checkable outcome>
- [ ] Tests cover <enumerated cases>.
- [ ] OTEL spans/metrics expose <…>.

Related: #1071, #1073, #1208, #1210, #1328.
```

(Exact text from #1326 and #1333; the trailing `Related: #a, #b` line is on #1332 and #1333.)

### 4.3 Acceptance-checkbox convention — this is the load-bearing part

- The heading is `## Acceptance` (#1326, #1332, #1333, #1335) or `## Acceptance criteria` (#1343).
  Both match the close-gate matcher.
- Machine rule (`netscript-pr/SKILL.md` lines 121-130): a **close-gated issue checkbox** is either
  (a) any markdown checkbox inside a section whose heading contains `acceptance`, `definition of
  done`, `gate`, or `fitness gate`; or (b) any checkbox **anywhere** in the body whose text starts
  with `gate:`. "Ordinary planning, dependency, sub-issue, or rollout checklists outside those
  sections are **not** close-gated. If a checklist is acceptance, put it under an acceptance/gate
  heading."
- Boxes are always filed **unchecked** (`- [ ]`) and are ticked only with linked evidence.
- Box style: one imperative, independently verifiable sentence, no sub-bullets. Counts observed:
  7 (#1326), 8 (#1332), 7 (#1335), 10 (#1333), 1 (#1343). **Include a test/gate box** — nearly every
  sample has an explicit "Tests cover…" / "Golden tests and scaffold runtime E2E prove…" /
  "A docs test or fixture prevents … drifting again" box.
- `[post-merge]` marker (case-insensitive) inside an acceptance box excludes it from the merge gate —
  reserved for facts that cannot exist before merge (e.g. verifying a published artifact)
  (`SKILL.md` lines 152-155).
- Evidence is mirrored from the PR via a fenced ```acceptance-evidence``` YAML block mapping
  `box:` (exact trimmed text) or `box-index:` (1-based) → `evidence:` (`SKILL.md` lines 132-150).
  Tooling: `.llm/tools/validation/mirror-acceptance-evidence.ts`,
  `.llm/tools/validation/check-close-gate.ts`. **Implication for drafting: write acceptance box text
  that is short and stable enough to be copied verbatim into an evidence mapping.**

### 4.4 Epic/umbrella body skeleton (#1335, verbatim structure)

```markdown
## Problem
<Why no existing issue covers this; explicitly names which sibling issues own which
pieces so the umbrella does not duplicate them.>

## Scope
<What is inventoried/covered. Often a bullet list of per-item facts to establish.>

## Acceptance
- [ ] <program-level outcome>
- [ ] Current specialized issues (#1328 and frontend modernization) land before their
      rows are marked complete here.

## Sub-issues
- [ ] #1328 — <one-line description>
- [ ] <not-yet-filed child, described in prose>

This is an umbrella. No implementation PR should close it directly.
```

Note the closing sentence is house style. `## Sub-issues` is a *non*-close-gated checklist (it is
outside an acceptance/gate heading) — deliberately, so children can be ticked independently of the
merge gate. Epics **never** receive a closing keyword; they close by hand (`AGENTS.md`;
`SKILL.md` lines 106-107, 233-234).

### 4.5 Other observed body sections

- `## Provenance` (#1343) — records the owner decision that created/relocated the issue, with date:
  "The publication-dependent criterion was relocated from #1024 by owner decision on 2026-08-07. It
  was not deleted, weakened, or claimed complete."
- `## Boundaries` (#1343) — explicit anti-scope: "Do not duplicate #1024's five criteria already
  completed by #1092, and do not reopen #1328's scaffold-owned quality implementation."
  **This is the house pattern for avoiding duplicate-issue collisions on a crowded board.**
- `Part of #<epic>` in the body is the epic linkage (`SKILL.md` lines 236-237). GitHub-native
  sub-issue linkage is "**unused repo-wide** today … adopted **opportunistically** as a
  nice-to-have on top of the `Part of #<epic>` body text — it is not required" (lines 238-240).
- `Related: #a, #b` (no keyword) for non-blocking cross-references.
- Evidence pointers to *other repos* are normal: "Wave 6 evidence: `rickylabs/loom`",
  "Compare them with `rickylabs/eis-chat/apps/dashboard/routes`" (#1333).

### 4.6 Wave labels — dead in practice

`wave:v1`, `wave:v1-min`, `wave:defer` exist live but appear on **none** of the 11 sampled
1325-1335 issues nor any of the 22 open `0.0.6` issues listed. Hypothesis: `wave:*` is a legacy
beta-era band superseded by milestones; `SKILL.md` line 312 still defines it. **Do not apply
`wave:*` to new issues** unless the plan explicitly revives the band.

### 4.7 Closing-keyword rule (issue-side consequence)

PRs, not issues, carry `Closes #N` / `Fixes #N` / `Resolves #N` in the **body** `## Scope` section.
`AGENTS.md` and `SKILL.md` lines 101-102 name the historical failure: "Bare `#N` and `Refs #N` /
`Re #N` do NOT auto-close. This is the exact defect that left 40+ merged NetScript PRs with
stale-open issues." Also live hazard (`SKILL.md` line 188): a manual **Development-sidebar link**
auto-closes the issue on merge *bypassing* close-gate entirely — tracked by #1188.

---

## 5. RFC process

Authority: `rfcs/README.md` (79 lines) + `rfcs/0000-template.md` (59 lines).

### 5.1 When required (`rfcs/README.md`, "When an RFC is required")

- Adds/removes/changes a **public API** or a `@netscript/*` package export surface.
- Is a **breaking change**, or changes the **release / publish surface**.
- Changes **plugin contracts**, the plugin/service base seam, or **architecture doctrine** under
  `docs/architecture/doctrine/`.
- Is **cross-cutting** across multiple packages/plugins, or introduces a new package/plugin archetype.
- Establishes a **new convention** contributors are expected to follow.

Not required for: bug fixes, docs, tests, refactors with no surface change, scoped single-package
enhancements. Process is explicitly modeled on Rust/React/Ember RFC repos + TC39 staging.

### 5.2 Lifecycle

`Draft → Discussion → Final Comment Period → Accepted → (tracking issue) → Implemented`, with
`Rejected` / `Withdrawn` branching off FCP.

1. **Draft** — copy `0000-template.md` to `rfcs/0000-<short-slug>.md` (keep `0000`), open a PR adding
   the file, **and** open the companion **RFC tracking issue** via the `rfc:` form, labelled `rfc`.
   Optional Discussion in the RFCs category.
2. **Discussion** — line-level on the PR, open-ended in Discussions. Tracking issue carries the
   `status:*` label.
3. **FCP** — a maintainer announces a ~7-day final comment period with a disposition.
4. **Decision** — Accepted: maintainer assigns the next free integer at acceptance (**not** by the
   author, to avoid number races), PR renamed `rfcs/NNNN-<slug>.md`, merged; tracking issue gets a
   **milestone** and stays open. Rejected: PR closed, rationale recorded in "Rationale and
   alternatives". Withdrawn: author closes; reason noted on the tracking issue.
5. **Implementation** — separate PRs referencing the tracking issue with `Part of #<issue>`; the
   tracking issue closes when fully implemented.

Milestone/label mapping: accepted RFC tracking issue goes on the normal `0.0.x` milestone it targets
or `Backlog / Triage`; labels = `rfc` on both tracking issue and RFC PR, one `status:*`, plus
`breaking` if applicable. Governance note: if this file ever conflicts with ratified doctrine,
**doctrine wins** and the file is updated to match.

### 5.3 `rfcs/0000-template.md` — required shape

YAML front matter: `rfc` (0000 while drafting), `title`, `status` (Draft | Discussion | FCP |
Accepted | Rejected | Withdrawn), `authors` (list of `@handle`), `created` (YYYY-MM-DD),
`tracking-issue`, `target-milestone`.

Body headings, in order: `# <RFC title>`, `## Summary`, `## Motivation`, `## Guide-level
explanation`, `## Reference-level explanation`, `## Drawbacks`, `## Rationale and alternatives`,
`## Breaking changes and migration`, `## Prior art`, `## Unresolved questions`,
`## Future possibilities`.

### 5.4 Live reality vs the documented process — a real conflict

**Fact: `rfcs/` on `main` contains only `0000-template.md` and `README.md`** (`git ls-tree -r
origin/main -- rfcs/`). **Zero numbered RFC documents have ever been merged.**

**Fact:** only 5 issues carry the `rfc` label repo-wide (`gh issue list --label rfc --state all`):

| # | State | Milestone | Title |
|---|---|---|---|
| 820 | OPEN | Backlog / Triage | RFC: single deployment — enterprise installation layer, update lifecycle, PM foundation, single-runtime composition |
| 510 | OPEN | Backlog / Triage | Epic: NetScript Process Manager — bare-metal supervisor + admin console (pup/pm2 done right) |
| 313 | OPEN | Backlog / Triage | epic: migrate NetScript DB layer to Prisma Next (Postgres-first pilot, deferred) |
| 305 | CLOSED | 0.0.1-beta.5 | [S4] Architecture Doctrine revamp |
| 234 | OPEN | Backlog / Triage | feat: HTTP/2 by default for NetScript services (feasibility + rollout) |

**Fact:** RFCs referenced elsewhere as authorities are **issues, not files** — "RFC #890, epic #922"
(milestone 0.0.7 description), "Deploy plugin family epic (RFC #891)" (`epic:deploy-plugin` label
description), "OpenAPI→MCP service introspection epic (RFC #1123, tracking #1117)"
(`epic:openapi-mcp` label description, `.github/labels.yml:205-207`).

**The de-facto RFC:** issue #1123 `RFC: OpenAPI→MCP — making a service's own API legible to the
agent building it (#1117)` — labels `rfc, type:docs, area:tooling, area:service, priority:p1,
status:plan, ci:skip-e2e, ci:skip-scaffold, canary:0.0.4-canary.1`; milestone `Backlog / Triage`.
Its headings are **not** the template's; it uses a numbered-section research-paper shape:

```
## Abstract
## 1. Motivation
## 2. The proposed decision and its rationale
## 3. Tool surface (implementation-level)
### End-to-end flows (diagrams, #822 convention — example app "acme-notes")
## 4. Plan — waves and gates (for the implementing run)
## 5. The plugin question and #1093 (the brief's central question, answered plainly)
## 6. Security model (summary, rev 2)
## 7. Board — FILED 2026-08-03 (owner-authorized). Epic **#1126**; OMB-1..14 → **#1127–#1140** per `FILING-LOG.md`; GitHub wins on conflict. Original proposal below:
## 8. Review trail
## 9. Forks — RATIFIED 2026-08-03 (owner-authorized, relayed)
```

Section 7 is the house **filing record**: it names the epic it spawned, the exact child issue-number
range, the mapping-log filename, and the arbitration rule "**GitHub wins on conflict**". Section 9
records owner ratification with a date. #820's RFC body is much thinner (`## Findings that motivate
this RFC`, `## Deliverables`).

**Guidance for this run (derived):** if the remediation plan needs an RFC, the *lowest-risk* path is
the live one — an `rfc:`-form tracking issue titled `RFC: <name>`, labelled `rfc` + one `status:` +
`area:` + `priority:` + a milestone, using the #1123 numbered-section shape, with an explicit
board-filing section. Writing `rfcs/NNNN-*.md` files would be *documented*-but-unprecedented; note
the divergence explicitly if chosen. **Hypothesis (unverified):** the file-based RFC process was
authored aspirationally alongside the issue forms and never adopted, because issue #1123 shows the
team prefers a single mobile-readable GitHub surface over a repo file + PR round trip.

---

## 6. PR-side conventions relevant to issue drafting

`.github/pull_request_template.md` sections: `## Summary`, `## Scope` (with `Part of #` / `Closes #`
and "Archetype / area"), `## Slices`, `## Validation`, `## Harness` (run dir + phase),
`## Drift / Debt`, `## Definition of Done`.

Load-bearing rules an issue draft must anticipate:

- "`## Definition of Done` and `## Acceptance` are the authoritative PR-body checklist sections. Any
  unchecked box beneath either heading fails close-gate. `## Slices` is progress tracking"
  (`SKILL.md` lines 82-85).
- Merge to `status:ready-merge` requires all three: IMPL-EVAL PASS phase comment (separate session),
  complete DoD checklist, and **every close-gated checkbox on every issue the PR closes checked with
  linked evidence** (`SKILL.md` lines 196-207). Named exemplar failure: **#260**, closed with its
  `gate:e2e` box unchecked.
- Branch naming `<type>/<slug>`; `plan/` is reserved for harness **seed runs** (planning-only, never
  shippable code) — which is this run's branch `plan/fable5-remediation-roadmap`
  (`SKILL.md` lines 22-29). "A PR whose `status:` is `research`, `plan`, or `plan-eval` **MUST NOT be
  merged**" (line 196).
- Phase comment format: `**[PHASE: IMPL-EVAL] [VERDICT: CHANGES_REQUESTED]**` + headline +
  `### Findings` (numbered, `**C1 …**`) + `### Next` (`SKILL.md` lines 247-258). Verdict vocabulary:
  RESEARCH (none), PLAN (summary; gate is a separate PLAN-EVAL comment with
  `APPROVED`/`CHANGES_REQUESTED`), IMPL (summary), IMPL-EVAL (`PASS`/`CHANGES_REQUESTED`), REVIEW
  (advisory).
- `SKILL.md` line 15 says "`gh` is **not** on PATH in this environment. Use the GitHub MCP tools."
  **Conflict (live wins): `gh` IS on PATH and authenticated in this worktree** — every read in this
  document used it. The skill statement is stale for this environment.

---

## 7. Checklist for drafting a new issue that matches the board

1. Title: `type(scope): <observed wrong behavior>` — or `Epic: <name> — <clarifier>` /
   `RFC: <name>` / `[<epic-slug> S<n>] <slice>`.
2. Body: reproduce the matching issue-form headings verbatim (`## Summary`/`## Area`/
   `## Reproduction steps`/`## Expected behavior`/`## Actual behavior`/`## Environment` for defects;
   `## Location`/`## Kind of issue`/`## Details` for docs).
3. Cite source evidence by `packages/<pkg>/src/<file>.ts` path and by issue number.
4. `## Acceptance` (or `## Acceptance criteria`) with unchecked, one-sentence, independently
   verifiable boxes; include at least one tests/gate box; use `gate:` prefixed boxes or a
   `gate`-headed section when a named CI gate is the proof; mark post-merge-only facts
   `[post-merge]`.
5. Add `## Boundaries` and/or `## Provenance` when the issue sits near existing ones (dedup defense).
6. Epics: add `## Sub-issues` checklist + "This is an umbrella. No implementation PR should close it
   directly."; children carry `Part of #<epic>`.
7. Labels: exactly one `status:` (`status:triage` for new filings) + ≥1 `type:` + ≥1 `area:` +
   `priority:pN` (+ `epic:<slug>` for epic members). Never hand-apply `canary:*`. Skip `wave:*`.
8. Milestone: mandatory. `0.0.5`/`0.0.6` for near-term, `Backlog / Triage` for unscheduled epics.
9. If a label you want is live-only or file-only, say so explicitly in the plan
   (`status:close-gate-override` and `docs-eval:skip` **do not exist live** and must be created
   before use).
