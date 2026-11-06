// Admin endpoints added in the latest swagger.json, plus the existing
// status endpoint the Users table needs for blocking.
import { apiRequest } from './client'
import { toPage } from './adapters'
import type {
  PageQuery,
  Raw,
  ReportsQuery,
  ReviewDecision,
  UserStatus,
  UsersQuery,
  WithdrawalsQuery
} from './types'

type Opts = { signal?: AbortSignal }

// Dashboard
export const getDashboard = (o?: Opts) => apiRequest<Raw>('/admin/dashboard', o)

// Users
export const getUserStats = (o?: Opts) => apiRequest<Raw>('/admin/users/stats', o)

export const listUsers = async (query: UsersQuery, o?: Opts) =>
  toPage(await apiRequest('/admin/users', { ...o, query: { ...query } }), query)

export const getUser = (id: string, o?: Opts) =>
  apiRequest<Raw>(`/admin/users/${encodeURIComponent(id)}`, o)

export const updateUserStatus = (id: string, status: UserStatus) =>
  apiRequest<Raw>(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status }
  })

// KYC
export const listPendingKyc = async (query: PageQuery, o?: Opts) =>
  toPage(await apiRequest('/admin/kyc/pending', { ...o, query: { ...query } }), query)

export const approveKyc = (userId: string) =>
  apiRequest(`/admin/kyc/${encodeURIComponent(userId)}/approve`, { method: 'POST' })

export const rejectKyc = (userId: string, reason: string) =>
  apiRequest(`/admin/kyc/${encodeURIComponent(userId)}/reject`, {
    method: 'POST',
    body: { reason }
  })

// Withdrawals
export const listWithdrawals = async (query: WithdrawalsQuery, o?: Opts) =>
  toPage(await apiRequest('/admin/withdrawals', { ...o, query: { ...query } }), query)

export const getWithdrawal = (id: string, o?: Opts) =>
  apiRequest<Raw>(`/admin/withdrawals/${encodeURIComponent(id)}`, o)

// Reports / flagged content
export const listFlaggedContent = async (query: ReportsQuery, o?: Opts) =>
  toPage(await apiRequest('/admin/flagged-content', { ...o, query: { ...query } }), query)

export const listReports = async (query: ReportsQuery, o?: Opts) =>
  toPage(await apiRequest('/admin/reports', { ...o, query: { ...query } }), query)

export const getReportStats = (o?: Opts) => apiRequest<Raw>('/admin/reports/stats', o)

export const getReport = (id: string, o?: Opts) =>
  apiRequest<Raw>(`/admin/reports/${encodeURIComponent(id)}`, o)

export const reviewReport = (id: string, status: ReviewDecision, reason: string) =>
  apiRequest(`/admin/reports/${encodeURIComponent(id)}/review`, {
    method: 'PATCH',
    body: { status, reason }
  })

/** InviteUserSearchResponseDto — from GET /users/search. */
export interface UserSearchResult {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  organizationName?: string | null
}

/** GET /users/search — `search` is an email or username (optionally @-prefixed), min 2 chars. */
export const searchUsers = async (search: string, o?: Opts) =>
  toPage(await apiRequest('/users/search', { ...o, query: { search, page: 1, limit: 10 } })).items as unknown as UserSearchResult[]
