export const API_BASE_URL = 'http://127.0.0.1:8000'
const AUTH_STORAGE_KEY = 'resolvecampus.auth'
const VALID_ROLES = new Set(['STUDENT', 'OFFICER', 'ADMIN'])

export function dashboardPathForRole(role) {
  const paths = {
    STUDENT: '/student',
    OFFICER: '/officer',
    ADMIN: '/admin',
  }
  return paths[role] ?? '/login'
}

export async function authenticate(email, password) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The sign-in service did not respond. Check that the backend is running and try again.')
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
    if (response.status === 401) {
      throw new Error('The email or password you entered is incorrect.')
    }
    if (response.status === 422) {
      throw new Error('Enter a valid email address and password.')
    }
    throw new Error('Sign in is temporarily unavailable. Please try again shortly.')
  }

  const user = result.user
  if (
    !result.access_token ||
    !user ||
    !Number.isInteger(user.id) ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    !VALID_ROLES.has(user.role)
  ) {
    throw new Error('The server returned an incomplete sign-in response. Please try again.')
  }

  return {
    accessToken: result.access_token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

export function readAuthSession() {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null

    const session = JSON.parse(stored)
    const user = session.user
    if (
      typeof session.accessToken !== 'string' ||
      !session.accessToken ||
      !user ||
      !Number.isInteger(user.id) ||
      typeof user.name !== 'string' ||
      typeof user.email !== 'string' ||
      !VALID_ROLES.has(user.role)
    ) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return {
      accessToken: session.accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  } catch {
    return null
  }
}

export function writeAuthSession(session) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}