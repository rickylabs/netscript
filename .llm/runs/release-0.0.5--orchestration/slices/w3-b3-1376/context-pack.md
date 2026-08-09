# Context pack: W3-B3 #1376

- Phase: `plan-eval`; no product source changed.
- Baseline: `aa8e151e6`; branch `fix/mcp-execute-command-host-cli`.
- Issue: #1376; all ten live acceptance rows are quoted in `plan.md`.
- Locked boundary: #1375 owns docs-root, host-config, environment, and corpus changes. This slice's
  eventual `run-agent-mcp.ts` edit is limited to CLI version/executor injection.
- PLAN-EVAL cycle 1: `FAIL_PLAN`. F1 corrected by removing the nonexistent generation-equality
  claim and explicitly decoupling standalone host identity: standalone MCP selects
  `MCP_PACKAGE_VERSION` as its CLI compatibility version. Workspace bump + `lockstep-residue` are
  accurately recorded as current release lockstep, not a generator assertion.
- F2: all artifacts consolidated under canonical `slices/w3-b3-1376/`.
- F3: mismatched identity starts as compile-time RED; execute→drift is behavioral RED; standalone
  fallback is characterization. Evidence must label each class.
- F4: a policy denial always writes/overwrites a failure receipt for the named resource.
- Locked design: one executor-owned identity shared by list/execute; host re-entry uses current
  executable/main module; standalone visibly uses the MCP-selected compatibility version; execute
  receipts use child exit/policy semantics and optional resource; list is explicitly exempt.
- PLAN-EVAL cycle 2: `PASS`; implementation authorized. Issue and PR are `status:impl`.
- S1 recorded: identity compile-time RED exit 1 (missing third argument + identity property),
  execute→drift behavioral RED exit 1 (no receipt written), standalone characterization exit 0.
- S2 implemented `CliExecutionIdentity`, executor-owned immutable identity, identity-bearing command
  results and list output, standalone MCP-version-selected identity, schemas, and composition.
  Targeted checks pass; identity tests 9/9; MCP full-export doc lint zero errors.
- Next action: commit/push/comment S2, then S3 makes the minimal `run-agent-mcp.ts` host injection
  and executes a temporary mismatched-version host entrypoint through the MCP server.
- S3 implemented script/installed re-entry as `[Deno.execPath(), "run", "-A", Deno.mainModule]`
  and compiled re-entry as `[Deno.execPath()]`, with `CLI_PACKAGE_VERSION` in production. Focused
  tests 4/4 include actual mismatched-version host execution and prove no MCP-pinned JSR spawn.
- Shared-file disclosure: `run-agent-mcp.ts` changed only for host runtime/version/executor
  injection; no #1375 docs-root/config/corpus symbols were touched.
- Next action: commit/push/comment S3, then S4 resolves the behavioral receipt RED, denial overwrite,
  refusal text, optional resource, and published MCP README policy.
- S4 resolved the behavioral RED: successful execute authorizes same-resource drift; failed child
  and all five named denials write failure and refuse drift. MCP tests 113/113, focused 24/24, CLI
  host 4/4, full-export doc lint zero errors, focused check green.
- README documents hosted vs standalone identity and receipt exemption/semantics. Mechanical
  publish-asset regeneration changed only the embedded MCP README constant; no #1375 wiring.
- Next action: commit/push/comment S4, then run S5 scoped check/lint/fmt, quality, arch, JSR,
  publish dry-run, review-thread and other non-expensive gates. Request—not run—the serialized
  `scaffold.runtime` token when otherwise green.
