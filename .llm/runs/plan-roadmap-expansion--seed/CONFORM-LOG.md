# CONFORM-LOG — pre-revamp KEEP issue taxonomy conformance

**Repo:** `rickylabs/netscript` · **Executed:** 2026-07-05 · **Run:** `plan-roadmap-expansion--seed`
**Actor:** rickylabs (gh from WSL codex) · **Authorization:** owner-ratified apply pass.

## Scope

- Enumerated all **open** issues (live `gh issue list`), **excluded #399–#461** (already conformant
  newly-filed batch). Remaining conform set = **49 pre-revamp KEEP issues**.
- **Milestones: untouched** (frozen train). **Closes: zero.** **No closing keyword** placed in any
  body. Children reference their epic via **`Part of #<epic>`**; umbrellas/epics/standalones get none.

## Summary counts

- **Conformed (mutated): 31 issues.**
  - Body `Part of #<epic>` appended: **31** (of which 4 also got the wave reconcile).
  - Wave-label reconcile (`wave:defer` → `wave:v1`): **4** (#345–#348).
- **No change (already conformant / no-op by design): 18 issues.**
- **Titles changed: 0** — pre-revamp titles already match the new convention family
  (`[Handle] scope: desc`, `epic: …`, `bug(...)`, `feat(...)`, `[Sn]`, `[Deploy-Sn]`, `[AI-stack …]`).
- **Labels:** full namespaced set (`type:`/`area:`/`priority:`/`wave:`/`epic:`/`gate:`/exactly one
  `status:`) was **already present** on the entire conform set from the Phase-2 filing batch; the only
  missing/incorrect label found was the #345–#348 stale `wave:defer`, now reconciled.

## Per-issue table

| # | Epic parent | Title changed | Labels changed | Body `Part of` added | Note |
|---|-------------|---------------|----------------|----------------------|------|
| #219 | #238 | no | no | **yes** → #238 | ai-stack child |
| #246 | #238 | no | no | **yes** → #238 | |
| #247 | #238 | no | no | **yes** → #238 | |
| #248 | #238 | no | no | **yes** → #238 | dual-epic (also `epic:telemetry-revamp`); home epic #238 |
| #256 | #238 | no | no | **yes** → #238 | |
| #257 | #238 | no | no | **yes** → #238 | folds→#379 downstream (not now) |
| #258 | #238 | no | no | **yes** → #238 | |
| #262 | #238 | no | no | **yes** → #238 | |
| #266 | #238 | no | no | **yes** → #238 | track-only; `status:triage` retained (Backlog) |
| #290 | #238 | no | no | **yes** → #238 | |
| #379 | #238 | no | no | **yes** → #238 | absorbs #257 downstream |
| #380 | #238 | no | no | **yes** → #238 | |
| #388 | #238 | no | no | **yes** → #238 | |
| #302 | #301 | no | no | **yes** → #301 | road-to-stable child (no `epic:` label exists for #301 tree) |
| #303 | #301 | no | no | **yes** → #301 | |
| #305 | #301 | no | no | **yes** → #301 | |
| #306 | #301 | no | no | **yes** → #301 | |
| #307 | #301 | no | no | **yes** → #301 | |
| #309 | #301 | no | no | **yes** → #301 | |
| #314 | #313 | no | no | **yes** → #313 | Prisma-Next child |
| #315 | #313 | no | no | **yes** → #313 | |
| #316 | #313 | no | no | **yes** → #313 | |
| #317 | #313 | no | no | **yes** → #313 | |
| #318 | #313 | no | no | **yes** → #313 | |
| #387 | #389 | no | no | **yes** → #389 | harness-v3 child |
| #345 | #327 | no | **`wave:defer`→`wave:v1`** | **yes** → #327 | Q2 reconcile (beta.5) |
| #346 | #327 | no | **`wave:defer`→`wave:v1`** | **yes** → #327 | Q2 reconcile (beta.5) |
| #347 | #327 | no | **`wave:defer`→`wave:v1`** | **yes** → #327 | Q2 reconcile (beta.5) |
| #348 | #327 | no | **`wave:defer`→`wave:v1`** | **yes** → #327 | Q2 reconcile (beta.5) |
| #349 | #327 | no | no | **yes** → #327 | WATCH sibling (Backlog `wave:defer` correct — untouched) |
| #350 | #327 | no | no | **yes** → #327 | WATCH sibling (Backlog `wave:defer` correct — untouched) |

### No change (already conformant / no `Part of` by design)

| # | Kind | Reason no body edit |
|---|------|---------------------|
| #232 | umbrella (docs) | epic/umbrella — no `Part of`; no `epic:` label (disjoint accuracy-debt sibling per map) |
| #238 | umbrella (ai-stack) | epic — no `Part of` |
| #301 | umbrella (road-to-stable, top) | epic — no `Part of` |
| #313 | umbrella (Prisma-Next) | epic — no `Part of` |
| #327 | umbrella (deployment) | epic — no `Part of` |
| #389 | umbrella (harness-v3) | epic — no `Part of` |
| #391 | umbrella (reforecast) | epic — no `Part of` |
| #234 | standalone RFC | no epic parent |
| #295 | standalone | no epic parent |
| #319 | standalone (Aspire Layer A tracking) | no epic parent (map: KEEP standalone) |
| #320 | standalone (Aspire Layer B tracking) | no epic parent (map: KEEP standalone) |
| #376 | standalone bug (plugin-workers) | no epic parent |
| #269 | #238 child | already carried `Part of #238` |
| #270 | #238 child | already carried `Part of #238` |
| #271 | #238 child | already carried `Part of #238` |
| #272 | #238 child | already carried `Part of #238` |
| #393 | deployment foundation | already carried `Part of #391` (valid umbrella) — **flagged**, see below |
| #394 | deployment foundation | already carried `Part of #391` (valid umbrella) — **flagged**, see below |

## #345–#348 wave reconcile (owner Q2) — RESULT

All four sat on milestone `0.0.1-beta.5` with a stale `wave:defer`. Per the netscript-pr wave→milestone
map, a beta cut is `wave:v1` (cf. sibling beta.5 issues #303/#305/#306/#307/#402/#403 all `wave:v1`).
Reconciled **`wave:defer` → `wave:v1`** on #345, #346, #347, #348. **Milestones left at beta.5**
(unchanged). #349/#350 (Backlog WATCH siblings) correctly keep `wave:defer` — untouched.

## Flags for owner (ambiguous / out-of-scope)

1. **`area:deploy` label absent from `.github/labels.yml`.** It is live and applied consistently on
   #327/#345–#350/#393/#394, but the canonical area set in `.github/labels.yml` (reconciled by PR #462)
   does **not** list `area:deploy`. Left as-is on the issues (do not churn); recommend adding
   `area:deploy` to `labels.yml` for parity, or re-labelling to an existing area.
2. **#393 / #394 `Part of #391` vs `#327`.** Both carry `epic:deployment` but reference the reforecast
   umbrella #391, not the deployment epic #327. `Part of #391` is a valid umbrella reference so it was
   **not clobbered**; if the owner prefers the epic-of-record, add `Part of #327`.
3. **#232 (docs umbrella)** has no `epic:` label. Per SUPERSESSION-MAP it is KEEP as a disjoint
   accuracy-debt sibling (not folded into `epic:docs-cut` #401), so no epic label was assigned — noted
   as intentional, not a gap.

## Guardrails honored

- No milestone changed. No issue closed. No closing keyword (`Closes/Fixes/Resolves`) in any body
  (verified count = 0 on sampled edits). All bodies written via `--body-file`. Read-then-write per
  issue; existing content preserved, `Part of #<epic>` appended only.
