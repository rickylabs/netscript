import LocalPluginIsland from './island.tsx';

export const css = ['/mounted-explicit.css'];

export default function LocalPluginExplicitCssRoute() {
  return (
    <section id='mounted-explicit-plugin-route' class='plugin-route-panel plugin-explicit-box' data-ns-plugin='acme-local'>
      <h1 id='mounted-explicit-title'>Mounted Plugin Route (explicit export const css)</h1>
      <p id='cascade-probe' class='ns-cascade-target'>
        Cascade layer probe target (mounted explicit css)
      </p>
      <LocalPluginIsland initialCount={9} label='mounted-explicit-island' />
    </section>
  );
}
