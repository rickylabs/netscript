# S1b environment and baseline

RTK is absent; run equivalent commands directly. Git identity was unset; configured worktree-local rickylabs identity matching authenticated GitHub login and baseline commit, with no attribution footer. Docker binary exists but `docker info` cannot connect to unix:///var/run/docker.sock, so scaffold runtime cannot be certified here. Aspire binary exists. Baseline structured token resolver/contrast tests: 12 passed, 0 failed. Baseline release:preflight passes all four scans.

Use the private package lock for token scripts, and structured test wrapper with `--cwd packages/fresh-ui -- --allow-all --lock=deno.lock --frozen --unstable-kv <tests>`. Source PR fetch needs explicit ref because clone tracking is narrow. No memory tool exists; use these tracked run notes.
