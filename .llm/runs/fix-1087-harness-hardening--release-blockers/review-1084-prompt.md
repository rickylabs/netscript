use harness

# Opposite-family slice review: #1084 publication-body ownership

## SKILL

- `.agents/skills/netscript-harness` — apply the substantive slice-review and verdict rules.
- `.agents/skills/netscript-tools` — verify compact gates and lock hygiene.
- `.agents/skills/netscript-pr` — closing-keyword publication safety is the protected boundary.

You are the separate Claude/Fable reviewer for a Codex-authored normal implementation slice. Review
only; do not edit product/tooling source. Write the compact verdict to:

`.llm/runs/fix-1087-harness-hardening--release-blockers/review-1084.md`

Review the uncommitted diff after `2f3e49456`, including untracked
`.llm/tools/agentic/github/publication-body.ts` and `publication-body_test.ts`.

Acceptance boundaries:

1. Every `agentic:gh-pr create` invocation copies inline or file content to a UUID-scoped artifact
   it wrote itself under `.llm/tmp/agentic/gh-pr/<session>/`.
2. The exact body used to construct the network payload is re-read from that artifact only after
   owner-session and SHA-256 verification; cross-session reuse, metadata swap, and body tampering
   fail before the GitHub request.
3. Two concurrent sessions cannot collide, and attempting to reuse one session directory fails.
4. File/directory modes, permissions in `deno.json`, dry-run behavior, failure cleanup/residue, and
   body secrecy are safe and compatible.
5. Active guidance/templates require `.llm/tmp/<run-id>/<session-id>/...` for PR/comment scratch and
   do not name a workspace-shared body file; durable reviewed run artifacts remain allowed.
6. The change does not weaken the existing PR base/eval/merge guards or leak body content.

Observed author evidence:

- Publication/compatibility focused tests: **7 passed, 0 failed**.
- `agentic:gh-pr create --dry-run`: wrote a unique UUID path, printed only byte count/path, and
  produced 0700 directory plus 0600 body/metadata with owner+fingerprint.
- Complete agentic suite: **336 passed, 0 failed**.
- Scoped agentic check/lint/fmt: **131 files, 0 findings each**.

Inspect implementation and tests directly. Your artifact must include `Verdict: PASS` or
`Verdict: FAIL_FIX`, severity-ordered findings with file/line evidence, explicit assessment of the
six boundaries, and any independently run gates.

Do not spawn sub-agents or workflows. Do not modify any file except the named review artifact.
