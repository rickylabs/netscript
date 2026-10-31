I've re-read the amended plan, research, memory note, supervisor scope, worklog and drift notes, and checked them against the source. The round 1 blocker is resolved, there are no new blockers, and the bootstrap slice is cleared for commit.

## B1 (second registry writers): resolved

- **Plan step 2** now routes both trigger writers (`generate-runtime-registries.ts` and `trigger-registry-compiler.ts`) and both worker writers (`runtime-registry-generator.ts` and `registry-compiler.ts`, including plugin-provided job folders) through the shared selector. Sagas has only the one writer, which is already in scope.
- **Plan step 4** now tests that a plugin command-line rewrite after `generate plugins` still leaves out the marked modules. It also tests that both writers select the same files when a marked module is present.
- **The memory note** now lists both command-line writers and the AI compiler. The supervisor's write-surface pattern `*registry*.ts` covers both compilers.

## AI plugin extension: no blockers

- Both of AI's registry outputs go through one selector, `ai-registry-compiler.ts`. `generate plugins` reaches it through `generate-runtime-registries.ts`, and the plugin's sync command reaches it through `sync-ai-project.ts`, so AI has no second writer to miss. The resource listing in `ai-project.ts` is read-only.
- AI already uses read-only inspection protocol 2, so excluded-file evidence reaches doctor the same way as for the other plugins.
- Applying the marker before AI's existing definition-shape check keeps the rule consistent across plugins. The change is limited to file selection, the declared write surface was extended to cover it, and the change is recorded in the drift notes.

## Rest of the plan: unchanged and still no blockers

Round 1 found no blockers in acceptance mapping, doctor evidence, compatibility with older plugins, the #2162 deferral, the planned proof, or the doctrine and JSR checks. The amendments don't change any of those.

The CI `scaffold.runtime` smoke contains no marked module, so it proves no regression, not the acceptance. The acceptance rests on the local tests that import the generated registry, and processor startup stays marked unproven until the coordinator's CI verdict.

## Bootstrap slice sign-off

The run files, including the new `pr-body.md`, `plan-eval.md`, `memory-evaluator.md` and round 2 prompt, contain no host names, absolute paths, credentials or session IDs. The draft PR body uses `Refs` rather than a closing keyword, as the owner instructed. I sign off the bootstrap slice (S0) for commit.

Two small fixes worth making before or with the commit, neither blocking:
- `context-pack.md` still says plan evaluation is pending.
- The supervisor's original write surface still lists the old `docs/site/pages/...` path. The amendment underneath gives the correct path, `docs/site/orchestration-runtime/how-to/author-a-plugin.md`.

VERDICT: PASS