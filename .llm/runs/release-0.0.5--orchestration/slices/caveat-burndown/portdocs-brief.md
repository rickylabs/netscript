# Brief: fixed-port prose sweep after randomized scaffold ports (#1240)

You are working in /home/codex/repos/ns005-portdocs on branch docs/randomized-ports-prose
(NetScript repo, rickylabs/netscript). Documentation-authoring lane; touch only Markdown under
docs/ and the root README.md. Never touch packages/, plugins/, or .llm/.

## What changed and why the docs are suspect

PR #1211 (merged to main) removed the fixed scaffold port defaults. Before it, every scaffolded
project used 8091/8092 for API services, 3000 for the web app, 5173 for the dev server, and the
docs were written against those constants. Now the scaffolder assigns randomized per-project
ports (read the #1211 diff with `gh pr diff 1211 --repo rickylabs/netscript` to anchor exactly
what is emitted now). Users discover their ports from the scaffold console output, the Aspire
dashboard, or the MCP `list_api_services` tool.

## Your task

Find every occurrence of 8091, 8092, localhost:3000, and localhost:5173 in README.md and
docs/site/**. For each one, JUDGE it before touching it:

- If the text asserts or implies these are the ports a scaffolded project will use — a promise
  the scaffolder no longer keeps — rewrite that passage so it tells the truth: ports are
  assigned per project at scaffold time, and here is where you see yours. Keep the surrounding
  narrative voice; integrate, don't bolt on.
- If the port is purely illustrative (a config excerpt showing shape, an Aspire-owned or
  OTel-collector port that #1211 did not change, an example that explicitly says "for example"),
  leave it alone. Where an illustrative port could be misread as a promise, a short
  "your scaffold's ports will differ" clause is enough.

Do not paste the same port-discovery sentence into fifteen files. Do not invent new sections.
A file where everything is accurate gets zero edits — that is a valid and expected outcome, and
you record it as a judgment, not a failure.

## Deliverable

Commit to the current branch (conventional message, docs scope). Push with the explicit
refspec: git push origin docs/randomized-ports-prose:docs/randomized-ports-prose. Open a DRAFT
PR with `gh pr create --repo rickylabs/netscript --draft --base main`, body containing
`Closes #1240` and a per-file judgment table: file, occurrences, verdict (kept-accurate /
rewritten), one-line reason. Honest verdicts only — the table is the deliverable as much as the
edits.
