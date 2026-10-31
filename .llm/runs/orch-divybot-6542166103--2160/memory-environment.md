# Environment / delivery

RTK absent; native gh, Deno and Claude available. Use repo claude-print.ts runner
with stdin null, stream JSON and same-session --resume. Keep its raw output and
session identifiers in project runs, outside public artifacts. Structured test
wrapper accepts -- --allow-all --unstable-kv --frozen followed by test paths.
Final report is an atomic excluded .divybot-final-report.md handoff.
