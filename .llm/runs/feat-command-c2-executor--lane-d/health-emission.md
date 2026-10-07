# Health declaration emission prerequisite

The annotation-only candidate fixes the inherited native packed health declaration failure while
preserving the existing source API and executable behavior. It is frozen in a task-private regular
clone based on a1eb16cd33e8e1f52aaf9bceb88b1a97400e2fba. The active clone is untouched.

Only packages/service/src/primitives/health.ts changes product source. Its inline annotation
documents four mutable function properties; all existing factory arguments, optional options and
HealthCheck returns remain assignable, including property reassignment. No named public type,
root export, dependency, lock, test, tool or runtime initializer changes. The original initializer
through end of file is byte-identical. Exact native generated JavaScript has the same 5,227-byte
executable body; its trailing native source map differs and is retained unchanged.

| Qualification | Baseline | Candidate |
| --- | --- | --- |
| Exact direct CI runtime | Deno 2.9.5 | Deno 2.9.5 |
| All eleven database and five service source entrypoints, unfrozen/frozen | 0 / 0 | 0 / 0 |
| Exact native packed all-export declarations, unfrozen/frozen | 1 / 1; four TS2300 + one TS7008 | 0 / 0 |
| Factory assignment/reassignment, default/explicit options and return compiler qualification | Source 0 / 0 | Source and declarations 0 / 0 |
| Native materialized publish dry-run and native pack, both packages | 0 | 0 |
| Scoped service check/lint/format, 65 files | — | 0 |
| Existing health and README regressions | — | 10 pass, 0 fail |
| Full-map service docs, each entrypoint and combined | — | 0 |
| Durable native quality, architecture and exports drift | — | 0 |
| Service JSR audit and whitespace check | — | 0 |

Consumers have an empty workspace. Database/service imports resolve to actual native publication
files; remaining first-party imports use declared public registry dependencies. Packed internal
JavaScript specifiers resolve to corresponding exact native declaration files. Native archives,
inventories, source and declarations remain unchanged. This is local publication qualification,
not a remote publication or complete npm consumer certification.

Read [gate receipts](health-emission-gates.json), [consumer control](health-emission-consumers.json)
and [source/semantic hashes](health-emission-source.json). Exact raw receipts, version receipt,
archives and output are retained privately; public evidence contains bounded native verdicts and
hashes. No new named tests were added: the baseline production source reproduces the failure,
and the annotation alone makes the identical meaningful compiler qualification pass.

The supervisor must substantively review and apply this candidate after the separate dependency
prerequisite, then commit, push and comment before explicitly releasing S5. This lane made no
commit, push, GitHub write or evaluator edit. No S5 or generated corpus refresh was started. Final
S6 consumers and generated corpus gates remain required on the final C2 tree.

Frozen candidate footprint: nine changed files, one product source and eight run artifacts.
