# Supervisor

Model: gpt-6.1-sol high. Session: lane C2 implementation. Branch: `fix/pure-route-url-utilities`. Baseline: `4ef93c2532e4aeabdbd26874cd36cd7d37e593fd` (current main). Checkout: repository root. Run: `fix-pure-route-url-utilities--c2`.

Routes: OpenAI implementation; independent Zhipu GLM evaluator via owner-selected OpenCode Go, `glm-5.3-flash`, max. Fallback: owner-selected Gemini via agy only if primary launch fails.

Owner override: HARNESS.md requires “opencode run -m opencode-go/glm-5.3-flash --variant max --auto”; use that explicit route rather than the default matrix. Public operational identity excludes machine and absolute directory details by BRIEF-C2.md.
