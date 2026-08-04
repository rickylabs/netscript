use harness

# Slice: #1246 — Windows node_modules/.deno incomplete materialization (decision + mitigation)

## SKILL

Activate `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-deno-toolchain`.
Per milestone ruling D6: no local PLAN-EVAL. Route: openai · gpt-5.6-sol · medium.

## The defect (issue #1246 is the specification — read it first)

On Windows, the project-local `node_modules/.deno` materialization is incomplete: a file
present in Deno's shared npm cache is missing from the project copy, and the scaffolded
frontend cannot start. It is the single hardest blocker for a new Windows developer. It may
be an upstream Deno bug. You are on WSL and cannot reproduce natively — design accordingly.

## Your job is a decision followed by its implementation, not a blind fix

1. **Classify.** From the issue's captured evidence plus the Deno issue tracker (search
   deno/deno for node_modules/.deno materialization/cache-copy bugs and pin the version
   window), decide: ours vs upstream, and which Deno versions exhibit it. Record the
   verdict with citations in the PR body — this classification IS a deliverable.
2. **Mitigate in 0.0.5 regardless of classification.** Candidates, judge which combination
   is right rather than doing all mechanically: (a) a scaffold/doctor detection — verify the
   project-local materialization is complete after install and print the exact remediation
   (known workaround: clear the project node_modules and re-run deno install, or pin the
   known-good Deno version) instead of letting the frontend die opaquely; (b) a pinned/
   documented known-good Deno version for Windows in the scaffold's engines surface and
   docs; (c) a docs call-out with the structured caveat marker linked to the debt entry —
   only if a real detect cannot be built.
3. **If upstream:** file (or link the existing) deno/deno issue, reference it in ours, and
   state in the PR that the full fix moves to 0.0.6 tracked against the upstream — the
   orchestrator carries the milestone move with your evidence.

## Contract

Worktree /home/codex/repos/ns005-winmat, branch fix/windows-node-modules-materialization
(NO upstream; explicit-refspec push). One PR, draft first. Use `Closes #1246` ONLY if your
mitigation genuinely satisfies the issue's acceptance list; otherwise `Refs #1246` with
remaining scope stated. acceptance-evidence YAML for whatever you claim. Labels
type:fix/area:cli/area:deps/priority:p1 + one status, milestone 0.0.5. The detection MUST
have a test that fails if it silently stops detecting (same law as #1250's no-op test).
