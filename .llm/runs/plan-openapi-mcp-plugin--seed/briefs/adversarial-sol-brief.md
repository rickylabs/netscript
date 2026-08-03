use harness

# Adversarial brief — OpenAPI→MCP seed design (stage 2)

You are the **adversarial reviewer** (Codex GPT-5.6 Sol, effort **xhigh**) for the seed run
`.llm/runs/plan-openapi-mcp-plugin--seed/` on branch `plan/openapi-mcp-plugin` (commit
`ba7d825a6`). Tracking issue #1117 (milestone 0.0.5).

**Your role: findings only.** You do not edit the design, file issues, open PRs, or run
AppHost/docker/scaffold (shared machine). You attack; the generator integrates what survives
triage. Output: a single findings document (see "Output contract" below).

## SKILL

Read, in order:

1. `.agents/skills/netscript-harness/SKILL.md` — run mechanics; you are the stage-2 reviewer
   lane of a seed run, session-separate from the generator.
2. `.agents/skills/netscript-doctrine/SKILL.md` — navigation for the doctrine files the design
   claims to satisfy.
3. `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` — the thinness law the core-vs-plugin
   verdict rests on.

## What to read, in order

1. `rfc.md` — the condensed normative claim.
2. `plan.md` — locked decisions D1–D9, owner forks F1–F5.
3. `design/canonical/00-overview.md` … `06-doctrine-fit.md` — the full design.
4. `design/examples/*.md` — two worked walkthroughs (attack their honesty too: an example that
   could not actually play out as written is a finding).
5. `research.md` — the evidence base. Spot-check citations; a load-bearing claim whose cited
   line does not say what the design says it says is a **blocker-class finding**.
6. `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` and
   `docs/architecture/doctrine/07-composition-and-extension.md` — the doctrine the design
   claims to satisfy.

## Scope guard — do NOT relitigate the instrument

Repo precedent (established by the 0.0.4 release orchestrator): **RFCs govern product
surface** — what NetScript ships to users (#890 frontend layer, #891 deploy family, #822 single
deployment) — while internal operating doctrine is ratified by draft PR instead
(`workflow/supervisor.md` via PR #96, `workflow/seed-run.md` via draft PR #397). An OpenAPI→MCP
projection ships in `packages/mcp` and changes what users get: it is product surface, and RFC is
the correct instrument. **Do not spend findings arguing process-vehicle choice.** Attack the
design, not the format.

## Required attack surface (non-optional — address each explicitly)

These come from the 0.0.4 release orchestrator's own failure catalog. Two of its
characteristic failure classes land squarely on this design.

### A. Predicate bugs — prove every guard CAN fire

The orchestrator shipped two guards whose condition could never fire: a watcher requiring
non-draft when every PR was a draft, and an `origin/main..HEAD` ancestry check for merged
branches that is always false under squash-merge. Both silently did nothing and **looked like
protection**.

The design's `EndpointPolicy` (`04-execution-and-security.md §3`) is exactly this shape: a
deny-by-default, three-rung policy engine. For **each** rung, do not review whether it is
written correctly — construct a **reachable input that trips it**:

1. Master switch: prove a call is denied when `enabled` is false — and when the policy is
   **absent entirely, malformed, and empty** (`{}`). Absent/malformed/empty MUST deny; if any
   of the three can fall through to allow (default-object creation, schema-default filling,
   optional-chaining to `undefined` treated as "no restriction"), that is a blocker.
2. `safeMethodsOnly`: prove a POST is denied while it is true, and identify how the method is
   determined — from the *spec's* operation entry or from caller input? If caller input can
   disagree with the spec, the guard fires on the wrong predicate.
3. `allowUnsafe` + `confirm`: prove a granted operation without the `confirm` echo is denied;
   prove `deny` beats `allowUnsafe` for the same id; probe id-matching (dotted id vs
   `METHOD path` fallback identity, case-insensitive matching, the substring-suggest matcher in
   03 §2) — can an operation be *granted under one identity and invoked under another*, so the
   deny list checks a name the transport never sees?

Also apply the predicate-bug lens to the read path: the staleness guard (`apphostPid` +
`writtenAt`, 02) — construct the input where it fires; PID reuse and clock skew are fair game.
And the loopback-only fetch guard: the design itself flags parse-level vs socket-level
enforcement (04 §6a) — decide whether the parse-level check has a never-fires or always-passes
hole (DNS names resolving to loopback, IPv6 forms, `localhost.` variants, redirects claimed
disabled).

### B. Absence of red is not green — what does "no signal" report?

The orchestrator found PRs that looked mergeable with every check SKIPPED/CANCELLED against a
dead base branch: "CLEAN" frequently means "nothing ran". Everywhere this design leans on a
gate, receipt, or check, ask **what it reports when it does not execute at all — and whether
anything distinguishes pass from did-not-run**:

- Evidence receipts (01 §registry, 05 §2F): if an introspection flow errors before writing a
  receipt, what exists? Can the #1078 evidence gate distinguish "introspection ran and found
  the service healthy" from "introspection never ran"? If fork F4(b) ever gates drift entries
  on receipts, does a missing receipt read as *no claim made* or as *nothing to check*?
- `list_api_services` degraded rows: `configured (not running)` derives from appsettings
  fallback — but if the **manifest read itself fails** (permissions, torn write, invalid JSON),
  does the tool report the failure, or silently degrade into an output identical to "AppHost not
  started"? Silent-identical is the SKIPPED-reads-as-CLEAN bug.
- The Wave-0 proofs [P1]–[P3]: as specified in `plan.md`, what evidence artifact does each
  produce, and could a proof be *skipped* yet the wave proceed as if passed? If the plan does
  not force each proof to emit a positive artifact the next wave checks, say so.
- `truncated: false` and the `operations` count in `list_api_services`: are these computed, or
  defaulted? A defaulted "not truncated" is a green that never ran.

### C. The discovery seam — the design's load-bearing correction; attack it hardest

The generator's research **contradicts issue #1117's sizing**: #1117 assumed
`getServiceUrl()` "largely solved" dynamic ports, but that helper reads `services__*` env vars
that exist only inside Aspire-launched processes — and the MCP server is spawned by the agent
host (`init-agent.ts:127-172`), so it has none of them. This is a real correction, and the
entire design now rests on the replacement seam: the AppHost-published endpoint manifest
(`02-discovery.md`, proof [P1]).

Attack it as the single point of failure it is: Is the claimed write point (generated helpers
observing *resolved* endpoints) plausible in Aspire's actual lifecycle, or does endpoint
resolution happen after the TS helper layer's last chance to run? Is the fallback ladder
(manifest → appsettings → override) actually a ladder, or can two sources disagree and the
merge pick the wrong one? Multiple AppHosts / multiple worktrees on one machine writing the
same relative path? Torn/partial writes despite the atomic-rename claim (who fsyncs, who
cleans up temp files)? Manifest present but from a *different project* (worktree copy /
`--project-root` mismatch)? If [P1] fails and F1(b) (`aspire` CLI query) activates, does the
port contract genuinely hold, or does the fallback change semantics (latency, auth, machine
scope) in ways the tools' promises don't survive?

## Standing attack surface (the generator's own uncertainty list)

`04-execution-and-security.md §6` names four: loopback enforcement depth; whether `confirm` is
friction or ceremony for a frontier agent; header-parameter validation soundness; whether
excluding auth entirely is the right cut. Address them, and go beyond them — also worth your
attention: the meta-tool-vs-per-operation ruling (D2) under MCP clients that cache tool lists;
truncation-budget arithmetic in 01/[P2]; the description ladder's rung-3 heuristic ("reads as a
sentence"); the activation section's testability claims (05 §4); prompt-injection posture for
spec-sourced text (04 §5); and the doctrine-fit argument itself (06 §1 — if you can construct a
genuine provider-variance axis the generator missed, that reopens the plugin question
legitimately).

## Output contract

Write findings to `.llm/runs/plan-openapi-mcp-plugin--seed/adversarial-sol.md`:

- One finding per entry: `S-<n> · <severity: blocker|major|minor> · <one-line claim>`, then
  the argument with file:line citations into the run docs and, where relevant, into repo
  source. A finding without a concrete failure scenario or citation is triage-rejected.
- Verify before asserting: where a finding depends on repo behavior, cite the source line
  (read-only commands are fine: `rtk git`, `rtk grep`, file reads, `deno doc`). No AppHost, no
  docker, no scaffold, no writes outside `adversarial-sol.md`.
- Cover sections A, B, C above explicitly — even if your verdict on one is "holds, here is why
  I could not break it" (a defended non-finding is valuable; an unexamined one is not).
- Do not propose redesigns; state what breaks and the minimal property a fix must have. The
  generator owns integration and will record dispositions in `adversarial-triage.md`.
