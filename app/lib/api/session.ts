import type { ApiUser, AuthTokens } from './types'

const KEY = 'gathr.admin.session'
const DEVICE_KEY = 'gathr.admin.deviceToken'

export interface Session {
  tokens: AuthTokens
  user: ApiUser | null
}

type Listener = (session: Session | null) => void
const listeners = new Set<Listener>()

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Storage blocked (private mode); session lives in memory only.
  }
}

let memory: Session | null | undefined

export const getSession = (): Session | null => {
  if (typeof window === 'undefined') return null
  if (memory !== undefined) return memory
  const raw = read(KEY)
  try {
    memory = raw ? (JSON.parse(raw) as Session) : null
  } catch {
    memory = null
  }
  return memory
}

export const setSession = (session: Session | null) => {
  memory = session
  write(KEY, session ? JSON.stringify(session) : null)
  listeners.forEach((listener) => listener(session))
}

export const updateTokens = (tokens: AuthTokens) => {
  const current = getSession()
  setSession({ user: current?.user ?? null, tokens })
}

export const subscribeSession = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getDeviceToken = () => (typeof window === 'undefined' ? null : read(DEVICE_KEY))
export const setDeviceToken = (token: string | undefined) => {
  if (token) write(DEVICE_KEY, token)
}
