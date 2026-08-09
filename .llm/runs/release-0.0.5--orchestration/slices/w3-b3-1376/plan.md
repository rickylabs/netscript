# Plan: MCP executes the hosting CLI (#1376)

## Metadata

| Field | Value |
| --- | --- |
| Run | `release-0.0.5--orchestration/slices/w3-b3-1376` |
| Branch | `fix/mcp-execute-command-host-cli` |
| Archetype | `6 — CLI/Tooling` |
| Phase | `impl` |

## Goal

Make both MCP command tools report and use one explicit CLI execution identity: the actual host CLI
when embedded by `netscript agent mcp`, and the documented MCP-version-pinned published CLI only
for the standalone MCP entrypoint. Receipt evidence must reflect command-policy denial and child
exit status so a successful allowed execution can truthfully authorize `record_drift`.

## Live acceptance rows (quoted verbatim from #1376)

- [ ] `netscript agent mcp` injects a `cliCommand` that re-enters the running CLI.
- [ ] No JSR download occurs for `execute_command` when the server is CLI-hosted.
- [ ] `list_commands` reports `CLI_PACKAGE_VERSION`, not `"current"`.
- [ ] `execute_command` results include the resolved executor command and version.
- [ ] `execute_command` writes a diagnostic receipt on success and on failure.
- [ ] `record_drift` accepts a receipt produced by a successful `execute_command`.
- [ ] The `record_drift` refusal message lists the tools that can authorize it, accurately.
- [ ] Tests cover: CLI-hosted executor resolution; standalone fallback to the pinned specifier;
      receipt written on both exit paths.
- [ ] Negative test: a denied command (`deploy`, `init`, `db reset`, `plugin remove`, `ui:remove`)
      writes no success receipt and cannot authorize `record_drift`.
- [ ] Negative test: with the host CLI at a version different from the MCP package, no spawn resolves
      to the MCP-pinned specifier.

## Locked decisions

1. Introduce one bounded, immutable CLI execution identity containing hosting mode (`host` or
   `standalone`), CLI version, and resolved fixed command prefix. The executor owns this identity;
   `list_commands` and `execute_command` receive the same instance at composition.
2. In CLI-hosted mode, resolve the re-entry prefix at the CLI composition edge: compiled binary is
   `[Deno.execPath()]`; script/global-install mode is
   `[Deno.execPath(), "run", "-A", Deno.mainModule]`. Inject `CLI_PACKAGE_VERSION`. No JSR
   specifier is constructed in this mode.
3. Standalone MCP is **explicitly decoupled from host CLI identity**: it keeps
   `DEFAULT_CLI_COMMAND` pinned to `jsr:@netscript/cli@${MCP_PACKAGE_VERSION}` and reports mode
   `standalone`, that command, and that version. This is an MCP-owned compatibility policy: absent a
   host, the MCP package selects the CLI version it was released to drive. It does not claim that
   publish-asset generation asserts CLI/MCP equality. Current release manifests are kept in
   lockstep by `.llm/tools/deps/bump-version.ts` plus the release-readiness `lockstep-residue`
   audit. S2 owns the executable policy in
   `packages/mcp/src/infrastructure/spawn-command-executor.ts` and
   `packages/mcp/tests/command_adapters_test.ts`; S4 owns its consumer documentation in
   `packages/mcp/README.md`.
4. Extend the published command result schemas rather than encode identity in output text.
   `list_commands` returns identity beside descriptors; every allowed `execute_command` result
   returns identity beside exit evidence.
5. Add optional `resource` to `execute_command`; default it to `project`. Receipt status is `0` only
   when policy permits execution and the child exits zero. Policy denial, timeout, thrown adapter
   failure, and non-zero child exit **always write status `1` for the named resource**, overwriting
   any earlier success. A denial therefore writes a failure receipt and can never preserve a
   success receipt that authorizes drift.
6. `list_commands` is explicitly receipt-exempt in code/README because enumeration is not a
   diagnostic of a project resource. `execute_command` is receipt-wrapped with command-specific
   exit semantics.
7. Update the shared refusal text to name `execute_command` as an authorizing tool only after the
   receipt behavior is proven.
8. Preserve `command-policy.ts` unchanged. Safety comes from default-deny policy plus guaranteed
   host-binary identity and truthful receipts, not a scope-expanding allowlist edit.

## Ordered commit slices

| Slice | Files | Change | Proving gate |
| --- | --- | --- | --- |
| S0 Plan | slice artifacts, draft PR | Research, design, exact acceptance, boundaries | separate PLAN-EVAL PASS |
| S1 RED | `packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts`; `packages/mcp/tests/drift-evidence_test.ts`; `packages/mcp/tests/command_adapters_test.ts` | Add a **compile-time RED** for planned mismatched host identity fields and a **behavioral RED** for execute→drift refusal; add standalone fallback as baseline characterization | targeted type-check fails on missing identity contract; receipt test runs and fails on missing evidence; raw exits/reasons recorded separately |
| S2 Identity contract | `packages/mcp/src/domain/command-executor-port.ts`; `packages/mcp/src/infrastructure/spawn-command-executor.ts`; list/execute flows; tool contracts; `packages/mcp/cli.ts`; `packages/mcp/tests/command_adapters_test.ts` and composition tests | One published execution identity; explicitly MCP-version-selected standalone policy | focused MCP tests + full MCP export-map doc lint |
| S3 Host composition | `run-agent-mcp.ts` minimal executor/version injection and CLI-hosted tests | Re-enter compiled or script host with `CLI_PACKAGE_VERSION`; no JSR command | decisive mismatched-version CLI-hosted test passes |
| S4 Receipts and docs | `packages/mcp/cli.ts`; `packages/mcp/tests/drift-evidence_test.ts`; `packages/mcp/tests/command_flows_test.ts`; `packages/mcp/src/application/flows/record-drift-flow.ts`; `packages/mcp/README.md` | Exit-aware resource receipts; denial always overwrites with failure; list exemption; explicitly decoupled standalone hosting policy documentation | success/failure/denial → `record_drift` focused tests |
| S5 Gates | run artifacts only unless a reviewed fix is required | Scoped and release-readiness evidence; request serialized runtime token | all named gates green; `EXPENSIVE-GATE-REQUEST` recorded, no runtime start before grant |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Re-entry recursively launches MCP | Prefix re-enters only when `execute_command` appends an allowed non-MCP command path; policy tests retain denied paths. |
| `Deno.mainModule` differs for compiled binary | Resolve mode explicitly and unit-test both pure branches; compiled mode executes `Deno.execPath()` directly. |
| Failure receipt accidentally authorizes drift | Test denial and non-zero child exit followed by `record_drift`; assert refusal. |
| Prior success survives a later failure | Evidence write replaces the resource receipt with exit status 1; test this sequence. |
| Published schema becomes undocumented/slow | Explicit exported types/JSDoc, full export-map `doc:lint`, JSR audit, publish dry-run. |
| Collision with #1375 | Minimal lines in `run-agent-mcp.ts`; no docs-root/config/corpus symbols touched; disclose exact diff in slice comment. |

## Deferred and excluded scope

- No command allow/deny policy changes.
- No docs-root, host-config, environment, corpus, OpenAPI tool, adoption, or installed-canary work.
- No merge, publish, canary, issue closure, or release workflow.
- Published installed fallback E2E remains #1343; this PR proves the standalone command contract and
  asks for the serialized `scaffold.runtime` token only after all cheaper gates pass.

## Required gates

- Focused CLI/MCP tests, with named RED then GREEN evidence.
- Scoped check/lint/fmt wrappers for `packages/mcp` and the focused CLI host path, passing
  `--deno-arg --no-lock` and `--unstable-kv` where supported/required.
- `rtk proxy deno task quality:gate`; `rtk proxy deno task arch:check` (named separately even though
  quality chains it).
- `rtk proxy deno task doc:lint --root packages/mcp --pretty` across the full export map.
- JSR audit for `packages/mcp`; `rtk proxy deno task publish:dry-run`.
- Before ready-for-review: review-thread gate.
- Finally write `EXPENSIVE-GATE-REQUEST`, push, and request the single runtime token. Run pre/post
  leak checks only after the grant and never start the expensive gate speculatively.
