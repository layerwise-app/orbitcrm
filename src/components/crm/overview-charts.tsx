import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '~/components/ui/chart';
import type { SeriesPoint, stageSummary } from '~/lib/crm-insights';
import { money, stageNames } from '~/lib/crm';

const revenueConfig = { value: { label: 'Won', color: 'var(--vermilion)' } } satisfies ChartConfig;
const stageConfig = {
  value: { label: 'Pipeline', color: 'var(--paper-3)' },
  weighted: { label: 'Weighted', color: 'var(--vermilion)' },
} satisfies ChartConfig;

const moneyRow = (config: ChartConfig) => (value: unknown, name: unknown) => (
  <div className='chart-tip-row'>
    <span>{config[String(name)]?.label}</span>
    <strong className='tnum'>{money(Number(value))}</strong>
  </div>
);

export function RevenueChart({ points }: { points: SeriesPoint[] }) {
  return (
    <ChartContainer config={revenueConfig} className='chart aspect-auto h-[232px] w-full'>
      <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke='var(--line)' />
        <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(value: number) => money(value, true)} />
        <ChartTooltip cursor={{ fill: 'var(--paper-2)' }} content={<ChartTooltipContent formatter={moneyRow(revenueConfig)} />} />
        <Bar dataKey='value' fill='var(--color-value)' radius={[3, 3, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}

export function StageChart({ summary }: { summary: ReturnType<typeof stageSummary> }) {
  const data = summary.map((s) => ({ ...s, name: stageNames[s.stage] }));
  return (
    <ChartContainer config={stageConfig} className='chart aspect-auto h-[232px] w-full'>
      {/* The weighted bar overlaps the full-value bar (negative gap) so each row reads as "how much is likely". */}
      <BarChart data={data} layout='vertical' margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barGap={-16} barCategoryGap={18}>
        <XAxis type='number' hide />
        <YAxis type='category' dataKey='name' tickLine={false} axisLine={false} width={88} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={moneyRow(stageConfig)} />} />
        <Bar dataKey='value' fill='var(--color-value)' radius={3} barSize={16}>
          <LabelList dataKey='value' position='right' offset={8} className='chart-label' formatter={(value: unknown) => money(Number(value), true)} />
        </Bar>
        <Bar dataKey='weighted' fill='var(--color-weighted)' radius={3} barSize={16} />
      </BarChart>
    </ChartContainer>
  );
}
