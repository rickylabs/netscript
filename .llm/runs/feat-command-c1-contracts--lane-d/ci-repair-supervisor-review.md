# C1 CI lock repair — substantive supervisor review

Decision: sign off the narrow owned CI repair; release same-session independent reevaluation. This is not a new independent PASS.

The sole product delta is the Fresh UI private lock. Independently compared complete JSON dependency bodies after native peer-name normalization: resolved npm/JSR versions, integrities, specifier names and unaffected member metadata are identical. Service metadata adds precisely its two declared database and Standard Schema dependencies. All twenty-two C1 product sources, root lock, package task/workflow definitions and historical evaluator are unchanged; source manifest hashes verified.

The stale frozen downstream gate was reproduced with exit 1 without modifying the lock. Native package lock:update succeeds, then the downstream frozen gate passes with unchanged lock. Supervisor independently ran the package-owned check with actual CI Deno 2.9.5 selected for every child process: 150 files, two batches, zero diagnostics, exit 0 and equal before/after lock hashes. Local Deno 2.9.7 qualification also passes. Complete Fresh UI tests pass (172), existing lock regressions pass (2), lint/publication/frozen production install pass, both locks stable.

Supervisor additionally reran native durable quality-scan and arch-check at pre-signoff 108b6930f455a2023e3abb7dbb2c91ab46380e6d against this manifest: both exit 0. The direct .lock formatter-extension refusal is retained and the corrected JSON stdin check passes; it is not a source-format failure. No new tests, behavior, declarations, toolchain edits, upgrades, suppression or debt are introduced.

Historical independent PASS is preserved byte-exactly in evaluate-round-1.md and its immutable original commit. New signed-off qualification head requires the same independent evaluator session to attest it. Closing claim remains withheld; C2 product remains paused pending that result. Supervisor owns commit/push/comment reconciliation; no merge or force push.
