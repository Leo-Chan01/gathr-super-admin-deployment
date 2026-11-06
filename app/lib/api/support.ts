// Admin support desk. Types follow the spec's Support* schemas (these are typed).
import { apiRequest } from './client'
import { num, toPage } from './adapters'
import type { Page, PageQuery, Raw } from './types'

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]
export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]
export const TICKET_CATEGORIES = ['GENERAL', 'ACCOUNT', 'BILLING', 'TECHNICAL', 'COMMUNITY', 'OTHER'] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]
export type TicketScope = 'active' | 'archived' | 'all'

/** SupportProfileDto */
export interface SupportProfile {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  avatar: string | null
  email?: string | null
}

/** SupportMessageResponseDto */
export interface SupportMessage {
  id: string
  ticketId: string
  authorId: string
  content: string
  attachmentUrls?: string[]
  isInternal: boolean
  isStaff: boolean
  createdAt: string
  author?: SupportProfile
  ticketStatus?: TicketStatus
}

/** SupportTicketResponseDto */
export interface SupportTicket {
  id: string
  userId: string
  assigneeId: string | null
  subject: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  version: number
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  archivedAt: string | null
  requester: SupportProfile
  assignee: SupportProfile | null
  _count: { messages: number }
  messages?: SupportMessage[]
}

export interface TicketQuery extends PageQuery {
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
  search?: string
  assigneeId?: string
  scope?: TicketScope
}

export interface TicketUpdate {
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  /** `null` unassigns. */
  assigneeId?: string | null
}

type Opts = { signal?: AbortSignal }
const ticketPath = (id: string) => `/admin/support/tickets/${encodeURIComponent(id)}`

export const profileName = (profile?: SupportProfile | null) => {
  if (!profile) return 'Unassigned'
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  return name || (profile.username ? `@${profile.username}` : profile.email ?? 'Gathr user')
}

export const listTickets = async (query: TicketQuery, o?: Opts) =>
  toPage(await apiRequest('/admin/support/tickets', { ...o, query: { ...query } }), query) as unknown as Page<SupportTicket>

export interface TicketStats {
  open?: number
  inProgress?: number
  waiting?: number
  resolved?: number
  closed?: number
  archived?: number
}

/** Response shape isn't documented; reads either flat keys or a `byStatus` map. */
export const getTicketStats = async (o?: Opts): Promise<TicketStats> => {
  const raw = await apiRequest<Raw>('/admin/support/tickets/stats', o)
  return {
    open: num(raw, 'OPEN', 'open', 'byStatus.OPEN'),
    inProgress: num(raw, 'IN_PROGRESS', 'inProgress', 'byStatus.IN_PROGRESS'),
    waiting: num(raw, 'WAITING_FOR_USER', 'waitingForUser', 'waiting', 'byStatus.WAITING_FOR_USER'),
    resolved: num(raw, 'RESOLVED', 'resolved', 'byStatus.RESOLVED'),
    closed: num(raw, 'CLOSED', 'closed', 'byStatus.CLOSED'),
    archived: num(raw, 'archived', 'ARCHIVED')
  }
}

export const listAssignees = async (o?: Opts) =>
  (toPage(await apiRequest('/admin/support/tickets/assignees', { ...o, query: { page: 1, limit: 100 } })).items as unknown as SupportProfile[])

export const getTicket = (id: string, o?: Opts) => apiRequest<SupportTicket>(ticketPath(id), o)

export const updateTicket = (id: string, patch: TicketUpdate) =>
  apiRequest<SupportTicket>(ticketPath(id), { method: 'PATCH', body: patch })

export const archiveTicket = (id: string) => apiRequest(ticketPath(id), { method: 'DELETE' })

export const restoreTicket = (id: string) => apiRequest(`${ticketPath(id)}/restore`, { method: 'POST' })

export const listMessages = async (id: string, o?: Opts) =>
  (toPage(await apiRequest(`${ticketPath(id)}/messages`, { ...o, query: { page: 1, limit: 100 } })).items as unknown as SupportMessage[])

/** Public reply — moves the ticket to WAITING_FOR_USER. */
export const replyToTicket = (id: string, content: string) =>
  apiRequest<SupportMessage>(`${ticketPath(id)}/messages`, { method: 'POST', body: { content } })

/** Private staff note — doesn't change the status. */
export const addTicketNote = (id: string, content: string) =>
  apiRequest<SupportMessage>(`${ticketPath(id)}/notes`, { method: 'POST', body: { content } })
