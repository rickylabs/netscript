# Supplement brief: complete the fixed-port sweep (#1240, pass 2)

You are continuing your own earlier commit in /home/codex/repos/ns005-portdocs on branch
docs/randomized-ports-prose (rickylabs/netscript; draft PR #1242 exists). Your first pass
handled 8091/8092/3000/5173 well, but the search set was narrower than the fix: PR #1211
replaced EVERY fixed scaffold port with a seeded per-project allocator. Ground truth from
packages/cli/src/kernel/constants/port-ranges.ts and the scaffold writers:

- GONE as fixed defaults: 3001 (example service), 8010 (scaffolded app dev fallback — now a
  seeded APP-range port baked per project), 8091–8094 (plugin APIs), 4437 (streams runtime —
  its portRangeKey is PLUGIN_API, it randomizes exactly like workers/sagas/triggers/auth).
- STILL FIXED (leave alone): 18888 Aspire dashboard, 4318 OTLP collector, 5432 postgres and
  other container-internal ports.
- Ranges, only where a page actually teaches allocation: SERVICE 49152+, APP 53248+,
  PLUGIN_API 57344+. Everywhere else, "its assigned port" style — match your pass-1 phrasing.

Run: grep -rn "4437\|8010\|3001" docs/site README.md --include="*.md"
(~95 occurrences, ~25 files; docs/site/durable-workflows/streams.md alone has ~20).

Judgment rules, per occurrence:
- Prose or diagrams/tables asserting a fixed port a scaffold no longer emits: rewrite, same as
  pass 1. This includes your own pass-1 files where you left 4437/3001/8010 behind: aspire.md
  (3 spots), architecture.md (2), fresh-ui.md ports table (the :8010, :3001, :4437 rows and
  the dead http://localhost:4437 link — do not link to a port that does not exist), glossary.md,
  add-a-plugin.md streams row "4437 (Deterministic)" (make it match the four sibling rows you
  already rewrote), author-a-plugin.md "servicePort 4437" (the manifest field still contains
  4437 but the installer allocates from portRangeKey — say what actually happens).
- Inside tutorial transcripts / captured command output (tutorials/storefront, workspace,
  live-dashboard): these are records of a real scaffold run. Do NOT rewrite the numbers —
  that would falsify a capture. Add one short note per page at the first port mention that the
  ports shown come from that tutorial's scaffold and each scaffold assigns its own; leave the
  rest of the page internally consistent.
- Genuinely illustrative config excerpts: your pass-1 comment treatment.

Deliverable: a second commit on the branch (do not amend), push with the explicit refspec
git push origin docs/randomized-ports-prose:docs/randomized-ports-prose, then edit the PR #1242
body: append the new per-file judgment rows to the existing table and a one-line note that
pass 2 widened the pattern to 4437/8010/3001. Honest verdicts; kept-accurate is a valid row.
