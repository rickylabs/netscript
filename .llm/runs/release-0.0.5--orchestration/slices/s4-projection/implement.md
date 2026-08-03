use harness

# Slice W2: OMB S4 projection domain module — #1130

You are the implementation supervisor for the PR closing #1130 (epic #1126, RFC #1123). Read the
issue body and RFC first. Wave-0 gating is satisfied: `proofs/P2-verdict.md` exists (committed,
`.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/`).

## Milestone-run evaluator rule (read before planning)

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: do
not spawn or wait on a local formal PLAN-EVAL — evaluation composes draft→ready augment +
OpenHands + the orchestrator pre-merge gate. Mark your PLAN-EVAL gate row "composed per
milestone-run.md (orchestrator waiver)", lock your plan, and implement in the same run.

## Proof inputs you MUST consume (do not re-derive)

`P2-verdict.md` + `proofs/evidence/P2-no-db.json` (no-DB branch, fully measured): 3657-byte
OpenAPI 3.1.1 spec; dotted contract-path operationIds (`v1.health.list` etc.); discovery rows
73/89/88 compact UTF-8 bytes; observed OpenAPI 3.1/2020-12 keyword subset recorded; **the no-DB
template has NO error envelope — error views are `{}`**; no local/external/unresolved refs in
the measured case. The DB branch is blocked by #1191 (in flight this wave) — if its
re-measurement later contradicts these contracts, that is a recorded epic-level re-scope, not
your concern now (orchestrator drift D8).

## Deliverable = the gates (issue boxes)

1. Per-rung description-ladder fixtures incl. a real generated no-summary spec.
2. Ambiguity-refusal fixtures (case-variant ids, >1 match).
3. Errors-view fixture on the no-database template proving **no hallucinated envelope** — the
   measured reality is `{}`; your projection must not invent one.

## Anticipated files

`packages/mcp` pure domain module (new files: operation index, canonical identity, description
ladder, schema views) + fixtures/tests. **Pure domain: no I/O, no adapters** (S5 owns the
directory port; S6 owns tools). Archetype-2 full gate column (RFC S-20): `deno task
quality:gate`, scoped check/lint/fmt on `packages/mcp`, doc-lint if exports move (they will —
new module: run scoped doc-lint + publish dry-run evidence), no new lint-ignores, no `deno.lock`
churn. Adjacent debt `MCP-A6-V2-SHAPE`: untouched.

## PR contract

Branch `feat/openapi-mcp-projection-domain` (worktree provided), target `main`. Labels:
`type:feat`, `area:tooling`, `priority:p1`, `epic:openapi-mcp`, exactly one `status:`; milestone
`0.0.5`. Body: `Closes #1130` only with all boxes truthfully ticked; authoritative
`## Definition of Done` per the live template (unchecked DoD boxes fail close-gate). Never write
keyword-adjacent issue references in prose. Slice `worklog.md`/`drift.md` in this dir. Push via
explicit refspec only.
