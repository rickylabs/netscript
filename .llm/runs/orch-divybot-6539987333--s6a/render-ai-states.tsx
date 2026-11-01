/** @jsx h */
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { h, type VNode } from 'npm:preact@^10.29.2';
import { PromptInput } from '../../../packages/fresh-ui/registry/components/ui/prompt-input.tsx';
import { ModelSelector } from '../../../packages/fresh-ui/registry/components/ui/model-selector.tsx';
import { ToolCallCard } from '../../../packages/fresh-ui/registry/components/ui/tool-call-card.tsx';
import { Message } from '../../../packages/fresh-ui/registry/components/ui/message.tsx';
import { CitationChip } from '../../../packages/fresh-ui/registry/components/ui/citation-chip.tsx';
import { CodeBlock } from '../../../packages/fresh-ui/registry/components/ui/code-block.tsx';
import { DesktopTrayMenu } from '../../../packages/fresh-ui/registry/components/ui/desktop-tray-menu.tsx';
import { DesktopDialog } from '../../../packages/fresh-ui/registry/components/ui/desktop-dialog.tsx';
import { DesktopNotification } from '../../../packages/fresh-ui/registry/components/ui/desktop-notification.tsx';
import { DesktopWindowChrome } from '../../../packages/fresh-ui/registry/components/ui/desktop-window-chrome.tsx';
import { DesktopUpdatePrompt } from '../../../packages/fresh-ui/registry/components/ui/desktop-update-prompt.tsx';
const fixtures: Array<{name:string;component:string;html:string}> = [];
function add(component:string, state:string, node:VNode):void { fixtures.push({name:`${component}/${state}`,component,html:render(node)}); }
const noop=()=>{};
const models=[{id:'a',label:'Model A',provider:'Provider',desc:'Fast analysis'},{id:'b',label:'Model B',desc:'Deep analysis'}];
for(const compact of [false,true])for(const state of ['rest','busy','disabled'])add('prompt-input',`${compact}/${state}`,<PromptInput compact={compact} busy={state==='busy'} sendDisabled={state==='disabled'} onStop={noop} onAttach={noop} onScreenshot={noop} onVoice={noop} onGroundingChange={noop} grounding onResearchChange={noop} models={models} model='a' hint='Enter to send'/>);
for(const align of ['left','right'] as const)for(const open of [false,true])add('model-selector',`${align}/${open}`,<ModelSelector value='a' models={models} align={align} open={open}/>);
for(const status of ['running','done','error'] as const)for(const open of [false,true])add('tool-call-card',`${status}/${open}`,<ToolCallCard name='orders.lookup' args='{"id":"SO-10480"}' result={status==='error'?'Order not found':'{"status":"paid"}'} status={status} defaultOpen={open}/>);
for(const role of ['user','assistant','system'] as const)for(const pending of [false,true])add('message',`${role}/${pending}`,<Message message={{role,author:{name:'Maya Rossi'},body:'The order is ready. See [1].',model:'Model A',time:'2 min ago',pending,followups:['Track order','View invoice']}}/>);
for(const active of [false,true])add('citation-chip',String(active),<CitationChip index={1} source='Order reference' active={active}/>);
for(const disabled of [false,true]){
 add('desktop-dialog',String(disabled),<DesktopDialog message='Discard unsaved changes?' disabled={disabled}/>);
 add('desktop-notification',String(disabled),<DesktopNotification notification={{title:'Export complete',body:'Your orders are ready to download.'}} disabled={disabled}/>);
 add('window-chrome',String(disabled),<DesktopWindowChrome title='Northwind' disabled={disabled}/>);
 for(const source of ['tray','application-menu'] as const)add('tray-menu',`${source}/${disabled}`,<DesktopTrayMenu source={source} disabled={disabled} items={[{type:'action',id:'open',label:'Open workspace',accelerator:'⌘O'},{type:'separator'},{type:'action',id:'disabled',label:'Unavailable',enabled:false},{type:'role',role:'copy'}]}/>);
}
add('update-prompt','restart',<DesktopUpdatePrompt event={{applyMode:'automatic',version:'1.0.0'}} onRestart={noop}/>);
add('update-prompt','manual',<DesktopUpdatePrompt event={{applyMode:'manual',version:'1.0.0',manualUpdateUrl:'https://example.com/download'}}/>);
for(const lang of ['ts','json','unknown-language'])add('code-block',lang,<CodeBlock code={lang==='json'?'{"order":10480,"paid":true}':'// Load an order\nconst greeting = "Hello";\nconst count = 42;'} filename='orders.ts' lang={lang}/>);
await Deno.writeTextFile(Deno.args[0],JSON.stringify(fixtures));
console.log(`Rendered ${fixtures.length} AI/desktop states`);
