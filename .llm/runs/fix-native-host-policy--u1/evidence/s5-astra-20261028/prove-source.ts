const root='C:/Users/ericc/source/repos/netscript-native-host-policy-008';
const out=root+'/.llm/tmp/native-host-policy-u1-s5-astra-20261028';
const sha=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const read=(path:string)=>Deno.readTextFile(root+'/'+path);
const baseline=JSON.parse(await Deno.readTextFile(out+'/baseline-hashes.json'));
const protectedRows=[];
for(const row of baseline){if(row.path==='plugins/streams/deno.json')continue;const actual=await sha(await Deno.readFile(root+'/'+row.path));protectedRows.push({...row,actual,matches:actual===row.sha256});}
const sourcePaths=['plugins/streams/services/src/service.ts','plugins/streams/services/mod.ts','plugins/streams/deno.json'];
const owners=[];for(const path of sourcePaths){const bytes=await Deno.readFile(root+'/'+path);owners.push({path,sha256:await sha(bytes),bytes:bytes.length,lines:new TextDecoder().decode(bytes).trimEnd().split(/\r?\n/).length});}
const main=await read('plugins/streams/services/src/main.ts'),service=await read(sourcePaths[0]),facade=await read(sourcePaths[1]);
const arrayValues=(source:string,pattern:RegExp)=>{const match=source.match(pattern);if(!match)throw new Error('Expected default array absent');return Array.from(match[1].matchAll(/'([^']*)'/g),v=>v[1]);};
const arrays=[];for(const[property,name,count]of [['allowMethods','DEFAULT_ALLOW_METHODS',6],['allowHeaders','DEFAULT_ALLOW_HEADERS',9],['exposeHeaders','DEFAULT_EXPOSE_HEADERS',12]]as const){const old=arrayValues(main,new RegExp(property+': \\[([\\s\\S]*?)\\]'));const current=arrayValues(service,new RegExp('const '+name+': readonly string\\[\\] = Object.freeze\\(\\[([\\s\\S]*?)\\]\\)'));arrays.push({property,count:current.length,expectedCount:count,exactLegacyValues:JSON.stringify(old)===JSON.stringify(current),values:current});}
const originalManifest=await Deno.readTextFile(out+'/streams-deno.json.before');
const expectedManifest=originalManifest.replace('"./services": "./services/src/main.ts"','"./services": "./services/src/main.ts",\n    "./service": "./services/mod.ts"').replace('verify-plugin.ts services/src/main.ts services/src/proxy-headers.ts','verify-plugin.ts services/src/main.ts services/mod.ts services/src/service.ts services/src/proxy-headers.ts');
const manifest=await read(sourcePaths[2]);const manifestExact=manifest===expectedManifest;
const manifestDelta=manifest.trimEnd().split(/\r?\n/).length-originalManifest.trimEnd().split(/\r?\n/).length;
const fixtureBefore=await Deno.readFile(out+'/s4-test.ts.before'),fixtureNow=await Deno.readFile(root+'/plugins/streams/services/src/service_test.ts');
const fixtureExact=await sha(fixtureBefore)===await sha(fixtureNow);
const tests=JSON.parse(await Deno.readTextFile(out+'/gates/tests.report.json'));
const types=JSON.parse(await Deno.readTextFile(out+'/gates/types.report.json'));
const lint=JSON.parse(await Deno.readTextFile(out+'/gates/lint.report.json'));
const fmt=JSON.parse(await Deno.readTextFile(out+'/gates/fmt.report.json'));
const gateExecution=JSON.parse(await Deno.readTextFile(out+'/gates/execution.json'));
const consumers=JSON.parse(await Deno.readTextFile(out+'/consumers/execution.json'));
const inventory=JSON.parse(await Deno.readTextFile(out+'/consumers/public-inventory.json'));
const cleanup=[];for(const dir of ['gates','consumers']){const receipt=JSON.parse(await Deno.readTextFile(out+'/'+dir+'/cleanup.json'));let absent=false;try{await Deno.stat(receipt.profile);}catch(error){if(error instanceof Deno.errors.NotFound)absent=true;else throw error;}cleanup.push({dir,...receipt,profileAbsent:absent});}
const residue=Array.from(Deno.readDirSync(root+'/plugins/streams/services/src'),v=>v.name).filter(v=>v.startsWith('__s5_consumer_'));
const ok=protectedRows.every(v=>v.matches)&&owners[0].lines<=200&&owners[1].lines<=90&&manifestExact&&manifestDelta===1&&fixtureExact&&arrays.every(v=>v.count===v.expectedCount&&v.exactLegacyValues)&&tests.summary.passed===4&&tests.summary.failed===0&&types.selection.filesSelected===4&&types.summary.totalOccurrences===0&&fmt.coverage.filesProcessed===4&&fmt.coverage.droppedFiles.length===0&&gateExecution.executions.every((v:any)=>v.code===0&&!v.timedOut)&&consumers.executions.length===6&&consumers.executions.every((v:any)=>v.ok)&&inventory.count===21&&cleanup.every(v=>v.profileAbsent&&v.residue.length===0)&&residue.length===0;
await Deno.writeTextFile(out+'/source-proof.json',JSON.stringify({ok,owners,protectedCount:protectedRows.length,protectedRows,manifest:{exactApprovedEdits:manifestExact,touchedExistingLines:2,lineDelta:manifestDelta},frozenFixture:{exactBytes:fixtureExact,lines:382,sha256:await sha(fixtureNow)},defaults:arrays,authAssertionFirst:/startStreamsService\([^]*?\{\s*assertServiceAuthPolicy\(options\?\.auth\);/.test(service),authIdentity:service.includes('auth: options.auth,'),serveIdentity:service.includes('}).serve(options.serve);'),noWildcardDefault:!service.includes("origin: '*'"),directNativeTypeClosure:facade.includes("} from '@netscript/service/auth';")&&facade.includes("} from '@netscript/service';"),tests:tests.summary,types,lint,fmt,inventory,cleanup,temporaryConsumerResidue:residue,runtimeStartupAndS6Qualification:false},null,2)+'\n',{createNew:true});
const patches=[];
for(const[path,index]of sourcePaths.map((v,i)=>[v,i]as const)){const args=index<2?['diff','--no-index','--','/dev/null',path]:['diff','--',path];const result=await new Deno.Command('C:/Program Files/Git/cmd/git.exe',{args,cwd:root,stdout:'piped',stderr:'piped'}).output();if(result.code!==0&&result.code!==1)throw new Error('Source diff failed');patches.push(new TextDecoder().decode(result.stdout));}
await Deno.writeTextFile(out+'/source.diff',patches.join('\n'),{createNew:true});
console.log(JSON.stringify({ok,owners,protectedCount:protectedRows.length,manifestExact,manifestDelta,frozenFixture:fixtureExact,defaultCounts:arrays.map(v=>v.count),testSummary:tests.summary,consumers:consumers.executions.length,cleanup:cleanup.map(v=>({dir:v.dir,profileAbsent:v.profileAbsent,residue:v.residue})),temporaryConsumerResidue:residue}));
if(!ok)Deno.exitCode=1;
