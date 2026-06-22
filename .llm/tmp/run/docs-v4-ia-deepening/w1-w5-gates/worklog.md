## W1/W5 Implementation

- 2026-06-22: Repointed the two stale Fresh Framework tutorial card hrefs and
  verified `deno task build` from `docs/site` exited 0.
- 2026-06-22: Added `.llm/tools/docs/check-internal-links.ts`, wired
  `docs/site` tasks and the Pages build workflow, and verified the real site
  with `deno task build` plus `deno task check:links`.
- 2026-06-22: Negative proof edited ignored built output only, replacing one
  Fresh Framework href with `/netscript/tutorials/does-not-exist/`; the checker
  exited 1 and reported that href from `/capabilities/fresh-framework/index.html`.
  Rebuilt afterward to remove the proof edit.
