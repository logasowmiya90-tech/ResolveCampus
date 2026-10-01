import { API_BASE_URL } from './auth.js'


async function officerRequest(path, accessToken, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The officer service did not respond. Please try again.')
    }
    throw new Error('Unable to connect to ResolveCampus. Check that the backend is running and try again.')
  } finally {
    clearTimeout(timeoutId)
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.')
  }

  if (!response.ok) {
    const message = response.status === 401
      ? 'Your session has expired. Sign in again to continue.'
      : response.status === 403
        ? 'This officer account is not authorized for this office or case.'
        : response.status === 404
          ? 'This case could not be found in your office queue.'
          : response.status === 409
            ? result.detail || 'That status transition is not allowed.'
            : response.status === 422
              ? 'Check the update details and try again.'
              : 'The officer service is temporarily unavailable. Please try again.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return result
}


export function getOfficerDashboard(accessToken, filters = {}) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) searchParams.set(key, value)
  }
  const query = searchParams.toString()
  return officerRequest(`/api/officer/grievances${query ? `?${query}` : ''}`, accessToken)
}


export function getOfficerCase(accessToken, caseId) {
  return officerRequest(`/api/officer/grievances/${encodeURIComponent(caseId)}`, accessToken)
}


export function updateOfficerCaseStatus(accessToken, caseId, status) {
  return officerRequest(`/api/officer/grievances/${encodeURIComponent(caseId)}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}


export function addOfficerCaseNote(accessToken, caseId, description) {
  return officerRequest(`/api/officer/grievances/${encodeURIComponent(caseId)}/events`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ description }),
  })
}