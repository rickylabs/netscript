# Context Pack — #2661 Streams access persistence

- Branch: `fix/streams-access-persistence-2661`. Baseline: `87965d800b7d61312e8612c82bdb0cb98bdf5b29`.
- Archetype 5, Service overlay. Read the design in `worklog.md` and evidence in `research.md`.
- S1 adds the standalone regression workload and test. S2 changes the internal native storage
  adapter and adds expiry, generation, fault, and restart verification. S3 records gate evidence.
- The coordinator owns independent review and the abrupt-crash contract decision. Use draft PR
  commits and slice evidence for handoff.
