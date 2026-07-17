use harness

## SKILL

- `netscript-harness` — preserve evaluator separation and record a concise, evidence-based verdict.
- `netscript-tools` — use repository-native commands and keep lock/worktree state clean.
- `openhands-handoff` — honor the `pr-comment` output contract and write the required summary.
- `netscript-cli` — hand-test scaffold and documented CLI commands when executable claims exist.
- `rtk` — keep changed-file and command inspection compact.

Act as a cheap-and-quick documentation accuracy evaluator. Do not edit source, documentation,
`deno.lock`, or run artifacts, and do not create commits. Write the complete result to
`OPENHANDS_SUMMARY_PATH`; output mode `pr-comment` will publish that result as the single PR
comment.

1. Identify every changed documentation file in this PR and read each one fully. Include Markdown,
   MDX, READMEs, RFCs, harness/process docs, and skill instructions; do not review only the diff
   hunks.
2. For every executable claim, QUICKLY hand-test the exact documented command or snippet from the
   repository root. Use the smallest representative scaffold/workspace needed, compare real output
   and generated paths with the document's claim, and stop after the highest-value small checks. Do
   not substitute a full expensive E2E suite for a focused manual check.
3. If the changed set contains no executable command, snippet, flag, verb, or path claim, say
   exactly:
   `No executable documentation claims in this changed set; manual command testing was not applicable.`
   Full accuracy and hallucination review is still mandatory.
4. Check every named command verb, flag, file path, package, API, and expected output against the
   repository. Any hallucinated or nonexistent verb, flag, or path is a BLOCKING finding.
5. Return a compact per-file table with `accurate`, `inaccurate`, or `unverifiable`, the commands or
   snippets tested, observed-versus-claimed output, and blocking findings. End with one overall
   `PASS` or `FAIL_FIX` verdict and a short list of exact fixes.

Keep the iteration budget small. Prefer one to three decisive manual checks over broad exploration,
but never omit a changed documentation file from the per-file verdict table.
