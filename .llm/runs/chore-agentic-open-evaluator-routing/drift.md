# Drift Log: GLM 5.3 Flash / Qwen 3.8 Flash default open-model routing

Append-only. No implementation drift recorded yet.

## 2026-08-30 — Pre-existing run path omits the activation suffix

- **What:** The owner/bootstrap commit created `.llm/runs/chore-agentic-open-evaluator-routing/`
  without the usual `--<suffix>` portion.
- **Source:** Branch head `bc1b2f88b`; existing `brief.md` and `context-pack.md`.
- **Expected:** Activation convention uses `<branch-with-dashes>--<suffix>`.
- **Actual:** The run and user brief consistently use the unsuffixed path.
- **Severity:** minor
- **Action:** accept; preserve the established path rather than fork the run record.
- **Evidence:** `.llm/runs/chore-agentic-open-evaluator-routing/`.

## 2026-08-30 — No existing policy/doc parity assertion

- **What:** Research found no executable comparison between the formal OpenRouter policy prose and
  `CANONICAL_ROUTE_POLICY`.
- **Source:** Focused search across agentic tests and harness docs.
- **Expected:** `lane-policy.md` claims to be a rendered view and the issue anticipated a parity
  assertion.
- **Actual:** Routing tests cover code behavior only.
- **Severity:** significant
- **Action:** fix in S3 with a machine-parsed formal-route table and exact comparison test.
- **Evidence:** `research.md` finding 12; planned D11.
