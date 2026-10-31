# Reference-server shutdown under Deno

Repeated restart tests exposed an intermittent upstream `DurableStreamTestServer.stop()` hang after all receipts, stops and reads had completed. Private step logging localized it to Node HTTP server close waiting on idle keep-alive sockets, not the producer lifecycle. Test requests should set `Connection: close`, including transport create/append and direct reads/HEAD. This still uses real network/protocol server behavior and does not alter production transport. Do not work around it by ignoring test sanitizers or abandoning server shutdown.
