import { apiRequest } from './client'
import { getDeviceToken, getSession, setDeviceToken, setSession } from './session'
import type { ApiUser, AuthResponse, AuthTokens, LoginInitiateResponse } from './types'

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'MODERATOR'])

export class NotAdminError extends Error {
  constructor() {
    super('This account does not have admin access.')
    this.name = 'NotAdminError'
  }
}

const startSession = (user: ApiUser, tokens: AuthTokens, deviceToken?: string) => {
  if (!ADMIN_ROLES.has(user.role)) throw new NotAdminError()
  setDeviceToken(deviceToken)
  setSession({ user, tokens })
}

export type LoginResult = { status: 'otp'; destination: string } | { status: 'done' }

/** POST /auth/login — skips OTP when the stored device token is still trusted. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await apiRequest<LoginInitiateResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password, deviceToken: getDeviceToken() ?? undefined }
  })

  if (!response.requiresOtp && response.user && response.tokens) {
    startSession(response.user, response.tokens, response.deviceToken)
    return { status: 'done' }
  }
  return { status: 'otp', destination: response.email ?? email }
}

/** POST /auth/login/verify-otp */
export async function verifyLoginOtp(email: string, otp: string) {
  const response = await apiRequest<AuthResponse>('/auth/login/verify-otp', {
    method: 'POST',
    auth: false,
    body: { email, otp }
  })
  startSession(response.user, response.tokens, response.deviceToken)
}

/** POST /auth/logout — always clears the local session, even if the call fails. */
export async function logout() {
  const refreshToken = getSession()?.tokens.refreshToken
  try {
    await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } })
  } catch {
    // Token may already be invalid; nothing else to do.
  } finally {
    setSession(null)
  }
}
