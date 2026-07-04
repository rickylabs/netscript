# Research — beta.3 → 0.0.1-stable roadmap re-forecast

Status: IN PROGRESS (G1 evidence sweeps dispatching).

## Method

Three parallel Opus 4.8 evidence sweeps (Tier B), each reporting to the supervisor:

- **R1 — open-issue sweep**: every open issue → real remaining scope, dedup, mis-milestoned,
  stale, already-done-but-open. Label/milestone claims are NOT trusted; each verdict cites evidence.
- **R2 — beta.2 PR verification**: the merged PRs in `v0.0.1-beta.1..v0.0.1-beta.2` → what each
  actually delivered vs claimed; false-closed acceptance flags (pattern: #260/#388).
- **R3 — epic completion + code dive**: true state of #301, #238 (+#388 parity), #327, #389,
  Prisma-Next DB migration, docs overhaul; verify in code: `plugins/ai` e2e presence, `/v1/ai`
  implementation, deploy targets; blockers to a dogfoodable stable for eis-chat.

Findings land below as each sweep reports.

## Supervisor inputs (read first-hand, 2026-07-04)

### #301 locked acceptance criteria (the forecast spine)

- **beta.x = correctness floor + repo maturity**: self-bench Run-1 (t1+t2 pass-rate ≥0.90 median,
  t1 turns ≤ NestJS median, rubric ≥0.50, zero harness-level failures); `e2e-cli-prod` +
  `scaffold.runtime` green as hard gates; 172a-2-SOUND plugin-service type-soundness fixed; public
  surface doc-linted; machine-agnostic tooling; doctrine v2 ratified w/ fitness in `arch:check`;
  stale-elim wave-1; one-shot deterministic `release:cut` proven by the cut itself.
- **stable = leadership + production-readiness**: bench leadership (t2 turns < all bare routers,
  ≤ Encore.ts; rubric ≥0.80; pass ≥0.95 t1–t3; composite top-2; reproduced Sonnet 5 + Opus 4.8;
  t3b ≥0.90); full cross-framework batch published; continuous self-bench per release; API/semver
  policy + public-surface-diff CI gate; deprecation policy; **≥1 verified production deployment
  path + CI deployability gate**; zero unowned arch-debt.
- #313 Prisma-Next: locked design, **explicitly NOT a beta blocker** (spec + gap tracker only).
- #301 children: #302 bench · #303 enterprise maturation · #304 de-rickylabs (closed?) · #305
  doctrine · #306 harness (→#389) · #307 stale-elim · #327 deployment · #309 release-eng · #313 DB.

### Milestone map at start (47 open; full list in worklog evidence)

- beta.3 (16): 219 238 246 248 257 269 270 295 309 319 320 376 379 380 387 388
- beta.4 (3): 247 262 290
- stable (16): 232 256 258 271 272 301 302 303 305 306 307 345 346 347 348 389 391(−this epic)
- Backlog (12): 234 266 313 314 315 316 317 318 327 349 350 375
- Notable oddity: deployment epic #327 sits in Backlog while its stable-criteria dependency
  ("≥1 verified production deployment path") is a stable hard gate; deploy S9–S12 sit at stable.

## R1 — Open issues

(pending)

## R2 — beta.2 merged PRs

(pending)

## R3 — Epics + code verification

(pending)
