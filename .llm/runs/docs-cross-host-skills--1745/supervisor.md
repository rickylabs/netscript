# Supervisor — docs-cross-host-skills--1745

| Field                | Value                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| Leaf issue           | #1745 — `docs(agentic): document canonical cross-host skill installation`         |
| Milestone / labels   | 0.0.7 · `type:docs`, `area:docs`, `priority:p1`, `status:plan` (filed by coordinator) |
| Topic lane           | docs (`orchestrator/release-0.0.7-docs`) — allocated by the coordinator            |
| Supervisor           | Claude · Anthropic · Opus 5 · high (Tier-A), NAS agent plane                       |
| Branch               | `docs/agentic-cross-host-skills` — direct-to-main, no upstream until first push    |
| Base                 | `origin/main` `13878a80a50c55b9662099fed64555f2310ae4a3`                           |
| Worktree             | `/home/agent/projects/netscript/worktrees/007-leaf-1745`                           |
| Run dir              | `.llm/runs/docs-cross-host-skills--1745/`                                          |
| Implementation lane  | `normal_implementation` → Codex · OpenAI · `gpt-5.6-sol` · medium                  |
| Review pairing       | `review_codex` → Tier-A supervisor review before sign-off (no self-certification)  |
| PLAN-EVAL            | **N/A** — coordinator ruling; bounded 3-page correction, authoritative current-main behavior, explicit acceptance |
| IMPL-EVAL            | **Required**, separate session, native opposite-family for Codex work → Claude · Fable 5 · medium |
| Archetype / overlay  | none (`SCOPE-docs.md`); no `packages/`/`plugins/` source in scope                  |

## Route justification

Three prose files plus two generated assets, with an authoritative source contract to check against —
more than `light_implementation`, well short of `complex_implementation`. `normal_implementation`
(Sol · medium) per `lane-policy.md`, which pairs to `review_codex` and to a Fable 5 · medium
IMPL-EVAL. The `documentation_authoring` (Antigravity/Gemini) lane was **not** used: the coordinator
allocated a Codex implementation thread explicitly, and this is a correction against source rather
than greenfield authoring.

## Boundaries this leaf must not cross

- No `packages/`/`plugins/` source. The only `packages/` diff permitted is the regenerated
  `agent-docs.generated.ts`.
- `skills/` bodies belong to #1737; Aspire 13.5 docs belong to #1723; the #1728 error-documentation
  observation (docs-lane D-2) stays parked.
- No merge, no publish, no relabel/close of any issue, no central ledger mutation.

## Phase log

- **Bootstrap / Research / Plan** — supervisor, this session. `research.md` read entirely from
  `origin/main` at the leaf base, per the lane rule that main-state facts are never read from a
  parked worktree.
- **Implement** — Codex thread; see `codex-thread-ids.md`.
- **Gate → Tier-A → IMPL-EVAL** — pending.
