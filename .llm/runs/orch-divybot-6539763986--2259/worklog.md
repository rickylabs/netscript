# Worklog — issue 2259

## Design

1. **Public surface:** research evidence only until the masking prerequisite passes; no
   exported API, CLI command, generated source, or gate behavior changes in the spike.
2. **Domain vocabulary:** secret parameter = Aspire ParameterResource with Secret enabled;
   composed binding = connection string built from that parameter; masking = no credential
   bytes in the backchannel-projected value; runtime resolution = unredacted consumer value.
3. **Ports:** installed Aspire.Hosting 13.5.3 public composition/environment APIs and the
   exact assembly's private backchannel redactor. No new production port or abstraction.
4. **Constants:** package version is pinned in the probe project; environment names and the
   internal redactor name are fixed diagnostic inputs. Credential bytes are generated in memory.
5. **Commit slices:** bootstrap/PLAN-EVAL, then capability proof/decision; exact files and
   gates are in plan.md. Each slice updates worklog and context pack.
6. **Deferred scope:** all product edits, whole-snapshot gate reactivation, database/runtime
   acceptance, and any upstream version choice depend on the spike. No upgrade is authorized.
7. **Contributor path:** plan.md is the one entry file for the bounded reproduction.

## Owner evaluator override (verbatim)

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

This changes the feature evaluator model cells to Anthropic Opus at high effort, preserving
session and vendor-family independence from the OpenAI implementer. Route discovery succeeded
with `deno task agentic:matrix --tier feature --json`; feature round limits remain in force.

## Bootstrap

Read the complete assignment, AGENTS, relevant skills/rules, prior committed environment
memories, and issue comments. There is no orchid-triage comment. Prior PR #2275 is closed,
unmerged, and research-only. Pin remains 13.5.3. NetScript MCP guidance/search completed.
RTK is unavailable; use plain git/gh with bounded output and structured wrappers when relevant.

Reconcile: no product implementation exists in the prior PR; the scope remains the owner's
spike-first decision. No acceptance, labels, milestone, lock, or cache has been modified.
