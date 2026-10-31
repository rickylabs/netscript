const root = Deno.cwd().replaceAll('\\', '/');
const directory = `${root}/.llm/tmp/u3-type-closure-application-20261028`;
const hash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files = ['packages/fresh/src/runtime/streams/create-stream-db.ts','packages/fresh/src/runtime/streams/mod.ts','plugins/workers/streams/factory.ts','plugins/workers/streams/mod.ts','.llm/harness/debt/arch-debt.md','deno.json','deno.lock','packages/fresh/deno.json','plugins/workers/deno.json'];
const before = [];
await Deno.mkdir(`${directory}/before`, { recursive: true });
for (const [index,path] of files.entries()) {
 const bytes = await Deno.readFile(path);
 const snapshot = `${directory}/before/${index}-${path.split('/').at(-1)}`;
 await Deno.writeFile(snapshot,bytes,{createNew:true});
 before.push({path,sha256:await hash(bytes),snapshot});
}
await Deno.writeTextFile(`${directory}/before.json`,JSON.stringify({sourceHead:'2322e6c66033e4db99ac3262110bcf5c3d3661e8',before},null,2),{createNew:true});
const review = `${root}/.llm/tmp/u3-corrective-plan-review-20261028/final-verdict.utf8.md`;
const bytes = await Deno.readFile(review);
if(await hash(bytes)!=='c12eef080d7b48478c85a6f0b4b42dc68f3b8c28db691d5bb292161a4b3ceaa4')throw new Error('Actual independent verdict changed.');
await Deno.writeFile(`${root}/.llm/runs/fix-browser-stream-headers--u3/corrective-type-closure-plan-eval.md`,bytes,{createNew:true});
console.log(JSON.stringify({snapshots:before.length,verdictVerified:true}));
