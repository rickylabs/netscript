import { define } from '@app/utils.ts';
import '@acme/local-plugin/route.css';
import { LocalPluginIsland } from '@acme/local-plugin/island';

export default define.page(function PluginFsRoute() {
  return (
    <section id='fs-plugin-route' class='plugin-route-panel' data-ns-plugin='acme-local'>
      <h1 id='fs-plugin-title'>FS Plugin Route (fresh:route-css)</h1>
      <p id='cascade-probe' class='ns-cascade-target'>
        Cascade layer probe target (fsRoute)
      </p>
      <LocalPluginIsland initialCount={3} label='fs-route-island' />
    </section>
  );
});
