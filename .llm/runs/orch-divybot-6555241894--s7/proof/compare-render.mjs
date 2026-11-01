import { chromium } from '../../../../tools/fresh-ui-browser/node_modules/playwright/index.mjs';
import { readFile,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const path='.llm/tmp/s7-proof-6555241894/';
const capture=JSON.parse(await readFile(path+'builder.json','utf8'));
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const scheme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width:1280,height:900},colorScheme:scheme});
  const builder=await context.newPage();
  await builder.goto('http://127.0.0.1:4186/netscript/create/?preset='+capture.code);
  await builder.waitForSelector('html[data-builder-ready="true"]');
  const frame=builder.frameLocator('[data-component-preview]');
  await frame.locator('html[data-preview-ready="workspace"][data-flavor="cloud"]').waitFor();
  const app=await context.newPage();
  const errors=[];app.on('pageerror',e=>errors.push(e.message));
  const response=await app.goto('http://127.0.0.1:4187/design/components');
  assert.equal(response.status(),200);
  await app.locator('html[data-theme="studio"][data-flavor="cloud"][data-density="comfortable"][data-scheme="'+scheme+'"]').waitFor();
  const tokens=async(root)=>root.evaluate(el=>{
   const s=getComputedStyle(el); const canvas=new OffscreenCanvas(1,1);const ctx=canvas.getContext('2d');
   function normalized(value) {
    if(CSS.supports('color',value)) {ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].join(',');}
    value=value.replace(/\/\*.*?\*\//g,' ').replace(/(?:oklch|lab|rgba?|hsla?|color)\([^)]*\)/g,color=>normalized(color));
    return value.replace(/["']/g,'').replace(/(-?\d*\.?\d+)ms\b/g,(_,n)=>Number(n)/1000+'s').replace(/-?\d*\.?\d+/g,n=>String(Number(n))).replace(/\s*([,\/])\s*/g,'$1').replace(/\s+/g,' ');
   }
   return Object.fromEntries([...s].filter(k=>k.startsWith('--ns-')).map(k=>[k,normalized(s.getPropertyValue(k).trim())]));
  });
  const expected=await tokens(frame.locator('html')); const actual=await tokens(app.locator('html'));
  const diffs=Object.keys(expected).filter(k=>actual[k]!==expected[k]);
  console.log(scheme,'token differences',diffs.length,diffs.slice(0,12).map(k=>({key:k,preview:expected[k],app:actual[k]})));
  const props=['backgroundColor','color','borderRadius','borderColor','fontFamily','fontSize','fontWeight','height','paddingLeft','paddingRight'];
  const styles=async(locator)=>locator.evaluate((el,props)=>{const s=getComputedStyle(el);const canvas=new OffscreenCanvas(1,1);const ctx=canvas.getContext('2d');return Object.fromEntries(props.map(k=>{let value=s[k];if(k.endsWith('Color')||k==='color'){ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);value=[...ctx.getImageData(0,0,1,1).data];}return [k,value];}));},props);
  // Workspace card and generated gallery both use the real default primary Button.
  const previewButton=frame.locator('button[data-variant="primary"]:not([disabled])').first();
  const appButton=app.locator('#item-button button').filter({hasText:/^Primary$/});
  console.log('buttons',await previewButton.count(),await appButton.count());
  const previewStyles=await styles(previewButton);const appStyles=await styles(appButton);
  console.log(scheme,'button',JSON.stringify({previewStyles,appStyles}));
  await builder.screenshot({path:path+'builder-'+scheme+'.png',fullPage:true});
  await app.locator('#item-button').screenshot({path:path+'app-button-'+scheme+'.png'});
  await app.screenshot({path:path+'app-'+scheme+'.png',fullPage:false});
  assert.deepEqual(appStyles,previewStyles);assert.deepEqual(diffs,[]);assert.deepEqual(errors,[]);
  results.push({scheme,tokenCount:Object.keys(expected).length,tokenDifferences:diffs.map(k=>({key:k,preview:expected[k],app:actual[k]})),previewStyles,appStyles,errors});
  await context.close();
 }
} finally {await browser.close();await writeFile(path+'render-comparison.json',JSON.stringify(results,null,2));}
