/** Can one process drive several GPUIX windows that share state? */
import { render } from 'gpuix-preact';
import { signal } from '@preact/signals';

const ticks = signal(0);
const View = ({ name }: { name: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', padding: 24, gap: 8, backgroundColor: name === 'one' ? '#fde8e8' : '#e8eefd', width: '100%', height: '100%' }}>
    <text style={{ fontSize: 28 }}>{`window ${name}`}</text>
    <text style={{ fontSize: 20 }}>{`shared ticks: ${ticks.value}`}</text>
  </div>
);
const t0 = performance.now();
const one = render(<View name='one' />, { title: 'one', width: 400, height: 300, onClose: () => {} });
console.log(`WINDOW one ${Math.round(performance.now() - t0)} ms`);
setTimeout(() => {
  const t1 = performance.now();
  try {
    const two = render(<View name='two' />, { title: 'two', width: 420, height: 320, onClose: () => {} });
    console.log(`WINDOW two ${Math.round(performance.now() - t1)} ms`, typeof two.renderer);
  } catch (error) {
    console.log('WINDOW two FAILED', String(error));
  }
}, 1500);
setInterval(() => ticks.value++, 250);
setTimeout(() => { console.log('RSS', Math.round(Deno.memoryUsage().rss / 1048576)); Deno.exit(0); }, 6000);
void one;
