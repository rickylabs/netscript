use harness

## SKILL

Read /home/agent/AGENTS.md, repository AGENTS.md, netscript-harness, netscript-tools,
netscript-pr and applicable doctrine. Use mise and the checked-in agentic toolchain.

## Bounded implementation mandate

Implement one independent Aspire parity closeout repair, Part of epic #1712, milestone 0.0.7.
Worktree: /home/agent/projects/netscript/worktrees/007-aspire-parity-context.
Branch: fix/aspire-parity-context, baseline main 94fe507af47171cd4f295e8f532b281d7147b334.
Run: .llm/runs/fix-aspire-parity-context--0.0.7/.
You are an implementation leaf, not a replacement topic supervisor. No merge/release authority.
Primary coordinator retains Tier-A, formal evaluator dispatch, and merge authority.

PLAN-EVAL: N/A, approved bounded classification/negative-test repair, no architecture change.
Bootstrap normal scoped harness artifacts, push and open draft PR at first commit. Explain actual
results in the PR; never claim runtime acceptance or close epic #1712. Only one status label.

## Observed red on clean main

`mise exec -- deno task check:aspire-version-parity -- --phase 2` fails five rows:

- Both generated consumer copies of aspire-orchestration/references/detection.md contain legitimate
  `Aspire 13.2+` minimum-version guidance. Do NOT hand-edit/regenerate upstream content just to
  rewrite historical truth. Teach ownership-aware parity to distinguish this floor from a pin.
- .agents/skills/aspire-upgrade/SKILL.md describes the 13.4.6 -> 13.5.3 historical migration and
  old/new fixtures. Existing compat-fixture semantics fit: require the current 13.5.3 counterpart.
  Prefer classification over editing the skill.
- .llm/tools/docs/check-accuracy-and-discoverability.ts mentions 13.4.6 only as second string-literal
  argument to forbidText(...) calls. These are negative enforcement, not stale advice. Exempt only
  those exact forbidden literals, NOT the entire file or other strings/calls.
- packages/aspire/src/domain/aspire-resource-name.ts has JSDoc claiming "Aspire 13.4.6 default
  resource-name grammar". Make this version-neutral; do not alter runtime behavior.

The parity evaluator is .llm/tools/validation/check-aspire-version-parity.ts; tests adjacent.
The source-of-truth ownership generator is
.llm/runs/research-aspire-13.5-adoption--0.0.7/tools/aspire-surface-manifest.ts.
Regenerate its TSV through that existing generator, never manual TSV edits.

## Locked boundaries and tests

Use narrow, manifest-owned classifications for genuine floor guidance / negative guards, or a
simpler equivalently fail-closed policy. No blanket archival exemptions, whole-file skip,
dependency addition, broad parser rewrite, phase-2 disable, current-pin weakening, generated
consumer bundle edits, workflow changes, or unrelated harness cleanup. Preserve all tracked runs.
Keep existing phase-1 exact-pin policy intact. Tests must prove: legitimate floors accepted only
on intended ownership; a stale current pin alongside a legitimate floor still fails; forbidden
literal accepted only in intended negative-guard position, ordinary requireText/string/other
arguments still fail; compat guide missing the current counterpart fails. Show red before repair
then green. Consider semantic ambiguity honestly; do not turn a regexp into a general TS parser.

Expected source scope: checker + adjacent tests + manifest generator/TSV + one JSDoc file; scoped
run artifacts. Small justified helper only if demonstrably necessary; record drift first.
Run focused structured test/check/lint/fmt, phases 1 and 2, manifest freshness; record source-only
quality/architecture applicability honestly. No Docker/Aspire starts and no host runtime lease.
Do not enqueue scaffold-runtime for this tooling/comment-only repair absent an actual need.

Commit and explicit push each verified slice, post exact-head packet to draft PR, keep context-pack
and worklog current. Stop authoring at review handoff; coordinator dispatches independent GLM
5.3 Flash max evaluation because native Fable is monthly capped (not an owner-routing question).
Do not auto-launch an evaluator, self-certify, merge, publish, or change any supervisor model.
