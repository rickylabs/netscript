# Drift Log: OpenCode MCP attachment and provider-valid resume

Drift is append-only.

## 2026-08-07 — Prepared coordination context is absent and stale at the implementation baseline

- **What:** The owner-named coordination paths do not exist in baseline `1455231b`; they were read
  from commit `3e757c273`. Their planned branch, worktree, base, implementation route, evaluator,
  dispatch hold, and lock hash no longer match the live owner prompt/policy/checkout.
- **Source:** `git log/show --all`; live owner prompt; `workflow/lane-policy.md`; raw git/lock
  checks.
- **Expected:** Prepared branch `fix/opencode-mcp-resume-1324`, canary.14 base, Sol-low sender, Qwen
  evaluator, and older coordination lock hash.
- **Actual:** Owner-provisioned `fix/opencode-mcp-resume-boundaries` at exact `origin/main`
  `1455231b`, current sole Codex writer, Minimax conditional PLAN-EVAL, DeepSeek V4 Flash 0731 max
  IMPL-EVAL, and implementation-base lock hash `d32ef0c1…`.
- **Severity:** significant
- **Action:** accept owner-authorized live contract and re-baseline all technical facts.
- **Evidence:** `research.md`, `supervisor.md`, #1324/#1330 live bodies/comments.

## 2026-08-07 — Runtime status did not surface the managed launcher identity

- **What:** Read-only `agentic:runtime status` found zero sessions and returned `MISSING_IDENTITY`;
  the checked-in launcher receipt nevertheless proves that the sole writer was launched through the
  repo-native managed app-server route as OpenAI `gpt-5.6-sol` at high effort, thread
  `019fdc4e-476f-7ae2-bfdc-48772775ce70`.
- **Source:** Checked-in repo-native app-server launcher receipt;
  `deno task agentic:runtime status --worktree ...`; raw `git status`.
- **Expected:** Runtime inventory and the authoritative launcher receipt both surface the managed
  writer identity.
- **Actual:** The runtime-status query missed the already-active managed writer; it did not prove
  that the writer lacked an app-server identity. Launching another sender would violate the
  exactly-one-writer rule.
- **Severity:** minor
- **Action:** Treat the launcher receipt as authoritative, retain the status miss as diagnostic
  evidence, and do not launch a rival app-server sender. Use only separate sequential formal
  evaluator sessions after writer work is quiescent.
- **Evidence:** Launcher receipt and corrected `supervisor.md` identity/route fields.

## 2026-08-07 — Pinned OpenCode does not expose MCP tools through its debug/tool-list seam

- **What:** Exact 1.17.20 live probing confirmed `/experimental/tool/ids` and `opencode debug agent`
  enumerate built-in/custom registry tools only. MCP tools are appended later in the session
  dispatch path, so the planned direct `debug agent --tool netscript_search_docs` lookup cannot
  execute an MCP tool even while both servers report connected.
- **Source:** exact-tag `tool/registry.ts`, `session/tools.ts`, live generated-project
  `opencode mcp list`, and failed first preflight.
- **Expected:** Research/plan D7 and PLAN-EVAL treated the debug tool seam as including dynamic MCP.
- **Actual:** OpenCode only makes MCP tools visible at provider dispatch.
- **Severity:** significant
- **Action:** retain loopback connected-status and host catalog checks, then use a bounded OpenCode
  provider preflight turn which must call `netscript_search_docs` exactly once. Prove the call from
  the privacy-safe plugin receipt before allowing the product prompt. This remains fail-closed and
  is stronger evidence of provider-visible attachment than the unavailable debug seam.
- **Evidence:** focused preflight tests, live receipt, and exact-tag source citations in
  `research.md`.

## 2026-08-07 — Local CLI live fixture briefly mutated the protected root lock

- **What:** The first repo-local CLI invocation was not passed `--no-lock` and changed three root
  `deno.lock` entries while resolving the live fixture.
- **Source:** immediate post-live `sha256sum` and raw `git diff -- deno.lock`.
- **Expected:** Root lock remains byte-identical to baseline `d32ef0c1…` throughout.
- **Actual:** A temporary hash mismatch was detected before staging.
- **Severity:** significant
- **Action:** reversed only the three run-owned diff hunks with `apply_patch`; did not stage, run a
  restore command, reload caches, or touch the temporary project's own files. Subsequent raw
  `git diff --exit-code -- deno.lock` is clean and the baseline hash matches.
- **Evidence:** `live-acceptance.md`; exact-head lock gates must continue to compare the baseline.
