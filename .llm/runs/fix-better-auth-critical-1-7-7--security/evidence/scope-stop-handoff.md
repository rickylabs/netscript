# Native version selection differs — root disposition required

The exact new worktree/branch remain at base1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d,
fix/better-auth-critical-1-7-7. Root's source authority selected actual1.7.7 and explicitly
required return before proceeding when ordinary native resolution selected a different version.

Actual unchanged-lock [audit RED](audit-unchanged-red.receipt.json) is FAIL/exit1: GHSA-965c-763c-88jm
is the sole critical finding among54 total (53 lower severity). No dependency edits preceded it.

The three authored owners now contain only the approved ^1.7.7 floor/four import literals;
all original bodies/assertions and exact287/78/184 physical lines are preserved byte-for-byte
after reversing only those literals. Ordinary `deno install --lockfile-only` then exited0 in4.172s
but selected actual better-auth1.7.14 and all seven corresponding release components1.7.14.
There was no override, reload, cache deletion, age bypass, pin manipulation or new source owner.

The [complete mismatch report](resolution-mismatch.json) inventories all version changes,
protected hashes and exact source bytes. Its SHA256 is
95a14d6391a78c6da3c1d0c9ec74a142f5387205037abb9d1789766212a58e5f.
[Native candidate diff](native-selection-mismatch.diff) SHA256
9b319455c97ea32873e7e89ca9bc340d567a3943270985c753640835279fe6b9;
[candidate lock bytes](candidate-root-lock.native-1.7.14.json.txt) SHA256
56b8b9cd2c8bae3b9a240af14aed2b7a48368ef572f3f711bed1c70e1a40bcb1.
The root lock delta is43 added/41 removed lines. The approved three authored changes are1/1,
2/2 and2/2; only four tracked owners currently differ. FreshUI private lock is unchanged.

The native dependency changes are the better-auth release family plus utils0.4.2→0.5.1,
better-fetch1.3.1→1.3.3, noble ciphers2.2.0→2.4.0, noble hashes2.2.0→2.4.0 (1.8.0 retained),
better-call1.3.6→1.4.4, kysely0.29.2→0.29.7, nanostores1.3.0→1.5.5,
rou3 adds0.9.2 beside0.7.12 and set-cookie-parser3.1.0→3.2.1. These are observations, not
acceptance of a broader target. Exact peer-qualified/integrity diff is preserved.

All80 protected hashes match, including production auth adapter source, remaining tests and
locks,20 current service owners, five Windows owners and two DB owners. Native initializer/docs
and installed MCP guidance were used. The ignored preparer/report writes are evidence only.

No FreshUI refresh, additional resolution, auth/session/revocation/static/quality/publication/
patched audit gates, commit, push or paid model was run after this stop condition. No adapter,
reference/generated owner or other worktree changed. Current candidate bytes are preserved
for root to select an exact native version strategy; no new version choice is inferred here.
