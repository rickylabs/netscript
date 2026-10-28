const directory = '.llm/tmp/u3-type-closure-application-20261028';
const hash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
const before = JSON.parse(await Deno.readTextFile(`${directory}/before.json`));
const diagnostic = JSON.parse(await Deno.readTextFile('.llm/tmp/u3-doc-closure-exact-20261028/diagnostic-proof.json'));
const candidate = JSON.parse(await Deno.readTextFile('.llm/tmp/u3-doc-closure-exact-20261028/clone-manifest.json'));
const gates = [];
for await (const entry of Deno.readDir(directory)) {
 if (!/-\d+\.json$/.test(entry.name)) continue;
 const path = `${directory}/${entry.name}`;
 const bytes = await Deno.readFile(path);
 const receipt = JSON.parse(new TextDecoder().decode(bytes));
 if (!receipt.prefix) continue;
 gates.push({ ...receipt, receipt: path, sha256: await hash(bytes), stdoutSha256: await hash(await Deno.readFile(`${receipt.prefix}.stdout`)), stderrSha256: await hash(await Deno.readFile(`${receipt.prefix}.stderr`)) });
}
gates.sort((a,b)=>a.started.localeCompare(b.started));
const gate = (name: string) => {const value=gates.filter(g=>g.selected===name).at(-1);if(!value)throw new Error(`Missing gate: ${name}`);return value;};
const findingIdentity = (text: string) => [...text.matchAll(/public type '([^']+)' references private type '([^']+)'/g)].map(m=>({publicType:m[1],privateType:m[2]})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
const fresh = gate('doc-fresh');const workers=gate('doc-workers');
const freshText=await Deno.readTextFile(`${fresh.prefix}.stderr`);const workerText=await Deno.readTextFile(`${workers.prefix}.stderr`);
const identities=findingIdentity(freshText);
if (fresh.code!==1||identities.length!==10||/Warning|Failed resolving|not in import map/i.test(freshText)||JSON.stringify(identities)!==JSON.stringify(diagnostic.lintMatrix.find(m=>m.owner==='fresh').runs[0].findings))throw new Error('Actual owning Fresh closure not qualified.');
if(workers.code!==0||findingIdentity(workerText).length||/Warning|Failed resolving|not in import map/i.test(workerText))throw new Error('Actual owning workers closure not qualified.');
const symbols=[];
for(const [name,owner,path]of [
 ['json-fresh','fresh','packages/fresh/src/runtime/streams/mod.ts'],
 ['json-workers','workers','plugins/workers/streams/mod.ts'],
 ['json-fresh-source','fresh-source','packages/fresh/src/runtime/streams/create-stream-db.ts'],
 ['json-workers-source','workers-source','plugins/workers/streams/factory.ts'],
]){
 const receipt=gate(name);const stderr=await Deno.readFile(`${receipt.prefix}.stderr`);
 if(receipt.code!==0||stderr.length||receipt.deadlineAborted)throw new Error('Native doc JSON not warning-free.');
 const data=JSON.parse(await Deno.readTextFile(`${receipt.prefix}.stdout`));
 if(data.version!==2||!data.nodes||typeof data.nodes!=='object'||Array.isArray(data.nodes))throw new Error('Unexpected JSON schema.');
 const roots=Object.entries(data.nodes).filter(([url])=>url.endsWith(`/${path}`));
 if(roots.length!==1)throw new Error('Native public owner missing/ambiguous.');
 const [url,node]=roots[0];
 if(!node||typeof node!=='object'||!('symbols'in node)||!Array.isArray(node.symbols)||!node.symbols.length)throw new Error('Empty public symbols.');
 const expected=diagnostic.symbols.find(item=>item.phase==='candidate'&&item.owner===owner);
 if(!expected||node.symbols.length!==expected.symbolCount)throw new Error('Public surface footprint differs.');
 const native=[];
 for(const name of ['HeadersRecord','MaybePromise']){
  const symbol=node.symbols.find(s=>s.name===name);const declarations=symbol?.declarations;
  const reference=expected.native.find(item=>item.name===name);
  if(!Array.isArray(declarations)||declarations.length!==1||declarations[0].kind!=='typeAlias'||declarations[0].declarationKind!=='export'||!declarations[0].location.filename.endsWith('/@durable-streams/client/0.2.7/dist/index.d.ts')||JSON.stringify(declarations[0].def?.tsType)!==JSON.stringify(reference.shape))throw new Error('Native resolved identity/shape differs.');
  native.push({name,location:declarations[0].location,kind:declarations[0].kind,shape:declarations[0].def.tsType});
 }
 symbols.push({owner,url,symbolCount:node.symbols.length,native,receipt:receipt.receipt});
}
const sources=[];
await Deno.mkdir(`${directory}/source-final`,{recursive:true});
for(const [index,input]of before.before.entries()){
 const bytes=await Deno.readFile(input.path);const sha256=await hash(bytes);const delta=candidate.deltas.find(d=>d.path===input.path);
 if(delta&&sha256!==delta.afterSha256)throw new Error('Source differs from exact accepted candidate.');
 if(index>4&&sha256!==input.sha256)throw new Error('Config/lock drift.');
 if(index===4){const prefix=bytes.subarray(0,(await Deno.readFile(input.snapshot)).length);if(await hash(prefix)!==input.sha256)throw new Error('Canonical debt changed outside appended entry.');}
 if(index<=4){const snapshot=`${directory}/source-final/${index}-${input.path.split('/').at(-1)}`;await Deno.writeFile(snapshot,bytes,{createNew:true});sources.push({path:input.path,sha256,lines:new TextDecoder().decode(bytes).trimEnd().split('\n').length,snapshot,exactAcceptedSource:!!delta});}
}
const parity=gate('parity-external');const parityStdout=await Deno.readTextFile(`${parity.prefix}.stdout`);const parityStderr=await Deno.readTextFile(`${parity.prefix}.stderr`);
if(parity.code!==0||!parityStdout.includes('Reference page coverage: PASS (36/36;')||!parityStdout.includes('Exports & Symbols drift check: PASS')||parityStderr.trim())throw new Error('Qualified external reference contract not green.');
const externalPath='C:/Users/ericc/source/repos/netscript-windows-qualification-008/.llm/tools/docs/check-exports-drift.ts';
const externalHash=await hash(await Deno.readFile(externalPath));if(externalHash!=='df2c50fbaef0095b8172d33c02dadf0038bc8280b071de927aa225d9958aa269')throw new Error('Qualified checker changed.');
const external={commit:'0d5b982b0a3050b94172770a435581c931c93b22',path:externalPath,sha256:externalHash,receipt:parity.receipt,policy:'Supporting read-only external-tool result against U3 CWD/config; no source import/cherry-pick and no original parent task PASS. Fresh/workers mapping contract is entrypoints-only, not exhaustive per-name reference prose.',coverage:'36/36; mapped35/excluded1; full declared contract PASS; no genuine missing-symbol finding'};
const compiler=JSON.parse(await Deno.readTextFile(`${directory}/compiler-proof.json`));
if(compiler.results.some(result=>result.deadlineAborted)||!compiler.ownedFixtureRemoved||compiler.negativeSeamErrors!==9)throw new Error('Compiler evidence incomplete.');
const leftovers=[];
for await(const entry of Deno.readDir('packages/fresh/tests/type-fixtures'))if(entry.name==='u3-doc-closure')leftovers.push(entry.name);
if(leftovers.length)throw new Error('Owned compiler sources remain.');
const allowed=sources.map(source=>source.path);
const changed=await new Deno.Command('git',{args:['diff','--name-only','HEAD','--'],stdout:'piped',stderr:'piped'}).output();
const names=new TextDecoder().decode(changed.stdout).trim().split(/\r?\n/).filter(Boolean);
if(!changed.success||names.length!==5||names.some(name=>!allowed.includes(name)))throw new Error('Unexpected tracked application owner.');
const diff=await new Deno.Command('git',{args:['diff','--',...allowed],stdout:'piped',stderr:'piped'}).output();if(!diff.success)throw new Error('Cannot capture application delta.');
await Deno.writeFile(`${directory}/final.diff`,diff.stdout,{createNew:true});
const proof={capturedAt:new Date().toISOString(),sourceAcceptance:'Pending root source/gate review; no checkpoint',sources,gates,
 owningDocs:{fresh:10,workers:0,warningFree:true,exactTenBaselineFindingIdentitiesPreserved:true,freshBaselineUnwaived:true,identities},symbols,compiler,externalReferenceContract:external,
 doctrine:'DEBT_ACCEPTED for exact F15/upstream type exposure AND F5 two-name facade growth. Direct scanner exit0 does not certify those as PASS; prior surplus remains unwaived.',
 stillOpen:['Fresh ten baseline doc findings','architecture existing DB identity prerequisite','original docs:accuracy Windows coverage prerequisite','prior C3 links/JSDoc/global format failures','independent IMPL/readiness/release'],
 cleanup:{ownedCompilerFixtureDirectories:leftovers,originalOutputAwaited:true},guardInputs:before.before.slice(5).map(input=>({path:input.path,sha256:input.sha256,unchanged:true})),
 diff:{path:`${directory}/final.diff`,sha256:await hash(diff.stdout)},sourceOwnerFootprint:'12 product/test/guide owners plus canonical registry=13, excluding explicit run/evidence provenance',
};
await Deno.writeTextFile(`${directory}/final-evidence.json`,JSON.stringify(proof,null,2),{createNew:true});
console.log(JSON.stringify({sources,owningDocs:{fresh:10,workers:0,warningFree:true,baselineIdentitiesPreserved:true},publicCounts:symbols.map(s=>({owner:s.owner,count:s.symbolCount})),externalReferenceContract:external,manifest:`${directory}/final-evidence.json`,cleanup:proof.cleanup}));
