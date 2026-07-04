# OWNER DECISION BRIEF — morning one-shot unblock

> **Status:** PR #397 is DRAFT. Zero GitHub mutation has occurred. This brief is the single set of
> inputs needed to unblock the reordered autonomous batch (pr-ready → main merges #397 → labels +
> milestones + file issues from `filing-manifest.md` → commit `SUPERSESSION-MAP.md` + reversible
> closes → launch beta.5). **Answer the four PRIMARY items in one line each in your own message and
> the batch runs.** The recommendations are already baked into every drafted artifact; picking the
> recommendation is a zero-rework confirmation.
>
> Verdicts of record: `plan-eval.md` (A–E, PASS) and `plan-eval-F-ai.md` (F-ai, PASS). Both leave
> exactly the items below to your explicit confirmation.

---

## PRIMARY — the four inputs that unblock beta.5

### 1. OF-5 — Telemetry SDK-adapter dependency posture (an architecture pick — yours)

**Question:** May the telemetry revamp ship an **opt-in** `@opentelemetry/sdk-*` adapter
(`adapters/otel-sdk`) on the messaging fan-in path, with the default build staying zero-runtime-dep
(`adapters/otel-deno`)?

- **Recommendation (adopted in drafts):** **YES — allow the opt-in SDK adapter.** Default stays
  zero-dep; the SDK is selected only via `NETSCRIPT_TELEMETRY_PROVIDER` (LD-4, telemetry T3).
- **Rework cost if you pick the recommendation:** **zero.** The drafted graph already assumes it
  (T5 fan-in links, T3 adapter, DDX-8 flagship trace).
- **Rework cost of the alternative (forbid any OTel-SDK dep):** Deno-native span links are
  attribute-less, so the beta.6 fan-in trace (T5) degrades to no-attribute links; the DDX-8 flagship
  waterfall renders a lower-fidelity trace and its "real attribute-bearing link" acceptance softens
  to accepted debt (risk-register line). No slice is deleted, but T5/DDX-8 acceptance is re-drafted.

**One-line answer needed:** `OF-5 = allow opt-in SDK` (recommended) **or** `OF-5 = default-thin only`.

### 2. OF-10 — Dashboard beta.6 IA shape (per-capability vs flat)

**Question:** At beta.6, is the dashboard's plugin surface organized as **per-capability sections**
(workers/sagas/triggers/streams each with create→configure→monitor, contributed via the DDX-17
seam), or as a single **flat "Plugin Control" list**?

- **Recommendation (adopted in drafts):** **per-capability sections.** It is the literal "the
  dashboard is how you drive the framework" thesis and it dogfoods the DDX-17 contribution seam.
- **Rework cost if you pick the recommendation:** **zero.** The drafted beta.6 graph already assumes
  it: DDX-17 blocks DDX-18a-d and DDX-10; DDX-18a-d are milestoned beta.6.
- **Rework cost of the alternative (flat list):** DDX-17 + DDX-18a-d move to `0.0.1-stable`, DDX-10
  loses its DDX-17 dependency, and DDX-16's beta.6 dep set shrinks — a documented fallback re-draft
  of ~5 slices' milestones/deps (not a smaller surface, real rework).

**One-line answer needed:** `OF-10 = per-capability` (recommended) **or** `OF-10 = flat list`.

### 3. Milestones to create (3, not 4)

Live check (read-only, this session) shows `0.0.1-beta.5` **already exists** (10 open issues) — the
plan's "beta.5 does not exist" was stale. `0.0.1-stable` and `Backlog / Triage` also exist.

- **Create:** `0.0.1-beta.6`, `0.0.1-beta.7`, `0.0.1-beta.8`.
- **Do NOT create:** `0.0.1-beta.5` (exists), `0.0.1-stable` (exists), `Backlog / Triage` (exists).

**One-line answer needed:** `milestones = create beta.6/7/8` (confirm) or amend.

### 4. Labels to create (3 epic labels only)

Live check (read-only) shows `wave:v1`, `wave:v1-min`, `wave:defer`, `epic:ai-stack`,
`epic:deployment`, `epic:harness-v3`, `epic:roadmap-reforecast` **already exist on the repo** — so
the design docs' repeated "add the `wave:*` block before filing" is already satisfied on the live
repo. Only the `.github/labels.yml` **file** is out of sync (it declares none of them).

- **Create on the repo (new):** `epic:telemetry-revamp`, `epic:dev-dashboard`, `epic:docs-cut`
  (the last only if you pick docs Opt-2 below).
- **Also (documentation catch-up, not blocking):** apply `proposed-labels-patch.md` to
  `.github/labels.yml` so the file mirrors live reality (adds the `epic:` and `wave:` blocks). This
  is a normal reviewed file edit on the merge, NOT done on the plan branch.

**One-line answer needed:** `labels = create 3 epic labels + apply labels.yml patch` (confirm).

---

## SECONDARY — not beta.5-blocking; needed before the later epics file

These do not gate the beta.5 telemetry launch. Confirm any time before their epic files.

| Fork | Question | Recommendation | Blocks |
| ---- | -------- | -------------- | ------ |
| **OF-2** | docs epic: rescope #232 (Opt-1) vs NEW `epic:docs-cut` child of #301 (Opt-2) | **Opt-2** (leave #232 as accuracy-debt; disjoint scope) | docs (beta.7) filing |
| **OF-3** | #327 rescope WATCH→Tier-4 + promote #375 (`Closes #375` on the #E2 PR) | adopt (draft delta ready) | desktop (beta.8) filing |
| **OF-F1** | FAI-17 GenAI-span adapter == Topic-B T9 — co-own, F-ai implements, one cross-labelled issue | co-own (do not file twice) | FAI-17/T9 (stable) filing |
| **F-ai issue cardinality** | Does each `FAI-n` slice get its own GitHub issue, or do FAI-0–3 share #388 and FAI-7/9 fold under siblings? The "15 KEEP · 1 FOLD · 3 NEW" headline implies the issue-centric accounting in `SUPERSESSION-MAP.md`. | confirm issue-centric accounting | F-ai filing count |
| **#252 / #240 state** | F-ai maps FAI-6→#252 and FAI-7→#240-cluster, but neither is in the live open set. Reconcile (closed? re-open? file new) before FAI-6/7 file. | verify at filing | FAI-6/7 filing |

---

## What happens when you answer (the reordered batch)

1. `gh pr ready 397` (undraft) — main merges #397 (planning artifacts only).
2. Apply `proposed-labels-patch.md` to `.github/labels.yml`; `gh label create` the 3 new epic labels.
3. Create milestones `0.0.1-beta.6/7/8`.
4. File epics + sub-issues exactly per `filing-manifest.md` (taxonomy + milestones + closing-keyword
   discipline; NEVER a closing keyword on umbrellas #391/#301/#238/#388/#327/#232 or the new epics).
5. Commit `SUPERSESSION-MAP.md`; apply its close-list — which is **empty at filing** (every fold
   resolves via a downstream PR closing keyword, so there are **no** manual "superseded by #X" closes
   to make now; the map is the audit trail proving that).
6. Launch beta.5 telemetry-revamp per `beta5-launch-brief.md` (WSL Codex, draft-PR-per-slice,
   separate-session eval).

All GitHub mutation is confined to steps 1–6 and happens only after your own message. Nothing above
has been executed.
