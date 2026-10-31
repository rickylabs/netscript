import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Fragment, h } from 'npm:preact@^10.29.2';
import { basicFixtures } from '../../../packages/fresh-ui/tests/contracts/utility-basic.tsx';
import { compositeFixtures } from '../../../packages/fresh-ui/tests/contracts/utility-composites.tsx';
import { proseFixture } from '../../../packages/fresh-ui/tests/contracts/utility-prose.ts';

import { Card } from '../../../packages/fresh-ui/registry/components/ui/card.tsx';

const fixtures = [...basicFixtures, ...compositeFixtures, proseFixture];
const output = [];
for (const fixture of fixtures) {
  output.push({
    name: `${fixture.component}/${fixture.scenario}`,
    component: fixture.component,
    scope: fixture.scope ?? fixture.component,
    html: fixture.renderHtml
      ? await fixture.renderHtml()
      : render(h(Fragment, null, fixture.render!())),
  });
}
output.push({name:'card/keyboard',component:'card',scope:'card',html:render(h(Card,{interactive:true,tabIndex:0,children:h(Card.Body,{children:'Focusable card'})}))});
await Deno.writeTextFile(Deno.args[0], JSON.stringify(output));
console.log(
  `Rendered ${output.length} fixtures for ${
    new Set(output.map((x) => x.component)).size
  } components.`,
);
