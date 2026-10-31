const payload = JSON.parse(Deno.env.get('TASK_PAYLOAD') ?? '{}');
await new Promise((resolve) => setTimeout(resolve, payload.duration ?? 0));
console.log(JSON.stringify({ finished: true }));
