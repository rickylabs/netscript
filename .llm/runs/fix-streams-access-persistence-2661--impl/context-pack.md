# Context Pack — #2661 Streams access persistence

- Branch: `fix/streams-access-persistence-2661`. Baseline: `87965d800b7d61312e8612c82bdb0cb98bdf5b29`.
- Archetype 5, Service overlay. Read the design in `worklog.md` and evidence in `research.md`.
- S1 adds the standalone regression workload and test. S2 changes the native storage adapter
  and read delivery, and adds expiry, generation, fault and restart verification.
- Successful reads are covered by a committed access on abrupt restart. Confirmed appends carry
  their access in their own transaction without awaiting read renewals.
- Use draft #2662 for the exact-head gate evidence and coordinator IMPL-EVAL.
