# Keep automatic file-change keys bounded

Deno KV keys are limited to 2048 bytes. A raw path-bearing tuple can exceed this on valid paths and silently route the event to the watcher error hook. Hash the JSON tuple [triggerId,path,kind,mtime,size] with Web crypto.subtle SHA-256 before adding the file-watch namespace. Separate adapter-only and TTL-only reverts: sequential missing-info events alone cannot prove unique keys once zero completed TTL is applied; concurrent distinct missing-info events isolate that requirement.
