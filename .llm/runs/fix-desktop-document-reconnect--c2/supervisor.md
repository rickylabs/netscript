# Supervisor

Model: gpt-6.1-sol high. Session: lane C2 implementation. Branch: `fix/desktop-document-reconnect`. Baseline: `8aad14940c52cd3a4db7efa57d56d50ae131df6c` (current main). Checkout: repository root. Run: `fix-desktop-document-reconnect--c2`.

Routes: OpenAI implementation; independent Zhipu GLM evaluator via owner-selected OpenCode Go, `glm-5.3-flash`, max. Fallback: owner-selected Gemini via agy when the primary evaluator route cannot complete, as explicitly authorized by HARNESS.md. Primary GLM provider stalled empty requests; same-session retries also stalled. Final independent IMPL-EVAL uses fresh Google Gemini 3.8 Flash High session.

Owner override: HARNESS.md requires “opencode run -m opencode-go/glm-5.3-flash --variant max --auto”; use that explicit route rather than the default matrix. Public operational identity excludes machine and absolute directory details by BRIEF-C2.md.

## Review repair
Supervisor and generator: gpt-6.1-sol high (OpenAI). Branch: fix/desktop-document-reconnect. Baseline: 20fa513a19a18873bd00785dba8443f14e84641b. Owner-authorized evaluator: opencode-go/glm-5.3-flash max; Google gemini-3.8-flash-high fallback. Separate evaluator session and vendor family required. Identity details omitted under owner brief.
