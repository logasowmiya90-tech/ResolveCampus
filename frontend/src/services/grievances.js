import { API_BASE_URL } from './auth.js'


export class GrievanceRequestError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'GrievanceRequestError'
    this.status = status
  }
}


async function grievanceRequest(path, accessToken, options = {}) {
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
      throw new Error('The grievance service did not respond. Please try again.')
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
    let message = 'The grievance service is temporarily unavailable. Please try again.'
    if (response.status === 401) {
      message = 'Your session has expired. Sign in again to continue.'
    } else if (response.status === 403) {
      message = 'You do not have permission to access this grievance.'
    } else if (response.status === 404) {
      message = 'This grievance could not be found.'
    } else if (response.status === 422) {
      message = 'Check the grievance details and try again.'
    }
    throw new GrievanceRequestError(message, response.status)
  }

  return result
}


export function createGrievance(accessToken, grievance) {
  return grievanceRequest('/api/grievances', accessToken, {
    method: 'POST',
    body: JSON.stringify(grievance),
  })
}


export function getMyGrievances(accessToken) {
  return grievanceRequest('/api/grievances', accessToken)
}


export function getGrievance(accessToken, caseId) {
  return grievanceRequest(`/api/grievances/${encodeURIComponent(caseId)}`, accessToken)
}


export function getGrievanceTimeline(accessToken, caseId) {
  return grievanceRequest(
    `/api/grievances/${encodeURIComponent(caseId)}/timeline`,
    accessToken,
  )
}