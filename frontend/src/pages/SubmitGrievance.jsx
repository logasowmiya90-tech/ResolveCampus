import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LineIcon from '../components/LineIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createGrievance } from '../services/grievances.js'


const CATEGORIES = [
  'Scholarship',
  'Examination',
  'Certificates/Documents',
  'Fees',
  'Hostel',
  'Other',
]


function SubmitGrievance() {
  const { accessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    confidentiality: 'NORMAL',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdCase, setCreatedCase] = useState(null)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const payload = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      confidentiality: form.confidentiality,
    }

    if (!payload.category || payload.title.length < 5 || payload.description.length < 10) {
      setError('Choose a category and provide a title and description with enough detail.')
      return
    }

    setIsSubmitting(true)
    try {
      const grievance = await createGrievance(accessToken, payload)
      setCreatedCase(grievance)
    } catch (requestError) {
      if (requestError.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(requestError.message || 'Your grievance could not be submitted. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdCase) {
    return (
      <section aria-labelledby="submission-success-title" className="submission-success">
        <span aria-hidden="true" className="submission-success-icon"><LineIcon name="check" /></span>
        <span className="dashboard-eyebrow">CASE SUBMITTED</span>
        <h2 id="submission-success-title">Your grievance is in the system.</h2>
        <p>Keep this case ID to follow its status and timeline.</p>
        <div className="success-case-id">
          <span>CASE ID</span>
          <strong>{createdCase.case_id}</strong>
        </div>
        <div className="submission-success-actions">
          <Link className="button button-primary" to={`/student/grievances/${encodeURIComponent(createdCase.case_id)}`}>View Case</Link>
          <Link className="button button-secondary" to="/student">Back to Dashboard</Link>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="submit-grievance-title" className="grievance-page-content">
      <div className="grievance-page-heading">
        <div>
          <span className="dashboard-eyebrow">NEW CASE</span>
          <h2 id="submit-grievance-title">Submit a Grievance</h2>
          <p>Share the details so the appropriate office can review your concern.</p>
        </div>
      </div>

      <form className="grievance-form" onSubmit={handleSubmit}>
        <div className="grievance-form-grid">
          <div className="grievance-field">
            <label htmlFor="grievance-category">Category <span aria-hidden="true">*</span></label>
            <select id="grievance-category" name="category" onChange={updateField} required value={form.category}>
              <option value="">Select a category</option>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>

          <div className="grievance-field">
            <label htmlFor="grievance-title">Title <span aria-hidden="true">*</span></label>
            <input
              autoComplete="off"
              id="grievance-title"
              maxLength={160}
              minLength={5}
              name="title"
              onChange={updateField}
              placeholder="Summarize your concern"
              required
              value={form.title}
            />
            <small>5 to 160 characters</small>
          </div>

          <div className="grievance-field grievance-field-wide">
            <label htmlFor="grievance-description">Description <span aria-hidden="true">*</span></label>
            <textarea
              id="grievance-description"
              maxLength={10000}
              minLength={10}
              name="description"
              onChange={updateField}
              placeholder="Include relevant details to help the office understand your concern."
              required
              rows={6}
              value={form.description}
            />
            <small>10 to 10,000 characters</small>
          </div>

          <div className="grievance-field">
            <label htmlFor="grievance-priority">Priority</label>
            <select id="grievance-priority" name="priority" onChange={updateField} value={form.priority}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <small>Expected response window is based on priority.</small>
          </div>

          <div className="grievance-field">
            <label htmlFor="grievance-confidentiality">Confidentiality</label>
            <select id="grievance-confidentiality" name="confidentiality" onChange={updateField} value={form.confidentiality}>
              <option value="NORMAL">Normal</option>
              <option value="CONFIDENTIAL">Confidential</option>
            </select>
            <small>Confidential cases are handled with restricted access.</small>
          </div>
        </div>

        {error && <div aria-live="polite" className="grievance-form-error" role="alert">{error}</div>}

        <div className="grievance-form-actions">
          <Link className="button button-secondary" to="/student">Cancel</Link>
          <button className="button button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Submitting…' : 'Submit Grievance'}
          </button>
        </div>
      </form>
    </section>
  )
}


export default SubmitGrievance