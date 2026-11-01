# Deferred event payloads

The ordering fix returns the existing WatchEvent shape from writeEntry/removeEntry,
preserving each mutation's previousValue and one shared commit versionstamp.
Accumulate locally in atomic, then dispatch in order. This keeps repeated-key
events intact while every handler-triggered read sees final storage. Missing-key
delete returns undefined. Standalone set/delete and TTL sweep immediately dispatch
the returned event. No adapter-wide buffer or notification-mode flag is needed.
