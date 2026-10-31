const directory = '.llm/tmp/u3-type-closure-application-20261028';
const files = ['packages/fresh/src/runtime/streams/create-stream-db.ts','packages/fresh/src/runtime/streams/mod.ts','plugins/workers/streams/factory.ts','plugins/workers/streams/mod.ts'];
const fileArgs = files.flatMap(file=>['--file',file]);
const run = (file: string, ...args: string[]) => ['run','--frozen','-A',file,...args];
const commands: Record<string,string[]> = {
 'doc-fresh':['doc','--lint','--frozen','packages/fresh/src/runtime/streams/mod.ts'],
 'doc-workers':['doc','--lint','--frozen','plugins/workers/streams/mod.ts'],
 'json-fresh':['doc','--json','--frozen','packages/fresh/src/runtime/streams/mod.ts'],
 'json-workers':['doc','--json','--frozen','plugins/workers/streams/mod.ts'],
 'json-fresh-source':['doc','--json','--frozen','packages/fresh/src/runtime/streams/create-stream-db.ts'],
 'json-workers-source':['doc','--json','--frozen','plugins/workers/streams/factory.ts'],
 'c1-tests':run('.llm/tools/run-deno-test.ts','--','--frozen','-A','packages/fresh/src/runtime/streams/create-stream-db_test.ts','packages/fresh/src/runtime/streams/stream-db-recovery-adapter_test.ts','packages/fresh/tests/streamdb-headers-contract_test.ts'),
 'c2-tests':run('.llm/tools/run-deno-test.ts','--','--frozen','-A','plugins/workers/tests/streams/factory-headers_test.ts','plugins/workers/tests/streams/factory-discovery_test.ts','plugins/workers/tests/streams/live-query-consumer_test.ts'),
 'types':run('.llm/tools/run-deno-check.ts',...fileArgs,'--deno-arg','--frozen','--deno-arg','--unstable-kv'),
 'consumer-fresh':['task','--cwd','packages/fresh','check:streams-types'],
 'consumer-workers':['check','--frozen','--unstable-kv','plugins/workers/tests/streams/live-query-consumer_type.ts'],
 'package-fresh':['task','--cwd','packages/fresh','check'],
 'package-workers':['task','--cwd','plugins/workers','check'],
 'lint':run('.llm/tools/run-deno-lint.ts',...fileArgs,'--ext','ts'),
 'fmt':run('.llm/tools/run-deno-fmt.ts',...fileArgs,'--ext','ts'),
 'quality-fresh':run('.llm/tools/quality/scan-code-quality.ts','--root','packages/fresh','--max-allow','7'),
 'quality-workers':run('.llm/tools/quality/scan-code-quality.ts','--root','plugins/workers','--max-allow','7'),
 'doctrine':['run','--frozen','--allow-read','--allow-run','.llm/tools/fitness/check-doctrine.ts','--all-roots'],
 'arch':['task','arch:check'],
 'publish-fresh':['task','--cwd','packages/fresh','publish:dry-run'],
 'publish-workers':['task','--cwd','plugins/workers','publish:dry-run'],
 'parity-external':['run','--frozen','--config',`${Deno.cwd()}/deno.json`,'--allow-read','--allow-run','C:/Users/ericc/source/repos/netscript-windows-qualification-008/.llm/tools/docs/check-exports-drift.ts'],
 'accuracy-parent':['task','docs:accuracy'],
};
const selected = Deno.args[0];
if (!commands[selected]) throw new Error('Unknown application gate.');
const env: Record<string,string> = {
 PATH:`${Deno.execPath().slice(0,Deno.execPath().lastIndexOf('\\'))};${Deno.env.get('PATH')??''}`,
 DENO_DIR:'C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache',
 HOME:`${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/home`,USERPROFILE:`${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/home`,
 TEMP:`${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/temp`,TMP:`${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/temp`,
 DENO_TLS_CA_STORE:'mozilla,system',HTTP_PROXY:'http://127.0.0.1:3128',HTTPS_PROXY:'http://127.0.0.1:3128',NO_PROXY:'127.0.0.1,localhost,0.0.0.0',
 DENO_NO_PROMPT:'1',DENO_NO_UPDATE_CHECK:'1',OTEL_DENO:'false',NO_COLOR:'1',
};
for(const name of ['SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','SYSTEMDRIVE','PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMW6432']){const value=Deno.env.get(name);if(value!==undefined)env[name]=value;}
const prefix=`${directory}/${selected}-${Date.now()}`;
const controller=new AbortController();const timer=setTimeout(()=>controller.abort(new Error('Application gate deadline.')),300_000);
const started=new Date().toISOString();
try {
 const output=await new Deno.Command(Deno.execPath(),{args:commands[selected],env,clearEnv:true,stdin:'null',stdout:'piped',stderr:'piped',signal:controller.signal}).output();
 await Deno.writeFile(`${prefix}.stdout`,output.stdout,{createNew:true});await Deno.writeFile(`${prefix}.stderr`,output.stderr,{createNew:true});
 const receipt={selected,args:commands[selected],code:output.code,started,ended:new Date().toISOString(),deadlineAborted:controller.signal.aborted,originalOutputAwaited:true,prefix};
 await Deno.writeTextFile(`${prefix}.json`,JSON.stringify(receipt,null,2),{createNew:true});
 console.log(JSON.stringify(receipt));
 if(!selected.startsWith('json-')){console.log(new TextDecoder().decode(output.stdout).slice(-2200));console.error(new TextDecoder().decode(output.stderr).slice(-2200));}
 Deno.exitCode=output.code;
} catch(error) {
 await Deno.writeTextFile(`${prefix}-exception.json`,JSON.stringify({selected,started,error:String(error),deadlineAborted:controller.signal.aborted},null,2),{createNew:true});throw error;
} finally{clearTimeout(timer);}
