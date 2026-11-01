# Independent repair IMPL-EVAL — PASS

Owner/coordinator requested read-only Opus; requested and observed model is
`claude-opus-5-5` at requested high effort. Same independent Anthropic session as
the original review, re-steered for the coordinator repair and bounded follow-ups.
All repair verdicts are PASS; no terminal failures. The final evaluator independently
ran 69 tests and verified all three coordinator findings, CI preservation, and
dry-run defaults.

## Reviewed content, committed unchanged

- `mirror-acceptance-evidence.ts`: SHA-256 `9bcd2608f195921c23a4c54ce8635bf872de902bb8b0a99edb0b3bb20131aec6`
- `mirror-acceptance-evidence_test.ts`: SHA-256 `137a138469a0a909bbc820809794cc0cbeaee5e546aebd0c129c2b521615a023`
- `post-merge-acceptance-policy.ts`: SHA-256 `c4b57c66b731072d8e9e364f2b18ac84933439d89b53e4c4326848ce03f38884`

The following is the final read-only evaluator response. Raw transport/session
metadata is retained privately and is excluded from this public run.

## Final IMPL-EVAL for the #2562 repair (PR #2564, current working tree): **PASS**

I found no blockers. Both link fixes do what you describe, and the earlier repair results still hold: PR body or commits must reference the issue, every PR, issue and evidence link must belong to `--repo`, comment reads are paginated, and a failed provenance comment is retried or reported as partial. CI mode is unchanged and post-merge mode still defaults to dry-run. This covers the uncommitted files, including the untracked `.llm/tools/validation/post-merge-acceptance-policy.ts`, which must be committed with them.

### The two fixes
- **Repository URLs followed by punctuation** (`post-merge-acceptance-policy.ts:25–26`): a URL is now matched when the next character can't be part of a repository name. A direct call to the policy function now refuses `https://github.com/other/repo, done` and `[x](https://github.com/other/repo)` with `post-merge-repository-mismatch`. The same repo followed by a tab is still accepted.
- **Links outside any repository** (`post-merge-acceptance-policy.ts:27` and the repository-link loop in `validateEvidenceRepositories`):
  - Only `https://github.com/user-attachments/…`, `/orgs/…` and `/advisories/…` links are skipped.
  - GitHub doesn't allow accounts with those names, so a real foreign repository can't hide behind the exemption.
  - API `/repos/…` URLs are still checked: `api.github.com/repos/orgs/x/…` is still refused.

### What I ran
- **Focused test wrapper:** 69 passed, 0 failed.
- **Type check:** `deno check --unstable-kv` on the three source files is clean.
- **Format:** `deno fmt --check` on the three source files is clean.
- **A small throwaway script** in the temp directory, deleted afterwards. It called the policy function directly and also ran the whole mirror with a stub client that makes no network calls or writes.

### One thing not to claim
Evidence that links an uploaded screenshot is still refused end to end, now by the `main` check rather than the repository check. A real upload link contains a hex group of 7 or more characters, for example `7e1c9a2b`, which is read as a SHA. That lookup fails, so the run reports "Cited SHA … is not reachable from main". It refuses with no writes, so it is safe, and it matches your note that SHA parsing is outside this delta. Just don't describe screenshot evidence as supported yet. The fix belongs in the SHA-detection rule in `mirror-acceptance-evidence.ts`, not in the policy module.

**Verdict: PASS**
