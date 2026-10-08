# Supervisor

Model: gpt-6.1-sol high. Session: lane C2 implementation. Branch: `fix/db-collection-runtime-family`. Baseline: `2f82548cf95a5841557b789d0713e04225e1c9da` (current main). Checkout: repository root. Run: `fix-db-collection-runtime-family--c2`.

Routes: OpenAI implementation; independent Zhipu GLM evaluator via owner-selected OpenCode Go, `glm-5.3-flash`, max. Fallback: owner-selected Gemini via agy only if primary launch fails.

Owner override: HARNESS.md requires “opencode run -m opencode-go/glm-5.3-flash --variant max --auto”; use that explicit route rather than the default matrix. Public operational identity excludes machine and absolute directory details by BRIEF-C2.md.

## Owner-requested review repair
Supervisor and generator: gpt-6.1-sol high (OpenAI). Branch: fix/db-collection-runtime-family. Baseline: a60a839668efd4b6b9cb7d4d47f5ebf4aef4e94b. Evaluator owner override: opencode-go/glm-5.3-flash max; Google gemini-3.8-flash-high fallback, separate session/vendor. Identity details omitted per owner brief.
