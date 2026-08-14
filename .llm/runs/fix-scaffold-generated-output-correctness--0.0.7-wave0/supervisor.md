# Supervisor identity — scaffold-generated-output-correctness

| Field                      | Value                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Profile                    | milestone leaf / normal harness run                                                 |
| Leaf                       | `scaffold-generated-output-correctness`                                             |
| Issues                     | #1262, #1263, #1588                                                                 |
| Worktree                   | `/home/codex/repos/netscript-007-leaf-scaffold-generated-output-correctness`        |
| Branch                     | `fix/scaffold-generated-output-correctness` (no upstream)                           |
| Base                       | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                          |
| Draft PR                   | #1654, direct to `main`                                                             |
| Topic orchestrator         | `topic-fixes-0.0.7`                                                                 |
| Merge/release authority    | `codex-root-0.0.7` only                                                             |
| Implementation route       | requested OpenAI/Codex `gpt-5.6-sol` high                                           |
| Thread id / observed route | `019ffcca-8be0-74c2-bb0e-c82cf5ce3c85`; OpenAI `gpt-5.6-sol` high (matched)         |
| PLAN-EVAL                  | cycle 1 `FAIL_PLAN`; repaired plan awaits updated immutable brief and explicit coordinator grant for cycle 2 |
| IMPL-EVAL                  | mandatory fresh opposite-family session                                             |

The three issues remain one PR and consume one shared `scaffold.runtime` verdict. The implementation
session updates this file with observed route identity and may not self-certify.

## Authority and stop conditions

- `codex-root-0.0.7` alone may change milestone scope, merge, or publish.
- `topic-fixes-0.0.7` owns substantive Tier-A review and the singleton expensive-gate lease request
  path.
- Coordinator comment `5286194892` authorizes only the exact generator/scaffolder seams recorded in
  `plan.md` and `drift.md`; contract-package work remains forbidden.
- Source implementation remains stopped. PLAN-EVAL cycle 2 requires an updated immutable source
  brief and a separate explicit coordinator grant; this implementation session may not launch,
  request, simulate, or self-evaluate it.
- `scaffold.runtime`, Aspire, and Docker remain forbidden until an explicit global lease grant.
