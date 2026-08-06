# Locked plan — #1117

Status: **LOCKED — composed per milestone-run.md (orchestrator waiver)**

## Design decision

The public activation contract is one ordered, local-only funnel:

`list_api_services → list_service_operations(service) → get_operation_schema(service, operation)`

The app-scoped convention will name all three in this order and state that the result replaces
endpoint/request guessing with curl. The live scaffold runtime gate will read that generated
convention, reject a missing or reordered funnel, then execute the same three existing MCP flows
against the running generated `users` service. It will select an operation from the enumeration
result and retrieve its schema without a hardcoded endpoint, port, or operation id.

Rationale: structural discovery is already implemented and public. Completing and proving its
activation path is smaller and more faithful than adding another tool/server/router. The integrated
gate makes a silently inert or unreachable helper fail, matching #1197's adoption concern.

## Slices

1. **RED — ordered documented path.** Add a focused convention assertion requiring
   `list_api_services` before the two existing tools; demonstrate failure on the current scaffold
   template. Files: public command-tree test and run artifacts. Gate: focused Deno test must fail for
   the missing first step.
2. **GREEN — public convention and live funnel.** Update the app-scoped convention and extend the
   existing MCP endpoint runtime verifier to read it and execute all three flows. Rename the gate
   description/id only if required for truthful reporting; avoid public tool/schema changes. Gates:
   focused tests plus scaffold runtime gate.
3. **Docs and merge readiness.** Keep agent-facing MCP/reference prose consistent if wording needs
   adjustment; run scoped check/lint/fmt, package tests, `quality:gate`, doc-lint when docs move, and
   full `scaffold.runtime` because scaffold output/runtime behavior changes. Perform composed
   evaluation, mirror one-based acceptance evidence, ready the canary-base PR when green.

## Acceptance mapping

1. Live funnel enumerates endpoints through `list_api_services` without curl.
2. Live funnel retrieves a schema through `get_operation_schema` using an operation returned by
   `list_service_operations`.
3. Existing Aspire CLI directory supplies the live dynamic URL; the gate hardcodes neither port nor
   endpoint.
4. Existing local MCP composition remains dependency-free; no hosted service or credential added.
5. Generated app-scoped convention names the complete ordered funnel at the debugging moment.
6. The deterministic scaffold-agent path is exercised by the runtime suite. Broader spontaneous
   adoption remains observational under #1140/#1090 and will not be overstated.

## Risks and mitigations

- **False activation proof:** string assertions alone can pass while flows break. Mitigation: the
  runtime gate executes the three-step chain and uses outputs as the next inputs.
- **Hardcoded sample coupling:** choosing `users` or an operation id could hide discovery failure.
  Mitigation: find the service from `list_api_services` and the operation from
  `list_service_operations` output.
- **Scope duplication:** rebuilding projection/discovery would diverge from merged S4–S7. Mitigation:
  import and compose existing public flows only.
- **Lock churn:** `deno.lock` is already modified on entry. Never stage it; compare status before
  every commit.

## Open decisions

None that force implementation rework. Whether #1140's later uncontrolled agent observation shows
spontaneous adoption is explicitly deferred and must remain honestly observational.

