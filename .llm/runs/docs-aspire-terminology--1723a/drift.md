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

## D-5 · Bare `doc:lint` command is invalid on this base

The requested `deno task doc:lint` invocation exits 1 before linting because the checked-in task
requires `--root`. Its usage text names `--root <path>` as required; the root task does not provide
a repository-wide default. The relevant generated package surface was therefore checked explicitly:
`packages/cli` passes across all three exports. `packages/mcp` reports existing private-type-ref
findings in `cli.ts` and `mod.ts`; this leaf changes only `publish-assets.generated.ts`, which is not
an entrypoint, and the wrapper reports combined child exit 0 for all three MCP entrypoints. The exact
bare-command failure and both scoped outputs are preserved in `worklog.md` for Tier-A classification.

## D-6 · Diagram gate required host-only bootstrap

The first `diagrams:check` attempt could not use the root-owned npm cache. A task-specific cache made
the pinned Mermaid CLI available, after which the host lacked Chromium and its shared libraries and
did not provide a usable Chromium sandbox. The successful retry used Mermaid CLI 10.9.1, a temporary
Chromium revision 1108766, extracted Debian runtime libraries, and a temporary `--no-sandbox`
launcher. All 16 SVGs byte-matched. No repository file or lock changed; a Chromium core dump created
by the failed launch was removed after ownership was verified.
