# Context Pack: RFC single deployment (issue #820) — rev 10 ready; final eval OWNER-RUN

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `rfc-single-deployment--orchestrator`        |
| Branch         | `feat/beta10-cli-integration` @ `f391190f` (re-baselined vs `origin/main` @ `47cc2fa9`) |
| Current phase  | **rev 10 staged; cycle-10 PLAN-EVAL pending, launched BY THE OWNER** (generator launches no further cycles per the 2026-07-17 owner instruction) |
| Archetype      | N/A — seed/RFC run (downstream drafts span Archetypes 2/3/4/5/6/7 + all three overlays) |
| Session        | generator `7f1fada7-805f-46cb-8ac4-5eb201bdc105` (Fable 5 · high) |
| Evaluator route | Codex · GPT-5.6 Sol · max via the agentic app-server client (drift entry 4); threads c1 `019f6fa1…` c2 `019f6fb5…` c3 `019f6fd5…` c4 `019f6feb…` c5 `019f7006…` c6 `019f701c…` c7 `019f7034…` c8 `019f7052…` c9 `019f7078…` |

## Current State (history in `closure.md`; this file is post-re-open)

plan.md **rev 10** is the staged candidate: after the cycle-9 verdict (FAIL_PLAN with **6/8
boxes PASS**, incl. Decisions-locked) and the design-record closure, the owner re-opened with
"proceed with the revision, I'll take care of the final eval myself". Rev 10 folds cycle 9's
only design residual — the surface classifications (PM-5 additions PUBLIC; PM-15 knobs INTERNAL
@ beta.12, re-decided at PM-20; SD-1 host surface INTERNAL, public = #451/SD-6) — into §I.2/§E.2
with §H dispositions. The RFC remains **unposted** (PASS-gated) and **zero board mutations have
ever occurred** (evaluator-audited cycles 1–9). Owner authorizations on record: loop
continuation (drift 5), cycle-9 bound (drift 6), owner-run final eval (drift 7).

## How the owner runs cycle 10

From the repo root:

```
deno run --no-lock --allow-read --allow-run --allow-env .llm/tmp/rfc820/launch-eval.ts
```

It sends `plan-eval-brief.md` (already carrying the cycle-10 note) to a fresh Codex Sol·max
thread via the agentic app-server client; the verdict overwrites `plan-eval.md` (cycles 1–9 are
archived as `plan-eval-cycle{1..9}.md`). On PASS: execute kickoff deliverable 5 — the #820 RFC
comment (public-repo hygiene: eis-chat PR/issue numbers OK, no internal process details) +
`drafts/` files (NOT filed) — then stage-H ratification of OF-A..OF-K.

## Key Decisions (rev 9 — evaluator-PASSed as locked)

| Decision | Source |
| --- | --- |
| PM-first Tier-4 split; single-runtime lane complete in beta.11; graph mode behind PM in beta.13 | plan §A.1 |
| PM bar PM-1..14 (+15/16/18 per-machine); PM-A/PM-B separate drafts; #543 stays beta.12 | plan §A.2/A.3 |
| Universal containment: harness+guardian pipe-EOF (PM-B core) + Job Objects; per-machine = PM-15 `KillMode` + Windows Job-Object wrapper (OF-K); SD-H Linux backstop @ stable (OF-H) | plan §A.3 |
| Installer = `DeployTargetPort` adapters + `MaintenancePort`; §B.1a op state machines; four-state deterministic purge; §B.1b canonical machine-state root | plan §B.1 |
| Schemas CLI-internal through beta.12 → SD-2 moves+publishes; pinned trust key; sequence high-water + explicit epoch reset (OF-J); `minBootstrapVersion` | plan §B.2 |
| Install-graph digest match-or-refuse (OF-I) | plan §B.2a |
| Identity/privilege matrix; updater sole writer; per-user read tokens via OS-auth broker | plan §B.3 |
| Per-user dynamic ports + `/_svc` proxy w/ per-launch token; per-machine port-reservation registry | plan §B.3a |
| `PackagingModel` (CLI-internal) + build verb + named Aspire publish step, all SD-2 | plan §B.4 |
| One journaled update mechanism incl. Windows apply (L0.7); stable bootstraps + journal-first resolution; §C.3b three-phase ownership + single confirmer | plan §C |
| Both composition modes kept; manifests + SD-7 conformance suite enforce | plan §D |
| Owner forks **OF-A..OF-K** resolve at stage-H filing | plan §F |

## Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| PLAN-EVAL c1–c9 | FAIL_PLAN ×9; c9 = 6/8 boxes PASS | `plan-eval-cycle{1..9}.md` |
| PLAN-EVAL c10 (gate of record) | **PENDING — owner-launched** on rev 10 | recipe above; verdict → `plan-eval.md` |

## Open Questions

- OF-A..OF-K (plan §F, 11 forks) — stage-H owner forks.
- (cycle-9 residual 1 — surface classification — resolved in rev 10 §I.2/§E.2/§H.)

## Drift and Debt

- Drift: **7 entries** (effort raises; no dedicated PR; sandbox-blocked clone → API corpus;
  evaluator via wrapper's inner client; owner-authorized loop continuation; owner wrap-up bound;
  owner-run final eval). Debt: none created.

## Commits

- None — kickoff scoped this run to run-dir artifacts + a post-PASS #820 comment (never earned).
