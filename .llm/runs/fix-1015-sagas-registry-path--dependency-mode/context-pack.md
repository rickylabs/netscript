# Context Pack — fix-1015-sagas-registry-path--dependency-mode

## Current state

- Phase: implementation and final validation complete; Opus 5 IMPL-EVAL pending.
- Branch/base: `fix/1015-sagas-registry-path` at `3ab64720f` from `origin/main`.
- Root cause verified exactly as supplied: service init and runner fallback anchor registry paths to
  package `import.meta.url`; Aspire never supplies the env seam; generated glue is already correct.
- Locked boundary: no Aspire entrypoint or generated glue text changes.

## Next action

The bounded Augment follow-up for comment `3696652319` is implemented and all four exact gates pass.
Commit once, push with `git push origin HEAD:refs/heads/fix/1015-sagas-registry-path` without adding
an upstream, confirm local and remote SHAs match, and reply directly to the review thread. Preserve
all original remaining-scope framing and do not launch an evaluator transport.
