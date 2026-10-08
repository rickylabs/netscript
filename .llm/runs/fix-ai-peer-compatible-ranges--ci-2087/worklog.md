# Worklog

Bootstrap: cloned owner repository, gh pr checkout 2087, exact baseline verified. Deno 2.9.5 first
on PATH. Free memory above 6 GiB; monitor owned commands. RTK unavailable on this host; use raw
commands and retain full logs. Owner's named gates take precedence over generic wrappers. Owner
requests normal push; no force push, merge or publication. PLAN-EVAL: N/A — bounded compatibility
repair with explicit existing public consumer fixture, known upstream role delta and owner-defined
acceptance gates.

## Design

Public surface: NetScriptChatSendMessage and existing NetScriptChatConnection.send; no new exports
or ports. Domain: native UIMessage, ModelMessage and activity parts; opaque forwarding containers.
No new finite constants or runtime dispatch. Port/adapter: existing durableStreamConnection seam; no
new resource ownership. Commit slice: derive transport contract, extend native fixtures and
unit/integration assertions, update send JSDoc and this run's evidence. Existing and new consumer
checks plus AI tests prove it. Contributor path: create-chat-connection.ts owns the send boundary;
chat-send-consumer_type.ts defines native consumer inputs; colocated tests prove identity and wire
fidelity. Deferred scope: full suite and scaffold/runtime infrastructure per owner; no visual UI
changes.

## Gates and slice review

| Gate                            | Exit | Evidence                                                                                 |
| ------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| Baseline three-file check       | 1    | Six owner-reported UI role errors                                                        |
| Final three-file consumer check | 0    | No casts; activity fixture and invalid-role negative                                     |
| Fresh check task                | 0    | All maintained entrypoints and streams types                                             |
| Fresh AI tests                  | 0    | 42 passed, zero failed; native identity and HTTP body preserve activity and extra fields |
| AI peer check                   | 0    | core 0.65.0; lockFree true                                                               |
| Frozen install                  | 0    | Existing lock intact                                                                     |
| Fresh lint                      | 0    | 237 files                                                                                |
| Touched formatting              | 0    | All changed source and run Markdown                                                      |
| quality:scan                    | 0    | Zero findings; existing seven allowances unchanged                                       |
| arch:check                      | 0    | Existing warnings retained                                                               |
| Focused AI doc lint             | 1    | Two private references recorded in fresh-ai-native-send-doc-2087                         |

Raw outputs are retained in project runs/2026-10-08-fix-ai-peer-types and exits in ../gates.log.
Fresh JSR audit exits 0 with the existing AI directory-cardinality warning; actual dry-run passes.
Independent evaluation follows. Substantive review: production runtime unchanged; array opacity and
readonly inputs retained; upstream-derived roles fix activity without allowing arbitrary roles;
existing reduced system sends retained; consumer fixture still accepts UIMessage/ModelMessage
without casts. No downgrade, suppression, cast, lifecycle change or lock churn.

Evaluator expense: Go GLM and DeepSeek routes both report weekly rate limit despite task shell
exit 0. Respect structured allowed:false. GLM is unavailable through Claude/Codex/Google/Copilot
catalogs; Ollama has no proven tier/usage snapshot. OpenRouter same logical GLM model is
catalog-attested and a live credential-blind balance snapshot is captured for canonical launcher
preflight.

## Final evaluation and reconcile

Independent GLM IMPL-EVAL: PASS (evaluate.md); fresh-ai-native-send-doc-2087 DEBT_ACCEPTED for
CI-repair scope. Separate session <session id redacted> independently reran the focused check and
all 42 AI tests, both exit 0. Two LOW findings are non-blocking: existing debt formatting
normalized; reduced-role narrative clarified. Source diff unchanged after evaluation (SHA256
a546d76ca95621589a80b8c15b4f34c3de4ae75aa14824c50b9f372b4e667b84). Reconcile: PR #2087 remains OPEN
on the authorized branch at original baseline; current main ancestor 7726065 confirmed. No issue
close, label change, PR comment, merge, publication or unrelated source work. Final sign-off commit
and normal push follow owner sequence; ../REPORT.md records the resulting immutable head.
