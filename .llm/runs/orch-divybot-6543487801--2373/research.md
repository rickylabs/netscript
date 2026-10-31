# Research

Current main includes #2525. Issue and PR search found no covering change. NetScript MCP find_guidance followed by search_docs returned no directly relevant testing recipe. Existing contract uses @std/async deadline and optional WatchStream.ready; existing watch tests use 5-second hang guards. Memory and Redis share this contract; Deno KV abort cases already use 5-second deadlines. The Redis queue unit test has an additional 100ms abort deadline.
RTK is unavailable; use focused commands and structured wrappers. Prior run memory documents read-only Claude CLI and frozen KV wrapper test invocation.
