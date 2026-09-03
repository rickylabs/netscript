
const base = Deno.env.get('NETSCRIPT_CALLBACK_URL')!;
const boot = Deno.env.get('NETSCRIPT_BOOT_TOKEN')!;
const noAuth = await fetch(base + '/v1/credentials');
const cred = await (await fetch(base + '/v1/credentials', { headers: { authorization: 'Bearer ' + boot } })).json();
const walls: number[] = [];
for (let i = 0; i < 50; i++) {
  const t0 = performance.now();
  const r = await fetch(base + '/v1/progress', { method: 'POST', headers: { authorization: 'Bearer ' + cred.taskToken }, body: JSON.stringify({ percent: i }) });
  await r.body?.cancel();
  walls.push(performance.now() - t0);
}
walls.sort((a, b) => a - b);
console.log(JSON.stringify({ unauthorizedStatus: noAuth.status, gotToken: cred.taskToken === 'tok_attempt_k3', p50: walls[24], p95: walls[47] }));
await noAuth.body?.cancel();
