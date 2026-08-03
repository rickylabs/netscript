use harness

# Slice W2: OMB S5 ServiceEndpointDirectoryPort + adapters — #1131

You are the implementation supervisor for the PR closing #1131 (epic #1126, RFC #1123). Read the
issue body and RFC first. Wave-0 gating is satisfied: `proofs/P1-verdict.md` exists.

## Milestone-run evaluator rule (read before planning)

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: do
not spawn or wait on a local formal PLAN-EVAL — evaluation composes draft→ready augment +
OpenHands + the orchestrator pre-merge gate. Mark your PLAN-EVAL gate row "composed per
milestone-run.md (orchestrator waiver)", lock your plan, and implement in the same run.

## Binding arbitration input — F1(b), qualified

P1's committed verdict (`.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md`)
selected **F1(b): the `aspire-cli` query adapter is the first-class live `EndpointSource`**.
Read the verdict: the post-allocation seam was NOT refuted (it emitted a correct identity-bound
manifest); the coherent-owned-run bar failed on the #1191 service defect. Consequences for you:

- Your port + adapter set keeps its full scope on the named `EndpointSource` axis
  (`run-manifest`, `appsettings`, `override`, `aspire-cli`) — **with `aspire-cli` as the
  primary live source** in precedence for the current decision record.
- The `run-manifest` adapter remains a first-class implementation of the same port (additive;
  F1 revisit is owner-owned).
- P3's ratified `spec_unavailable` wording (in `proofs/P3-verdict.md`) is the status-mapping
  vocabulary your rows must use.

## Deliverable = the gates (issue boxes)

1. Fixture matrix covering **every** source outcome and status-mapping row — including
   foreign-root manifest, torn manifest + healthy appsettings, identity mismatch on a reused
   port.
2. One hanging spec endpoint yields a **row-level** timeout while the rest of the directory
   returns.

## Anticipated files

`packages/mcp`: the port type + four adapters + precedence/composition + fixtures. The
`aspire-cli` adapter spawns the CLI — design its failure states (CLI absent, non-zero, parse
error) as explicit status rows, never silent. Archetype-2 full gate column: `quality:gate`,
scoped wrappers, doc-lint + publish dry-run evidence for the new exports, no new lint-ignores,
no `deno.lock` churn. Coordinate surface: S4 (projection domain) is being built in parallel —
your port must not depend on S4 internals; both are consumed together by S6 next wave.

## PR contract

Branch `feat/openapi-mcp-endpoint-directory` (worktree provided), target `main`. Labels:
`type:feat`, `area:tooling`, `priority:p1`, `epic:openapi-mcp`, exactly one `status:`; milestone
`0.0.5`. Body: `Closes #1131` only with boxes truthfully ticked; authoritative
`## Definition of Done`; no keyword-adjacent issue references in prose. Slice
`worklog.md`/`drift.md` in this dir. Push via explicit refspec only.
