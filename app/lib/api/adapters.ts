// Maps raw admin API payloads onto the view models the existing components use.
//
// The swagger export documents no response bodies for these endpoints, so every
// field below is read through `pick()` with a few likely names. When the backend
// publishes schemas, tighten each adapter and drop the alternatives you don't need.

import type { MetricItem } from '../../components/dashboard/MetricCards'
import type { KYCDetails, KYCDocument, KYCItem } from '../../components/dashboard/KYCCard'
import type { WithdrawalItem } from '../../components/dashboard/WithdrawalCard'
import type { FlaggedItem } from '../../components/dashboard/FlaggedCard'
import type { BusinessProfile, KycQueueEntry, Page, PageMeta, PageQuery, Raw, ReportStatus, UserStatus } from './types'

// ---- Primitive helpers -----------------------------------------------------

const isObject = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const at = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => (isObject(node) ? node[key] : undefined), source)

/** First non-empty value among dotted paths. */
export const pick = (source: unknown, ...paths: string[]): unknown => {
  for (const path of paths) {
    const value = at(source, path)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

export const str = (source: unknown, ...paths: string[]): string | undefined => {
  const value = pick(source, ...paths)
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return undefined
}

export const num = (source: unknown, ...paths: string[]): number | undefined => {
  const value = pick(source, ...paths)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

/** Avatar/image fields are typed `object` in UserResponseDto; accept string or `{ url }`. */
const image = (source: unknown, ...paths: string[]): string | undefined => {
  for (const path of paths) {
    const value = at(source, path)
    if (typeof value === 'string' && value) return value
    if (Array.isArray(value) && value.length) {
      const first = value[0]
      if (typeof first === 'string') return first
      const url = str(first, 'url', 'secureUrl', 'src')
      if (url) return url
    }
    const url = str(value, 'url', 'secureUrl', 'src')
    if (url) return url
  }
  return undefined
}

// ---- Formatting ------------------------------------------------------------

export const timeAgo = (iso: string | undefined): string => {
  if (!iso) return ''
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ''
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}${hours === 1 ? 'hr' : 'hrs'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(time).toLocaleDateString('en-GB')
}

export const shortDate = (iso: string | undefined) => {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB')
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const formatCount = (value: number | undefined) =>
  value === undefined ? '—' : value < 10000 ? value.toLocaleString('en-US') : compact.format(value)

export const formatMoney = (value: number | undefined, currency = 'USD', compactForm = false) => {
  if (value === undefined) return '—'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: compactForm ? 'compact' : 'standard',
      maximumFractionDigits: compactForm ? 1 : 2
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString('en-US')}`
  }
}

const formatChange = (value: number | undefined) =>
  value === undefined ? undefined : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

const humanize = (value: string | undefined) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : ''

// ---- Pagination ------------------------------------------------------------

/** Accepts `{ data, meta }`, `{ items, meta }`, `{ data: { data, meta } }` or a bare array. */
export function toPage(body: unknown, query: PageQuery = {}): Page<Raw> {
  let node: unknown = body
  if (isObject(node) && isObject(node.data) && !Array.isArray(node.data) && !('meta' in node)) {
    node = node.data
  }
  const list = Array.isArray(node)
    ? node
    : (pick(node, 'data', 'items', 'results', 'rows', 'docs') as unknown[] | undefined) ?? []
  const items = (Array.isArray(list) ? list : []).filter(isObject)

  const meta = isObject(node) ? (node.meta ?? node.pagination) : undefined
  const page = num(meta, 'page', 'currentPage') ?? query.page ?? 1
  const limit = num(meta, 'limit', 'perPage', 'pageSize') ?? query.limit ?? (items.length || 10)
  const totalItems = num(meta, 'totalItems', 'total', 'count') ?? items.length
  const totalPages = num(meta, 'totalPages', 'pages') ?? Math.max(1, Math.ceil(totalItems / limit))

  const fullMeta: PageMeta = {
    page,
    limit,
    totalItems,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages
  }
  return { items, meta: fullMeta }
}

// ---- Users -----------------------------------------------------------------

export const userName = (user: unknown): string => {
  const first = str(user, 'firstName')
  const last = str(user, 'lastName')
  const full = [first, last].filter(Boolean).join(' ')
  return (
    str(user, 'organizationName', 'businessProfile.organizationName', 'businessName') ||
    full ||
    str(user, 'name', 'fullName', 'username', 'email', 'phone') ||
    'Unknown user'
  )
}

const handle = (user: unknown) => {
  const username = str(user, 'username')
  return username ? `@${username.replace(/^@/, '')}` : undefined
}

export const categoryFromUserType = (userType: string | undefined) =>
  userType === 'CHARITY' ? 'Non-profit' : userType === 'COMPANY' ? 'For-profit' : 'Individual'

export type AccountStatus = 'active' | 'blocked' | 'suspended' | 'inactive' | 'pending'

export const accountStatus = (status: string | undefined): AccountStatus => {
  switch (status as UserStatus | undefined) {
    case 'ACTIVE':
      return 'active'
    case 'BANNED':
      return 'blocked'
    case 'SUSPENDED':
      return 'suspended'
    case 'PENDING_VERIFICATION':
      return 'pending'
    default:
      return 'inactive'
  }
}

export interface UserRow {
  id: string
  name: string
  username?: string
  email: string
  phone: string
  joined: string
  userType: string
  category: 'for-profit' | 'non-profit'
  status: AccountStatus
  rawStatus?: string
  blocked: boolean
}

export const toUserRow = (raw: Raw): UserRow => {
  const user = isObject(raw.user) ? { ...raw.user, ...raw } : raw
  const rawStatus = str(user, 'status')
  const status = accountStatus(rawStatus)
  const userType = str(user, 'userType') ?? 'INDIVIDUAL'
  return {
    id: str(user, 'id', 'userId') ?? '',
    name: userName(user),
    username: handle(user),
    email: str(user, 'email') ?? '—',
    phone: str(user, 'phone', 'phoneNumber') ?? '—',
    joined: shortDate(str(user, 'createdAt', 'joinedAt')),
    userType,
    category: userType === 'COMPANY' ? 'for-profit' : 'non-profit',
    status,
    rawStatus,
    // The table's Block toggle is "on" for any restriction (banned or suspended).
    blocked: status === 'blocked' || status === 'suspended'
  }
}

export interface UserDetail extends UserRow {
  avatarUrl?: string
  bannerUrl?: string
  role?: string
  bio?: string
  location?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  verificationStatus?: string
  /** ISO timestamp; `null` = never logged in, `undefined` = not reported. */
  lastLoginAt?: string | null
  createdAt?: string
  stats: { label: string; value: string }[]
  business?: BusinessProfile
}

/**
 * Admin user record. Fields confirmed from GET /admin/users (list rows include
 * `lastLoginAt`, `_count.gathrPosts`, `_count.donations`, `businessProfile`);
 * GET /admin/users/{id} may add more, which the fallbacks below pick up.
 */
export const toUserDetail = (raw: Raw): UserDetail => {
  const user = isObject(raw.user) ? { ...raw, ...raw.user } : raw
  const row = toUserRow(user)
  const stats: UserDetail['stats'] = []
  const addStat = (label: string, value: number | undefined, money = false) => {
    if (value !== undefined) stats.push({ label, value: money ? formatMoney(value) : formatCount(value) })
  }
  addStat('Gathr posts', num(user, '_count.gathrPosts', 'gathrCount', '_count.gathrs'))
  addStat('Donations', num(user, '_count.donations', 'donationCount'))
  addStat('Impact posts', num(user, '_count.impactPosts', 'impactPostCount'))
  addStat('Followers', num(user, 'followersCount', '_count.followers'))
  addStat('Following', num(user, 'followingCount', '_count.following'))
  addStat('Wallet balance', num(user, 'wallet.balance', 'walletBalance'), true)
  addStat('Reports against', num(user, 'reportCount', '_count.reports'))

  const lastLogin = user.lastLoginAt
  const business = isObject(user.businessProfile) ? (user.businessProfile as unknown as BusinessProfile) : undefined

  return {
    ...row,
    avatarUrl: image(user, 'avatar', 'avatarUrl', 'profileImage'),
    bannerUrl: image(user, 'bannerImage'),
    role: str(user, 'role'),
    bio: str(user, 'bio'),
    location: str(user, 'location') ?? business?.location ?? undefined,
    emailVerified: pick(user, 'emailVerified') as boolean | undefined,
    phoneVerified: pick(user, 'phoneVerified') as boolean | undefined,
    verificationStatus: str(user, 'verificationStatus') ?? business?.verificationStatus,
    lastLoginAt: lastLogin === null ? null : typeof lastLogin === 'string' ? lastLogin : undefined,
    createdAt: str(user, 'createdAt'),
    stats,
    business
  }
}

/** GET /admin/users/stats → the four Users page cards. */
export const toUserMetrics = (raw: Raw | undefined): MetricItem[] => {
  const blocked =
    num(raw, 'blockedUsers', 'blocked', 'bannedUsers', 'banned', 'byStatus.BANNED')
  return [
    metric('Total users', formatCount(num(raw, 'totalUsers', 'total', 'users')), num(raw, 'totalUsersChange'), 'blue'),
    metric('Active users', formatCount(num(raw, 'activeUsers', 'active', 'byStatus.ACTIVE')), num(raw, 'activeUsersChange'), 'green'),
    metric(
      'Pending verification',
      formatCount(num(raw, 'pendingVerification', 'pendingVerificationUsers', 'pending', 'byStatus.PENDING_VERIFICATION')),
      num(raw, 'pendingVerificationChange'),
      'gray'
    ),
    metric('Blocked users', formatCount(blocked), num(raw, 'blockedUsersChange'), 'pink')
  ]
}

const metric = (
  title: string,
  value: string,
  change: number | undefined,
  tone: MetricItem['tone']
): MetricItem => ({
  title,
  value,
  change: formatChange(change),
  isPositive: (change ?? 0) >= 0,
  tone
})

// ---- Dashboard -------------------------------------------------------------

export interface DashboardView {
  metrics: MetricItem[]
  counts: { flagged?: number; kyc?: number; withdrawals?: number }
}

export const toDashboard = (raw: Raw | undefined): DashboardView => {
  const m = pick(raw, 'metrics', 'stats') ?? raw
  const a = pick(raw, 'attention', 'attentionQueue', 'queue', 'counts') ?? raw
  const currency = str(m, 'currency') ?? 'USD'
  return {
    metrics: [
      metric('Total Users', formatCount(num(m, 'totalUsers', 'users.total', 'users')), num(m, 'totalUsersChange', 'users.change'), 'blue'),
      metric(
        'Total Amount Raised',
        formatMoney(num(m, 'totalAmountRaised', 'totalRaised', 'totalDonations', 'donations.total'), currency, true),
        num(m, 'totalAmountRaisedChange', 'totalRaisedChange', 'donations.change'),
        'green'
      ),
      metric(
        'Active Campaigns',
        formatCount(num(m, 'activeCampaigns', 'activeGathrs', 'gathrs.active', 'campaigns.active')),
        num(m, 'activeCampaignsChange', 'activeGathrsChange', 'gathrs.change'),
        'gray'
      ),
      metric('Reports', formatCount(num(m, 'reports', 'totalReports', 'reports.total', 'openReports')), num(m, 'reportsChange', 'reports.change'), 'pink')
    ],
    counts: {
      flagged: num(a, 'flaggedContent', 'flagged', 'openReports', 'flaggedContentCount'),
      kyc: num(a, 'pendingKyc', 'kyc', 'pendingKycCount', 'pendingVerifications'),
      withdrawals: num(a, 'pendingWithdrawals', 'withdrawals', 'withdrawalRequests', 'pendingWithdrawalsCount')
    }
  }
}

// ---- KYC -------------------------------------------------------------------
// Shape confirmed from a live GET /admin/kyc/pending response (see KycQueueEntry).

const fileTypeFrom = (url: string) => {
  const ext = url.split('?')[0].split('.').pop()
  return ext && ext.length <= 5 ? ext.toUpperCase() : 'FILE'
}

/** Business profile fields that hold verification files, in display order. */
const BUSINESS_DOCUMENTS: { key: keyof BusinessProfile; title: string }[] = [
  { key: 'incorporationDocUrl', title: 'Certificate of Incorporation' }
]

export const toKycItem = (raw: Raw): KYCItem => {
  const entry = raw as unknown as KycQueueEntry
  const profile = entry.businessProfile
  const documents: KYCDocument[] = BUSINESS_DOCUMENTS.flatMap(({ key, title }) => {
    const url = profile?.[key]
    return typeof url === 'string' && url
      ? [{ id: `${entry.id}-${key}`, title, fileType: fileTypeFrom(url), fileSize: '', status: 'Uploaded' as const, url }]
      : []
  })
  const isOrganization = entry.userType === 'CHARITY' || entry.userType === 'COMPANY'
  const fullName = [entry.firstName, entry.lastName].filter(Boolean).join(' ') || undefined
  const affiliationName = profile?.isAffiliated ? profile.affiliatedOrgName : null

  const details: KYCDetails = {
    kind: isOrganization ? 'organization' : 'individual',
    imageUrl: profile?.logoUrl ?? image(entry, 'avatar'),
    fullName,
    username: entry.username ? `@${entry.username}` : undefined,
    email: entry.email ?? undefined,
    emailVerified: entry.emailVerified,
    phone: entry.phone ?? undefined,
    phoneVerified: entry.phoneVerified,
    signedUpAt: entry.createdAt,
    hasSubmission: Boolean(profile),
    submittedAt: profile?.createdAt,
    location: profile?.location ?? undefined,
    taxId: profile?.taxIdNumber ?? undefined,
    foundedAt: profile?.foundedAt ?? undefined,
    verificationStatus: profile?.verificationStatus,
    previousRejection: profile?.rejectionReason ?? undefined,
    affiliation: affiliationName
      ? {
          name: affiliationName,
          taxId: profile?.affiliatedOrgTaxId ?? undefined,
          orgId: profile?.affiliatedOrgId ?? undefined
        }
      : undefined
  }

  return {
    // Approve/reject are keyed by user ID, not business profile ID.
    id: entry.id,
    name: userName(entry),
    email: entry.email ?? entry.phone ?? undefined,
    category: categoryFromUserType(entry.userType),
    // A business profile's timestamps reflect the submission; fall back to signup.
    timeAgo: timeAgo(profile?.createdAt ?? entry.createdAt),
    docsSubmitted: documents.length,
    totalDocs: isOrganization ? BUSINESS_DOCUMENTS.length : 0,
    documents,
    details
  }
}

// ---- Withdrawals -----------------------------------------------------------

export const toWithdrawalItem = (raw: Raw): WithdrawalItem => {
  const user = pick(raw, 'user', 'wallet.user', 'requester') ?? {}
  const currency = str(raw, 'currency', 'wallet.currency') ?? 'USD'
  const account = str(raw, 'accountNumber', 'bankAccount.accountNumber', 'bank.accountNumber', 'payoutAccount.accountNumber')
  const gathr = pick(raw, 'gathr', 'campaign', 'wallet.gathr')
  return {
    id: str(raw, 'id') ?? '',
    name: userName(user),
    category: categoryFromUserType(str(user, 'userType')),
    timeAgo: timeAgo(str(raw, 'createdAt', 'requestedAt')),
    amount: formatMoney(num(raw, 'amount'), currency),
    bankName: str(raw, 'bankName', 'bankAccount.bankName', 'bank.name', 'payoutAccount.bankName') ?? 'Bank',
    accountLast4: account ? account.slice(-4) : '••••',
    walletType: str(gathr, 'title') ? 'Campaign wallet' : humanize(str(raw, 'walletType', 'wallet.type')) || 'Personal wallet',
    campaignName: str(gathr, 'title', 'name') ?? humanize(str(raw, 'status')),
    thumbnailUrl: image(gathr, 'coverImage', 'image', 'images', 'media'),
    status: str(raw, 'status')
  }
}

export interface WithdrawalDetail {
  item: WithdrawalItem
  rows: { label: string; value: string }[]
}

export const toWithdrawalDetail = (raw: Raw): WithdrawalDetail => {
  const item = toWithdrawalItem(raw)
  const rows: WithdrawalDetail['rows'] = [
    { label: 'Amount', value: item.amount },
    { label: 'Status', value: humanize(str(raw, 'status')) || '—' },
    { label: 'Bank', value: `${item.bankName} • ${item.accountLast4}` },
    { label: 'Account name', value: str(raw, 'accountName', 'bankAccount.accountName', 'payoutAccount.accountName') ?? '—' },
    { label: 'Wallet', value: item.walletType },
    { label: 'Campaign', value: item.campaignName || '—' },
    { label: 'Requested', value: shortDate(str(raw, 'createdAt', 'requestedAt')) },
    { label: 'Reference', value: str(raw, 'reference', 'transactionReference', 'id') ?? '—' }
  ]
  const reason = str(raw, 'rejectionReason', 'failureReason', 'reason')
  if (reason) rows.push({ label: 'Reason', value: reason })
  return { item, rows }
}

// ---- Reports ---------------------------------------------------------------

export interface ReportItem extends FlaggedItem {
  status: ReportStatus
  entityType?: string
}

export const toReportItem = (raw: Raw): ReportItem => {
  const reporter = pick(raw, 'reporter', 'reportedBy', 'user') ?? {}
  const content = pick(raw, 'content', 'entity', 'target', 'reportedContent') ?? {}
  const reason = str(raw, 'reason', 'description', 'comment') ?? ''
  return {
    id: str(raw, 'id') ?? '',
    name: userName(reporter),
    username: handle(reporter),
    avatarUrl: image(reporter, 'avatar', 'avatarUrl'),
    timeAgo: timeAgo(str(raw, 'createdAt')),
    comment: reason,
    hasMoreComment: reason.length > 60,
    targetTitle:
      str(content, 'title', 'caption', 'name', 'content', 'text', 'body', 'description') ??
      humanize(str(raw, 'entityType')) ??
      'Reported content',
    targetImage: image(content, 'coverImage', 'image', 'images', 'media', 'thumbnail', 'avatar'),
    reportCount: num(raw, 'reportCount', '_count.reports'),
    status: (str(raw, 'status') as ReportStatus) ?? 'OPEN',
    entityType: str(raw, 'entityType')
  }
}

export interface ReportDetail {
  item: ReportItem
  contentAuthor?: string
  contentBody?: string
  rows: { label: string; value: string }[]
}

export const toReportDetail = (raw: Raw): ReportDetail => {
  const item = toReportItem(raw)
  const content = pick(raw, 'content', 'entity', 'target', 'reportedContent') ?? {}
  const author = pick(content, 'author', 'user', 'creator', 'owner')
  const rows = [
    { label: 'Status', value: humanize(item.status) },
    { label: 'Content type', value: humanize(item.entityType) || '—' },
    { label: 'Reported', value: shortDate(str(raw, 'createdAt')) },
    { label: 'Reporter', value: item.username ?? item.name ?? '—' }
  ]
  const reviewedBy = pick(raw, 'reviewedBy', 'reviewer')
  if (reviewedBy) rows.push({ label: 'Reviewed by', value: userName(reviewedBy) })
  const reviewReason = str(raw, 'reviewReason', 'resolution', 'adminReason')
  if (reviewReason) rows.push({ label: 'Review note', value: reviewReason })
  return {
    item,
    contentAuthor: author ? userName(author) : undefined,
    contentBody: str(content, 'content', 'text', 'body', 'description', 'caption'),
    rows
  }
}

/** GET /admin/reports/stats → the four Reports page cards. */
export const toReportMetrics = (raw: Raw | undefined): MetricItem[] => [
  metric('Total flagged posts', formatCount(num(raw, 'flaggedPosts', 'totalFlagged', 'flagged', 'total')), num(raw, 'flaggedPostsChange'), 'blue'),
  metric('Pending review', formatCount(num(raw, 'pendingReview', 'pending', 'open', 'OPEN')), num(raw, 'pendingReviewChange'), 'green'),
  metric('Resolved', formatCount(num(raw, 'resolved', 'RESOLVED')), num(raw, 'resolvedChange'), 'gray'),
  metric('Removed content', formatCount(num(raw, 'removedContent', 'removed', 'REMOVED')), num(raw, 'removedContentChange'), 'pink')
]
