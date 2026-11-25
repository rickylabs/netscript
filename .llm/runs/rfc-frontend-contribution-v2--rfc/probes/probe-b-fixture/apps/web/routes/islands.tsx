import { Partial } from 'fresh/runtime';
import { define } from '@app/utils.ts';
import AppCounter from '@app/islands/AppCounter.tsx';
import { DeferComponent } from '@netscript/fresh/defer/island';
import { LocalPluginIsland } from '@acme/local-plugin/island';

export default define.page(function IslandsMatrixPage() {
  return (
    <section id='islands-matrix' f-client-nav>
      <h1>Islands Matrix</h1>
      <AppCounter initialCount={1} />
      <LocalPluginIsland initialCount={2} label='local-v1' />
      <DeferComponent
        action='/islands'
        partial='/partials/defer-probe'
        isPartialRequest={false}
        hasCachedData={false}
        policy='balanced'
      />
      <Partial name='defer-probe'>
        <div id='defer-target' data-defer-state='waiting'>initial</div>
      </Partial>
    </section>
  );
});
