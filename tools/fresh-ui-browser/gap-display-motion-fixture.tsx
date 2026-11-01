import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { Chart } from '../../packages/fresh-ui/registry/components/ui/chart.tsx';
import { Carousel } from '../../packages/fresh-ui/registry/components/ui/carousel.tsx';

export function DisplayMotion() {
  const [locale, setLocale] = useState('en-US');
  const [changes, setChanges] = useState(0), [count, setCount] = useState(3);
  const slides = ['One', 'Two', 'Three'].map((name) => ({
    label: name,
    content: (
      <article
        style={{
          boxSizing: 'border-box',
          blockSize: '100%',
          display: 'grid',
          placeItems: 'center',
          padding: 'var(--ns-card-padding)',
          background: 'var(--ns-muted)',
        }}
      >
        <a href={`#project-${name.toLowerCase()}`}>Project {name}</a>
      </article>
    ),
  }));
  return (
    <>
      <h2>Chart and carousel components</h2>
      <section aria-label='Series chart' id='series-chart'>
        <select
          aria-label='Chart number locale'
          value={locale}
          onChange={(event) => setLocale(event.currentTarget.value)}
        >
          <option value='en-US'>English numbers</option>
          <option value='de-DE'>German numbers</option>
        </select>
        <Chart
          title='Revenue trend'
          locale={locale}
          description='Monthly source values'
          series={[{ label: 'Web' }, { label: 'Retail' }]}
          data={[{ label: 'January', values: [20, -5] }, { label: 'February', values: [30, 0] }, {
            label: 'March',
            values: [40, 15],
          }]}
        />
      </section>
      <section aria-label='Chart states' id='series-chart-states'>
        <Chart title='Pending revenue' state='loading' series={[{ label: 'Web' }]} data={[]} />
        <Chart title='Empty revenue' series={[{ label: 'Web' }]} data={[]} />
        <Chart
          title='One point'
          type='line'
          series={[{ label: 'Web' }]}
          data={[{ label: 'Now', values: [0] }]}
        />
      </section>
      <section aria-label='Horizontal carousel' id='carousel-horizontal'>
        <Carousel
          label='Projects'
          slides={slides.slice(0, count)}
          counter
          onIndexChange={() => setChanges((previous) => previous + 1)}
        />
        <output aria-label='Project slide changes'>{changes}</output>
        <Button type='button' onClick={() => setCount(1)}>Keep first project only</Button>
      </section>
      <section aria-label='Vertical carousel' id='carousel-vertical'>
        <Carousel
          label='Vertical projects'
          slides={slides}
          orientation='vertical'
          controls='inside'
          counter
        />
      </section>
      <section aria-label='Empty carousel' id='carousel-empty'>
        <Carousel label='Empty projects' slides={[]} counter />
      </section>
    </>
  );
}
