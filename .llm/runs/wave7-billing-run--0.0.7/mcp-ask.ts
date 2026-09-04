// Minimal stdio MCP client: list tools, or call one. Usage:
//   deno run -A mcp-ask.ts <workspace> list
//   deno run -A mcp-ask.ts <workspace> call <tool> '<json-args>'
const [cwd, mode, tool, argsJson] = Deno.args;
const p = new Deno.Command('netscript', { args: ['agent','mcp','--project-root',cwd], cwd, stdin:'piped', stdout:'piped', stderr:'null' }).spawn();
const w = p.stdin.getWriter(); const enc = new TextEncoder();
const send = async (o:unknown)=>{ await w.write(enc.encode(JSON.stringify(o)+"\n")); };
await send({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"po-audit",version:"1"}}});
await send({jsonrpc:"2.0",method:"notifications/initialized"});
if (mode==='list') await send({jsonrpc:"2.0",id:2,method:"tools/list",params:{}});
else await send({jsonrpc:"2.0",id:2,method:"tools/call",params:{name:tool,arguments:JSON.parse(argsJson??'{}')}});
const out:string[]=[]; const dec=new TextDecoder();
const t=setTimeout(()=>{try{p.kill()}catch{}},60000);
for await (const c of p.stdout) { const s=dec.decode(c); out.push(s); if (s.includes('"id":2')) break; }
clearTimeout(t); try{p.kill()}catch{}
const line = out.join('').split('\n').find(l=>l.includes('"id":2'));
if (!line) { console.log("NO RESPONSE"); Deno.exit(1); }
const r = JSON.parse(line);
if (mode==='list') console.log(r.result.tools.map((t:any)=>`${t.name} :: ${(t.description??'').slice(0,110)}`).join('\n'));
else console.log(JSON.stringify(r.result ?? r.error ?? r).slice(0,4000));
