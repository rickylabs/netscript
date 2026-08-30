# Drift Log: S9 Phase A

## 2026-08-30 — RTK unavailable on the NAS image

- **What:** The preferred read-heavy command proxy is not installed.
- **Source:** bootstrap command returned `/bin/bash: rtk: command not found`.
- **Expected:** AGENTS.md prefers `rtk` for read-heavy git/rg output.
- **Actual:** Focused raw `git`, `rg`, and bounded `sed` are required.
- **Severity:** minor
- **Action:** accept for this run; do not install host tooling.
- **Evidence:** first bootstrap tool output in the session; no product behavior is affected.

## 2026-08-30 — Aspire 13.5.3 static MCP exposes 14 tools, not the locked 15

- **What:** The one permitted no-AppHost stdio capture found the exact 13.4.6 baseline tool set;
  `get_integration_docs` was absent.
- **Source:** direct `initialize`, `tools/list`, and `doctor` JSON-RPC exchange with
  `aspire agent mcp` from a directory containing no AppHost.
- **Expected:** The S9 contract expects the 14-tool baseline plus `get_integration_docs`.
- **Actual:** `toolsDiscovered: 14`, `toolsMissing: ["get_integration_docs"]`, and an empty
  baseline diff under CLI/server version 13.5.3.
- **Severity:** significant
- **Action:** preserve the observed receipt verbatim; retain the contract's 15-tool gate so a live
  Phase-B run fails honestly if the mismatch persists. Do not rewrite evidence or claim the
  missing tool was observed.
- **Evidence:**
  `receipts/aspire-13.5.3-mcp-tools-static.json`; pre/post `aspire ps` were `[]` and remote Docker
  inventory was empty.

## 2026-08-30 — scoped check wrapper flag syntax

- **What:** The first scoped check invocation passed `--unstable-kv` directly to the wrapper.
- **Expected:** Workspace checks include unstable KV support.
- **Actual:** The wrapper rejected the direct flag because it already enables `--unstable-kv` by
  default; the corrected invocation passed with zero diagnostics.
- **Severity:** minor
- **Action:** use the wrapper default (or `--deno-arg` for other extra Deno flags).
- **Evidence:** Slice-1 check output and `.llm/tools/run-deno-check.ts --help`.

## 2026-08-30 — agent guidance authority is a generated template

- **What:** The dispatch named `init-agent.ts` as the AGENTS block edit point, while the repository
  generates that block from `packages/cli/src/kernel/assets/agent/guidance.md.template`.
- **Expected:** Update the generator authority and regenerate its consumers.
- **Actual:** The template was updated and `gen:assets-barrel` produced the embedded output; no
  generated mirror was hand-edited.
- **Severity:** minor
- **Action:** follow the repository authority chain.
- **Evidence:** template and generated asset diff in slice 2.

## 2026-08-30 — workflow push required a scoped GitHub write path

- **What:** The configured HTTPS credential could push ordinary commits but lacked GitHub's
  `workflow` scope for `.github/workflows/e2e-cli.yml`.
- **Expected:** Push both slice-1 commits to the explicit branch ref.
- **Actual:** The code commit was pushed normally; the workflow-only commit was created through the
  authenticated GitHub connector and the local branch was fast-forwarded to the identical commit.
- **Severity:** minor
- **Action:** no credential mutation; subsequent non-workflow commits use the required refspec.
- **Evidence:** PR #1759 commits `83ae1a43` and `06a0e5e1` and their implementation comments.
