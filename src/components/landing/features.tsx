import type { ReactNode } from 'react';
import { ContactsSnippet } from './snippet-contacts';
import { ForecastSnippet } from './snippet-forecast';
import { InsightsSnippet } from './snippet-insights';
import { PaletteSnippet, TasksSnippet, TimelineSnippet } from './snippet-workflow';

/** Product sections: alternating split rows, one wide row, then a bento grid. */
export function Features() {
  return (
    <>
      <FeatureRow
        id='pipeline'
        title='Forecast from the pipeline you already have.'
        body='Stage probabilities roll up into a weighted forecast, and every lost deal records why.'
        visual={<ForecastSnippet />}
      />
      <FeatureRow
        id='insights'
        reverse
        title='Know where revenue comes from.'
        body='Won revenue, pipeline by stage, and win rate, from the last 30 days to the last 12 months.'
        visual={<InsightsSnippet />}
      />
      <section id='contacts' className='lp-section lp-wide' aria-labelledby='contacts-title'>
        <div className='lp-wide-copy'>
          <h2 id='contacts-title'>Every contact, one fast table.</h2>
          <p>Sort any column, stack filters, and update hundreds of records at once.</p>
        </div>
        <ContactsSnippet />
      </section>
      <section id='workflow' className='lp-section' aria-labelledby='workflow-title'>
        <div className='lp-wide-copy'>
          <h2 id='workflow-title'>Built for the daily follow-up.</h2>
          <p>Every deal’s history, the next task, and any record a keystroke away.</p>
        </div>
        <div className='lp-bento'>
          <BentoCell className='lp-bento-timeline' title='Record timeline' body='Notes, calls, emails, and meetings, logged in one place.'>
            <TimelineSnippet />
          </BentoCell>
          <BentoCell className='lp-bento-palette' title='Command palette' body={<>Press <kbd className='lp-kbd'>⌘K</kbd> to jump to any record or action.</>}>
            <PaletteSnippet />
          </BentoCell>
          <BentoCell className='lp-bento-tasks' title='Tasks' body='Overdue, today, and upcoming. Nothing slips.'>
            <TasksSnippet />
          </BentoCell>
        </div>
      </section>
    </>
  );
}

function FeatureRow({ id, title, body, visual, reverse = false }: { id: string; title: string; body: string; visual: ReactNode; reverse?: boolean }) {
  return (
    <section id={id} className={`lp-section lp-row ${reverse ? 'is-reverse' : ''}`} aria-labelledby={`${id}-title`}>
      <div className='lp-row-copy'>
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{body}</p>
      </div>
      <div className='lp-row-visual'>{visual}</div>
    </section>
  );
}

function BentoCell({ className, title, body, children }: { className: string; title: string; body: ReactNode; children: ReactNode }) {
  return (
    <article className={`lp-bento-cell ${className}`}>
      <div className='lp-bento-copy'>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <div className='lp-bento-visual'>{children}</div>
    </article>
  );
}
