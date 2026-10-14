import { ArrowUpRight } from 'lucide-react';
import { pipeline, stageTotal, usd, wonByMonth, wonLast12 } from './data';
import { Panel } from './primitives';

const kpis = [
  { label: 'Won revenue', value: usd(wonLast12), delta: '+18%' },
  { label: 'Win rate', value: '41%', delta: '+4 pts' },
  { label: 'Avg. deal', value: '$24,600', delta: '+6%' },
];

/** Overview insights: KPIs, won revenue by month, and pipeline by stage. */
export function InsightsSnippet() {
  const open = pipeline.filter(stage => stage.id !== 'won');
  const maxStage = Math.max(...open.map(stageTotal));
  return (
    <Panel className='lp-insights'>
      <div aria-hidden='true'>
        <div className='lp-panel-head'>
          <strong>Overview</strong>
          <span className='lp-seg'><span>30D</span><span>90D</span><span className='is-on'>12M</span></span>
        </div>
        <div className='lp-kpis'>
          {kpis.map(kpi => (
            <div key={kpi.label}>
              <span>{kpi.label}</span>
              <strong className='tnum'>{kpi.value}</strong>
              <small className='tnum'><ArrowUpRight size={11} />{kpi.delta}</small>
            </div>
          ))}
        </div>
        <div className='lp-insights-grid'>
          <div className='lp-chart-card'>
            <span className='lp-chart-title'>Won revenue</span>
            <RevenueBars />
          </div>
          <div className='lp-chart-card'>
            <span className='lp-chart-title'>Pipeline by stage</span>
            <div className='lp-hbars'>
              {open.map(stage => (
                <div key={stage.id}>
                  <span>{stage.name}</span>
                  <i><b style={{ width: `${(stageTotal(stage) / maxStage) * 100}%` }} /></i>
                  <span className='tnum'>{usd(stageTotal(stage), true)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RevenueBars() {
  const width = 300;
  const height = 132;
  const max = 80_000;
  const gap = 6;
  const barWidth = (width - gap * (wonByMonth.length - 1)) / wonByMonth.length;
  return (
    <svg className='lp-bars' viewBox={`0 0 ${width} ${height + 18}`} role='img' aria-label='Won revenue by month'>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1='0' x2={width} y1={height - height * f} y2={height - height * f} className='lp-grid' />
      ))}
      {wonByMonth.map((row, i) => {
        const h = (row.value / max) * height;
        const x = i * (barWidth + gap);
        const last = i === wonByMonth.length - 1;
        return (
          <g key={row.month}>
            <rect x={x} y={height - h} width={barWidth} height={h} rx='2.5' className={last ? 'lp-bar-accent' : 'lp-bar'} />
            {(i % 3 === 2 || last) && <text x={x + barWidth / 2} y={height + 14} textAnchor='middle' className='lp-axis'>{row.month}</text>}
          </g>
        );
      })}
    </svg>
  );
}
