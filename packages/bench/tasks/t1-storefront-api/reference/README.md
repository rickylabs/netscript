# Golden reference — DEFERRED to Slice 1b

This directory will hold the **golden NetScript solution** for `t1`: a
hand-authored, idiomatic implementation that passes the frozen suite. It is the
basis for two things Slice 1a intentionally does not ship:

1. **Conformance mode** (`bench conformance`) — a key-free CI gate that replays
   this reference against the frozen suite, proving the task and suite are
   internally consistent without spending an agent run.
2. **Task seeding** — later tasks (e.g. t2) seed their starting state from this
   reference (OQ6).

**Do not author the solution here in Slice 1a.** It is a Slice 1b deliverable.
Until then, `bench conformance` reports a documented skipped status and does not
fail CI.
