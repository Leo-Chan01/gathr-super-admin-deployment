'use client'

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { getSession, subscribeSession, type Session } from '../lib/api/session'
import { logout as apiLogout } from '../lib/api/auth'
import { getMe } from '../lib/api/profile'

interface AuthContextValue {
  /** `undefined` until the client has read storage (avoids SSR flash). */
  session: Session | null | undefined
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: undefined,
  logout: async () => {}
})

const subscribe = (onChange: () => void) => subscribeSession(onChange)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSyncExternalStore(subscribe, getSession, () => undefined)
  const userId = session?.user?.id ?? (session ? 'unknown' : null)

  // Refresh the stored user from /users/me once per sign-in, so fields the
  // login response leaves out (avatar, banner…) and later edits show up.
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    getMe({ signal: controller.signal }).catch(() => {
      // Non-fatal: keep the user from the login response.
    })
    return () => controller.abort()
  }, [userId])

  return (
    <AuthContext.Provider value={{ session, logout: apiLogout }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
