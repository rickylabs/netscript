import {
  QUERY_RESULT_RETURN,
  QUERY_RESULT_TEMPLATE,
} from '../../../packages/cli/src/kernel/application/ui/page/query-result-template.ts';

const output = Deno.args[0];
const source = `import { h, type VNode } from 'preact';
import { render } from 'npm:preact-render-to-string@^6.7.0';
${QUERY_RESULT_TEMPLATE}
function QueryView({query}:{query:{isLoading:boolean;isError:boolean;data:unknown}}):VNode {
${QUERY_RESULT_RETURN}
}
const samples = [null, [], {}, [{name:'Ada', active:true}, {name:'Lin', active:false}], {title:'Order', nested:{total:42}}, 'Ready', '<script>alert(1)</script>'];
const html = samples.map(value => render(h(QueryResult,{value})));
html.push(render(h(QueryView,{query:{isLoading:true,isError:false,data:undefined}})));
html.push(render(h(QueryView,{query:{isLoading:false,isError:true,data:undefined}})));
console.log(JSON.stringify(html));`;
const result = await new Deno.Command(Deno.execPath(), {
  args: ['eval', '--config', 'deno.json', '--ext', 'tsx', source],
  cwd: 'packages/fresh-ui',
  stdout: 'piped',
  stderr: 'piped',
}).output();
if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
await Deno.writeFile(output, result.stdout);
