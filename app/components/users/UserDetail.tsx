'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ExternalLink, FileText, Heart, MessageCircle } from 'lucide-react'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import { getUser, updateUserStatus } from '../../lib/api/admin'
import { accountStatus, timeAgo, toUserDetail } from '../../lib/api/adapters'
import { listUserGathr, listUserImpact } from '../../lib/api/feed'
import type { UserStatus } from '../../lib/api/types'
import type { FeedPost } from '../gathr-feed/feedData'
import RestrictUserDialog, { type Restriction } from './RestrictUserDialog'
import { errorMessage } from '../../lib/api/client'
import { useResource } from '../../lib/hooks/useResource'
import styles from './UserDetail.module.css'

const humanize = (value?: string | null) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '—'

const formatDate = (iso?: string | null) => {
  if (!iso) return undefined
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_TONE: Record<string, string> = {
  active: styles.chipGreen,
  blocked: styles.chipRed,
  suspended: styles.chipOrange,
  pending: styles.chipAmber,
  inactive: styles.chipGray
}

type ContentTab = 'impact' | 'gathr'
const CONTENT_LIMIT = 6

export const UserDetail: React.FC<{ id: string }> = ({ id }) => {
  const user = useResource((signal) => getUser(id, { signal }).then(toUserDetail), [id])
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [restrictOpen, setRestrictOpen] = useState(false)
  const [contentTab, setContentTab] = useState<ContentTab>('impact')
  const content = useResource(
    (signal) =>
      contentTab === 'impact'
        ? listUserImpact(id, CONTENT_LIMIT, { signal })
        : listUserGathr(id, CONTENT_LIMIT, { signal }),
    [id, contentTab]
  )
  const detail = user.data

  const applyStatus = (status: UserStatus) => {
    const view = accountStatus(status)
    user.mutate((current) =>
      current ? { ...current, rawStatus: status, status: view, blocked: view === 'blocked' || view === 'suspended' } : current
    )
  }

  /** Restricted → reinstate now. Otherwise ask whether to ban or suspend. */
  const handleRestrictionButton = async () => {
    if (!detail) return
    if (!detail.blocked) {
      setRestrictOpen(true)
      return
    }
    setSaving(true)
    setActionError(null)
    try {
      await updateUserStatus(detail.id, 'ACTIVE')
      applyStatus('ACTIVE')
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const restrict = async (status: Restriction) => {
    if (!detail) return
    await updateUserStatus(detail.id, status)
    applyStatus(status)
  }

  const lastLogin =
    detail?.lastLoginAt === null
      ? 'Never logged in'
      : detail?.lastLoginAt
        ? `${timeAgo(detail.lastLoginAt)} · ${formatDate(detail.lastLoginAt)}`
        : undefined
  const isOrg = detail && detail.userType !== 'INDIVIDUAL'
  const business = detail?.business
  const avatar = detail?.avatarUrl ?? business?.logoUrl ?? undefined

  return (
    <div className={styles.page}>
      <Link href="/users" className={styles.back}>
        <ChevronLeft aria-hidden="true" /> Users
      </Link>

      {user.error && <ErrorState message={user.error} onRetry={user.reload} />}

      {user.loading && !detail && (
        <div className={styles.card} aria-busy="true">
          <div className={styles.skeletonHead} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      )}

      {detail && (
        <>
          <section className={`${styles.card} ${styles.profileCard}`}>
            {detail.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={detail.bannerUrl} alt="" className={styles.banner} />
            )}
            <div className={styles.head}>
              <div className={styles.identity}>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className={styles.avatar} />
                ) : (
                  <AvatarIllustration />
                )}
                <div className={styles.identityText}>
                  <h1 className={styles.name}>{detail.name}</h1>
                  <p className={styles.sub}>
                    {[detail.username, detail.email].filter((v) => v && v !== '—').join(' · ') || detail.phone}
                  </p>
                  <div className={styles.chips}>
                    <span className={`${styles.chip} ${STATUS_TONE[detail.status] ?? styles.chipGray}`}>
                      {humanize(detail.rawStatus)}
                    </span>
                    <span className={styles.chip}>{humanize(detail.userType)}</span>
                    {detail.role && detail.role !== 'USER' && (
                      <span className={`${styles.chip} ${styles.chipBlue}`}>{humanize(detail.role)}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={detail.blocked ? styles.unblock : styles.block}
                onClick={handleRestrictionButton}
                disabled={saving}
              >
                {saving && <InlineSpinner />}{' '}
                {detail.blocked ? `Lift ${detail.status === 'suspended' ? 'suspension' : 'ban'}` : 'Ban user'}
              </button>
            </div>

            {actionError && <ErrorState message={actionError} compact />}

            <dl className={styles.facts}>
              <Fact label="Joined" value={formatDate(detail.createdAt)} />
              <Fact label="Last login" value={lastLogin} />
              <Fact label="Email">
                {detail.email !== '—' && (
                  <>
                    {detail.email} <Tag ok={detail.emailVerified} />
                  </>
                )}
              </Fact>
              <Fact label="Phone">
                {detail.phone !== '—' && (
                  <>
                    {detail.phone} {detail.phoneVerified !== undefined && <Tag ok={detail.phoneVerified} />}
                  </>
                )}
              </Fact>
              <Fact label="Location" value={detail.location} />
              {isOrg && <Fact label="Verification" value={humanize(detail.verificationStatus)} />}
            </dl>

            {detail.bio && <p className={styles.bio}>{detail.bio}</p>}
          </section>

          {detail.stats.length > 0 && (
            <section className={styles.stats}>
              {detail.stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                </div>
              ))}
            </section>
          )}

          {isOrg && (
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Business profile</h2>
              {business ? (
                <>
                  <dl className={styles.facts}>
                    <Fact label="Organization" value={business.organizationName} />
                    <Fact label="Tax ID" value={business.taxIdNumber} />
                    <Fact label="Founded" value={formatDate(business.foundedAt)} />
                    <Fact label="Location" value={business.location} />
                    <Fact label="Status" value={humanize(business.verificationStatus)} />
                    <Fact label="Submitted" value={formatDate(business.createdAt)} />
                    {business.isAffiliated && (
                      <Fact
                        label="Parent organization"
                        value={[business.affiliatedOrgName, business.affiliatedOrgTaxId].filter(Boolean).join(' · ')}
                      />
                    )}
                  </dl>
                  {business.rejectionReason && (
                    <p className={styles.rejection}>Last rejection: “{business.rejectionReason}”</p>
                  )}
                  {business.incorporationDocUrl && (
                    <a
                      href={business.incorporationDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.docLink}
                    >
                      <FileText aria-hidden="true" /> Certificate of Incorporation
                      <ExternalLink aria-hidden="true" />
                    </a>
                  )}
                </>
              ) : (
                <p className={styles.muted}>No business profile submitted yet.</p>
              )}
            </section>
          )}

          <section className={styles.card}>
            <div className={styles.contentHead}>
              <h2 className={styles.sectionTitle}>Content</h2>
              <div className={styles.segment} role="tablist" aria-label="User content">
                {(['impact', 'gathr'] as ContentTab[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={contentTab === key}
                    className={`${styles.segmentButton} ${contentTab === key ? styles.segmentActive : ''}`}
                    onClick={() => setContentTab(key)}
                  >
                    {key === 'impact' ? 'Impact posts' : 'Active gathrs'}
                  </button>
                ))}
              </div>
            </div>

            {content.error ? (
              <ErrorState message={content.error} onRetry={content.reload} compact />
            ) : content.loading && !content.data ? (
              <div className={styles.contentGrid} aria-busy="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className={styles.contentSkeleton} />
                ))}
              </div>
            ) : (content.data?.items.length ?? 0) === 0 ? (
              <p className={styles.muted}>
                {contentTab === 'impact' ? 'No impact posts yet.' : 'No active offers or requests.'}
              </p>
            ) : (
              <>
                <div className={styles.contentGrid} aria-busy={content.loading}>
                  {content.data?.items.map((post) => <ContentCard key={post.id} post={post} />)}
                </div>
                {(content.data?.total ?? 0) > CONTENT_LIMIT && (
                  <p className={styles.muted}>
                    Showing {content.data?.items.length} of {content.data?.total.toLocaleString('en-US')}
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
      <RestrictUserDialog
        userName={restrictOpen && detail ? detail.name : null}
        onClose={() => setRestrictOpen(false)}
        onConfirm={restrict}
      />
    </div>
  )
}

const Fact: React.FC<{ label: string; value?: string | null; children?: React.ReactNode }> = ({
  label,
  value,
  children
}) => (
  <div>
    <dt>{label}</dt>
    <dd>{children || value || <span className={styles.notProvided}>Not provided</span>}</dd>
  </div>
)

const Tag: React.FC<{ ok?: boolean }> = ({ ok }) => (
  <span className={ok ? styles.tagOk : styles.tagMissing}>{ok ? 'Verified' : 'Unverified'}</span>
)

const ContentCard: React.FC<{ post: FeedPost }> = ({ post }) => (
  <article className={styles.contentCard}>
    {post.images[0] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.images[0]} alt="" className={styles.contentImage} loading="lazy" />
    ) : (
      <div className={styles.contentImagePlaceholder} aria-hidden="true">
        <FileText />
      </div>
    )}
    <div className={styles.contentBody}>
      {post.title && <p className={styles.contentTitle}>{post.title}</p>}
      <p className={styles.contentCaption}>{post.caption}</p>
      <p className={styles.contentMeta}>
        {post.tab === 'impact' ? (
          <>
            <Heart aria-hidden="true" /> {post.likes} <MessageCircle aria-hidden="true" /> {post.comments} ·{' '}
            {post.meta}
          </>
        ) : (
          post.meta
        )}
      </p>
    </div>
  </article>
)

export default UserDetail
