# Shallow PR adoption

This worker's origin fetch refspec tracks only main. A branch-name fetch downloads objects
without creating remote tracking refs. Fetch explicit destinations before using merge bases:
`git fetch origin refs/heads/<branch>:refs/remotes/origin/<branch>`.
Use bounded `--deepen=200` if `git merge-base` reports no common ancestor.
`git -c branch.autoSetupMerge=false switch -c <branch> origin/<branch>` works even with the
single-branch fetch mapping. Explicit `--track` can fail after updating the index/worktree;
compare the index with the intended destination before repairing that interrupted switch.
Never commit a staged diff against the wrong HEAD. Confirm the branch before each push.

The worker also lacks a local commit identity initially. Set repository-local identity to
the authenticated repository owner's existing verified Git identity; never change global config.
