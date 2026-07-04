# Turso Sync — offline-first fit for NetScript

## What it is

Turso Sync is the current (2026) framing of libSQL's earlier "embedded replicas" concept: a local
SQLite-compatible (tursodb) file that can operate fully offline, then reconcile with Turso Cloud:

- `pull()` — bring remote committed changes down into the local replica.
- `push()` — send local mutations up to the cloud primary.
- Default conflict policy is **"Last-Push-Wins"** — the most recently pushed write for a given row/
  key wins on conflict.
- A `transform` hook lets the application override that default with custom merge logic (e.g.
  CRDT-like merges, field-level reconciliation) for rows that need smarter conflict handling than
  last-write-wins.

## What it does NOT change

Turso Sync is a **cloud-sync layer bolted onto the existing local-file model** — it does not alter
tursodb's native-driver exclusive-file-lock behavior (see `analysis/E-desktop/offline-first-surface.md`
for the exact single-writer constraint quote). Concretely:

- Each local replica is still exactly **one physical SQLite/tursodb file**.
- That file can still only be opened by **one OS process at a time** on that machine.
- Sync solves the *cross-device*/*cross-session* durability problem; it does nothing for the
  *same-machine, same-moment, multiple-processes-want-the-same-file* problem eis-chat's
  architecture (and any multi-process desktop shell) has today.

## Fit assessment for topic E's three architecture options

| Option | Turso Sync relevance |
| --- | --- |
| (a) bundle+spawn multiple services in one VFS binary | **Irrelevant to the blocking risk.** The blocking risk is whether tursodb's native driver works at all when loaded from a self-extracting VFS path — a loader/packaging question, not a sync question. Even if that risk clears, multiple spawned processes inside the binary would still contend for the one db file unless collapsed to one process (which is option (c)). |
| (b) dashboard-only desktop + external services (current eis-chat MVP) | **Irrelevant.** This topology already works without any sync layer — the single external `eischat` process is the sole writer today, over a local network, no cloud involved. |
| (c) in-process/embedded (true single-process desktop) | **Strong fit.** In this option, exactly one process (the desktop app itself) becomes the sole tursodb writer — which is precisely the shape Turso Sync is designed for: one local writer per device/session, optionally syncing to cloud when connectivity allows. This is the option where "offline-first" as a marketing/product claim would actually be true and technically sound. |

## Conclusion for the topic-E research question ("offline-first surface")

"Offline-first" for NetScript desktop is not a single undifferentiated feature — it specifically
requires architecture option (c) (true single-process, one local writer) to be technically coherent
with Turso Sync's design. Pursuing "offline-first" language or marketing before option (c) exists
would overstate what options (a)/(b) can deliver. This observation is offered as evidence for
sequencing discussions, not a scheduling recommendation.
