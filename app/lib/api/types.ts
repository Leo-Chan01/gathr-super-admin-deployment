// Types taken from app/swagger.json.
//
// Request bodies, query params and enums are typed by the spec. The admin
// endpoints' 200 responses have NO schema in the current export, so their
// payloads are typed as `Raw` and mapped through ./adapters, which tolerates
// a few likely field names. Tighten these once the backend publishes schemas.

export type Raw = Record<string, unknown>

// ---- Enums (spec) ----------------------------------------------------------

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN'
export type UserType = 'INDIVIDUAL' | 'CHARITY' | 'COMPANY'
export type UserCategory = 'INDIVIDUAL' | 'ORGANIZATION' | 'PENDING_VERIFICATION'
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'

export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED' | 'REMOVED'
export type ReviewDecision = Exclude<ReportStatus, 'OPEN'>
export type ReportEntityType =
  | 'IMPACT_POST'
  | 'GATHR'
  | 'EVENT'
  | 'COMMUNITY'
  | 'COMMUNITY_POST'
  | 'COMMUNITY_COMMENT'

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED'

// ---- Shared (spec) ---------------------------------------------------------

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn?: number
}

/** UserResponseDto */
export interface ApiUser {
  id: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  phone?: unknown
  avatar?: unknown
  role: UserRole
  status: UserStatus
  userType: UserType
  emailVerified: boolean
  organizationName?: string
  verificationStatus?: VerificationStatus
  createdAt: string
  followersCount?: number
  followingCount?: number
}

/** PaginationMetaDto */
export interface PageMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface Page<T> {
  items: T[]
  meta: PageMeta
}

export interface PageQuery {
  page?: number
  limit?: number
}

// ---- Auth (spec) -----------------------------------------------------------

/** LoginInitiateResponseDto */
export interface LoginInitiateResponse {
  message: string
  requiresOtp: boolean
  email?: string
  phone?: string
  user?: ApiUser
  tokens?: AuthTokens
  deviceToken?: string
}

/** AuthResponseDto */
export interface AuthResponse {
  message: string
  user: ApiUser
  tokens: AuthTokens
  deviceToken?: string
}

// ---- KYC queue (from a live response; not in the spec) ----------------------

export interface BusinessProfile {
  id: string
  userId: string
  organizationName: string
  foundedAt: string | null
  location: string | null
  taxIdNumber: string | null
  logoUrl: string | null
  incorporationDocUrl: string | null
  verificationStatus: VerificationStatus
  rejectionReason: string | null
  isAffiliated: boolean
  affiliatedOrgId: string | null
  affiliatedOrgName: string | null
  affiliatedOrgTaxId: string | null
  createdAt: string
  updatedAt: string
}

/** One item of GET /admin/kyc/pending → data.data[] */
export interface KycQueueEntry {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  userType: UserType
  status: UserStatus
  createdAt: string
  emailVerified: boolean
  phoneVerified: boolean
  businessProfile: BusinessProfile | null
}

// ---- Admin query params (spec) ---------------------------------------------

export interface UsersQuery extends PageQuery {
  status?: UserStatus
  role?: UserRole
  userType?: UserType
  category?: UserCategory
  search?: string
}

export interface ReportsQuery extends PageQuery {
  search?: string
  reporterId?: string
  status?: ReportStatus
  entityType?: ReportEntityType
}

export interface WithdrawalsQuery extends PageQuery {
  status?: WithdrawalStatus
}
