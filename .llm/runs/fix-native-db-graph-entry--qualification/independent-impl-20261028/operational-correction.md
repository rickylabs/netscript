# Operational evidence correction

The original copy operation accidentally included the launch/after allowance snapshots and the expense guard's raw account/window values in this Git bundle. The lane policy states: "Allowance snapshots are operational state and must not be committed." This correction removes only those three current-tree copies. Byte-identical originals remain in verified ignored local storage.

`operational-admission.sanitized.json` retains the planned estimate and recorded admission predicates, without account balances, selected-key limits/remaining amounts or raw usage windows. It records historical evidence and authorizes no future launch. `operational-private-resolution.json` maps each original SHA256 to its ignored resolution; it does not pretend the sanitized receipt has the raw hash.

`root-copy-audit.json`, packet/source manifests, preparation seals, source snapshots, verdict, coverage, native public output and observed identity remain byte-for-byte unchanged. The old manifest is a historical record of the copy, not a claim that the removed raw paths still exist in the current tree. Git history is intentionally unchanged; this is a current-tree correction, not history removal.

All bundle JSON and JSONL records were parsed and checked for other account/key/window payloads, including embedded JSON strings. The three removed records were the only such snapshots found. Public model prices, estimates/reservations, model-reported cost/token counts and the boolean non-attribution note are retained evidence, not account snapshots. The scoped credential-pattern scan found no credential values matching its patterns; the removed records contain allowance metadata rather than provider credentials. This statement is bounded to the audited bundle, not a global secret audit.

Prepared under the coordinator's operational-correction authority. No product/source/test/config/lock/debt change, runtime, inference, account action occurred. Root coordinator reviewed and accepted this operational correction. Source and verdict remain unchanged; this acceptance does not widen their scope.
