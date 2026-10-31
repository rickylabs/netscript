import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Capture the real shipped fixture markup. Output stays outside Git.
const [input, variantInput, output, ...families] = process.argv.slice(2);
const root = resolve('packages/fresh-ui');
const all = [...JSON.parse(await readFile(input, 'utf8')), ...JSON.parse(await readFile(variantInput, 'utf8'))];
const selected = all.filter(x => families.includes(x.component ?? x.name.split('/')[0]));
if (!selected.length) throw new Error('No fixtures selected');
await mkdir(output, { recursive: true });
const paths = [join(root, 'registry/styles/layouts.css')];
for (const dir of ['registry/components/ui', 'registry/islands']) {
 for (const name of (await readdir(join(root, dir))).sort()) if (name.endsWith('.css')) paths.push(join(root, dir, name));
}
const css = (await Promise.all(paths.map(p => readFile(p, 'utf8')))).join('\n').replace(/@import\s+[^;]+;/g, '');
const tokens = await readFile(join(root, 'registry/theme/presets/studio-utility.css'), 'utf8');
const fonts = JSON.parse(await readFile(join(root,'registry/theme/fonts.json'),'utf8')).imports['studio-utility'];
const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
try {
 for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
  await page.setContent(`<!doctype html><html data-theme="studio" data-flavor="utility" data-scheme="${scheme}" data-density="compact"><head>${fonts.map(x=>`<link rel="stylesheet" href="${escape(x)}">`).join('')}<style>${tokens}\n${css}\nhtml{font-family:var(--ns-font-sans);color:var(--ns-fg);background:var(--ns-bg)}body{margin:0;padding:var(--ns-space-6)}*{box-sizing:border-box}h2{font-size:var(--ns-text-heading)}.specimen{padding:var(--ns-space-4);margin-block:var(--ns-space-3);min-width:0;border:var(--ns-border-width) solid var(--ns-border)}.specimen-label{font:var(--ns-text-caption) var(--ns-font-mono);margin-block-end:var(--ns-space-3)}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--ns-space-4)}</style></head><body><h1>Utility ${scheme}</h1><div class="grid">${selected.map((x,i)=>`<section class="specimen" id="case-${i}"><div class="specimen-label">${escape(x.name)}</div><div class="content">${x.html}</div></section>`).join('')}</div></body></html>`);
  await page.evaluate(()=>{
   document.addEventListener('click',event=>{if(event.target.closest('a,button'))event.preventDefault();},true);
   document.addEventListener('submit',event=>event.preventDefault(),true);
   return document.fonts.ready;
  });
  for (let i=0;i<selected.length;i++) {
   const row = selected[i];
   const container = page.locator(`#case-${i}`);
   const control = container.locator('button,a[href],input,select,textarea,[tabindex="0"]').first();
   const measure = async state => {
    await container.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getTiming().iterations)).map(a=>a.finished.catch(()=>{}))));
    const values = await container.evaluate(el => [...el.querySelectorAll('[data-part],input')].map(node=>{
     const s=getComputedStyle(node);
     const probe=document.createElement('span');probe.style.color='var(--ns-destructive)';node.parentElement.append(probe);const errorColor=getComputedStyle(probe).color;probe.style.color='var(--ns-ring)';const ringColor=getComputedStyle(probe).color;probe.remove();
     return {scope:node.dataset.scope,part:node.dataset.part,tag:node.tagName,state:node.dataset.state,size:node.dataset.size,variant:node.dataset.variant,errorColor,ringColor,invalid:node.closest('[data-invalid=true]')?'true':undefined,focused:node.matches(':focus-visible'),disabled:node.matches(':disabled'),radius:s.borderRadius,shadow:s.boxShadow,transform:s.transform,height:s.height,color:s.color,background:s.backgroundColor,border:s.borderColor,outline:s.outlineColor,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth,opacity:s.opacity,font:s.fontFamily,fontSize:s.fontSize,transition:s.transitionDuration};
    }));
    results.push({name:row.name,scheme,state,values});
    await container.screenshot({path:join(output,`state-${i}-${scheme}-${state}.png`),animations:'disabled'});
    for (const v of values) {
     if(v.invalid==='true'&&!v.disabled&&(['input','select','textarea'].includes(v.scope)&&v.part==='root'||['checkbox','switch'].includes(v.scope)&&['indicator','track'].includes(v.part))&&v.border!==v.errorColor)errors.push(`${row.name}/${scheme}/${state}: invalid border lost`);
     if(v.focused&&['button','icon-button','input','select','textarea','search'].includes(v.scope)&&(v.outlineStyle!=='solid'||v.outlineWidth!=='2px'||v.outline!==v.ringColor))errors.push(`${row.name}/${scheme}: focus-visible outline absent`);
     if(['button','icon-button'].includes(v.scope)&&v.part==='root'&&v.height!==({sm:'28px',md:'32px',lg:'40px',icon:'32px'}[v.size]??'32px'))errors.push(`${row.name}/${scheme}/${state}: control height`);
     if(['button','icon-button','checkbox','switch'].includes(v.scope)&&v.part==='root'&&v.state==='disabled'&&v.opacity!=='0.38')errors.push(`${row.name}/${scheme}: disabled opacity`);
     if(['button','icon-button'].includes(v.scope) && v.part==='root' && (v.shadow!=='none'||v.transform!=='none'||v.radius!=='0px')) errors.push(`${row.name}/${scheme}/${state}: Utility button geometry`);
     if(['input','select','textarea'].includes(v.scope)&&v.part==='root'&&v.radius!=='0px')errors.push(`${row.name}/${scheme}: input radius`);
    }
   };
   await measure('rest');
   if (await control.count() && await control.isVisible() && await control.isEnabled()) {
    const target = ['checkbox','switch'].includes(await control.getAttribute('data-scope')) ? container.locator('[data-part=label]').first() : control;
    await target.hover({force:true}); await measure('hover');
    const rest=results.at(-2)?.values.find(v=>v.part==='root');const hover=results.at(-1)?.values.find(v=>v.part==='root');
    if(['button','icon-button'].includes(rest?.scope)&&rest.background===hover.background)errors.push(`${row.name}/${scheme}: hover paint unchanged`);
    await page.keyboard.press('Tab'); await control.focus(); await measure('focus-visible');
    await page.mouse.down(); await measure('active'); await page.mouse.up();
    await control.evaluate(el=>{el.blur();if(el.type==='checkbox')el.checked=el.defaultChecked;});
   }
  }
  for (const component of families) {
   const indexes=selected.flatMap((x,i)=>(x.component??x.name.split('/')[0])===component?[i]:[]);
   if(!indexes.length) { errors.push(`Missing component ${component}`); continue; }
   await page.locator('.specimen').evaluateAll((els,keep)=>els.forEach((el,i)=>el.hidden=!keep.includes(i)),indexes);
   await page.screenshot({path:join(output,`${component}-${scheme}.png`),fullPage:true});
  }
  await page.locator('.specimen').evaluateAll(els=>els.forEach(el=>el.hidden=false));
  await page.evaluate(()=>document.documentElement.dir='rtl');
  await page.emulateMedia({reducedMotion:'reduce'});
  for(let i=0;i<selected.length;i++) {
   const control=page.locator(`#case-${i} input[type=checkbox]`).first();
   if(await control.count()&&await control.isEnabled())await control.evaluate(el=>{el.checked=true;});
  }
  const rtl = await page.locator('[data-scope=switch][data-part=thumb]').evaluateAll(els=>els.map(el=>({transform:getComputedStyle(el).transform,transition:getComputedStyle(el).transitionDuration})));
  for(const v of rtl) if(v.transform !== 'none' && Number(v.transform.split(',')[4]) > 0 || v.transition !== '0s') errors.push(`RTL/reduced switch: ${JSON.stringify(v)}`);
  results.push({scheme,state:'rtl-reduced',values:rtl});
  await page.screenshot({path:join(output,`rtl-reduced-${scheme}.png`),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.addStyleTag({content:'.grid{grid-template-columns:1fr}'});
  await page.screenshot({path:join(output,`mobile-${scheme}.png`),fullPage:true});
  await page.close();
 }
 await writeFile(join(output,'measurements.json'),JSON.stringify({browser:browser.version(),fixtures:selected.length,measurements:results.length,errors,results},null,2));
 console.log(JSON.stringify({fixtures:selected.length,measurements:results.length,errors}));
 if(errors.length)process.exitCode=1;
} finally {await browser.close();}
