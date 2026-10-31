const root='C:/Users/ericc/source/repos/netscript-native-host-policy-008';
const base=root+'/.llm/tmp/native-host-policy-u1-s5-astra-20261028';
const output=base+'/consumers';await Deno.mkdir(output);
const profile=await Deno.makeTempDir({dir:output,prefix:'owned-profile-'});
const env:Record<string,string>={DENO_DIR:root+'/.llm/tmp/native-host-policy-preflight/cache',PATH:'C:\\Users\\ericc\\source\\repos\\eis-chat-netscript-008-s01\\.netscript\\agent\\toolchains\\deno-2.9.7;C:\\Windows\\System32;C:\\Windows',SystemRoot:Deno.env.get('SystemRoot')??'C:/Windows',NO_COLOR:'1',PATHEXT:'.COM;.EXE;.BAT;.CMD'};
for(const key of ['HOME','USERPROFILE','APPDATA','LOCALAPPDATA','TEMP','TMP','TMPDIR','XDG_CACHE_HOME','XDG_CONFIG_HOME','XDG_DATA_HOME','XDG_STATE_HOME'])env[key]=profile;
const service=['CorsOptions','RunningService','RunningServiceAddress','ServeOptions','ServiceApp','ServiceEnvironment','ServiceTlsOptions'];
const auth=['AuthenticatorPort','AuthnOptions','AuthnRequest','AuthnResult','AuthorizerPort','AuthzDecision','AuthzOptions','AuthzRequest','Principal','ServiceAuthPolicy','ServiceGuardedAuthPolicy','ServicePublicAuthPolicy'];
const expected=['startStreamsService','StreamsServiceOptions',...service,...auth].sort();
const doc=JSON.parse(await Deno.readTextFile(base+'/gates/public-json.stdout.log'));
const module=doc.nodes[Object.keys(doc.nodes)[0]];
const names=module.symbols.map((v:{name:string})=>v.name).sort();
if(JSON.stringify(names)!==JSON.stringify(expected))throw new Error('Production public inventory differs');
const origins=module.symbols.map((symbol:any)=>({name:symbol.name,origins:symbol.declarations.map((v:any)=>v.location.filename),functionExample:symbol.name==='startStreamsService'?symbol.declarations.some((v:any)=>v.jsDoc?.tags?.some((tag:any)=>tag.kind==='example'&&tag.doc?.includes('startStreamsService'))):undefined}));
for(const row of origins)if([...service,...auth].includes(row.name)&&row.origins.some((v:string)=>!v.includes('/packages/service/')))throw new Error('Native declaration origin differs: '+row.name);
if(!origins.find((v:any)=>v.name==='startStreamsService')?.functionExample)throw new Error('Function own example missing from actual public doc JSON');
await Deno.writeTextFile(output+'/public-inventory.json',JSON.stringify({count:names.length,names,nativeOriginCount:19,origins,functionOwnExample:true,numericF5:'DEBT_ACCEPTED_NOT_PASS'},null,2),{createNew:true});
const identity=`import type * as Public from '@netscript/plugin-streams/service';
import type * as Native from '@netscript/service';
import type * as Auth from '@netscript/service/auth';
import type * as Implementation from './service.ts';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Check<T extends true> = T;
export type IdentityChecks = [
${service.map(v=>`  Check<Equal<Public.${v}, Native.${v}>>`).concat(auth.map(v=>`  Check<Equal<Public.${v}, Auth.${v}>>`),['  Check<Equal<Public.StreamsServiceOptions, Implementation.StreamsServiceOptions>>','  Check<Equal<typeof Public.startStreamsService, typeof Implementation.startStreamsService>>']).join(',\n')}
];
export function compose(auth: Auth.ServiceAuthPolicy, serve: Native.ServeOptions, cors: Native.CorsOptions): Public.StreamsServiceOptions {
  return { auth, serve, cors };
}
`;
const fixtures:{name:string;source:string;expected:number}[]=[
 {name:'identity-21',source:identity,expected:0},
 {name:'negative-auth',source:"import type { StreamsServiceOptions } from '@netscript/plugin-streams/service';\nconst invalid: StreamsServiceOptions = { auth: { public: true, reason: 7 } };\nvoid invalid;\n",expected:1},
 {name:'negative-serve',source:"import type { StreamsServiceOptions } from '@netscript/plugin-streams/service';\nconst invalid: StreamsServiceOptions = { auth: { public: true, reason: 'type control' }, serve: { port: '0' } };\nvoid invalid;\n",expected:1},
];
for(const[path,prefix]of [['plugins/streams/services/src/service.ts','function-example'],['plugins/streams/services/mod.ts','module-example']]){
 const source=(await Deno.readTextFile(root+'/'+path)).split('\n').map(v=>v.replace(/^\s*\* ?/,'')).join('\n');let index=0;
 for(const match of source.matchAll(/```ts\n([\s\S]*?)```/g))fixtures.push({name:prefix+'-'+(++index),source:match[1],expected:0});
}
if(fixtures.length!==6)throw new Error('Expected three real source examples and three consumer controls');
const temporary:string[]=[];const executions:any[]=[];let failed=false;
try{
 for(const fixture of fixtures){
  await Deno.writeTextFile(output+'/'+fixture.name+'.ts.txt',fixture.source,{createNew:true});
  const relative='plugins/streams/services/src/__s5_consumer_'+fixture.name+'_'+crypto.randomUUID()+'.ts';const path=root+'/'+relative;
  await Deno.writeTextFile(path,fixture.source,{createNew:true});temporary.push(path);
  const args=['run','--frozen','--cached-only','-A','.llm/tools/run-deno-check.ts','--output',output+'/'+fixture.name+'.report.json','--file',relative,'--deno-arg','--frozen','--deno-arg','--cached-only'];
  const startedAt=new Date().toISOString();const child=new Deno.Command(Deno.execPath(),{args,cwd:root,env,clearEnv:true,stdout:'piped',stderr:'piped'}).spawn();let timedOut=false;const timer=setTimeout(()=>{timedOut=true;try{child.kill();}catch{/* owned command settled */}},120000);
  let result;try{result=await child.output();}finally{clearTimeout(timer);}
  await Deno.writeFile(output+'/'+fixture.name+'.stdout.log',result.stdout,{createNew:true});await Deno.writeFile(output+'/'+fixture.name+'.stderr.log',result.stderr,{createNew:true});
  const report=JSON.parse(await Deno.readTextFile(output+'/'+fixture.name+'.report.json'));
  const selected=report.selection?.filesSelected===1;
  const expectedDiagnostic=fixture.expected===0?report.summary.totalOccurrences===0:report.summary.totalOccurrences===1&&report.groups.every((v:any)=>String(v.code)==='TS2322');
  const ok=!timedOut&&result.code===fixture.expected&&selected&&expectedDiagnostic;
  const row={name:fixture.name,args,cwd:root,executable:Deno.execPath(),pid:child.pid,startedAt,finishedAt:new Date().toISOString(),code:result.code,expected:fixture.expected,timedOut,selectedOne:selected,expectedDiagnostic,ok,stdoutBytes:result.stdout.length,stderrBytes:result.stderr.length};executions.push(row);failed||=!ok;console.log(JSON.stringify(row));
  await Deno.writeTextFile(output+'/execution.json',JSON.stringify({clearEnv:true,env,executions},null,2));
 }
}finally{
 const sourceRoot=await Deno.realPath(root+'/plugins/streams/services/src');
 for(const path of temporary){const actual=await Deno.realPath(path);if(!actual.startsWith(sourceRoot+'\\__s5_consumer_')&&!actual.startsWith(sourceRoot+'/__s5_consumer_'))throw new Error('Temporary consumer boundary differs');await Deno.remove(path);}
 const actual=await Deno.realPath(profile),parent=await Deno.realPath(output);if(!actual.startsWith(parent+'\\')&&!actual.startsWith(parent+'/'))throw new Error('Owned profile boundary differs');
 const residue=Array.from(Deno.readDirSync(profile),v=>v.name);await Deno.remove(profile);await Deno.writeTextFile(output+'/cleanup.json',JSON.stringify({profile,removed:true,residue,temporaryConsumers:temporary,allConsumersRemoved:true,recursiveDelete:false},null,2),{createNew:true});
}
Deno.exitCode=failed?1:0;
