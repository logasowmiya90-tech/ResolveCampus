import LineIcon from './LineIcon.jsx'
import { formatDateTime } from '../utils/grievanceFormat.js'


function CaseTimeline({ events, showVisibility = false }) {
  const orderedEvents = [...events].sort((first, second) => (
    new Date(first.created_at).getTime() - new Date(second.created_at).getTime()
  ))

  return (
    <section aria-labelledby="case-timeline-title" className="case-timeline-section">
      <div className="case-section-heading">
        <div>
          <span className="dashboard-eyebrow">CASE HISTORY</span>
          <h2 id="case-timeline-title">Timeline</h2>
        </div>
        <span className="timeline-count">{events.length} {events.length === 1 ? 'event' : 'events'}</span>
      </div>

      {orderedEvents.length === 0 ? (
        <div className="timeline-empty-state">
          <span aria-hidden="true"><LineIcon name="clock" /></span>
          <p>No timeline events have been recorded yet.</p>
        </div>
      ) : (
        <ol className="case-timeline-list">
          {orderedEvents.map((event, index) => (
            <li className="case-timeline-event" key={`${event.event_type}-${event.created_at}-${index}`}>
              <span aria-hidden="true" className={`case-timeline-marker${index === 0 ? ' is-first' : ''}`}>
                {index === 0 && <LineIcon name="check" />}
              </span>
              <div className="case-timeline-copy">
                <strong>{event.description}</strong>
                <time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time>
                {showVisibility && event.is_student_visible === false && (
                  <span className="private-event-label">Internal note · not shown to student</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}


export default CaseTimeline