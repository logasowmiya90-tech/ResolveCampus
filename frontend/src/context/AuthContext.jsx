import { createContext, useContext, useState } from 'react'
import {
  authenticate,
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from '../services/auth.js'


const AuthContext = createContext(null)


export function AuthProvider({ children }) {
  const [session, setSession] = useState(readAuthSession)

  async function login(email, password) {
    const nextSession = await authenticate(email, password)
    try {
      writeAuthSession(nextSession)
    } catch {
      throw new Error('Your browser could not save this sign-in session. Check your privacy settings and try again.')
    }
    setSession(nextSession)
    return nextSession.user
  }

  function logout() {
    clearAuthSession()
    setSession(null)
  }

  const value = {
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}