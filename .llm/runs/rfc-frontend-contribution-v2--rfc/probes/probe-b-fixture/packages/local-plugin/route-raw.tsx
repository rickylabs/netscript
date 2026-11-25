import './route-raw.css';
import LocalPluginIsland from './island.tsx';

export default function LocalPluginRawRoute() {
  return (
    <section id='mounted-raw-plugin-route' class='plugin-route-panel' data-ns-plugin='acme-local'>
      <h1 id='mounted-raw-plugin-title'>Mounted Plugin Route (raw css side-effect)</h1>
      <p id='cascade-probe-raw' class='ns-cascade-target'>
        Cascade layer probe target (mounted raw import)
      </p>
      <LocalPluginIsland initialCount={7} label='mounted-raw-route-island' />
    </section>
  );
}
