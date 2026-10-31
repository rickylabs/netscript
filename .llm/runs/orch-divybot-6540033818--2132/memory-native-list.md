# Native KV listing translation

A read-only Deno 2.9.7 probe confirms native kv.list({prefix, start}) INCLUDES start and
{prefix, start, end} throws TypeError. NetScript documents exclusive start/end. Filter native
start equality before counting limit and use at most one bound alongside prefix. Native prefix
lists omit the prefix key itself. Reverse changes order, not lower/upper bound meaning.
