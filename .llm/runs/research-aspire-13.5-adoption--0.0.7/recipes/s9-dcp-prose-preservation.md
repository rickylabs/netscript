# S9 convergence — preserving #1887's DCP constraint prose

**Proven by execution, then deliberately rolled back** because S9's parent is S8, not `main`
(see "Correct base" below). Re-apply this resolution when S9 actually converges.

## The hazard, measured

`.agents/skills/aspire/SKILL.md` (and its `.claude/` mirror) conflict in **exactly one region**:

| side | size | contains the DCP section? |
| ---- | ---: | ------------------------- |
| HEAD (`e938ecd31`, #1887) | **20 lines** | **yes — it *is* the section** |
| S9 | **150 lines** | **no** |

So "take S9's side" — the natural resolution for a slice whose whole purpose is rewriting this file —
**deletes #1887's section outright**. Nothing goes red: the file is prose, no test covers it, and
`agentic:sync-claude:check` would still pass because it proves the two files *agree*, not that either
is correct. This is the failure mode flagged on #1759.

## The resolution that works

Keep **both**: S9's 13.5.3 rewrite, then re-append #1887's section. They are additive — #1887's block
is a contiguous insertion at line 108 of the pre-merge file, not an interleaved edit.

```python
def keep_both(m):
    head, theirs = m.group(1), m.group(2)
    return theirs.rstrip('\n') + '\n\n' + head.strip('\n') + '\n'
re.sub(r'<<<<<<< HEAD\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n', keep_both, s, flags=re.S)
```

Apply to **both** `.agents/skills/aspire/SKILL.md` and `.claude/skills/aspire/SKILL.md`.

## Verification — do not skip

```
grep -c 'Upstream cleanup of networks and anonymous volumes' .agents/skills/aspire/SKILL.md   # 1
grep -c 'microsoft/dcp#213'                                  .claude/skills/aspire/SKILL.md   # 1
deno task agentic:sync-claude:check                                                            # mirror agrees
```

The greps are the real gate here; `sync-claude:check` cannot detect prose that was correctly mirrored
after being wrongly deleted.

## Correct base — why this was rolled back

S9 is **stacked on S8**, so it must rebase `--onto <S8-final> <previous-S8-head>`, never
`--onto origin/main`. Rebasing onto `main` drops S8's commits, and S9 commits that build on S8's
`runtime-gates.ts` / `runtime-scripts.ts` changes then conflict against their own missing parent —
which is exactly what happened and why this attempt was aborted rather than forced.

**Order:** S8's repair lands → S8 converges onto main → **then** S9 converges onto S8's new head, with
this resolution applied to the SKILL pair.
