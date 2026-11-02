import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { Chart } from '../../registry/components/ui/chart.tsx';

Deno.test('Chart rejects mismatched and non-finite data instead of drawing misleading geometry', () => {
  for (const values of [[], [1, 2], [NaN], [Infinity]]) {
    assertThrows(
      () =>
        render(
          <Chart title='Invalid' series={[{ label: 'A' }]} data={[{ label: 'Now', values }]} />,
        ),
      RangeError,
    );
  }
  for (const count of [0, 4]) {
    assertThrows(
      () =>
        render(
          <Chart
            title='Invalid'
            series={Array.from({ length: count }, () => ({ label: 'A' }))}
            data={[]}
          />,
        ),
      RangeError,
    );
  }
});

Deno.test('Chart preserves zero, negative and one-point data with finite accessible output', () => {
  for (const value of [-12, 0, 12]) {
    const html = render(
      <Chart
        title='One point'
        type='line'
        series={[{ label: 'Observed' }]}
        data={[{ label: 'Now', values: [value] }]}
      />,
    );
    assertEquals(/NaN|Infinity/.test(html), false);
    assertStringIncludes(html, '<circle');
    assertStringIncludes(html, 'One point source values');
    assertStringIncludes(html, String(value));
    assertStringIncludes(html, 'data-state="rest"');
  }
});

Deno.test('Chart formats source values with an explicit locale on the server', () => {
  const props = {
    title: 'Localized',
    series: [{ label: 'Observed' }],
    data: [{ label: 'Now', values: [1000.5] }],
  };
  assertStringIncludes(render(<Chart {...props} />), '1,000.5');
  assertStringIncludes(render(<Chart {...props} locale='de-DE' />), '1.000,5');
});
