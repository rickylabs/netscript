# Context pack

Issue #2650. Use `worklog.md` for the design and gate record, `research.md` for source
citations, and `plan.md` for the workload and cleanup decisions. The coordinator owns the
independent implementation evaluation. The benchmark and docs use current checkout surfaces.

The executable benchmark is in `tools/streams-subscriber-capacity/`. The scoped TypeScript
gates and short real service smoke passed. The full nine-phase measurement exited 0. Raw stdout is `results.json`. The worklog lists
measured and source-inspected claims, including the cleanup scope. The 32-reader single-stream
trial completed delivery after a backlog, with its last write acknowledged 216.1 seconds after
the start of the 60-second offered-write window. The two site pages and the benchmark README
carry the corresponding caveats and usage advice.

The Phase B matched controls and upstream inspection are in phase-b.md. The server-side
defect is tracked separately in #2661.
