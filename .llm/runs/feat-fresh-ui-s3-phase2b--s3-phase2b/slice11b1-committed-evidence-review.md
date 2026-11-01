**PASS**: the Docs 11b1 committed-source evidence at `4ca68e4c` reconciles. I found no blockers, and the failure streak stays at 0.

**Why it holds** (`slice11b1-committed-evidence.json`, worklog and context pack)
- **The commit contains exactly the reviewed source.** The 26 source hashes and 7 canonical build hashes show 0 differences from the bytes reviewed in round 2. No product source was edited after the PASS, and the commit message is plain with no attribution.
- **The carriers were measured after the commit.** All six commands exited 0 (`docs11b1-carriers.json` and its logs): `gen:mcp-export-corpus`, `gen:publish-assets` and the four checks. The generated tracked delta is a measured 0, so no derived commit is needed.
- **Quality and publish ran at the right head.**
  - Durable quality passes, and its recorded `gitHead` equals the actual `4ca68e4c` (`docs11b1-committed-quality.json`).
  - The native publish dry run exits 0 with 0 slow types and no allowance (`docs11b1-committed-publish.log`).
  - Both exits are recorded (`docs11b1-committed-exits.json`).
- **Reuse is labelled honestly.** These runs are pre-commit runs on byte-identical source, not runs at `4ca68e4c`:
  - full package 786;
  - full Chromium 739;
  - affected Firefox/WebKit 200;
  - dedicated docs 140;
  - the 6 red-first controls and the 24 focused cases.

  All have 0 retries, 0 flaky, 0 skipped and 0 new allowances.
- **Debt and limits are stated.** Doc-lint remains the raw 124 under #2531 (123 TypeScript plus 1 JSON, 0 new / 0 removed) and isn't called green. The body-as-scroller limitation is disclosed as not covered, with no source change (`worklog.md:810-811`). Runtime and required CI are still unproven.

**Non-blocking**: the body-scroller note is only in the worklog and context pack. A one-line mention in the Toc/AnchorNav README section would tell consumers, but that touches docs and their carriers, so leave it for a later docs pass if you prefer.

**Authorized, in order**
1. The evidence commit, staged by explicit path from your own run directory only.
2. Repeat the frozen-bytes check after that commit.
3. The public audit: added lines plus both run directories, with 0 absolute paths, 0 session identifiers and 0 thumbprints.
4. Confirm with `ls-remote` that the child remote is still exactly `3e88d48774722987d039250b099aafeade5a6971` and the parent is still exactly `c5877ff8610f5fbafd5276e0115c114f92d1cb16`. If either moved, stop.
5. The exact-lease child push, then confirm the remote matches the local head.
6. Update the #2538 body and IMPL comment, referencing #2416 only, then the reconcile note.

**Still required, in order:**
- **11b2:** RuledGrid and Hero, the actual Desktop audit.
- **12:** the production declared x-extensions and the all-style harness.
- **13:** the full runtime run, the same final IMPL-EVAL and green required CI at the exact head.

Each starts from its own design checkpoint. No READY, labels, closing keywords, merge or final report yet. The unknown-owner core dump stays untouched and excluded.
