# Brief — #1729 ADVISORY-1 repair (bounded, inside the five-path ceiling)

Canonical author, thread `01a04f8b-9ef4-7f60-bc39-2e6e824981d9`, worktree
`/home/codex/repos/netscript-007-leaf-agent-init`, head
`9abc76d48cb7bf63ee25b413fb72160362bc2e8c`.

**IMPL-EVAL cycle 1 returned `PASS_IMPL`.** Artifact `907cce4147d999f1ea0f145ca02731307cf680d4` on
`eval/impl-eval-1729-cycle-1`. All three acceptance sets are individually implemented, individually
tested, and reproduced from a fresh scaffold against a base control; the shipped barrel is current;
the canonical→mirror direction is proven in code and by `cmp`; no sixth product path. Good work.

Two advisories. **One requires action now.**

## ADVISORY-1 — the pointer surface misroutes, and that is this leaf's whole subject

Generated root guidance says:

> The app build guide at `apps/<app>/AGENTS.md` explains the local examples, `defineRouteContract`,
> `withResource`, `staleTime`, dehydration, optimistic UI, and `withForm`

The evaluator grepped the generated target `apps/evalapp-web/AGENTS.md` (2,072 bytes, not touched by
this leaf):

| Promised topic | Occurrences in the linked file |
| --- | --: |
| `defineRouteContract` | **0** |
| `staleTime` | **0** |
| dehydration | **0** |
| optimistic | **0** |
| `withResource` | 1 |
| `definePage` | 1 |
| `withForm` | 1 |

So the **one file every agent loads by default** promises four topics the file it points at does not
contain. #1674's acceptance boxes are still met, which is why this is advisory rather than blocking —
but the leaf exists precisely to stop the guaranteed-read file from misdirecting an agent. Shipping a
pointer that overstates its target would reproduce the defect class in a new place.

## The fix — one sentence, inside the ceiling

1. In `packages/cli/src/kernel/assets/agent/guidance.md.template`, correct that sentence so it claims
   only what the target actually covers. Either attribute the four missing topics to their real home
   (the offline docs / MCP `find_guidance`) or drop them. Keep the link and its "read it before app
   work instead of inventing a parallel pattern" instruction — those are correct and are what
   acceptance box 2 rests on.
2. Regenerate the shipped barrel: `deno task gen:assets-barrel`. The template alone is not what ships.
3. Update the `#1674` test string assertion so it matches the corrected wording.
4. Re-run: `deno task check:assets-barrel`, the focused installer suite
   (`init-agent_test.ts`, expect 22 passing), scoped structured `check`, and the fresh-scaffold proof
   (`agent init --host all --editor vscode --with-docs`). A scaffold receipt from before this change
   does not count.

Do **not** edit `apps/<app>/AGENTS.md` or its template to add the missing topics — that is a
different file, a different scope, and would be a sixth product path.

## ADVISORY-2 — not yours, filed separately

`skills/netscript/SKILL.md:43` and `skills/netscript-operate/SKILL.md:50` still say
`.claude/skills/help.md`, contradicting the canonical-tree convention this leaf establishes. `skills/`
is outside the five permitted paths, so the evaluator correctly did **not** fix it and neither will
you. The supervisor is filing a follow-up issue.

## Boundaries

- **Five-path ceiling unchanged.** No sixth product path.
- Never hand-edit a `.generated.ts` file — regenerate.
- No `deno.lock` change. No merge, readiness flip, label change, or issue-body edit.
- Do not touch other lanes' branches or worktrees.
- No self-certification. A bounded delta re-review by the same independent evaluator follows.

## Finish

Commit, **explicitly push** with a full refspec, and report the exact head SHA, the corrected
sentence, `check:assets-barrel` exit code, the installer suite result, and the fresh-scaffold proof.
Then stop.
