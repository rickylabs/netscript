# Drift

- Environment: RTK absent; use direct commands plus structured repository wrappers.
- Process: explicit owner evaluator routes and Refs-only draft override defaults.
- Foundation #2577 and AI discovery #2590 are open partial work, not merged full
  showcase implementations. Reuse merged canonical pages/data/plugin wiring.

- Astra review uses a separate read-only worktree because the runtime correctly
  prevents launching a second sender in the source reviewer's worktree. Images
  are captured from the same live generated app, with no fake data.
- Native pack emits npm metadata; acceptance projects the archive's actual name,
  exact version and JS/data export map into Deno metadata. No closure guard
  bypass or source-vendor fallback is used.
- AI integration is POSIX-only for private secret-file mode enforcement. Real
  OAuth/OIDC and model credentials are external setup prerequisites; CI uses a
  stub provider and real local framework/auth/streams paths.

- Reconcile observed new main commits: #2592 documented post-seed lifecycle,
  #2559 preset/theming follow-ups and CLI quality ratchet, and #2573 component
  documentation payload reduction. These will be merged normally after the
  current source slice signoff, retaining both histories and regenerating all
  shared carriers. The new CLI lint/format rules already pass on owned TS files.
- The unchanged typed route-reference example had no Utility heading hierarchy.
  The showcase composes the existing typed builder with shared PageHeader/Badge/
  Button components and explanatory reference copy; its route binding remains
  canonical and ordinary init remains byte-identical.

- Current main `59e6202` was merged normally, with no source conflicts. All
  carriers and configured checks were regenerated/rerun on candidate `04149cb`.
- Conversation ownership listing is O(n), preserving every owned thread and sorting
  by timestamp/stable ID. Shared ownership/index pagination is outside the local
  showcase deployment contract; no framework doctrine exception is accepted.
- Final evidence extraction drops launcher/prompt transcripts and preserves only
  reviewer verdicts. Historical commits are retained per the no-rewrite directive.

- Formal IMPL-EVAL D1 identified unrecorded folder-cardinality growth, despite
  green advisory architecture checks. Accepted bounded exception
  `cli-showcase-cardinality-2571`: kernel adapters18→19 and scaffold gates93→94.
  Central registry and CLI README now name cost, owners, target and closure
  gates. This supersedes prior no-deepened-debt claims; runtime code is unchanged.
