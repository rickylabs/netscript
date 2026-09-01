# D-235 — shared persisted diagnostic budget

Date: 2026-09-01

## Decision

Option (a). Both retained streams share D-224's existing 16-KiB persisted-detail budget. Each stream
still selects at most 32 lines as an 8-line head and 24-line tail, and each line still uses the
UTF-8-safe head/tail truncator with the original 511-byte maximum. After both selections are known,
the emitted runner derives the final allowance from their combined count.

The atomic request result is itself a persisted artifact, so its serializer also fits the complete
JSON record—including envelope bytes, escaping, and the repeated promoted message—to 16 KiB. This
stronger final-artifact assertion makes the flattened Aspire-visible message fit without changing
the generated callback's outward `{ success, message }` contract.

## RED and GREEN measurements

The tool-agnostic fixture floods both stderr and stdout with 32 oversized lines and executes normal
error-file mode plus request-result mode. It reconstructs the generated callback's `|`-flattened
message and measures UTF-8 bytes on all three contract artifacts.

| Artifact             | Baseline `e4464e9f4` | Repaired |
| -------------------- | -------------------: | -------: |
| persisted error file |             32,767 B | 16,383 B |
| request result JSON  |             33,479 B | 16,384 B |
| flattened message    |             32,893 B | 16,061 B |

The baseline structured fixture exited 1 and reported all three values in its assertion. The
repaired fixture exits 0, retains 32 entries in each stream, and asserts each artifact is at most 16
KiB.

## Ordering repair

The old selector concatenated stderr before stdout. A later failure-shaped informational stderr line
could therefore outrank an earlier real stdout error. The runner now stamps complete lines with a
sequence shared by both asynchronous readers and selects from the surviving retained lines in that
observed order. The generic regression was RED before the repair and GREEN after it. It deliberately
claims observed line-completion order only because separate OS pipes provide no global write
timestamp.

## Boundaries

No public export, dependency, package metadata, task mapping, graph injection, runtime behavior, or
tool-specific classifier changed. `evaluate.md` is deleted and no replacement evaluation was
self-dispatched. CI remains the runtime authority.
