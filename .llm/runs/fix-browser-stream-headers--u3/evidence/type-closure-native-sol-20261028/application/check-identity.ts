const directory = `${Deno.cwd()}/.llm/tmp/u3-type-closure-application-20261028`;
const clone = Deno.cwd();
const fixture = `${clone}/packages/fresh/tests/type-fixtures/u3-doc-closure`;
await Deno.mkdir(fixture);
const url = (path: string) => new URL(`file:///${clone.replaceAll('\\','/')}/${path}`).href;
const fresh = url('packages/fresh/src/runtime/streams/mod.ts');
const freshSource = url('packages/fresh/src/runtime/streams/create-stream-db.ts');
const workers = url('plugins/workers/streams/mod.ts');
const workerSource = url('plugins/workers/streams/factory.ts');
const imports = `import type { HeadersRecord as Native, MaybePromise as NativePromise } from '@durable-streams/client';
import type { HeadersRecord as Fresh, MaybePromise as FreshPromise, NetScriptStreamDBOptions, NetScriptStreamDBFactoryInput, NetScriptStreamStateDefinition } from '${fresh}';
import type { HeadersRecord as FreshSource, MaybePromise as FreshSourcePromise } from '${freshSource}';
import { createWorkersStreamDB } from '${workers}';
import type { HeadersRecord as Workers, MaybePromise as WorkersPromise } from '${workers}';
import type { HeadersRecord as WorkersSource, MaybePromise as WorkersSourcePromise } from '${workerSource}';
type FreshHeaders = NonNullable<NetScriptStreamDBOptions<NetScriptStreamStateDefinition>['headers']>;
type InputHeaders = NetScriptStreamDBFactoryInput<NetScriptStreamStateDefinition>['streamOptions']['headers'];
type WorkersHeaders = NonNullable<NonNullable<Parameters<typeof createWorkersStreamDB>[0]>['headers']>;
`;
const positive = `${imports}
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
export type NativeNotAny = Assert<Equal<IsAny<Native>, false>>;
export type ExportNotAny = Assert<Equal<IsAny<Fresh | Workers | FreshSource | WorkersSource>, false>>;
export type FreshIdentity = Assert<Equal<Fresh, Native>>;
export type WorkersIdentity = Assert<Equal<Workers, Native>>;
export type FreshSourceIdentity = Assert<Equal<FreshSource, Native>>;
export type WorkersSourceIdentity = Assert<Equal<WorkersSource, Native>>;
export type FreshPromiseIdentity = Assert<Equal<FreshPromise<string>, NativePromise<string>>>;
export type WorkersPromiseIdentity = Assert<Equal<WorkersPromise<string>, NativePromise<string>>>;
export type FreshSourcePromiseIdentity = Assert<Equal<FreshSourcePromise<string>, NativePromise<string>>>;
export type WorkersSourcePromiseIdentity = Assert<Equal<WorkersSourcePromise<string>, NativePromise<string>>>;
export type FreshHeadersIdentity = Assert<Equal<FreshHeaders, Native>>;
export type InputHeadersIdentity = Assert<Equal<InputHeaders, Native>>;
export type WorkersHeadersIdentity = Assert<Equal<WorkersHeaders, Native>>;
const native: Native = { static: 'value', sync: () => 'value', async: async () => 'value' };
const fresh: FreshHeaders = native;
const input: InputHeaders = native;
const workers: WorkersHeaders = native;
const backFresh: Native = fresh;
const backInput: Native = input;
const backWorkers: Native = workers;
void [backFresh, backInput, backWorkers];
`;
const cases = [
  ['positive', positive, 0],
  ['numeric-value', `${imports}\nconst fresh: FreshHeaders = { authorization: 1 };\nconst input: InputHeaders = { authorization: 1 };\nconst workers: WorkersHeaders = { authorization: 1 };\nvoid [fresh, input, workers];\n`, 3],
  ['numeric-async', `${imports}\nconst fresh: FreshHeaders = { authorization: async () => 1 };\nconst input: InputHeaders = { authorization: async () => 1 };\nconst workers: WorkersHeaders = { authorization: async () => 1 };\nvoid [fresh, input, workers];\n`, 3],
  ['map-factory', `${imports}\nconst fresh: FreshHeaders = () => ({ authorization: 'value' });\nconst input: InputHeaders = () => ({ authorization: 'value' });\nconst workers: WorkersHeaders = () => ({ authorization: 'value' });\nvoid [fresh, input, workers];\n`, 3],
] as const;
const env: Record<string,string> = {
 PATH:`${Deno.execPath().slice(0,Deno.execPath().lastIndexOf('\\'))};${Deno.env.get('PATH')??''}`,
 DENO_DIR:'C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache',
 HOME:`${directory}/home`,USERPROFILE:`${directory}/home`,TEMP:`${directory}/temp`,TMP:`${directory}/temp`,
 DENO_TLS_CA_STORE:'mozilla,system',HTTP_PROXY:'http://127.0.0.1:3128',HTTPS_PROXY:'http://127.0.0.1:3128',NO_PROXY:'127.0.0.1,localhost,0.0.0.0',
 DENO_NO_PROMPT:'1',DENO_NO_UPDATE_CHECK:'1',NO_COLOR:'1',OTEL_DENO:'false',
};
for(const name of ['SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','SYSTEMDRIVE']){const value=Deno.env.get(name);if(value!==undefined)env[name]=value;}
const results=[];
try {
 for(const [name,source,expectedErrors] of cases){
  const path=`${fixture}/${name}.ts`;
  await Deno.writeTextFile(path,source,{createNew:true});await Deno.writeTextFile(`${directory}/compiler-${name}.ts`,source,{createNew:true});
  const args=['check','--frozen','--unstable-kv','--config',`${clone}/deno.json`,path];
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(new Error('Compiler deadline.')),30_000);
  try {
   const output=await new Deno.Command(Deno.execPath(),{args,cwd:clone,env,clearEnv:true,stdin:'null',stdout:'piped',stderr:'piped',signal:controller.signal}).output();
   await Deno.writeFile(`${directory}/compiler-${name}.stdout`,output.stdout,{createNew:true});await Deno.writeFile(`${directory}/compiler-${name}.stderr`,output.stderr,{createNew:true});
   const text=new TextDecoder().decode(output.stdout)+new TextDecoder().decode(output.stderr);
   const errors=(text.match(/TS2322/g)??[]).length;
   const result={name,args,cwd:clone,code:output.code,ts2322Count:errors,expectedErrors,deadlineAborted:controller.signal.aborted,outputAwaited:true};results.push(result);
   await Deno.writeTextFile(`${directory}/compiler-${name}.json`,JSON.stringify(result,null,2),{createNew:true});
   if(/Warning|No matching|No input|No target|not mapped|not in import map|Failed resolving/i.test(text) || !text.includes(`${name}.ts`) || controller.signal.aborted || (expectedErrors===0? output.code!==0||/TS\d{4}/.test(text):output.code===0||errors!==expectedErrors))throw new Error(`Invalid compiler control: ${name}`);
  }finally{clearTimeout(timer);}
 }
}finally{
 const resolved=await Deno.realPath(fixture);const scope=await Deno.realPath(`${clone}/packages/fresh/tests/type-fixtures`);
 if(!resolved.startsWith(`${scope}\\`)&&!resolved.startsWith(`${scope}/`))throw new Error('Owned cleanup escaped fixture scope.');
 await Deno.remove(resolved,{recursive:true});
}
await Deno.writeTextFile(`${directory}/compiler-proof.json`,JSON.stringify({results,exactNativeVersion:'0.2.7',positiveIdentityAssertions:13,negativeControls:3,negativeSeamErrors:9,ownedFixtureRemoved:true,sourceExecuted:false},null,2),{createNew:true});
console.log(JSON.stringify({results,ownedFixtureRemoved:true}));
