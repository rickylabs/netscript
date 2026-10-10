/** Persistent upstream reference server for the killed-process regression. @module */
import { DurableStreamTestServer } from 'npm:@durable-streams/server@0.3.9';

if (import.meta.main) {
  const options = JSON.parse(Deno.args[0]) as { dataDir: string; port: number };
  const server = new DurableStreamTestServer(options);
  console.log(JSON.stringify({ ready: await server.start() }));
}
