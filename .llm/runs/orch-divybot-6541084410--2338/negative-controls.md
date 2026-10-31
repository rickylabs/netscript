# Real negative controls

Restored the three production application files to baseline f6839463668c5dae4ca7234d26909e74e10b89c0 while retaining the tests, ran through the structured test wrapper with `--no-check` so failure proves runtime assertions rather than missing new option types, and restored all implementation bytes in a finally block. No baseline source was committed.

Same command with the fix: 9 passed, 0 failed, exit 0. Baseline production files: 1 passed (pre-existing transport protocol test), 8 failed, exit 1.

- session epoch validates before IO, including incompatible singleton reuse
- explicit epoch zero differs from legacy auto-claim singleton configuration
- real server: explicitly allocated stale close epoch cannot close another session
- session epoch reaches append and terminal close with consecutive sequences
- real server: caller checkpoint skips unchanged documents across restarted sessions without advancing offset
- real server: lost acknowledgement after restart retries exact tuple and bytes and appends once
- real server: stopped and recreated stable producers append changed documents at distinct offsets
- real server: explicitly allocated stale append epoch is fenced without stealing a new session

All five new real-server tests go red on the full revert. The unchanged test fails on its changed-document restart setup; caller-checkpoint/no-upsert suppression itself already held on baseline. Similarly, byte retention already existed; the lost-ack test fails because baseline sends epoch 0 and receives duplicate rather than the expected first new append. These are deliberately documented limits, not claims that content deduplication was newly implemented.

Re-ran the same positive/full-revert pair after adding Connection: close to the reference-server fixture: identical 9-pass positive and 8-fail negative results. Repeated the fixed focused suite 20 times: all 180 test results pass. This isolates the prior intermittent upstream idle-socket shutdown stall from producer behavior.
