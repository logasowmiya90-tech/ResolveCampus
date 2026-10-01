import { API_BASE_URL } from './auth.js'


async function adminRequest(path, accessToken) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The admin service did not respond. Please try again.')
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
    const error = new Error(
      response.status === 401
        ? 'Your session has expired. Sign in again to continue.'
        : response.status === 403
          ? 'This admin account is not authorized to view this information.'
          : response.status === 404
            ? 'This case could not be found or is not available to this admin account.'
            : 'Admin reporting is temporarily unavailable. Please try again.',
    )
    error.status = response.status
    throw error
  }

  return result
}


export const getAdminSummary = (token) => adminRequest('/api/admin/summary', token)
export const getAdminCategories = (token) => adminRequest('/api/admin/categories', token)
export const getAdminStatuses = (token) => adminRequest('/api/admin/status', token)
export const getAdminOffices = (token) => adminRequest('/api/admin/offices', token)
export const getAdminOverdue = (token) => adminRequest('/api/admin/overdue', token)
export const getAdminRecurring = (token) => adminRequest('/api/admin/recurring', token)
export const getAdminCase = (token, caseId) => (
  adminRequest(`/api/admin/grievances/${encodeURIComponent(caseId)}`, token)
)