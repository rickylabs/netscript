# Stale replacement permissions

CI test-5 on the first pushed head exposed that OpenOptions.mode only applies when a file is created. Reopening a stale history .tmp file preserves that file's mode; the existing atomic rename then publishes it. Local umask differences can hide this: the CI fixture's stale file was 0644, while local default creation gave 0600.

Make the fixture explicitly chmod its stale file to 0644 on POSIX so the failure is deterministic under either umask. The adapter must chmod the opened replacement to 0600 before writing or renaming it. Windows retains the existing platform policy. This strengthens the original private-history guarantee and does not weaken the assertion.

Before correction the strengthened adapter test fails 1/2 with actual 0644 versus expected 0600. After correction adapter plus monitor history tests pass 7/7. The completed job's artifact provides the authoritative structured failure even while its containing CI run is still in progress; gh run view --log-failed waits for the whole run, so download the individual shard artifact instead.
