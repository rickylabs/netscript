---
name: netscript-pr
description: Author NetScript branches, pull requests, and the per-phase structured PR comments used by the harness (research / plan / plan-eval / impl / impl-eval / review summaries), plus umbrella↔sub-PR linking and the namespaced label taxonomy. Use this whenever you are about to create a branch, open or update a PR, post a phase summary comment, split an umbrella into sub-PRs, or apply status/type/area labels in this repo — even if the user just says "open a PR", "push this", "comment the results", or "mark it ready for review". Getting the branch name, PR body, and labels right the first time is what keeps the harness board from rotting.
---

# NetScript PR Authoring

Consistent branches, PR bodies, phase comments, and labels are what let the harness run as a
machine: humans and agents read the same structured surface, and automation (Phase D labels +
Projects v2) keys off it. Sloppy PR hygiene is how a board becomes a graveyard. This skill is the
house format.

## Tooling note

`gh` is **not** on PATH in this environment. Use the **GitHub MCP** tools for all PR/issue/label
operations (`create_pull_request`, `update_pull_request`, `add_issue_comment`, `issue_write`,
`pull_request_read`, label tools). For ground-truth branch/remote state, spawn git directly (RTK can
serve stale reads) — see the **netscript-tools** skill.

## Branch naming

`<type>/<slug>` — lowercase, kebab, no trailing dates. Types match the commit/PR taxonomy:

- `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `perf/`, `test/`.
- Sub-branches of an umbrella append a scope: `chore/deno-2.8-aspire-13.4-upgrade` (umbrella) →
  `chore/deno-2.8-aspire-13.4-upgrade-fresh` (sub). Keep the umbrella prefix so the relationship is
  visible in `git branch` and the PR list.

## Umbrella vs sub-PR (wave-4/5 pattern)

- **Umbrella PR**: the coordinating PR for a multi-slice effort. Body carries the slice checklist and
  links every sub-PR. Labelled `type:umbrella`.
- **Sub-PR**: one parallelizable slice on its own sub-branch, targeting the **umbrella branch** (not
  `main`). Labelled `type:sub-pr` and links back to the umbrella with `Part of #<umbrella>`.
- **Sequential vs parallel**: only split into sub-PRs when slices are genuinely independent. Slices
  that all edit `deno.json`/catalog are conflict-prone → keep them **sequential on one branch**, one
  commit per slice. (This is why PR #44's remediation is sequential, not fanned out.)

## PR body template

Always structure the body like this so reviewers and automation find the same anchors:

```markdown
## Summary

<1–3 sentences: what this PR changes and why.>

## Scope

- Archetype / area: <e.g. tooling, packages/fresh, plugins/workers>
- Part of #<umbrella> · Sub-PRs: #<n>, #<n>   <!-- omit the side that doesn't apply -->

## Slices

- [x] S1 <slice> — <commit>
- [ ] S2 <slice>

## Validation

- `deno task check:<slice>` — <result>
- `deno task ci` / `e2e:cli scaffold.runtime` — <result + native-WSL note if applicable>

## Harness

- Run dir: `.llm/runs/<run-id>/`
- Phase: <research|plan|plan-eval|impl|impl-eval|review> — see phase comments below.

## Drift / Debt

- <DEBT_ACCEPTED rows or "none">
```

Keep `Validation` honest: paste real results/exit codes; if a gate was skipped, say so. A green
checkbox with no evidence is how false-green merges happen.

## Linking issues (auto-close on merge) — MANDATORY

A PR that **fully resolves** an issue MUST put a GitHub **closing keyword** in the **PR body** so the
merge auto-closes the issue. Use one of: `Closes #N`, `Fixes #N`, `Resolves #N` (one per issue; put
each on its own line in the `## Scope` section).

```markdown
## Scope

- Archetype / area: packages/service
- Closes #234
- Part of #301   <!-- umbrella: reference only, do NOT close -->
```

- **Bare `#N` and `Refs #N` / `Re #N` do NOT auto-close.** This is the exact defect that left 40+
  merged NetScript PRs with stale-open issues that had to be triaged by hand. If the work fully
  lands the issue, a closing keyword is not optional.
- **Partial work:** reference the issue **without** a closing keyword (`Part of #N` / plain `#N`) and
  state the remaining scope in the body. Never `Closes` an issue you only partially deliver.
- **Never** put a closing keyword on an **epic/umbrella** (`type:umbrella`, `epic:*`) — those close
  by hand once every child is done. Use `Part of #<umbrella>` instead.
- The keyword must be in the **PR body or a commit message**, not only in a comment, for GitHub to
  wire the auto-close. The PR template's `## Scope` is the canonical home.

## Merge close-gate (#387)

The closing-keyword rule above wires the auto-close; this gate governs **when a PR carrying one may
merge**. They are separate concerns: a keyword makes the merge *close* the issue, the close-gate
makes sure the issue is *actually done* before that happens.

A PR whose `status:` is `research`, `plan`, or `plan-eval` **MUST NOT be merged** — a plan-only
artifact set can never satisfy an implementation Definition-of-Done. Merge requires
`status:ready-merge`, and moving to `status:ready-merge` requires all three:

1. **IMPL-EVAL PASS evidence** — the `[PHASE: IMPL-EVAL] [VERDICT: PASS]` phase comment from the
   evaluator (a separate session).
2. **DoD checklist complete** — every `- [ ]` in the PR body's Definition-of-Done is checked.
3. **Referenced-issue acceptance** — for **every** issue the PR references, its acceptance criteria
   **and** every `gate:` checkbox are checked with linked evidence (command, run URL, or PR comment).

The exemplar failure is **#260**, closed with its `gate:e2e` box unchecked — the false-done this gate
exists to stop. Enforcement lives at three points today: this section, the evaluator protocol's
IMPL-EVAL checklist line, and the PR-template close-gate checkbox. The future Phase-D label
automation will block the `status:ready-merge` transition (and any `Closes #N` auto-close) while any
referenced `- [ ]` remains unchecked; until it lands, honor this gate by hand.

## Epic / sub-issue standard

Program epics use one convention so the board and the run dir agree:

- **Epic issue** — title `Epic: <name>`; labels `type:umbrella` + `epic:<slug>` + the relevant
  `area:`/`priority:` + a milestone; body = the epic's pillars, a sub-issue checklist, and links.
  **Never put a closing keyword on an epic** (see the close-gate above) — it closes **by hand** once
  every child is done.
- **Sub-issues** — real issues titled `[<epic-slug> S<n>] <slice>`, each carrying `epic:<slug>` (plus
  its own `area:`/`priority:`/milestone), linked to the epic by `Part of #<epic>` in the body.
  Exactly **one** PR resolves each sub-issue, and that PR's body carries `Closes #<child>`.
- GitHub-native sub-issue linkage is **unused repo-wide** today, so it is adopted **opportunistically**
  as a nice-to-have on top of the `Part of #<epic>` body text — it is not required and carries no
  migration burden.

## Per-phase structured comments

Each harness phase posts ONE comment so the PR timeline reads as a phase log. Lead with a status
token line so the (future) label automation can parse it:

```markdown
**[PHASE: IMPL-EVAL] [VERDICT: CHANGES_REQUESTED]**

<one-line headline>

### Findings
1. **C1 …** — <what + where + fix>
...

### Next
- <action + owner>
```

Phases & their verdict vocabulary:

- `RESEARCH` → (no verdict; summary only)
- `PLAN` → summary; gate is a separate `PLAN-EVAL` comment with `APPROVED` / `CHANGES_REQUESTED`.
- `IMPL` → summary of slices landed.
- `IMPL-EVAL` → `PASS` / `CHANGES_REQUESTED` (the gate that clears merge).
- `REVIEW` (augment/Fable) → advisory.

The evaluator must be a **separate session** from the generator (harness rule). Comment, don't edit,
when acting as evaluator.

## Draft-PR-on-start (harness)

For harnessed work, **opening the feature is opening a DRAFT PR** — in the **same session as the
first commit**, where the run-dir bootstrap commit (`.llm/runs/<run-id>/`) is the natural first
commit. There is no "work now, PR later": the draft PR is the reviewable surface from the first
commit onward, so the whole run reads from mobile without cloning or diffing.

The draft PR body carries these, live from the start (they are the anchors the close-gate and the
evaluator read):

- an explicit, **checkable Definition-of-Done** (the close-gate reads these boxes);
- the run-dir path `.llm/runs/<run-id>/`;
- the slice checklist (`## Slices`);
- the **live commit list** — the draft PR's own commit list plus per-slice comments are the commit
  trail (there is no `commits.md`);
- drift / debt (`## Drift / Debt`).

## Draft ↔ ready

- Open multi-slice work as a **draft** PR; per-commit CI (Phase C tier 1) runs on drafts but is
  non-blocking.
- Flip to **ready for review** only when the slice checklist is complete and IMPL-EVAL is expected to
  pass — that transition is what triggers the blocking e2e tier and `status:impl-eval`.

## Label taxonomy (namespaced — Phase D)

Exactly one `status:` at a time; `type:`/`area:`/`ci:` as needed. The single-status rule is what lets
a board column reflect reality.

- `type:` — `umbrella`, `sub-pr`, `chore`, `feat`, `fix`, `docs`, `refactor`, `perf`, `test`
- `status:` — `triage` (incoming issues), `research`, `plan`, `plan-eval`, `impl`, `impl-eval`,
  `augment-review`, `ci-fail`, `ready-merge`
- `area:` — `cli`, `fresh`, `fresh-ui`, `plugins`, `auth`, `deps`, `aspire`, `tooling`, `database`,
  `kv`, `sdk`, `service`, `config`, `telemetry`, `ai-core`, `plugin-ai`, `docs`
- `priority:` — `p0` (release blocker), `p1`, `p2`, `p3`
- `ci:` — `skip-e2e`, `full` (manual overrides for the path-filtered CI); `gate:` — `e2e`, `jsr`
- `epic:` — groups every issue/PR belonging to a program epic (e.g. `epic:ai-stack`,
  `epic:deployment`); the epic's own umbrella issue carries `type:umbrella`.
- `wave:` — scheduling band that drives the **milestone** (see below): `v1`, `v1-min`, `defer`.
- flags — `rfc` (an RFC tracking issue/PR; see `rfcs/README.md`), `breaking`, `good first issue`,
  `help wanted`

The machine-readable label set (names + colors + descriptions) is mirrored in
[`.github/labels.yml`](../../../.github/labels.yml) for a future label-sync workflow; keep the two in
sync. Add labels there first — never delete an existing label (it strips the label off live issues).

**Every open issue and PR carries at least one `type:` and one `area:` label, and every open issue
carries a milestone.** New issues land with `status:triage` (the issue forms apply it automatically)
until triaged.

Source of truth stays the harness run artifacts under `.llm/runs/`. Labels + Projects v2 are a
**view and a trigger**, not the record. When you advance a phase, move the `status:` label in the
same action you post the phase comment, so the board never lags the timeline.

### Stage-label lifecycle

The `status:` labels are a **lifecycle**, not free-form tags — a harness PR walks exactly one path,
moving the label in the **same action** as each phase comment:

`status:research → status:plan → status:plan-eval → status:impl → status:impl-eval →
status:augment-review` (optional advisory) `→ status:ready-merge`

Exactly one `status:` at any moment. These are the existing `labels.yml` tokens — **no new stage
names**. Enforcement exists because a practice audit found ~50% non-compliance: recent merged PRs
shipped with **zero** labels or with `status:` frozen mid-lifecycle (merged still at `status:plan`).
The close-gate keys off `status:ready-merge`, so a missing or frozen `status:` is a merge hazard, not
a cosmetic lapse.

> Phase D (the Action that enforces single-status, syncs label→Project column, and fires the right
> workflow per status) is deferred to the repo-process-automation umbrella. Until it lands, apply
> labels manually per this taxonomy so the future automation has clean data.

## Milestones (roadmap mapping)

Three milestones track the release roadmap. Assign one to every open issue:

- **`0.0.1-beta.1`** — the next beta cut. Everything scheduled for the beta.
- **`0.0.1-stable`** — the stable release. Deferred-but-committed work.
- **`Backlog / Triage`** — accepted-but-unscheduled work and not-yet-triaged issues.

Map from the `wave:` label:

| Label | Milestone |
| ----- | --------- |
| `wave:v1`, `wave:v1-min` | `0.0.1-beta.1` |
| `wave:defer` | `0.0.1-stable` (or `Backlog / Triage` when the body says "track only / no impl") |
| epics + umbrellas (`epic:*`, `type:umbrella`) | the milestone of the cut they land in (usually `0.0.1-beta.1`) |
| upstream / tracking issues with no wave | `0.0.1-beta.1` if the cut depends on them, else `Backlog / Triage` |

Beta/stable acceptance criteria are owned by the Road-to-0.0.1-stable umbrella; keep milestone scope
in sync with it rather than inventing criteria here.

## Issue and PR templates

Contributors and agents file through the GitHub-native forms — do not hand-author raw issues when a
form fits:

- Issue forms live in [`.github/ISSUE_TEMPLATE/`](../../../.github/ISSUE_TEMPLATE/): `bug_report`,
  `feature_request`, `rfc_proposal`, `documentation`, plus `config.yml` (contact links). They
  auto-apply the incoming labels (`bug`/`enhancement`/`rfc`/`documentation` + `status:triage`).
- The PR body follows [`.github/pull_request_template.md`](../../../.github/pull_request_template.md),
  which is the PR body template above plus the closing-keyword `## Scope` convention.
- Substantial/breaking changes go through the RFC process in
  [`rfcs/README.md`](../../../rfcs/README.md) before implementation.

This skill is the single canonical reference for NetScript's GitHub process — label taxonomy,
milestones, closing-keyword rule, templates, and RFC entry point. `CONTRIBUTING.md` is the
human-facing mirror; `.github/labels.yml` is the machine-readable label set.

## Path-filter awareness (Phase C)

Config/docs-only PRs are auto-skipped by CI `paths-ignore`; override with `ci:full` when a docs PR
must run e2e, or `ci:skip-e2e` to suppress it. Don't fight the filter by editing workflows per-PR.
