// Live feed: public content lists + interactions, plus admin moderation.
// Shapes below were taken from live responses (Nov 2026); the spec only
// documents GathrResponseDto.

import { apiRequest } from './client'
import { toPage, timeAgo } from './adapters'
import type { Page, Raw, ReportEntityType } from './types'
import type { FeedComment, FeedPost, FeedReply, FeedTab, GathrFilter } from '../../components/gathr-feed/feedData'

type Opts = { signal?: AbortSignal }

// ---- Raw shapes ------------------------------------------------------------

interface Author {
  id: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  avatar?: string | null
  location?: string | null
  emailVerified?: boolean
}

interface ImpactPost {
  id: string
  content: string
  images: string[]
  tags: string[]
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: string
  user: Author
}

interface GathrPost {
  id: string
  title?: string
  description?: string
  postType: 'OFFER' | 'REQUEST'
  givingType: string
  status: string
  goalAmount?: number | null
  currentAmount: number
  currency: string
  coverImage?: string | null
  images: string[]
  featured: boolean
  donorCount: number
  percentageRaised?: number
  createdAt: string
  user: Author
  interest?: { name: string } | null
}

interface Community {
  id: string
  name: string
  mission?: string | null
  coverImage?: string | null
  memberCount: number
  postCount: number
  isPublic: boolean
  createdAt: string
  creator: Author
  interests?: { name: string }[]
}

interface EventItem {
  id: string
  title: string
  description?: string | null
  mode?: string | null
  location?: string | null
  startsAt?: string | null
  coverImage?: string | null
  attendeeCount: number
  isCancelled: boolean
  createdAt: string
  creator: Author
  category?: string | null
}

interface ApiComment {
  id: string
  userId: string
  content: string
  likeCount: number
  createdAt: string
  user: Author
  replies?: ApiComment[]
  _count?: { replies?: number }
}

// ---- Mapping ---------------------------------------------------------------

export const ENTITY_FOR_TAB: Record<FeedTab, FeedPost['entityType'] & ReportEntityType> = {
  impact: 'IMPACT_POST',
  gathr: 'GATHR',
  communities: 'COMMUNITY',
  events: 'EVENT'
}

const handle = (author: Author) => {
  if (author.username) return `@${author.username}`
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ')
  return name || 'Gathr user'
}

const money = (value: number | null | undefined, currency: string) => {
  if (value === null || value === undefined) return undefined
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${currency} ${value}`
  }
}

const humanize = (value?: string | null) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : ''

const base = (tab: FeedTab, id: string, author: Author) => ({
  id,
  tab,
  entityType: ENTITY_FOR_TAB[tab],
  userId: author.id,
  username: handle(author),
  avatarUrl: author.avatar ?? undefined,
  verified: Boolean(author.emailVerified),
  liked: false
})

const fromImpact = (post: ImpactPost): FeedPost => ({
  ...base('impact', post.id, post.user),
  location: post.user.location ?? timeAgo(post.createdAt),
  caption: post.content,
  images: post.images ?? [],
  likes: post.likeCount,
  comments: post.commentCount,
  meta: timeAgo(post.createdAt)
})

const fromGathr = (post: GathrPost): FeedPost => {
  const images = [post.coverImage, ...(post.images ?? [])].filter((src): src is string => Boolean(src))
  const raised = money(post.currentAmount, post.currency)
  const goal = money(post.goalAmount, post.currency)
  const progress =
    post.givingType === 'FINANCIAL' && goal
      ? `${raised} of ${goal} raised${post.percentageRaised !== undefined ? ` · ${post.percentageRaised}%` : ''}`
      : humanize(post.givingType)
  return {
    ...base('gathr', post.id, post.user),
    gathrKind: post.postType === 'OFFER' ? 'offers' : 'requests',
    location: [humanize(post.postType), post.interest?.name].filter(Boolean).join(' · '),
    title: post.title,
    caption: post.description ?? post.title ?? '',
    images,
    likes: 0,
    comments: 0,
    meta: [progress, `${post.donorCount} donors`].filter(Boolean).join(' · '),
    status: post.status,
    featured: post.featured
  }
}

const fromCommunity = (community: Community): FeedPost => ({
  ...base('communities', community.id, community.creator),
  location: community.interests?.map((interest) => interest.name).join(', ') || (community.isPublic ? 'Public' : 'Private'),
  title: community.name,
  caption: community.mission ?? '',
  images: community.coverImage ? [community.coverImage] : [],
  likes: 0,
  comments: 0,
  meta: `${community.memberCount.toLocaleString('en-US')} members · ${community.postCount.toLocaleString('en-US')} posts`
})

const fromEvent = (event: EventItem): FeedPost => {
  const when = event.startsAt
    ? new Date(event.startsAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : undefined
  return {
    ...base('events', event.id, event.creator),
    location: [humanize(event.mode), event.location].filter(Boolean).join(' · '),
    title: event.title,
    caption: event.description ?? '',
    images: event.coverImage ? [event.coverImage] : [],
    likes: 0,
    comments: 0,
    meta: [when, `${event.attendeeCount} attending`, event.isCancelled ? 'Cancelled' : undefined]
      .filter(Boolean)
      .join(' · '),
    status: event.isCancelled ? 'CANCELLED' : undefined
  }
}

const toReply = (comment: ApiComment): FeedReply => ({
  id: comment.id,
  userId: comment.userId,
  username: handle(comment.user),
  avatarUrl: comment.user.avatar ?? undefined,
  time: timeAgo(comment.createdAt),
  body: comment.content,
  likes: comment.likeCount,
  liked: false,
  replyCount: comment._count?.replies ?? comment.replies?.length ?? 0,
  replies: (comment.replies ?? []).map(toReply)
})

export const toFeedComment = (postId: string, comment: ApiComment): FeedComment => ({
  ...toReply(comment),
  postId,
  replies: (comment.replies ?? []).map(toReply)
})

// ---- Requests --------------------------------------------------------------

export interface FeedQuery {
  tab: FeedTab
  gathrFilter: GathrFilter
  search?: string
  page: number
  limit: number
}

export async function listFeed({ tab, gathrFilter, search, page, limit }: FeedQuery, o?: Opts): Promise<Page<FeedPost>> {
  const query = { page, limit, search: search || undefined }
  const load = async <T,>(path: string, extra: Record<string, string | undefined>, map: (raw: T) => FeedPost) => {
    const result = toPage(await apiRequest(path, { ...o, query: { ...query, ...extra } }), query)
    return { items: result.items.map((raw) => map(raw as unknown as T)), meta: result.meta }
  }
  switch (tab) {
    case 'impact':
      return load<ImpactPost>('/impact', {}, fromImpact)
    case 'gathr':
      return load<GathrPost>(
        '/gathr',
        { postType: gathrFilter === 'offers' ? 'OFFER' : gathrFilter === 'requests' ? 'REQUEST' : undefined },
        fromGathr
      )
    case 'communities':
      return load<Community>('/communities', {}, fromCommunity)
    case 'events':
      return load<EventItem>('/events', {}, fromEvent)
  }
}

export async function listComments(post: Pick<FeedPost, 'id' | 'entityType'>, o?: Opts) {
  const result = toPage(
    await apiRequest(`/interactions/${post.entityType}/${encodeURIComponent(post.id)}/comments`, {
      ...o,
      query: { page: 1, limit: 50 }
    })
  )
  return result.items.map((raw) => toFeedComment(post.id, raw as unknown as ApiComment))
}

export async function listReplies(commentId: string) {
  const result = toPage(
    await apiRequest(`/interactions/comment/${encodeURIComponent(commentId)}/replies`, { query: { page: 1, limit: 50 } })
  )
  return result.items.map((raw) => toReply(raw as unknown as ApiComment))
}

export async function createComment(post: Pick<FeedPost, 'id' | 'entityType'>, content: string, parentId?: string) {
  const created = await apiRequest<Raw>('/interactions/comment', {
    method: 'POST',
    body: { entityId: post.id, entityType: post.entityType, content, parentId }
  })
  return toReply(created as unknown as ApiComment)
}

export const deleteComment = (id: string) =>
  apiRequest(`/interactions/comment/${encodeURIComponent(id)}`, { method: 'DELETE' })

/** Toggle like; returns the server's liked state when it reports one. */
export async function toggleLike(post: Pick<FeedPost, 'id' | 'entityType'>) {
  const result = await apiRequest<Raw | null>('/interactions/like', {
    method: 'POST',
    body: { entityId: post.id, entityType: post.entityType }
  })
  const liked = result && (result.liked ?? result.isLiked)
  return typeof liked === 'boolean' ? liked : undefined
}

// ---- Moderation ------------------------------------------------------------

export const featureGathr = (id: string) =>
  apiRequest(`/admin/gathr/${encodeURIComponent(id)}/feature`, { method: 'PATCH' })

/** Body isn't documented in the spec; `{ status }` matches the other admin status endpoints. */
export const setGathrStatus = (id: string, status: 'ACTIVE' | 'PAUSED' | 'REJECTED') =>
  apiRequest(`/admin/gathr/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })

export const deleteImpactPost = (id: string) =>
  apiRequest(`/impact/${encodeURIComponent(id)}`, { method: 'DELETE' })

// ---- Rail ------------------------------------------------------------------

export interface AuditEntry {
  id: string
  time: string
  actor: string
  detail: string
}

export async function listAuditLogs(limit: number, o?: Opts): Promise<AuditEntry[]> {
  const result = toPage(await apiRequest('/admin/audit-logs', { ...o, query: { page: 1, limit } }))
  return result.items.map((raw, index) => {
    const actor = (raw.admin ?? raw.user ?? raw.actor) as Author | undefined
    const action = String(raw.action ?? raw.event ?? raw.type ?? 'updated')
    const target = raw.entityType ?? raw.targetType ?? raw.resource
    const detail = String(raw.description ?? raw.details ?? raw.message ?? '')
    return {
      id: String(raw.id ?? index),
      time: timeAgo(String(raw.createdAt ?? '')),
      actor: actor ? handle(actor) : 'Admin',
      detail: detail || [humanize(action), target ? humanize(String(target)) : ''].filter(Boolean).join(' ')
    }
  })
}

// ---- Per-user content (user detail page) -----------------------------------

export async function listUserImpact(userId: string, limit: number, o?: Opts) {
  const result = toPage(
    await apiRequest(`/impact/user/${encodeURIComponent(userId)}`, { ...o, query: { page: 1, limit } })
  )
  return { items: result.items.map((raw) => fromImpact(raw as unknown as ImpactPost)), total: result.meta.totalItems }
}

/** Only the user's active offers and requests (that's what the endpoint returns). */
export async function listUserGathr(userId: string, limit: number, o?: Opts) {
  const result = toPage(
    await apiRequest(`/gathr/user/${encodeURIComponent(userId)}`, { ...o, query: { page: 1, limit } })
  )
  return { items: result.items.map((raw) => fromGathr(raw as unknown as GathrPost)), total: result.meta.totalItems }
}
