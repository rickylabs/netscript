- 2026-06-22: Internal-link checker strips the Lume base path from `_config.ts`
  (`/netscript/`) before resolving emitted hrefs against `_site`.
- 2026-06-22: Negative proof injected `/netscript/tutorials/does-not-exist/`
  into ignored built output at `_site/capabilities/fresh-framework/index.html`;
  `deno task check:links` exited 1 and reported the bad href. A subsequent
  `deno task build` regenerated `_site` and removed the proof edit before commit.
- 2026-06-22: Confirmed `docs/site/_site/` is gitignored by `docs/site/.gitignore`.
