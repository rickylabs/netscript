# Qwen 3.8 Max — Recover and Finish Prisma Risk Review

Resume session `f5c1afd0-f89f-48e2-9dfc-3e8f5ade646b` using the same requested and observed route:
OpenRouter `qwen/qwen3.8-max`, effort `max`.

The parent review was interrupted because an automatically spawned child requested `claude-opus-5`;
the evaluator model guard denied that cross-model request. This is a route-policy failure, not a
finding about the architecture.

Hard constraint for this resumed turn: do **not** invoke Agent, Task, TaskCreate, Workflow, Team, or
any subagent/child-session facility. Work as one Qwen parent. Use the evidence and completed child
results already in the resumed conversation; use only read-only file/search/shell tools if a small
gap remains.

Finish the original independent falsification report. Correct any imprecise claims (including exact
versus caret Prisma catalog ranges), distinguish RC-tag proof from post-RC-main proof, and make
every load-bearing conclusion evidence-backed.

Write exactly one repository artifact:

`.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/qwen-prisma-risk-review.md`

The report must contain:

- requested/observed route and the guard-interruption disclosure;
- verdict on the architectural direction;
- corrected-fact ledger with exact sources;
- minimum viable NetScript-owned architecture;
- boundary table for NetScript vs Prisma vs providers/plugins/apps;
- Prisma adopt/wrap/reject/defer table;
- multi-provider and Prisma-GA contingency strategy;
- adversarial failure/risk ledger;
- conformance and release matrix;
- conditional decisions and kill/switch criteria;
- source register.

Do not edit the canonical RFC, plan, worklog, supervisor, drift log, existing research, production
code, or any other file. End only after the report is complete.
