import './route-mounted.css';
import LocalPluginIsland from './island.tsx';

export default function LocalPluginRoute() {
  return (
    <section id='mounted-plugin-route' class='plugin-route-panel' data-ns-plugin='acme-local'>
      <h1 id='mounted-plugin-title'>Mounted Plugin Route (CSS side-effect)</h1>
      <p id='cascade-probe' class='ns-cascade-target'>
        Cascade layer probe target (mounted route)
      </p>
      <LocalPluginIsland initialCount={5} label='mounted-route-island' />
    </section>
  );
}
