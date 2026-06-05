import type { HealthRouteData } from '../(_shared)/health.ts';

export default function HealthView({ payload }: HealthRouteData) {
  return (
    <div class='min-h-screen bg-ns-bg text-ns-fg'>
      <section class='ns-shell ns-section'>
        <div class='mx-auto max-w-3xl ns-stack ns-stack--md'>
          <div class='ns-stack ns-stack--xs'>
            <span class='ns-badge ns-badge--success w-fit'>healthy</span>
            <h1 class='text-3xl font-semibold text-ns-fg sm:text-4xl'>playground health</h1>
            <p class='text-sm leading-7 text-ns-muted-fg sm:text-base'>
              Requesting <code>/health</code> with <code>Accept: application/json</code>{' '}
              returns the probe payload directly. Browser requests render the same payload through
              the shared builder route.
            </p>
          </div>

          <div class='rounded-xl border border-ns-border bg-ns-surface p-5'>
            <pre class='overflow-x-auto text-sm leading-6 text-ns-muted-fg'>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
