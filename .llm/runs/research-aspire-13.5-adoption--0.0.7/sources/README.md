# Retrieved upstream sources (2026-08-29)

All files are verbatim Markdown retrieved from official Aspire sources on 2026-08-29 by the research
orchestrator (Fable 5 medium). Retrieval method:

- `aspiredev-*.md`: `curl -sL https://aspire.dev/<path>.md` — aspire.dev serves a Markdown form of
  every page at `<page-url-without-trailing-slash>.md`. The `?aspire-lang=typescript` query has no
  effect on the Markdown form (byte-identical response verified for the What's New page); the
  Markdown contains both the C# and the `apphost.mts` TypeScript tabs, so TypeScript claims are
  taken from the `apphost.mts` / `twoslash` code fences and from
  `reference/api/typescript/aspire.hosting` (the generated TypeScript API reference), never from C#
  samples.
- `aspire-whats-new-13.5.md`: https://aspire.dev/whats-new/aspire-13-5.md (release page, 13.5.0).
- `github-release-v13.5.x.md`: `gh api repos/microsoft/aspire/releases/tags/<tag>` bodies for 13.5.0
  (2026-08-18), 13.5.1 (2026-08-21), 13.5.2 (2026-08-21), 13.5.3 (2026-08-25).
- The local Aspire CLI used for `aspire docs list|search|get` was 13.4.6; its docs commands fetch
  live aspire.dev content, and the `aspire docs api` subcommand already exists at 13.4.6.

Files in this directory are **verbatim**: do not run `deno fmt` over them (the run-dir fmt on
2026-08-29 was reverted for `sources/` so byte-level diffs against upstream stay meaningful).
