# Resume — published parity verification

Issue 1912 box 8 is proven on Linux and Windows with published `jsr:@netscript/cli@0.0.8`, Deno 2.9.7. Exact commands, exit codes, report excerpts, artifact hashes and run links are in evidence.md; full sanitized reports are linux.json and windows.json.

Successful Windows run: https://github.com/rickylabs/netscript/actions/runs/41208565476 at bcefeaa33ce3d8971ff3dad3dbfb6e7686e21439. First attempt 41207980660 failed in redundant setup before checks; reviewed repair removed only that step. Shared script checks 0/current twice and 1/drift/bytes twice, with exact target and no consumer-file/lock mutation. Windows and Linux result objects are identical.

PR: https://github.com/rickylabs/netscript/pull/2537. Product code unchanged. Scoped static wrappers pass, 16 policy tests pass, YAML parses, review threads PASS. Broader scaffold runtime is UNPROVEN: full e2e:cli attempted and failed at Aspire/Docker preflight before scaffold startup. Raw diagnostics and reviewer identity stay outside Git. Foreign/unknown-owner resources were observed read-only and left untouched.

Independent same-session Claude Opus 5.5 high slice reviews passed. Close protocol: final read-only independent evaluation attests the committed evidence head in a PR IMPL-EVAL phase comment; evaluate.md links that authoritative verdict. That comment is authoritative for the final SHA; do not infer readiness if it is missing. Mark the PR ready only after MERGE verdict. Queue canonical READY issue report through atomic excluded final-report file handoff; publication acceptance is not directly observable here. STOP at READY: no merge, tags, releases, issue closure, labels or milestones.
