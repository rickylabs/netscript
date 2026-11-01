const root='C:/Users/ericc/source/repos/netscript-native-host-policy-008';
const out=root+'/.llm/tmp/native-host-policy-u1-s5-astra-20261028';
const sha=async(path:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await Deno.readFile(root+'/'+path))),b=>b.toString(16).padStart(2,'0')).join('');
const prior=JSON.parse(await Deno.readTextFile(root+'/.llm/tmp/native-host-policy-u1-s4-astra-20261028/baseline-hashes.json'));
const paths=new Set<string>(prior.map((v:{path:string})=>v.path));
for(const path of ['plugins/streams/services/src/service_test.ts','.llm/runs/fix-native-host-policy--u1/root-s4-source-acceptance.md','.llm/runs/fix-native-host-policy--u1/s5-streams-factory-proposal.md','.llm/runs/fix-native-host-policy--u1/plan-streams-f5-debt-eval.md','.llm/runs/fix-native-host-policy--u1/root-streams-f5-plan-acceptance.md'])paths.add(path);
const baseline=[];for(const path of [...paths].sort())baseline.push({path,sha256:await sha(path)});
await Deno.writeTextFile(out+'/baseline-hashes.json',JSON.stringify(baseline,null,2)+'\n',{createNew:true});
for(const[name,path]of [['legacy-main.ts.before','plugins/streams/services/src/main.ts'],['streams-deno.json.before','plugins/streams/deno.json'],['s4-test.ts.before','plugins/streams/services/src/service_test.ts']])await Deno.writeFile(out+'/'+name,await Deno.readFile(root+'/'+path),{createNew:true});
for(const path of ['plugins/streams/services/src/service.ts','plugins/streams/services/mod.ts']){try{await Deno.stat(root+'/'+path);}catch(error){if(error instanceof Deno.errors.NotFound)continue;throw error;}throw new Error('Authorized new owner already exists: '+path);}
console.log(JSON.stringify({baselineFiles:baseline.length,testSha:await sha('plugins/streams/services/src/service_test.ts'),debtSha:await sha('.llm/harness/debt/arch-debt.md')}));
