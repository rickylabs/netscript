# GLM lane-validation pass — report

Branch: `glm/lane-validation` (based on `main` after the OpenRouter lane-repair merge, PR #696).
Agent: GLM 5.2 running as a bounded validation agent. Scope was strictly limited to the two
named paths (`.llm/tools/agentic/README.md` and `.llm/runs/glm-lane-validation--glm/`).

## 1. TEST — commands run and raw outcomes

### a) Provider canary (all presets, static mode)

```
deno task agentic:provider-canary --all --worktree /home/codex/repos/ns-fix-agentic-lanes
```

Exit code: **0**

Status line (single JSON line, formatted here for readability):

```json
{
  "mode": "static",
  "status": "passed",
  "expectedPresetIds": [
    "claude-fanout-minimax-m3",
    "claude-design-glm-5-2",
    "codex-design-glm-5-2",
    "codex-long-medium-grok-4-5"
  ],
  "observedPresetIds": [
    "claude-design-glm-5-2",
    "claude-fanout-minimax-m3",
    "codex-design-glm-5-2",
    "codex-long-medium-grok-4-5"
  ],
  "rows": [
    { "id": "claude-fanout-minimax-m3",  "validation": "passed", "launchValid": true, "liveEligible": false, "agenticTurn": "unverified",  "transport": "anthropic-messages", "incompatibility": null },
    { "id": "claude-design-glm-5-2",    "validation": "passed", "launchValid": true, "liveEligible": true,  "agenticTurn": "supported",    "transport": "anthropic-messages", "incompatibility": null },
    { "id": "codex-design-glm-5-2",      "validation": "passed", "launchValid": true, "liveEligible": false, "agenticTurn": "unsupported",  "transport": "responses",         "incompatibility": "codex-native-namespace-tool" },
    { "id": "codex-long-medium-grok-4-5","validation": "passed", "launchValid": true, "liveEligible": false, "agenticTurn": "unverified",  "transport": "responses",         "incompatibility": null }
  ],
  "diagnostics": []
}
```

Summary: static canary passed for all four registered `OPENROUTER_PRESETS`. Registry coverage and
capability coherence hold; both the Claude and Codex launch planners validated. Notably the
`claude-design-glm-5-2` lane is the one live-agentic-eligible route (`liveEligible: true`,
`agenticTurn: "supported"`), while `codex-design-glm-5-2` is correctly surfaced as structurally
unsupported (`agenticTurn: "unsupported"`, `incompatibility: "codex-native-namespace-tool"`) —
exactly the post-repair shape the README describes.

### b) Type-check of the agentic tools

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts
```

Exit code: **0**

Result summary (emitted by the wrapper): `deno check --quiet --unstable-kv <files>`,
selection `filesSelected: 105, batches: 1, failedBatches: 0`, with `totalOccurrences: 0`
diagnostics. Clean.

## 2. FIX — README review

I read `.llm/tools/agentic/README.md` and cross-checked every item the task named against the
source of truth (`runtime/provider-profiles.ts`, `runtime/cli/provider-canary.ts`,
`claude/claude-print.ts`) and against the live canary output above.

Findings — all four required items are already present and accurate:

1. **`claude-design-glm-5-2` preset** — README (around the `provider-canary.ts` section, lines
   278-281) states the Claude GLM design preset is live-agentic supported. Source
   `provider-profiles.ts:158-167` sets `agenticTurn: 'supported'`; canary confirms
   `liveEligible: true`, `agenticTurn: "supported"`. Accurate.
2. **`codex-design-glm-5-2` lane structurally unsupported** — README says the Codex GLM design
   preset is explicitly unsupported because the Responses route declares a native namespace tool
   that the available OpenRouter endpoints reject. Source `provider-profiles.ts:168-177` sets
   `agenticTurn: 'unsupported'`, `incompatibility: 'codex-native-namespace-tool'`; canary confirms
   both. Accurate.
3. **Static-by-default + `--live` canary modes** — README documents static mode as the default
   (registry coverage / capability coherence / real launch planners, no credentials, no provider
   process) and shows the `--live` opt-in invocation. The `--live` example in the README
   (lines 287-289) matches the CLI usage string in `provider-canary.ts:24-25` verbatim
   (`--live --profile <id> --model <id> --effort <effort> --worktree <native-ext4-path>
   [--base-url <https-url>] [--codex-profile-home <path>]`), and the static status-line shape
   documented (lines 284-285) matches the actual canary output. Accurate.
4. **`claude-print` bounded print-mode lane** — README (line 275-276) describes
   `claude/claude-print.ts` as the launch/resume wrapper for non-mobile gateway sessions. Source
   builds `-p` print-mode argv (`--permission-mode bypassPermissions`, `--output-format
   stream-json`) with an optional `--resume` for same-session continuation. Accurate.

**No changes made to `.llm/tools/agentic/README.md`.** Per the task instruction ("If the README
is already accurate, say so and change nothing"), the file is already accurate for the
post-lane-repair state and was left untouched. No other path was modified.

## 3. Self-assessment — running as an agent through this lane

Running this validation pass through the agentic lane was, on the whole, smooth and reliable. Both
gated commands returned exit 0 on the first invocation with no flakiness, and the canary's
structured single-line JSON output made verification against the README trivial — the documented
preset shape (`liveEligible`, `agenticTurn`, `incompatibility`) lined up field-for-field with the
README prose and the source in `provider-profiles.ts`, so the "is the doc still accurate?"
question was answerable by direct comparison rather than judgment calls. The one mildly awkward
aspect is that the README documents the GLM presets in prose rather than as an explicit table, so
"the OpenRouter preset table" in the task brief maps to scattered sentences; the substance is all
present, but a future reader scanning for a single preset row has to read the paragraph. That is a
stylistic observation, not a defect, and I deliberately did not reformat it given the "keep edits
minimal / match existing style / change nothing if accurate" constraint. The `rtk` prefixing and
the scoped `run-deno-check.ts` wrapper both worked as advertised, keeping the logs compact. No
tools failed, retried, or needed a workaround.

## Commit

Single commit on `glm/lane-validation`:
`chore(agentic): GLM lane-validation pass — canary/check evidence + README refresh`.
Contents: this report only (the README required no edits). Pushed to `origin/glm/lane-validation`.
No PR opened, per instructions. No files under `packages/`, `plugins/`, or any other path were
touched.
