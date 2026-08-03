# Drift Log: saga engine correctness

## 2026-08-03 — Healthy Redis result does not resolve the field hang

- **What:** Owned healthy Redis/Garnet completed the exercised paths, while a concurrent CAS probe
  admitted all 16 competing writers. The healthy result is scoped to that setup and cannot close the
  field hang; dead-endpoint bounded failure is independently required.
- **Source:** Real-server probes in ignored `.llm/tmp/repro-1064-*.ts`.
- **Expected:** The healthy-container reproduction would expose the deployed hang.
- **Actual:** Healthy sequential saves complete; the deployed localhost/dead-endpoint condition
  still requires a dedicated reproduction. Connection-shared `WATCH` independently fails CAS.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `repro-1064-concurrent-cas.ts` output: `fulfilled: 16`, `rejected: 0`, final
  writer 16.

## 2026-08-03 — Capability path redirects to canonical content

- **What:** `docs/site/capabilities/durable-sagas.md` is a three-line redirect stub whose target is
  `docs/site/durable-workflows/sagas.md`.
- **Source:** docs tree and xref search.
- **Expected:** State precedence on the sagas capability page.
- **Actual:** Acceptance updates the canonical content reached through that redirect, plus the
  storefront tutorial.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `rg -n "cap:durable-sagas" docs/site` and both existing pages.

## 2026-08-03 — Local PLAN-EVAL transport is credential-blocked

- **What:** The canonical local Claude Code + OpenRouter evaluator could not launch because the
  selected provider credential is absent.
- **Source:**
  `deno task agentic:provider-canary --live --profile claude-openrouter --model
  qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns004-sagas`.
- **Expected:** A separate Qwen evaluator session writes `plan-eval.md` before implementation.
- **Actual:** The agentic canary returned exit 4, `status: blocked`, diagnostic `auth_required`; no
  evaluator session was created.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** The provider canary reports `credential: absent`. Cloud OpenHands is prohibited for
  this local run by the OpenHands routing skill.

## 2026-08-03 — PLAN-GATE waived by PR-A supervisor

- **What:** “Plan-Gate for this run is waived.” The supervisor states: “You are not self-certifying
  — I am certifying,” and will substantively review each slice.
- **Source:** Written PR-A supervisor message in the implementation session.
- **Expected:** Separate local Qwen PLAN-EVAL before implementation.
- **Actual:** The canonical open-model lane is credential-blocked and closed-model substitutes are
  prohibited; the opposite-family supervisor supplied the written waiver requested by the run.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Supervisor waiver dated 2026-08-03; prior canary evidence remains recorded and will
  not be rerun.
