# Direct worker consumers and generated fixture types

WorkerDispatchContext is constructed outside the worker package: the saga relay .ts.template, the saga publish-order fixture and scheduled trigger idempotency tests all use it directly. Scoped TS source checks cannot see type declarations inside a .ts.template string. New injectable fields should preserve existing context shape and supply a real runtime default, or update all consumer proofs coherently. The job DLQ extension is optional only at direct dispatch; Worker owns a required store and the fallback never skips terminal persistence. A local real-KV regression exercises the old context shape.

Main #2476 repaired independent cold-fixture instrumentation drift while this task ran. Merge reviewed upstream fixes, then rerun affected tests; do not patch dependency ranges or lock files separately in the worker PR.
