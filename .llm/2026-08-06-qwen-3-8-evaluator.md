# Phase-specific formal evaluator defaults

Harness run `chore-qwen-3-8-evaluator--1331` completed its implementation close gate on
2026-08-06.

- Routing: canonical PLAN-EVAL remains OpenRouter `minimax/minimax-m3`; canonical IMPL-EVAL is
  OpenRouter `qwen/qwen3.8-max`.
- PLAN-EVAL: separate Minimax M3 session `815534c7-6c02-4aa5-ab86-a905a0bade6f` returned `PASS`
  before implementation.
- Implementation: S1–S3 migrated the model catalog, phase routing, provider presets, runtime
  guards/canaries/tests, harness guidance, skills, generated mirrors, and validation surfaces while
  retaining Qwen 3.7 only in explicit rejection or historical evidence.
- Review: each substantive slice received owner-authorized OpenRouter Grok 4.5 adversarial review
  and passed re-review after its findings were addressed.
- Gates: focused suites passed 52/52 and 98/98; the final agentic suite passed 417/417; scoped
  check/lint/fmt, docs maintenance, generated-surface synchronization, and static/live provider
  canaries passed; the full CLI E2E passed 73/73 with cleanup.
- IMPL-EVAL: separate Qwen 3.8 Max session `039835cf-151b-4152-98b8-1037f8c6330c` returned `PASS`.
  Its sole LOW process lesson—six ordinary review prompts omitted `## SKILL`—was incorporated into
  the canonical briefing template and lane-policy invariant without rewriting historical evidence.
- Delivery: PR #1336 closes issue #1331 after merge. The milestone orchestrator retains merge
  authority; this run does not merge or publish.
- Hygiene: unrelated `deno.lock` launcher churn remained untouched and excluded from every commit.
