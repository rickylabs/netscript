# Drift — docs-aspire-terminology--1723a

## D-1 · #1723 cannot be implemented whole; this leaf is slice A

Recorded before implementation. #1723's contract is "prose must match shipped behaviour (S1–S10)",
and nothing 13.5 has merged — main pins Aspire 13.4.6 and #1727 (S1) is still a draft PR. The
version-bound rows are deferred with named dependencies in `research.md` §4. This PR therefore
**closes #1000 only** and references #1723 without a closing keyword.

## D-2 · My first two premises about #1723 were wrong, and were corrected by the Aspire lane

- I assumed `aspire start --format Json` might be 13.5-only. It exists in **13.4.6** (probed by the
  Aspire lane with `--help`, no AppHost started). The real reason to defer the #1642 how-to is that
  the payload shape is receipt-proven on 13.5.3 only, and #1723's row text is itself inaccurate —
  the key is `logFile`, not `logFilePath`, and `dashboardUrl` carries no token on an ephemeral port.
- I assumed a comment-only `.mmd` edit might move the rendered SVG. It does not: the committed SVG
  contains zero `%%` content, and `render.ts --check` byte-compares. Verified independently here.
  The diagram comment is in scope.

## D-3 · Generated-asset rule, refined

`check:publish-assets` is unconditional for this leaf because it regenerates the agent-docs corpus,
whose `provenance.json` `sourceCommit` is embedded in `packages/mcp/src/publish-assets.generated.ts`.
The Aspire lane verified the useful negative: regenerating `agent-tools.generated.ts` alone does
**not** move publish-assets, so the trigger is specifically an agent-docs corpus regeneration, not any
input path.

## D-4 · Scoped inventory is 18 occurrences in 13 files, not 14

The implementation brief says “18 occurrences, 14 files,” but its enumerated locations and the
required pre-edit `git grep` both resolve to 18 occurrences across 13 files. `CONTRIBUTING.md` has no
matching occurrence, as already established in `research.md` §3. The enumerated occurrences remain
the authority; no extra row was inferred or edited to manufacture a fourteenth file.
