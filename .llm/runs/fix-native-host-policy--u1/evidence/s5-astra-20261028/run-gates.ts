const root='C:/Users/ericc/source/repos/netscript-native-host-policy-008';
const output=root+'/.llm/tmp/native-host-policy-u1-s5-astra-20261028/gates';
await Deno.mkdir(output);
const profile=await Deno.makeTempDir({dir:output,prefix:'owned-profile-'});
const env:Record<string,string>={DENO_DIR:root+'/.llm/tmp/native-host-policy-preflight/cache',PATH:'C:\\Users\\ericc\\source\\repos\\eis-chat-netscript-008-s01\\.netscript\\agent\\toolchains\\deno-2.9.7;C:\\Windows\\System32;C:\\Windows',SystemRoot:Deno.env.get('SystemRoot')??'C:/Windows',NO_COLOR:'1',PATHEXT:'.COM;.EXE;.BAT;.CMD'};
for(const key of ['HOME','USERPROFILE','APPDATA','LOCALAPPDATA','TEMP','TMP','TMPDIR','XDG_CACHE_HOME','XDG_CONFIG_HOME','XDG_DATA_HOME','XDG_STATE_HOME'])env[key]=profile;
const files=['plugins/streams/services/src/service.ts','plugins/streams/services/mod.ts','plugins/streams/services/src/service_test.ts','plugins/streams/services/src/main.ts'];
const selected=files.flatMap(file=>['--file',file]);
const executions:unknown[]=[];let failed=false;
async function execute(name:string,args:string[]){
 const startedAt=new Date().toISOString();const child=new Deno.Command(Deno.execPath(),{args,cwd:root,env,clearEnv:true,stdout:'piped',stderr:'piped'}).spawn();let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;try{child.kill();}catch{/* owned command settled */}},120000);
 try{const result=await child.output();await Deno.writeFile(output+'/'+name+'.stdout.log',result.stdout,{createNew:true});await Deno.writeFile(output+'/'+name+'.stderr.log',result.stderr,{createNew:true});const row={name,args,cwd:root,executable:Deno.execPath(),pid:child.pid,startedAt,finishedAt:new Date().toISOString(),code:result.code,timedOut,stdoutBytes:result.stdout.length,stderrBytes:result.stderr.length};executions.push(row);await Deno.writeTextFile(output+'/execution.json',JSON.stringify({clearEnv:true,env,executions},null,2));console.log(JSON.stringify(row));if(!result.success||timedOut)failed=true;}finally{clearTimeout(timer);}
}
try{
 await execute('format-edited',['run','--frozen','--cached-only','-A','.llm/tools/run-deno-fmt.ts','--output',output+'/format-edited.report.json','--write','--config',root+'/deno.json',...files.slice(0,2).flatMap(file=>['--file',file]),'--file','plugins/streams/deno.json']);
 await execute('tests',['run','--frozen','--cached-only','-A','.llm/tools/run-deno-test.ts','--output',output+'/tests.report.json','--','--frozen','--cached-only','--allow-all',files[2]]);
 await execute('types',['run','--frozen','--cached-only','-A','.llm/tools/run-deno-check.ts','--output',output+'/types.report.json',...selected,'--deno-arg','--frozen','--deno-arg','--cached-only']);
 for(const tool of ['lint','fmt'])await execute(tool,['run','--frozen','--cached-only','-A','.llm/tools/run-deno-'+tool+'.ts','--output',output+'/'+tool+'.report.json',...selected,'--config',root+'/deno.json']);
 await execute('manifest-fmt',['run','--frozen','--cached-only','-A','.llm/tools/run-deno-fmt.ts','--output',output+'/manifest-fmt.report.json','--file','plugins/streams/deno.json','--config',root+'/deno.json']);
 await execute('quality-new',['run','--frozen','--cached-only','--allow-read','.llm/tools/quality/scan-code-quality.ts',...files.slice(0,2).flatMap(file=>['--changed-file',file]),'--max-allow','0']);
 await execute('quality-legacy-baseline',['run','--frozen','--cached-only','--allow-read','.llm/tools/quality/scan-code-quality.ts','--changed-file',files[3],'--max-allow','0']);
 await execute('public-doc',['doc','--frozen','--deny-import','--lint',files[1]]);
 await execute('public-json',['doc','--frozen','--deny-import','--json',files[1]]);
}finally{
 const actual=await Deno.realPath(profile),parent=await Deno.realPath(output);if(!actual.startsWith(parent+'\\')&&!actual.startsWith(parent+'/'))throw new Error('Owned profile boundary differs');
 const residue=Array.from(Deno.readDirSync(profile),v=>v.name);await Deno.remove(profile);await Deno.writeTextFile(output+'/cleanup.json',JSON.stringify({profile,removed:true,residue,recursiveDelete:false},null,2),{createNew:true});
}
Deno.exitCode=failed?1:0;
