# Research — docs(aspire): terminology sweep, the shippable slice of #1723

Base `origin/main` `13878a80`. Every fact read from `origin/main`, and the Aspire-lane facts are
attributed to the `007-aspire-9a` session where they came from its receipts rather than from mine.

## 1. Why #1723 cannot be implemented whole

#1723 (S11) says "prose must match shipped behaviour (S1–S10)". **Nothing 13.5 has landed.**

- `.github/toolchain.env` on main: `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.6`,
  `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.6`.
- Every S-slice PR is open: #1727 (S1 pin bump) **draft**, #1735 (S2), #1738 (S4), #1740 (S5),
  #1741 (S3), #1743 (S6), #1744 (S7). None merged.
- Neither `tools/aspire-surface-manifest.ts` nor `check:aspire-version-parity` exists on main; the
  manifest lives on `research/aspire-13.5-0.0.7`.

The two version literals in public docs are therefore **correct today**:

| Location | Says | Main pins | Verdict |
| --- | --- | --- | --- |
| `docs/site/explanation/aspire.md:83` (`aspire.config.json` snippet) | `13.4.6` | `13.4.6` | correct — do not touch |
| `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58` | `13.4.6` | `13.4.6` | correct — do not touch |

Writing 13.5.3 now would make the public docs **false against main** — the same defect class #1745
just repaired, in the opposite direction. The manifest's own disposition for the four
`doc:aspire-dedicated` rows agrees: *"version snippets must equal a fresh `netscript init`."*

## 2. What is genuinely independent of S1–S10

**Terminology (#1000): ".NET Aspire" → "Aspire", and Microsoft Learn links → `aspire.dev`.** A naming
fact, carrying no version or behaviour claim. 18 occurrences across 14 published surfaces:

```
README.md:16,31,317
docs/site/cli-reference.md:122
docs/site/explanation/aspire.md:101
docs/site/glossary.md:40
docs/site/index.vto:9
docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:11,33
docs/site/orchestration-runtime/how-to/deploy.md:373
docs/site/quickstart/aspire.md:36
docs/site/tutorials/erp-sync/index.md:112
docs/site/tutorials/index.md:33,90
docs/site/tutorials/workspace/01-scaffold.md:46
docs/site/why.vto:68,91
docs/site/_diagrams/aspire-resource-graph.mmd:2   ← in scope, see §4a
```

Four of those also carry a `learn.microsoft.com/dotnet/aspire/` link (`README.md:31`,
`quickstart/aspire.md:36`, `tutorials/erp-sync/index.md:112`, `tutorials/index.md:90`).
**`aspire.dev` is already the convention on main** — used in `explanation/aspire.md`,
`quickstart.vto`, and three tutorial scaffold chapters — so this is consistency, not a new rule.

`docs/site/_plan/**` also matches, but Lume ignores `_`-prefixed directories: those are unpublished
research archives and are **out of scope**.

## 3. Rows already satisfied — recorded with proof, not skipped

- **"Remove/avoid any AI-Assistant mention."** `git grep -rniE 'ai.assistant' origin/main -- docs/site
  README.md` → **zero hits**. The Aspire lane confirms this is an upstream dashboard removal recorded
  as docs-only impact with its own grep verification, and that nothing queued adds one. Row satisfied
  by inspection; the PR body carries the grep.
- **`CONTRIBUTING.md`** — #1723 names lines 57 and 86, but neither contains ".NET Aspire" (they are
  E2E guidance and the label taxonomy). No terminology change needed; any version-literal work there
  belongs to the deferred set.

## 4. Held back deliberately, each with a named dependency

| Row | Depends on | Why |
| --- | --- | --- |
| `explanation/aspire.md:83`, `deploy-local-aspire.md:58`, `quickstart/aspire.md`, `reference/aspire/index.md` version snippets | **S1 #1727** | main pins 13.4.6; docs are correct today |
| `reference/aspire/index.md` health checks | **S6 #1718** (blocked) | behaviour not shipped |
| `reference/aspire/index.md` resource commands, `excludeFromMcp` | **S8 #1720** | behaviour not shipped |
| `observability/*` (`aspire otel … --search timestamp:>=`, `aspire export`) | **S3 #1741 / S10 #1722** | fixture/CLI surface not re-captured |
| `_diagrams/*.mmd` **graph nodes** (not the comment — see §4a) | S6 #1718 / S8 #1720 | S6 is proven node-neutral by the Aspire lane (2 `addContainer` calls before and after; health checks are resource properties, not nodes) and S8 is node-neutral at design level under locked D-6. No render needed for this leaf. |
| #1642 detached-start how-to | **not version-bound — deferred on evidence** | The Aspire lane probed 13.4.6 directly: `aspire start --format <Json\|Table>` and `aspire ps --format Json` **exist in 13.4.6**, so my original "13.5-only" premise was wrong. But S2's receipts prove the payload shape on **13.5.3 only**, and the shape contradicts #1723's row text: the key is **`logFile`**, not `logFilePath`, and `dashboardUrl` carries **no token** on an **ephemeral** port. Documenting an unverified payload shape against the pinned version is worse than documenting nothing. #1642 also declares itself outside 0.0.7. |

### 4a. The diagram comment IS shippable — verified, not assumed

I initially deferred `aspire-resource-graph.mmd:2` for fear a comment edit would move the rendered
artifact and hand the Aspire lane a spurious diagram diff. That fear was unfounded, and I checked it
myself rather than taking the answer:

`docs/site/assets/diagrams/aspire-resource-graph.svg` (21,680 bytes) contains **zero** occurrences of
`.NET Aspire`, `%%`, the comment text, or any source digest or timestamp — Mermaid strips `%%`
comments at parse time and they never reach the SVG. `docs/site/_diagrams/render.ts --check` renders
to a temp file and **byte-compares** against the committed SVG, so a comment-only `.mmd` edit renders
identically and `diagrams:check` stays green.

The row is therefore in the terminology sweep. Run `diagrams:check` anyway as a gate; if it ever goes
red on a comment-only edit, that is a diagram-tooling problem, not a docs one.

## 5. The manifest is a completeness contract, not a menu

Locked decision D-13, per the Aspire lane: parity phase 1 (S1) reports non-failing `deferred` rows;
**phase 2 (S13) fails on every non-archival row**. The 102 `doc:public-page` rows assigned to S11
flip from advisory to hard failure when S13 lands. Every row must therefore be closed **or** carry a
recorded rationale before S13 — an unexplained decline becomes a red gate someone else has to
interpret. The PR body accounts for all of them in three buckets: edited, no-change-needed with the
grep that proves it, or deferred with the named dependency.

## 6. Not ours

S13's cleanup set is three named items — `.agents/skills/codex-wsl-remote/SKILL.md` and its `.claude`
mirror, `packages/cli/.../render-ts-apphost.ts:81`, and the D-17 telemetry resolver. Untouched here;
two are outside the docs surface entirely.

## 7. Generated assets — the rule that cost #1746 a red CI job

`docs/site` edits regenerate the agent-docs corpus, which is an **input** to
`generate-publish-assets.ts`. Run `gen:agent-docs-prose`, `gen:assets-barrel` **and**
`gen:publish-assets`, then their three check gates, **unconditionally**.

Refinement from the Aspire lane, worth stating precisely because the naive rule over-predicts: the
trigger is not "one of the generator's seven input paths changed", it is "an input whose content
actually reaches the emitted output". They verified a clean negative — S5 regenerated
`agent-tools.generated.ts` (an input path) at head `f0de60a1` and `check:publish-assets` still exited
0, because nothing the generator *emits* moved. What bit #1746 was `provenance.json`, whose
`sourceCommit` **is** embedded. So: **an agent-docs corpus regeneration is the trigger**, and this
leaf performs one. Do not reason about which
generator "should" fire — the #1746 leaf did exactly that from a remembered file list, the list was
wrong, and neither Tier-A nor an independent IMPL-EVAL could catch it because the wrong list was what
they re-ran. The Aspire lane lost a CI cycle to the same class in `agent-tools.generated.ts`.
