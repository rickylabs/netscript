# Drift

No implementation drift. Historical benchmark and rollout model literals were intentionally
preserved because they describe measured artifacts, not active routing.

The worktree branch initially inherited `refs/heads/main` as its upstream, so a plain upstream push
was rejected by branch protection. No remote state changed. The branch was published with the
explicit safe refspec `HEAD:refs/heads/chore/update-agent-model-routing` and its upstream was then
corrected to that feature branch.
