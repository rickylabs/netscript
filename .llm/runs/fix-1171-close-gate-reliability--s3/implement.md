use harness

## SKILL

Read `.agents/skills/netscript-tools/SKILL.md` and `.agents/skills/netscript-pr/SKILL.md`. You are
the implementation lane (Codex · GPT-5.6 Sol · low) for slice **S3** of epic #1169, closing #1171
(scope-widened — read the issue AND its latest comment in full:
`gh issue view 1171 --repo rickylabs/netscript --comments`). Supervisor verifies and enhances
before merge; commit but do NOT push; no PRs.

Owner mandate, verbatim intent: "we keep close-gate, we fix the mechanisms to something extremely
solid. I'm tired of this unreliable gate."

Worktree `/home/codex/repos/ns004-s3-closegate`, branch `fix/1171-close-gate-reliability`.
Scope: `.llm/tools/validation/` (check-close-gate.ts, mirror-acceptance-evidence.ts,
acceptance-evidence.ts + tests), the close-gate job steps in `.github/workflows/ci.yml`, docs of
the contract in the netscript-pr skill (`.agents/skills/netscript-pr/SKILL.md` §close-gate — keep
the mirrored `.claude/skills/` copy in sync via
`deno run --allow-read --allow-write .llm/tools/agentic/claude/sync-claude-skills.ts` if that is
the documented mechanism; check it), run-dir worklog. Nothing else.

## Phase 1 — RESEARCH FIRST (mandatory, before any code)

Search the web (you have network access; if not, STOP and report) and record findings with URLs in
`.llm/runs/fix-1171-close-gate-reliability--s3/research.md`:

1. How do major projects/frameworks enforce PR/issue acceptance checklists? Look at (at minimum):
   `mheap/require-checklist-action`, GitHub's native task-list behavior and the
   `issues`/`sub-issues` REST surface, Kubernetes prow's approval plugins, and any
   marketplace action for "task list completed" / "checklist gate".
2. Is there a maintained action we should ADOPT instead of maintaining our own parser? Compare:
   what it enforces, whether it supports cross-referencing evidence, provenance, live reads.
3. Known GitHub Actions pitfalls we already hit — frozen event payloads on rerun, `issues.body`
   staleness, checkbox edit races. Find the documented recommendations (poll the API at run time,
   `pull_request.labeled` triggers, concurrency).

Decision record: adopt / wrap / rebuild, with reasons. If an existing action covers ≥80% and is
maintained, prefer wrapping it and keep our delta small. Record the decision in research.md; the
supervisor will review it before accepting the implementation.

## Phase 2 — Design contract (LOCKED invariants, however you implement)

1. **Live state only.** Every read (labels, PR body, issue bodies) happens at execution time via
   the API. Nothing is read from `github.event` except identifiers (PR number, repo). The
   rerun-blindness fixed in #1178 must be impossible by construction — assert it in a test or a
   workflow-level comment + grep guard test that fails if `github.event.pull_request.labels`
   reappears in the close-gate job.
2. **Structured evidence, no prose parsing.** Replace last-em-dash splitting with an explicit,
   unambiguous mapping. Preferred shape (adjust from research findings): a fenced block in the PR
   body, e.g.
   ````
   ```acceptance-evidence
   issue: 1170
   - box: "Exit code is non-zero only when a current failure exists"
     evidence: "pr-checks_test.ts fixture; report.ok gate"
   ```
   ````
   parsed as YAML with exact-match (after trim) on box text, plus optional `box-index:` fallback
   for long boxes. Em-dashes anywhere must be harmless. Keep reading the legacy `## Acceptance
   evidence` format for one transition release, with a deprecation warning naming the new format.
3. **Verdict provenance on every output** (original #1171 scope): the gate and the mirror both
   report `{headSha, evaluatedAt, per-issue: {number, updatedAt, bodySha256}}` in JSON and pretty
   output. A verdict can be re-tied to the exact state it read.
4. **Self-explaining failures.** Every failure names the box, the issue, what was compared, and
   the one action that fixes it ("add an entry for box …", "label then push — reruns cannot …").
   No bare "Missing evidence: <text>".
5. **Post-merge-only boxes.** Detect boxes matching a documented convention (e.g. containing
   `[post-merge]`) and EXCLUDE them from the merge gate with a visible notice; document in the
   netscript-pr skill that post-merge verification belongs in a follow-up comment/issue tick, not
   a merge blocker. (The #1142 box-4 dead-end must be expressible without dropping closing
   keywords.)
6. **Idempotent + race-aware mirror.** Ticking boxes uses the current issue body fetched
   immediately before the PATCH, compares bodySha256 before/after, retries once on mid-air edit,
   and posts one provenance comment (not one per rerun — dedupe by marker).
7. **Negative cases for every predicate** (non-negotiable, epic rule): tests proving — em-dash in
   evidence is harmless; unmatched box fails with the named-box message; stale snapshot detected;
   post-merge box excluded with notice; frozen-payload guard test fires on regression; mid-air
   edit retry works (fake fetch).

## Phase 3 — Gates to run and record in the run-dir worklog

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/validation --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/validation --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/validation --ext ts
deno test --allow-read --allow-env .llm/tools/validation/
deno eval YAML-parse of .github/workflows/ci.yml
```

Plus a read-only live demonstration of the new gate against a real PR
(`--repo rickylabs/netscript --pr 1177 --dry-run`-equivalent) pasted into the worklog.
No `any`, no `deno-lint-ignore`, no `as unknown as`. Keep backward compatibility for the
`status:close-gate-override` escape hatch.

## Done means

research.md with URLs + decision record; implementation per invariants 1–7; all gates green with
evidence in worklog; commits on `fix/1171-close-gate-reliability` (research commit separate from
implementation commit preferred). Commit, do not push.
