// The signed-in admin's notification inbox. Response bodies aren't in the
// spec (the schema was dropped from the latest export), so items are read
// defensively via `pick`.
import { apiRequest } from './client'
import { num, pick, str, toPage } from './adapters'
import type { PageMeta, Raw } from './types'

type Opts = { signal?: AbortSignal }

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt?: string
  /** In-app destination derived from the notification type/entity. */
  href?: string
}

const routeFor = (type: string, entityType?: string): string | undefined => {
  const key = `${type} ${entityType ?? ''}`.toUpperCase()
  if (/REPORT|FLAG/.test(key)) return '/reports'
  if (/KYC|VERIFICATION|BUSINESS/.test(key)) return '/users?tab=pending'
  if (/WITHDRAW|PAYOUT|WALLET|DONATION/.test(key)) return '/wallets'
  if (/SUPPORT|TICKET/.test(key)) return '/help-support'
  if (/IMPACT|GATHR|COMMENT|LIKE|COMMUNITY|EVENT/.test(key)) return '/gathr-feed'
  return undefined
}

const toNotification = (raw: Raw): AppNotification => {
  const type = str(raw, 'type', 'category', 'kind') ?? 'GENERAL'
  const readAt = pick(raw, 'readAt')
  const read = Boolean(pick(raw, 'isRead', 'read')) || Boolean(readAt)
  return {
    id: str(raw, 'id') ?? '',
    type,
    title: str(raw, 'title', 'subject', 'heading') ?? type.toLowerCase().replace(/_/g, ' '),
    body: str(raw, 'message', 'body', 'content', 'description') ?? '',
    read,
    createdAt: str(raw, 'createdAt', 'sentAt'),
    href: routeFor(type, str(raw, 'entityType', 'data.entityType', 'metadata.entityType'))
  }
}

export async function listNotifications(page: number, limit: number, o?: Opts) {
  const result = toPage(await apiRequest('/notifications', { ...o, query: { page, limit } }), { page, limit })
  return { items: result.items.map(toNotification), meta: result.meta as PageMeta }
}

export async function getUnreadCount(o?: Opts): Promise<number> {
  const raw = await apiRequest<unknown>('/notifications/unread-count', o)
  if (typeof raw === 'number') return raw
  return num(raw, 'count', 'unreadCount', 'unread', 'total') ?? 0
}

export const markRead = (id: string) =>
  apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })

export const markAllRead = () => apiRequest('/notifications/read-all', { method: 'POST' })

export const deleteNotification = (id: string) =>
  apiRequest(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' })

/** Lets the sidebar badge refresh after the inbox changes. */
export const UNREAD_EVENT = 'gathr:notifications-changed'
export const announceUnreadChange = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UNREAD_EVENT))
}
