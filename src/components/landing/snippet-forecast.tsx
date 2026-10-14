import { Check, X } from 'lucide-react';
import { companies, openPipeline, pipeline, stageTotal, stageWeighted, usd, weightedForecast } from './data';
import { CompanyLogo, Panel } from './primitives';

const reasons = ['Price', 'Timing', 'Competitor', 'No decision'];

/** Weighted forecast table plus the "Mark as lost" flow. */
export function ForecastSnippet() {
  const open = pipeline.filter(stage => stage.id !== 'won');
  return (
    <div className='lp-stack' aria-hidden='true'>
      <Panel className='lp-forecast'>
        <div className='lp-panel-head'>
          <strong>Forecast</strong>
          <span className='lp-seg'><span>Q3</span><span className='is-on'>Q4</span></span>
        </div>
        <div className='lp-ftable'>
          <div className='lp-frow lp-frow-head'>
            <span>Stage</span><span>Value</span><span>Win %</span><span>Weighted</span>
          </div>
          {open.map(stage => (
            <div className='lp-frow' key={stage.id}>
              <span className='lp-fstage'>{stage.name}<small className='tnum'>{stage.deals.length}</small></span>
              <span className='tnum'>{usd(stageTotal(stage))}</span>
              <span className='lp-fprob'>
                <i><b style={{ width: `${stage.probability * 100}%` }} /></i>
                <span className='tnum'>{Math.round(stage.probability * 100)}%</span>
              </span>
              <span className='tnum'>{usd(stageWeighted(stage))}</span>
            </div>
          ))}
          <div className='lp-frow lp-frow-total'>
            <span>Total</span>
            <span className='tnum'>{usd(openPipeline)}</span>
            <span />
            <span className='tnum lp-accent-text'>{usd(weightedForecast)}</span>
          </div>
        </div>
      </Panel>
      <Panel className='lp-lost'>
        <div className='lp-lost-head'>
          <CompanyLogo company={companies.kestrel} size='sm' />
          <div>
            <strong>Support retainer</strong>
            <span className='tnum'>Kestrel Analytics · $22,000</span>
          </div>
          <X size={14} className='lp-muted-icon' />
        </div>
        <span className='lp-lost-label'>Lost reason</span>
        <div className='lp-reasons'>
          {reasons.map(reason => (
            <span key={reason} className={reason === 'Competitor' ? 'is-on' : ''}>
              {reason === 'Competitor' && <Check size={12} />}{reason}
            </span>
          ))}
        </div>
        <div className='lp-lost-note'>Went with an annual plan from a competitor.</div>
        <div className='lp-lost-actions'>
          <span className='lp-btn-mock'>Cancel</span>
          <span className='lp-btn-mock lp-btn-mock-ink'>Mark as lost</span>
        </div>
      </Panel>
    </div>
  );
}
