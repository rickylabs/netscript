const run = '.llm/runs/fix-browser-stream-headers--u3';
const source = '.llm/tmp/u3-type-closure-application-20261028';
const target = `${run}/evidence/type-closure-native-sol-20261028`;
const hash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
const entries=[];
async function copy(from:string,to:string) {
 const bytes=await Deno.readFile(from);
 if (/(?:sk-or-v1-|ghp_|github_pat_|sk-proj-)[A-Za-z0-9_-]{12}/.test(new TextDecoder().decode(bytes)))throw new Error('Credential-shaped evidence.');
 await Deno.mkdir(to.slice(0,to.lastIndexOf('/')),{recursive:true});
 await Deno.writeFile(to,bytes,{createNew:true});
 const digest=await hash(bytes);if(await hash(await Deno.readFile(to))!==digest)throw new Error('Raw copy mismatch.');
 entries.push({source:from,copied:to,bytes:bytes.length,sha256:digest});
}
async function copyTree(from:string,to:string){
 for await(const entry of Deno.readDir(from)){
  if(entry.isDirectory)await copyTree(`${from}/${entry.name}`,`${to}/${entry.name}`);
  else if(entry.isFile)await copy(`${from}/${entry.name}`,`${to}/${entry.name}`);
 }
}
await copyTree(source,`${target}/application`);
const diagnostic='.llm/tmp/u3-doc-closure-exact-20261028';
for(const name of ['report.md','diagnostic-proof.json','candidate.diff','compiler-proof.json'])await copy(`${diagnostic}/${name}`,`${target}/diagnostic/${name}`);
const review='.llm/tmp/u3-corrective-plan-review-20261028';
const coveragePath=`${review}/coverage.json`;const identityPath=`${review}/observed-identity.json`;
const coverage=JSON.parse(await Deno.readTextFile(coveragePath));const identity=JSON.parse(await Deno.readTextFile(identityPath));
const publicReviewReceipt={
 method:'Curated public identity/coverage only; original raw bindings retained ignored. No account allowance, operational usage, private session export or reasoning.',
 sourceCoverageSha256:await hash(await Deno.readFile(coveragePath)),sourceIdentitySha256:await hash(await Deno.readFile(identityPath)),
 sessionIDs:coverage.sessionIDs,reads:coverage.reads,mcp:coverage.mcp,failures:coverage.failures,textEventCount:coverage.textEventCount,
 steps:(coverage.steps??[]).map(step=>({reason:step.reason})),
 sessionID:identity.sessionID,requestedVariant:identity.requestedVariant,
 addedAssistants:(identity.addedAssistants??[]).map(message=>({id:message.id,sessionID:message.sessionID,providerID:message.providerID,modelID:message.modelID,finish:message.finish})),
 verdictPath:`${run}/corrective-type-closure-plan-eval.md`,verdictSha256:await hash(await Deno.readFile(`${run}/corrective-type-closure-plan-eval.md`)),
};
await Deno.writeTextFile(`${target}/public-review-receipt.json`,JSON.stringify(publicReviewReceipt,null,2),{createNew:true});
await Deno.writeTextFile(`${target}/manifest.json`,JSON.stringify({capturedAt:new Date().toISOString(),byteVerified:true,policy:'Raw application and actual-source diagnostic records only. All earlier failures remain immutable. Account/operational usage and private model sessions excluded.',entries},null,2),{createNew:true});
await Deno.writeTextFile(`${run}/type-closure-checkpoint.md`,`# Root-accepted native type-closure checkpoint

Four native type-only export sites now expose exactly HeadersRecord and MaybePromise.
The48-line canonical entry acknowledges BOTH F15 upstream exposure and F5 two-name
facade growth as DEBT_ACCEPTED, fixed2026-11-10/no extension/no growth. Prior facade
surplus and ten Fresh baseline findings remain unwaived. Source/docs12+registry13;
explicit run/evidence provenance is separate. No runtime/dependency/config/lock change.

[Actual independent corrective verdict](corrective-type-closure-plan-eval.md),
[root PLAN disposition](root-corrective-type-closure-plan-acceptance.md) and
[root source acceptance](root-corrective-type-closure-source-acceptance.md) remain
distinct from the immutable failed predecessor. [Raw byte-verified evidence](evidence/type-closure-native-sol-20261028/manifest.json)
and [application bindings](evidence/type-closure-native-sol-20261028/application/final-evidence.json)
retain exact results and failures; the public review receipt excludes account/usage data.

Actual shipping docs are warning-free Fresh10/workers0, preserving the exact original
ten finding identities and real native declarations. C1 runtime20/0/0 and C2 suite5/0/0,
13 identity/anti-any assertions and9 intended TS2322 errors pass. Four-input types/lint/
format, authored consumers, both package checks, quality, direct doctrine and both publish
dry-runs pass. No publication. Scanner success is not F15/F5 compliance.

Root qualifies the existing reference contract using the external Windows checker
0d5b982b/df2c50f: actual36/36 against U3 CWD/config, empty stderr and no missing symbols.
Fresh/workers mappings remain entrypoints-only; no exhaustive per-name prose, page
edit, waiver, checker import or original parent accuracy PASS is inferred. Architecture
still fails the DB identity prerequisite; original parent accuracy and prior global
documentation/format failures remain RED. Compiler fixture cleanup and locks are verified.

All planned source slices are root accepted. PR2423 may enter real CI; independent
feature IMPL remains mandatory. Opus/xhigh is the eligible fallback because Meta and
OpenAI generated this leaf. Review preparation alone authorizes no inference. No merge,
integration, issuer/authentication, browser/CEF or release acceptance.
`,{createNew:true});
await Deno.writeTextFile(`${run}/worklog.md`,`\n\n## Root-accepted corrective type closure,2026-10-28\n\nActual SAME-GLM corrective PLAN is PASS as bounded DEBT_ACCEPTED, with repaired BOTH F15/F5\nwording. Root independently read source/gates and matched11bindings before accepting the exact\nfour-site +8/-2 patch and48-line registry entry. See type-closure-checkpoint.md and root source\nacceptance. Shipping Fresh10/workers0, compiler/runtime/static/package/publish evidence and\nqualified external existing reference contract are retained. Original failed premise/application,\nten baseline findings, surplus and parent Windows/architecture failures remain unwaived.\nAll planned source is complete; prepare independent Opus/xhigh IMPL only, no inference authority.\nPR2423 may enter actual CI. No merge/readiness or release acceptance.\n`,{append:true});
await Deno.writeTextFile(`${run}/context-pack.md`,`\n\n## Current continuation: root accepted bounded type closure,2026-10-28\n\nC1/C2/C3 and the exact four-site native type closure are root source accepted. The canonical\nentry is DEBT_ACCEPTED for BOTH F15 native exposure and F5 measured facade growth, fixedNov10\nwithout extension/growth. Actual shipping docs10/0; original ten Fresh findings/surplus remain\nunwaived. Root qualified the existing reference contract through read-only external Windows\nchecker0d5b982b; no checker import/page edit/waiver or original parent task PASS. See\ntype-closure-checkpoint.md. Next is independent feature IMPL preparation: Opus/xhigh fallback,\nskipping Meta and OpenAI generator families. No review inference or merge authorization yet.\n`,{append:true});
console.log(JSON.stringify({evidenceFiles:entries.length,byteVerified:true,publicReviewReceiptExcludesFinancialAndPrivateSessionData:true}));
