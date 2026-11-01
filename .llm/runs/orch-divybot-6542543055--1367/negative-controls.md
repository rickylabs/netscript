# Executed negative controls

All mutations restored afterward. Raw local logs remain outside Git to avoid private operational
metadata. Wrapper results are summarized without rewriting their verdicts.

| Control | Expected | Observed |
| --- | --- | --- |
| Replace contribution implementation with original main version; run new on/off tests with runtime checking | New explicit opt-in fails | exit 1, 2 pass / 1 fail; missing directory declaration |
| Force contribution default to a persistent path | Ephemeral default test fails | exit 1, 1 pass / 2 fail; unwanted directory and env |
| Remove consumption of DataDirectories in generated registration | Provisioning and fail-closed tests fail | exit 1, 1 pass / 3 fail; no directory created, file target not refused, reserved key not refused |
| Actual generated AppHost: remove emitted withEnvironment binding, restart the AppHost, run exact same restart probe | File health assertion fails before claiming replay | exit 1; actual memory versus expected file |
| Restore generated registration and run same probe again | Green proof restored | exit 0; identical document/tombstone HTTP history after exact Aspire streams restart |

The contribution mutation uses `--no-check` deliberately: the baseline does not have the new
constructor signature, and this proves behavioral regression rather than merely a type error.
Both source files were restored byte-for-byte after the controls.

The committed restart-gate negative tests additionally reject a swallowed pre-restart write, an
empty producer history, missing file-mode opt-in, empty/changed replay and a failed restart.
The runtime-suite registration test fails if either new gate is removed from either runtime tier.
The generated-project fixture test proves it never creates the directory itself.
