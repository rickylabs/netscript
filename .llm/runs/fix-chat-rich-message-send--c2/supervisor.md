# Supervisor

Model: gpt-6.1-sol high. Session: lane C2 implementation. Branch: `fix/chat-rich-message-send`. Baseline: `8aad14940c52cd3a4db7efa57d56d50ae131df6c` (current main). Checkout: repository root. Run: `fix-chat-rich-message-send--c2`.

Routes: OpenAI implementation; independent Zhipu GLM evaluator via owner-selected OpenCode Go, `glm-5.3-flash`, max. Fallback: owner-selected Gemini via agy when primary provider is blocked, as explicitly authorized by owner HARNESS.md.

Owner override: HARNESS.md requires “opencode run -m opencode-go/glm-5.3-flash --variant max --auto”; use that explicit route rather than the default matrix. Public operational identity excludes machine and absolute directory details by BRIEF-C2.md.

Selected PLAN-EVAL PASS via independent Google Gemini fresh session48bf1c5f-a82d-4869-ac20-776b4bec62b6 with same-session report-only factual reconciliation. Immutable evaluated main equals fresh fetched branch baseline before source. Primary GLM provider stalled without verdict, evidence retained privately. Mandatory final independent fresh Google Gemini IMPL-EVAL planned.
