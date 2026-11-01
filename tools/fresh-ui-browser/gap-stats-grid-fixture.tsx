import { useState } from 'preact/hooks';
import { Icon } from '../../packages/fresh-ui/primitives.tsx';
import { StatsGrid } from '../../packages/fresh-ui/registry/components/ui/stats-grid.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { Badge } from '../../packages/fresh-ui/registry/components/ui/badge.tsx';

/** Real StatsGrid source and caller-owned content; no imitation layout or data engine. */
export function StatsGrids() {
  const [actions, setActions] = useState(0);
  return (
    <main id='stats-examples'>
      <h1>Stats grid examples</h1>
      {([2, 3, 4] as const).flatMap((columns) =>
        [false, true].map((joined) => (
          <section key={`${columns}-${joined}`} id={`stats-${columns}-${joined}`}>
            <h2>{columns} columns, {joined ? 'joined' : 'separate'}</h2>
            <StatsGrid columns={columns} joined={joined}>
              <StatsGrid.Card
                label='Net revenue'
                value='$284,920'
                detail={
                  <>
                    <span style={{ color: 'var(--ns-success-text)' }}>+8.2%</span>{' '}
                    vs. previous 30 days
                  </>
                }
                delta='up'
              />
              <StatsGrid.Card
                label='Orders'
                value='3,182'
                detail={
                  <>
                    <span style={{ color: 'var(--ns-success-text)' }}>+4.1%</span>{' '}
                    vs. previous 30 days
                  </>
                }
                delta='up'
              />
              {columns >= 3 && (
                <StatsGrid.Card
                  label='Average order value'
                  value='$89.54'
                  detail={
                    <>
                      <span style={{ color: 'var(--ns-destructive-text)' }}>-1.3%</span>{' '}
                      vs. previous 30 days
                    </>
                  }
                  delta='down'
                />
              )}
              {columns === 4 && (
                <StatsGrid.Card
                  label='Refund rate'
                  value='1.8%'
                  detail='0.2 pts vs. previous 30 days'
                />
              )}
            </StatsGrid>
          </section>
        ))
      )}
      <section id='stats-hero'>
        <h2>Hero lead card, badge and icon</h2>
        <StatsGrid columns={3}>
          <StatsGrid.Card
            variant='hero'
            label='Net revenue'
            value='$284,920'
            delta='up'
            detail='+8.2% vs. previous 30 days'
          />
          <StatsGrid.Card
            label='Orders'
            value='3,182'
            badge={<Badge variant='success'>Live</Badge>}
            detail='+4.1% vs. previous 30 days'
            delta='up'
          />
          <StatsGrid.Card
            label='Average order value'
            value='$89.54'
            icon={<Icon name='info' size={14} />}
            detail='-1.3% vs. previous 30 days'
            delta='down'
          />
        </StatsGrid>
      </section>
      <section id='stats-hero-badge'>
        <h2>Optional hero badge</h2>
        <StatsGrid>
          <StatsGrid.Card
            variant='hero'
            label='Revenue'
            value='$284,920'
            detail='+8.2% versus previous 30 days'
            delta='up'
            badge={<Badge variant='secondary'>Current period</Badge>}
          />
        </StatsGrid>
      </section>
      <section id='stats-native'>
        <h2>Caller controls and decorative content</h2>
        <Button type='button' variant='ghost' size='sm' data-before-stats>Before metrics</Button>
        <StatsGrid>
          <StatsGrid.Card
            label='Actions'
            value='42'
            badge={
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setActions((n) => n + 1)}
              >
                Inspect metrics
              </Button>
            }
            detail={<a href='#metrics-details'>Read metric details</a>}
            sparkline={<button type='button'>Hidden sparkline control</button>}
            ticks={<button type='button'>Hidden ticks control</button>}
            blockbars={<button type='button'>Hidden bars control</button>}
            icon={<button type='button'>Decorative icon control</button>}
          />
        </StatsGrid>
        <Button type='button' variant='ghost' size='sm' data-after-stats>After metrics</Button>
        <output aria-label='Metric actions'>{actions}</output>
      </section>
      <section id='stats-container' style={{ maxWidth: 330 }}>
        <h2>Narrow container</h2>
        <StatsGrid columns={4}>
          <StatsGrid.Card label='First' value='1' />
          <StatsGrid.Card label='Second' value='2' />
          <StatsGrid.Card label='Third' value='3' />
          <StatsGrid.Card label='Fourth' value='4' />
        </StatsGrid>
      </section>
      <section id='stats-default'>
        <h2>Automatic grid</h2>
        <StatsGrid>
          {[1, 2, 3, 4, 5].map((n) => <StatsGrid.Card key={n} label={`Metric ${n}`} value={n} />)}
        </StatsGrid>
      </section>
    </main>
  );
}
