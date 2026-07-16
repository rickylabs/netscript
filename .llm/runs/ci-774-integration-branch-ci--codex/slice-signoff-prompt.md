The two non-blocking metadata notes are now addressed: `pr-body.md` says `impl-eval` and points to
the live commit list rather than a self-referential pending hash. Your exact review session id was
also added to `slice-review.md`, with matching worklog/context updates.

Act as the Tier-A supervisor for the sign-off commit now:

1. Inspect raw `git status --short` and the full diff against HEAD. Confirm the workflow logic is
   unchanged from the diff you passed, metadata changes are coherent, `deno.lock` is clean, and no
   unrelated file exists.
2. If and only if that remains true, stage the two workflow files and all files under
   `.llm/runs/ci-774-integration-branch-ci--codex/` that belong to this slice.
3. Commit with exactly: `fix(ci): run real lanes on integration pull requests`
4. Push only with the explicit refspec:
   `git push origin HEAD:refs/heads/ci/774-integration-branch-ci`
5. Report the commit hash and push result. Do not edit files, change GitHub metadata, merge, or run
   additional expensive gates. If anything diverged from the reviewed slice, stop and report it.
