import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CaseTimeline from '../components/CaseTimeline.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { addOfficerCaseNote, getOfficerCase, updateOfficerCaseStatus } from '../services/officer.js'
import { formatDateTime, formatPriority, formatStatus, statusClass } from '../utils/grievanceFormat.js'


const NEXT_STATUS = {
  SUBMITTED: 'ASSIGNED',
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: null,
}


function OfficerCaseDetails() {
  const { caseId } = useParams()
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    setError('')
    getOfficerCase(accessToken, caseId)
      .then((result) => {
        if (isCurrent) setCaseData(result)
      })
      .catch((requestError) => {
        if (!isCurrent) return
        if (requestError.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [accessToken, caseId, logout, navigate, refreshKey])

  async function handleStatusUpdate(event) {
    event.preventDefault()
    if (!caseData) return
    const nextStatus = NEXT_STATUS[caseData.status]
    if (!nextStatus) return

    setIsUpdatingStatus(true)
    setActionMessage('')
    setError('')
    try {
      await updateOfficerCaseStatus(accessToken, caseData.case_id, nextStatus)
      setActionMessage(`Case status updated to ${formatStatus(nextStatus)}.`)
      setRefreshKey((key) => key + 1)
    } catch (requestError) {
      if (requestError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(requestError.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handleAddNote(event) {
    event.preventDefault()
    const cleanNote = note.trim()
    if (cleanNote.length < 4) {
      setError('Enter an update with at least 4 characters.')
      return
    }

    setIsAddingNote(true)
    setActionMessage('')
    setError('')
    try {
      await addOfficerCaseNote(accessToken, caseId, cleanNote)
      setNote('')
      setActionMessage('Internal note added. Students will not see this note.')
      setRefreshKey((key) => key + 1)
    } catch (requestError) {
      if (requestError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(requestError.message)
    } finally {
      setIsAddingNote(false)
    }
  }

  if (isLoading) return <div aria-live="polite" className="officer-state">Loading case details…</div>
  if (error && !caseData) {
    return (
      <section className="officer-state is-error" role="alert">
        <h2>We could not load this case</h2>
        <p>{error}</p>
        <Link className="button button-secondary" to="/officer">Back to assigned cases</Link>
      </section>
    )
  }
  if (!caseData) return null

  const nextStatus = NEXT_STATUS[caseData.status]

  return (
    <div className="officer-case-page">
      <div className="officer-case-heading">
        <div>
          <Link className="officer-back-link" to="/officer">← Assigned cases</Link>
          <span className="officer-eyebrow">CASE REVIEW</span>
          <h2>{caseData.case_id}</h2>
          <p>{caseData.category}</p>
        </div>
        <span className={`status-badge status-${statusClass(caseData.status)}`}>{formatStatus(caseData.status)}</span>
      </div>

      {error && <div className="officer-inline-message is-error" role="alert">{error}</div>}
      {actionMessage && <div className="officer-inline-message" role="status">{actionMessage}</div>}

      <section aria-labelledby="officer-complaint-title" className="officer-detail-panel">
        <div className="officer-detail-heading">
          <div>
            <span className="officer-eyebrow">COMPLAINT</span>
            <h3 id="officer-complaint-title">{caseData.title}</h3>
          </div>
          <span className={`priority-badge priority-${caseData.priority.toLowerCase()}`}>
            {formatPriority(caseData.priority)} priority
          </span>
        </div>
        <dl className="officer-detail-grid">
          <div className="officer-detail-wide">
            <dt>Description</dt>
            <dd className="officer-complaint-description">{caseData.description}</dd>
          </div>
          <div>
            <dt>Student reference</dt>
            <dd>{caseData.student_reference}</dd>
          </div>
          <div>
            <dt>Confidentiality</dt>
            <dd>{formatStatus(caseData.confidentiality)}</dd>
          </div>
          <div>
            <dt>Assigned office</dt>
            <dd>{caseData.assigned_office}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDateTime(caseData.created_at)}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{formatDateTime(caseData.deadline)}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd><span className={`status-badge status-${statusClass(caseData.status)}`}>{formatStatus(caseData.status)}</span></dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="officer-case-actions-title" className="officer-actions-grid">
        <form className="officer-action-panel" onSubmit={handleStatusUpdate}>
          <span className="officer-eyebrow">WORKFLOW</span>
          <h3 id="officer-case-actions-title">Update status</h3>
          <p>Status follows the defined case sequence.</p>
          {nextStatus ? (
            <>
              <div className="next-status-display">
                <span>Next available status</span>
                <strong>{formatStatus(nextStatus)}</strong>
              </div>
              <button className="button button-primary" disabled={isUpdatingStatus} type="submit">
                {isUpdatingStatus ? 'Updating…' : `Move to ${formatStatus(nextStatus)}`}
              </button>
            </>
          ) : (
            <div className="workflow-complete">This case is closed. No further status changes are available.</div>
          )}
        </form>

        <form className="officer-action-panel" onSubmit={handleAddNote}>
          <span className="officer-eyebrow">INTERNAL CASE NOTE</span>
          <h3>Add an update</h3>
          <p>This note is visible to authorized officers only, not to the student.</p>
          <label className="officer-note-label" htmlFor="officer-note">Update note</label>
          <textarea
            id="officer-note"
            maxLength={240}
            minLength={4}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a concise internal update"
            required
            rows={3}
            value={note}
          />
          <small>{note.length}/240 characters</small>
          <button className="button button-secondary" disabled={isAddingNote || note.trim().length < 4} type="submit">
            {isAddingNote ? 'Adding note…' : 'Add internal note'}
          </button>
        </form>
      </section>

      <CaseTimeline events={caseData.timeline} showVisibility />
    </div>
  )
}


export default OfficerCaseDetails