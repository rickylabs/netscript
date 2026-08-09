use harness

You are the W3-B1 implementation supervisor for the NetScript 0.0.5 stable release. You own one PR
cluster: **#1102 — make capability discovery an intent-aware primary agent workflow.** Priority p1,
`type:feat`. This is the wave's public MCP feature, not a chore.

## SKILL

- `netscript-harness`
- `netscript-cli` — `agent mcp`, the MCP tool surface, the docs corpus
- `netscript-doctrine` — A6 CLI/tooling plus the published `packages/mcp` surface; contract first
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` — `@netscript/mcp` is published

Read the inlined shared contract below in full, **including the 2026-08-09 token-scope
clarification**.

## Identity

| Field     | Value                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------- |
| Lane      | `normal_implementation` — Codex · OpenAI · GPT-5.6 Sol · medium                                 |
| Worktree  | `/home/codex/repos/ns005-w3b1`                                                                  |
| Branch    | `fix/mcp-intent-aware-discovery`                                                                |
| Base      | `origin/main@3f41a3639`                                                                         |
| Slice dir | `.llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/`                                     |
| PLAN-EVAL | Claude · Fable 5, separate session, orchestrator-launched — **mandatory before implementation** |
| IMPL-EVAL | Claude · Fable 5, separate session, orchestrator-launched                                       |

## Your dependencies both landed — build on them

Two sibling slices merged into your base and you should read them before planning:

- **#1375 (`9fabd5286`)** shipped the docs-corpus plumbing: `agent init` now emits host configs that
  reach the installed corpus, with `resolveDocsRoot` precedence (flag > env > probe > embedded), a
  **generated embedded fallback corpus** with provenance and a `262_144`-byte budget, and
  `list_docs` reporting `corpus: {kind, root, documentCount}`. Your retrieval work sits on top of a
  corpus that is now genuinely reachable — before that slice, `search_docs` saw two documents.
- **#1376 (`3f41a3639`)** made `execute_command` re-enter the host CLI with real version identity
  and receipt-wrapped both it and `list_commands`.

Do not re-derive or duplicate either. If your feature needs corpus behaviour that #1375 did not
provide, say so as a finding rather than building a second path.

## The issue

Read #1102 in full (`gh issue view 1102 --repo rickylabs/netscript`) and **quote its acceptance rows
into your plan from the live body**. Four separate errors in this milestone came from trusting a
summary instead of the issue, including one where a named root-cause mechanism turned out never to
have existed in the code. Open the files behind every load-bearing claim.

Its seven rows require an intent-aware guidance flow returning **ordered section-level guidance with
cited code excerpts**, a **checked-in evaluation corpus** with deterministic expected top-k, concept
mismatch handled without knowing exact symbol names, internal links contributing prerequisite and
next-step routing, filesystem/embedded corpus parity with bounded responses, and MCP instructions
plus generated agent guidance that **activate the flow before unfamiliar implementation work**.

## Boundary — do not claim it

Row 7 says observed usage and adoption are tracked **only in #1090**. #1090 is a controlled
experiment — four acceptance rows including a falsifiable check at **six agents per arm** varying
only the app-scoped conventions file. Your PR closes **#1102 only**. Do not tick #1090's rows and do
not describe your evaluation corpus as evidence of adoption; a deterministic top-k corpus proves
retrieval quality, not that agents use it.

## What will be asked of your plan

Your PLAN-EVAL will check, at minimum: that every load-bearing research claim is true when the file
is opened; that each proposed test has a concrete pre-fix state where it fails, **labelled
behavioral or compile-time**; that the evaluation corpus is a real discriminator rather than a
fixture that passes by construction; and that your named gates actually cover `packages/mcp` — note
that `quality:gate` does **not**, since `quality:scan`'s roots are `['packages/cli/src','plugins']`
and `arch:check` omits 20 of 36 publishable members (**#1403**, p0). Use the package-scoped commands
as your decisive evidence and record the aggregates as non-decisive.

Plan, open the draft PR, set `status:plan-eval`, and **stop**. Do not implement product source
before a separate-session `PASS`.
