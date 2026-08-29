# Brief — #1729 main integration and shared-derivative regeneration

Canonical author, thread `01a04f8b-9ef4-7f60-bc39-2e6e824981d9`, worktree
`/home/codex/repos/netscript-007-leaf-agent-init`, branch
`fix/agent-init-guidance-and-cross-host-skills`, head
`83d24ba57d4e2b6f1d3905ebe508cdc3016a3b0b`.

Your checkpoint is accepted for review. The gate evidence is well-formed, you regenerated
`embedded.generated.ts` rather than leaving a template-only fix, you separated the three issues'
assertions, and you correctly declined to self-certify. Good work.

## Supervisor decision on the behavioural boxes — resolved

Your recommendation is adopted. The three behavioural acceptance boxes are now marked
**`[post-merge]`** on the issues themselves (#1672 acceptance 4, #1674 acceptance 4, #1675
acceptance 5). They are structurally impossible before merge, which is exactly what that marker is
for, and one unfamiliar-agent wave will measure all three signals together against the merged
artifact.

Consequence for you: **the PR may now carry closing keywords.** Add `Closes #1672`, `Closes #1674`,
and `Closes #1675` to the PR body, and state in the body that the three behavioural boxes are
`[post-merge]` and will be verified by a single follow-up wave. Do not tick them.

## The integration task

`main` has advanced twice since your base — through #1711 and #1728 — and is now
**`8b1e42f725919457c64781d5973fd419017fab13`**. Integrate it before your final authored push, so the
branch is reviewed and merged against current main rather than a stale base.

1. **Merge** `origin/main` at `8b1e42f72`. Do **not** rebase — rebasing rewrites the commits your
   gate receipts attest and destroys that correspondence.
2. Resolve any conflict in a generated file **by regeneration only**, never by hand-combining hunks.
   Expect conflicts in the shared repo-wide derivatives; the sibling #1711 leaf hit exactly this.
3. **Regenerate every shared derivative from that exact merged base**, in this order:

```
deno task gen:agent-docs-prose
deno task gen:assets-barrel
deno task gen:mcp-export-corpus
deno task gen:publish-assets
```

4. Prove all four gates exit 0 on the merged tree and report each exit code:

```
deno task check:agent-docs-prose
deno task check:assets-barrel
deno task check:mcp-export-corpus
deno task check:publish-assets
```

5. Re-run your focused product gates on the merged tree — structured `check`, `lint`, `fmt`, and the
   `packages/cli` tests covering `init-agent` — plus the fresh-scaffold consumer proof
   (`agent init --host all --with-docs`). A stale scaffold receipt from before the merge does not
   count.

## Boundaries

- **Preserve product semantics and your current WIP.** The five product paths you touched must keep
  their meaning; the merge must not silently revert or reshape them. After merging, diff your product
  paths against `83d24ba57` and confirm any change came from `main`, not from a bad resolution.
- Product ceiling unchanged. No sixth product path without supervisor approval.
- Never hand-edit a `.generated.ts` file or the prose bundle.
- No `deno.lock` change of your own; if `main` brings one, keep `main`'s and say so.
- No merge of the PR, no readiness flip, no label change, no issue-body edits — the supervisor owns
  those and has already applied the labels, milestone, and `[post-merge]` markers.
- No self-certification. A fresh opposite-family IMPL-EVAL follows the supervisor's Tier-A.

## Finish

Commit the merge, the regenerated derivatives, and the PR-body update; **explicitly push** with a
full refspec. Report the exact head SHA, the four `check:` exit codes, your re-run product gate
results, and confirmation that your product paths kept their semantics. Then stop.
