# S8b supervisor

- Assignment: #2436, Design system documentation section; feature tier, implementation role.
- Implementer: dispatched Codex session, OpenAI family; branch `orch/divybot-6463057309`.
- Baseline: `2560bf564` on current main, fast-forwarded after unshallowing the initial checkout.
- Evaluator/slice reviewer: separate native Claude session, Anthropic family, owner-requested `claude-opus-5-5`, high effort, read-only, stdin closed. No self-certification.
- Write surface: `docs/site/design-system/**`, `docs/site/_components/design/**`, `docs/site/assets/design-system/**`, `docs/site/reference/fresh-ui/**`, `docs/site/_plugins/design-system*`, `.llm/tools/docs/design-system*`, this run directory. Local generated output and final-report handoff are excluded from Git.
- Shared layouts/components/styles/data/config remain owned by S8. Generator integration uses a Lume generator page under the owned section.
- Stop at ready for review. Never merge, tag, release, change labels, force-push, delete locks/caches, or commit the assignment.
