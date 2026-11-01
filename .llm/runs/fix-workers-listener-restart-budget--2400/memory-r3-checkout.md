
# R3 narrow fetch and checkout

Dispatcher checkout has a narrow fetch refspec. Fetch explicit destination refs:
`git fetch origin refs/heads/main:refs/remotes/origin/main refs/heads/fix/workers-listener-restart-budget:refs/remotes/origin/fix/workers-listener-restart-budget`.
`git switch --track` rejects this nonconfigured remote branch and can leave the
index switched while HEAD stays old. Complete with `git switch --no-track -c
fix/workers-listener-restart-budget refs/remotes/origin/fix/workers-listener-restart-budget`;
verify clean status and intended HEAD. No resets or user-change deletion needed.
