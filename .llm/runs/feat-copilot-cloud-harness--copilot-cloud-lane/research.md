# Research — feat-copilot-cloud-harness--copilot-cloud-lane

## Re-baseline

- Carried-in source: the owner has an active GitHub Copilot Pro+ subscription; no carried-in code
  plan.
- Re-derived against `main` @ `1c9eeef1a58316cff416bb9049e90346a78c89cc` on 2026-09-04.
- Research generator: native `agy`, Gemini 3.8 Flash high, separate conversation.
- Verification: every product, API, quota, and billing claim below was checked against current
  GitHub or OpenCode documentation. Unpublished limits remain explicitly unknown.

## Questions resolved

1. Which Copilot surfaces can the harness automate?
2. Can the Copilot subscription back Claude Code or OpenCode?
3. Should Copilot replace OpenHands immediately or enter as a measured peer?
4. Which Pro+ costs and limits can be guarded without scraping the GitHub UI?
5. Which dispatch, status, steering, receipt, cancellation, branch, and CI contracts are provable?
6. How should the typed workload matrix bind model, effort, transport, and evaluator independence?

## Primary sources

- [Copilot cloud agent API](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api)
- [Agent tasks REST reference](https://docs.github.com/en/rest/agent-tasks/agent-tasks)
- [Copilot cloud agent concepts](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent)
- [Copilot cloud agent settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)
- [Copilot CLI programmatic reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference)
- [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- [Copilot CLI AI-credit limit](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit)
- [Copilot Pro+ usage billing](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals)
- [Copilot model prices](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
- [Copilot customization matrix](https://docs.github.com/en/copilot/reference/customization-cheat-sheet)
- [Copilot agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
- [Copilot hooks](https://docs.github.com/en/copilot/reference/hooks-reference)
- [OpenCode providers](https://opencode.ai/docs/providers)

## Findings

### 1. There are two distinct, useful automation surfaces

| Surface             | What is proven                                                                                                                                                                                                         | Harness value                                                                                         | Current boundary                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Local `copilot` CLI | Programmatic `-p`, `--model`, supported effort levels, permission allowlists, `--autopilot`, continuation cap, per-session `--max-ai-credits`, JSONL output, custom agents, skills, hooks, MCP, and resumable sessions | A first-class local implementation transport with structured output and an enforceable task spend cap | Binary is not installed on this host yet; authentication and a bounded zero-write probe belong to implementation                          |
| Copilot cloud agent | `POST /agents/repos/{owner}/{repo}/tasks`, list/get status, explicit base/model/PR creation, issue-assignment API, `gh agent-task`, draft PR output, GitHub-hosted sandbox                                             | A genuine asynchronous cloud implementation lane                                                      | Agent Tasks API and model-selection assignment are preview surfaces; CI approval policy and the 59-minute hard task limit must be encoded |

The Agent Tasks API exposes machine-readable states: `queued`, `in_progress`, `completed`, `failed`,
`idle`, `waiting_for_user`, `timed_out`, and `cancelled`. Its response also carries task and session
IDs, selected model, base/head refs, timestamps, and PR artifacts. This is sufficient for a typed
dispatcher/status/watcher contract without scraping the GitHub UI.

Repository proof on 2026-09-04: the read-only `suggestedActors(CAN_BE_ASSIGNED)` GraphQL query for
`rickylabs/netscript` returned `copilot-swe-agent`, so the cloud agent is enabled for this account
and repository. No billable task was launched during research.

### 2. Client and subscription boundaries

| Client             | Copilot subscription support                                 | Conclusion                                                                                                       |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| GitHub Copilot CLI | Native GitHub OAuth/token authentication                     | Supported and preferred for local Copilot execution                                                              |
| OpenCode           | Native `GitHub Copilot` provider through GitHub device login | Supported; can consume the Pro+ entitlement inside OpenCode                                                      |
| Claude Code        | No documented GitHub Copilot authentication/provider surface | Do not route Copilot credentials through Claude Code. Model catalog overlap is not subscription interoperability |

The research does **not** claim that every third-party proxy is contractually prohibited, nor that
using one necessarily causes suspension. The safe harness rule is narrower and testable: support
only documented native authentication paths; never extract or translate Copilot session tokens.

OpenCode documents GitHub Copilot as a subscription provider and stores its own authenticated
credential after `/connect`. That makes OpenCode a possible local client for Copilot-backed models,
but the native Copilot CLI remains the stronger first target because it exposes Copilot-specific
credit caps, effort, permissions, session identity, and JSONL directly.

### 3. Pro+ cost and quota facts

| Surface          | Published contract                                                                                                          | Harness consequence                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Subscription     | $39/month; 3,900 base + 3,100 flex = 7,000 monthly AI credits                                                               | Track a 7,000-credit monthly envelope; reset at 00:00 UTC on the first of each month                         |
| Credit value     | 1 AI credit = $0.01; token price varies by model                                                                            | Estimate by explicit model and official input/cache/output rates                                             |
| Local CLI        | `--max-ai-credits` is a soft per-session ceiling; an in-flight response may overshoot slightly                              | Require a positive cap on every harness launch and record requested cap/observed usage                       |
| Cloud agent      | Consumes AI credits and GitHub Actions minutes                                                                              | Expense receipt must preserve both meters; Actions compute is a distinct budget                              |
| Overage          | Additional use requires an owner-configured budget                                                                          | Default harness policy should fail closed at the included allowance; no assumption that overage is enabled   |
| Rate limits      | GitHub documents temporary rate limiting but no fixed personal rolling-window numbers                                       | Treat `rate_limited`/429 as runtime state; do not invent 5-hour, weekly, or concurrency quotas               |
| Usage visibility | Individual usage is visible in GitHub billing UI; no documented individual real-time credit-balance REST endpoint was found | Use local accounting plus per-run caps; do not claim authoritative remaining balance from an unsupported API |

The previous generated draft's references to a Copilot 5-hour window, weekly quota, and
`/settings/billing/actions` preflight were not supported by current product documentation and are
rejected. Likewise, model multipliers apply only to legacy annual request-based plans; the current
AI-credit model uses per-token prices.

### 4. Cloud automation contracts

| Capability      | Stable automation seam                                                                    | Notes                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dispatch        | Agent Tasks REST `POST`, `gh agent-task create`, or issue assignment through REST/GraphQL | Prefer Agent Tasks REST for a new harness lane because it directly returns a task ID                                                           |
| Model selection | `model` in Agent Tasks/agent-assignment input                                             | Never use auto selection in matrix-governed launches                                                                                           |
| Base/PR         | `base_ref` and `create_pull_request`                                                      | Require explicit base ref; validate resulting head/ref and PR artifact                                                                         |
| Status          | Agent Tasks list/get                                                                      | Parse only documented task states; preserve raw response as a transient receipt                                                                |
| Follow          | `gh agent-task create --follow` and `gh agent-task view --log --follow`                   | Useful operator surface; REST polling remains the machine authority                                                                            |
| Steering        | GitHub session prompt or `@copilot` on the assigned PR                                    | Current public docs do not expose a typed REST steering endpoint; treat comment steering as a separate, auditable GitHub mutation              |
| Stop            | UI stop is documented; task state includes `cancelled`                                    | No public stop endpoint was found in the Agent Tasks REST reference; do not promise programmatic cancellation yet                              |
| CI              | Copilot pushes do not run Actions by default                                              | Repository setting can disable manual approval, but that increases risk. Initial canary keeps approval explicit and records it as a human gate |
| Execution       | GitHub-hosted ephemeral environment, one repository/branch/PR, 59-minute hard maximum     | Slice tasks below the hard limit and reject multi-repository work                                                                              |

Issue assignment remains useful when the issue is the task authority. It supports
`target_repo`/`targetRepositoryId`, `base_branch`/`baseRef`, custom instructions, custom agent, and
model. It requires a user token. Implementation must perform a non-billable permission preflight
before any dispatch.

### 5. Instructions, skills, hooks, and MCP

Copilot supports repository instructions, repository custom agents under `.github/agents`, and agent
skills under `.github/skills`, `.claude/skills`, **or `.agents/skills`.** NetScript therefore does
not need to mirror its canonical `.agents/skills` tree for Copilot. This matches the repository's
recent single-source skill decision.

Hooks under `.github/hooks/*.json` run in Copilot CLI and cloud agent sessions. In the cloud agent,
only repository hooks are present by default; the job is non-interactive and `GITHUB_TOKEN` is not
set. Policy hooks are not supported in the cloud agent, so repository command hooks can produce
receipts and fail commands but cannot be treated as a complete policy-enforcement boundary.

MCP can be supplied through repository settings or a custom agent. The first implementation should
not broaden secrets or network access merely to prove transport viability.

### 6. Comparison with the existing OpenHands lane

| Dimension       | OpenHands today                                                | Copilot opportunity / gap                                                                       |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Dispatch/status | Repository wrappers, Actions run IDs, phase labels             | Agent Tasks API supplies a cleaner task/state object                                            |
| Model/effort    | Requested model recorded; effort cannot be attested by adapter | Local CLI exposes model and supported effort; cloud task exposes model but not reasoning effort |
| Receipts        | Committed metadata, summary, logs, and formal verdict line     | Local CLI JSONL can be normalized; cloud API provides status metadata but not a harness verdict |
| Evaluation      | Existing PLAN/IMPL evaluator protocol and parser               | Copilot must not self-certify; evaluator-family independence still applies                      |
| CI              | Normal workflow integration                                    | Cloud PR workflows require approval by default or a deliberate repository policy change         |
| Cancellation    | Actions API/concurrency cancellation                           | Cloud public API does not currently document stop; UI stop only                                 |
| Cost guard      | Provider expense preflight                                     | Copilot has a native per-session CLI credit cap but no authoritative personal balance API       |
| Environment     | Harness-controlled Actions job                                 | Cloud agent sandbox is managed, firewalled, single-repo, and capped at 59 minutes               |

### 7. Recommendation

Add Copilot in two bounded stages, without immediately deleting OpenHands:

1. **Local Copilot CLI transport first.** It has the best deterministic harness seams: explicit
   model/effort, JSONL, tool permissions, continuation bound, session ID, and AI-credit cap. Map it
   into the typed matrix as a transport, never as a model family.
2. **Cloud Agent Tasks as a canary implementation lane.** Add typed dispatch/status/watch support
   and run a small, non-critical task. Keep OpenHands as the established cloud evaluator/peer until
   the canary proves CI propagation, receipts, hygiene, and cost accounting.

Promotion to primary cloud implementation lane is appropriate only after all of these are proven:

- five consecutive exact-head tasks dispatch and reach a documented terminal state;
- selected model, task/session ID, base/head ref, PR artifact, elapsed time, and AI-credit estimate
  are captured without UI scraping;
- no unexpected lockfile or workflow drift;
- `.agents/skills` and `AGENTS.md` instructions are followed;
- the CI approval policy has an explicit owner-approved stance;
- a separate-family IMPL-EVAL can evaluate the resulting exact head;
- the lane stops cleanly at the 59-minute limit and reports `waiting_for_user`, `timed_out`, and
  rate-limit failures without looping.

This evidence can justify making Copilot primary and OpenHands fallback later. The present research
does not justify an immediate replacement because cancellation and CI approval still have human or
repository-policy boundaries, and no live canary receipt exists yet.

## Candidate implementation boundary for planning

The plan generator must verify exact paths rather than assuming all are needed:

- typed model transport/provider capability catalog;
- subscription allowance and expense policy for Copilot Pro+;
- local CLI launcher/JSONL normalizer/status receipt;
- cloud Agent Tasks dispatcher/status/watcher;
- GitHub token capability preflight without printing credentials;
- repository Copilot instructions/custom agent that reuse `AGENTS.md` and `.agents/skills`;
- focused tests for state parsing, model/effort/cap arguments, expense fail-closed behavior,
  instruction discovery, CI-approval classification, and secret redaction;
- documentation and one bounded, explicitly authorized canary protocol.

No workflow-policy toggle, billable cloud dispatch, installation, or OpenHands removal is authorized
by the research phase itself.

## jsr-audit surface scan

N/A: this is repository-internal agentic tooling and GitHub integration, not a published
package/plugin surface. Revisit only if the ratified plan touches an exported package.

## Open decisions for PLAN-EVAL

1. Whether the first PR should implement both local CLI and cloud Agent Tasks, or land the local
   transport and cloud typed client behind a no-dispatch canary flag.
2. Whether CI approval remains an explicit human gate for the first canary (recommended) or whether
   repository settings may be relaxed. Relaxing it is a security decision and must not be inferred.
3. The initial per-task AI-credit caps by workload row. They must be conservative and positive;
   current product docs advise that useful limits are generally above 30 credits.
4. Whether OpenCode's Copilot provider is in the first slice or deferred after native CLI receipts.
   Native CLI first is recommended because it exposes stronger Copilot-specific controls.
