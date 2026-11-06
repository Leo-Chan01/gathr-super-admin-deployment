'use client'

import React, { useEffect, useState } from 'react'
import {
  X,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  Check,
  Copy,
  Clock,
  Link2,
  RotateCcw
} from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import { KYCItem, KYCDetails, KYCDocument } from './KYCCard'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import { errorMessage } from '../../lib/api/client'
import { timeAgo } from '../../lib/api/adapters'
import styles from './KYCDetailDrawer.module.css'

interface KYCDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  item: KYCItem | null
  /** May return a promise; the drawer shows progress and closes on success. */
  onAccept?: (item: KYCItem) => void | Promise<void>
  onReject?: (item: KYCItem, reason: string) => void | Promise<void>
}

const ORGANIZATION_REASONS = [
  'Certificate of incorporation is invalid',
  'Tax ID could not be verified',
  'Document is unreadable',
  "Organization details don't match the documents",
  'Documents are expired',
  'Wrong document submitted',
  'Other'
]

const INDIVIDUAL_REASONS = [
  'Email address not verified',
  'Phone number not verified',
  'Profile details are incomplete',
  "Information doesn't match",
  'Suspected duplicate account',
  'Other'
]

const IMAGE_FILE = /^(JPE?G|PNG|GIF|WEBP|AVIF|HEIC)$/

const formatDate = (iso?: string) => {
  if (!iso) return undefined
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const yearsSince = (iso?: string) => {
  if (!iso) return undefined
  const years = Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 3600 * 1000))
  if (Number.isNaN(years) || years < 0) return undefined
  return years < 1 ? 'under 1 yr' : `${years} yr${years === 1 ? '' : 's'}`
}

/** Fallback when an item has no `details` (shouldn't happen with the live adapter). */
const emptyDetails = (item: KYCItem): KYCDetails => ({
  kind: item.category === 'Individual' ? 'individual' : 'organization',
  emailVerified: false,
  phoneVerified: false,
  signedUpAt: '',
  hasSubmission: (item.documents?.length ?? 0) > 0,
  email: item.email
})

export const KYCDetailDrawer: React.FC<KYCDetailDrawerProps> = ({ isOpen, item, ...rest }) => {
  if (!isOpen || !item) return null
  // Keyed so reject/form state resets when a different submission opens.
  return <DrawerPanel key={String(item.id)} item={item} {...rest} />
}

const DrawerPanel: React.FC<Omit<KYCDetailDrawerProps, 'isOpen' | 'item'> & { item: KYCItem }> = ({
  item,
  onClose,
  onAccept,
  onReject
}) => {
  const [isRejecting, setIsRejecting] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [otherReason, setOtherReason] = useState('')
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<KYCDocument | null>(null)

  const details = item.details ?? emptyDetails(item)
  const isOrg = details.kind === 'organization'
  const documents = item.documents ?? []
  const reasons = isOrg ? ORGANIZATION_REASONS : INDIVIDUAL_REASONS
  const reason = selectedReason === 'Other' ? otherReason.trim() : selectedReason
  // An organization with nothing submitted has nothing to approve.
  const canAccept = !isOrg || details.hasSubmission

  const checks = [
    { label: 'Email verified', ok: details.emailVerified, hint: details.email ?? 'No email on file' },
    { label: 'Phone verified', ok: details.phoneVerified, hint: details.phone ?? 'No phone on file' },
    {
      label: 'Profile complete',
      ok: Boolean(details.fullName && details.username),
      hint: details.fullName && details.username ? 'Name and username set' : 'Missing name or username'
    }
  ]
  const checksPassed = checks.filter((check) => check.ok).length

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (preview) setPreview(null)
      else if (!busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview, busy, onClose])

  const handleClose = () => {
    if (!busy) onClose()
  }

  const run = async (kind: 'accept' | 'reject', action: () => void | Promise<void>) => {
    setBusy(kind)
    setError(null)
    try {
      await action()
      setBusy(null)
      onClose()
    } catch (err) {
      setBusy(null)
      setError(errorMessage(err))
    }
  }

  const handleAccept = () => run('accept', () => onAccept?.(item))

  const handleConfirmReject = () => {
    if (!reason) return
    run('reject', () => onReject?.(item, reason))
  }

  const subtitle = isOrg ? details.location : details.username

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Verification for ${item.name}`}
      >
        {/* Top Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {details.imageUrl ? (
              // Plain <img>: storage host isn't configured for next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={details.imageUrl} alt="" className={styles.logo} />
            ) : (
              <AvatarIllustration />
            )}
            <div className={styles.headerInfo}>
              <h2 className={styles.title}>{item.name}</h2>
              <div className={styles.metaRow}>
                <span className={styles.badge}>{item.category}</span>
                {subtitle && (
                  <>
                    <span className={styles.bullet}>•</span>
                    <span className={styles.timeAgo}>{subtitle}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close drawer"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Notices */}
        {isOrg && !details.hasSubmission && (
          <div className={`${styles.notice} ${styles.noticeWarn}`} role="status">
            <Clock className={styles.noticeIcon} aria-hidden="true" />
            <div>
              <strong>Awaiting submission</strong>
              <p>
                This organization hasn&apos;t submitted a business profile yet, so there is nothing to
                approve. You can still reject the account.
              </p>
            </div>
          </div>
        )}
        {details.previousRejection && (
          <div className={`${styles.notice} ${styles.noticeInfo}`}>
            <RotateCcw className={styles.noticeIcon} aria-hidden="true" />
            <div>
              <strong>Resubmission</strong>
              <p>Previously rejected: “{details.previousRejection}”</p>
            </div>
          </div>
        )}

        {/* Status Summary Banner */}
        <div className={styles.summaryCard}>
          <div className={styles.statItem}>
            <div className={styles.statIconBox}>
              {isOrg ? (
                <svg
                  className={styles.statIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="11" y2="13" />
                  <line x1="8" y1="17" x2="14" y2="17" />
                </svg>
              ) : (
                <Check className={styles.statIcon} />
              )}
            </div>
            <div className={styles.statContent}>
              <span className={styles.statPrimary}>
                {isOrg ? `${item.docsSubmitted} / ${item.totalDocs}` : `${checksPassed} / ${checks.length}`}
              </span>
              <span className={styles.statSecondary}>
                {isOrg ? 'Required documents' : 'Verification checks'}
              </span>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconBox}>
              <Clock className={styles.statIcon} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statPrimary}>
                {timeAgo(isOrg ? details.submittedAt ?? details.signedUpAt : details.signedUpAt) || '—'}
              </span>
              <span className={styles.statSecondary}>
                {isOrg && details.submittedAt ? 'Submitted' : 'Signed up'}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <section className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>
            {isOrg ? 'Organization details' : 'Account details'}
          </h3>
          <dl className={styles.facts}>
            {isOrg ? (
              <>
                <Fact label="Tax ID">
                  {details.taxId ? <CopyValue value={details.taxId} /> : undefined}
                </Fact>
                <Fact label="Founded">
                  {formatDate(details.foundedAt) &&
                    `${formatDate(details.foundedAt)} · ${yearsSince(details.foundedAt)}`}
                </Fact>
                <Fact label="Location">{details.location}</Fact>
                <Fact label="Account">{details.username ?? details.fullName}</Fact>
              </>
            ) : (
              <>
                <Fact label="Full name">{details.fullName}</Fact>
                <Fact label="Username">{details.username}</Fact>
              </>
            )}
            <Fact label="Email">
              {details.email && <Verified value={details.email} ok={details.emailVerified} />}
            </Fact>
            <Fact label="Phone">
              {details.phone && <Verified value={details.phone} ok={details.phoneVerified} />}
            </Fact>
            <Fact label="Signed up">{formatDate(details.signedUpAt)}</Fact>
            {isOrg && details.submittedAt && (
              <Fact label="Submitted">{formatDate(details.submittedAt)}</Fact>
            )}
          </dl>
        </section>

        {/* Individual: verification checklist */}
        {!isOrg && (
          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>Verification checks</h3>
            <ul className={styles.checklist}>
              {checks.map((check) => (
                <li key={check.label} className={styles.checkItem}>
                  <span className={`${styles.checkMark} ${check.ok ? styles.checkOk : styles.checkMissing}`}>
                    {check.ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                  </span>
                  <span className={styles.checkText}>
                    <span className={styles.checkLabel}>{check.label}</span>
                    <span className={styles.checkHint}>{check.hint}</span>
                  </span>
                  <span className={styles.srOnly}>{check.ok ? 'passed' : 'not passed'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Organization: affiliation */}
        {isOrg && details.affiliation && (
          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>Parent organization</h3>
            <div className={styles.affiliation}>
              <Link2 className={styles.noticeIcon} aria-hidden="true" />
              <div>
                <strong>{details.affiliation.name}</strong>
                {details.affiliation.taxId && <p>Tax ID {details.affiliation.taxId}</p>}
              </div>
              {details.affiliation.orgId && (
                <a href={`/users/${details.affiliation.orgId}`} className={styles.viewDocButton}>
                  <span>Profile</span>
                  <ExternalLink className={styles.externalIcon} />
                </a>
              )}
            </div>
          </section>
        )}

        {/* Organization: verification documents */}
        {isOrg && details.hasSubmission && (
          <div className={styles.documentsSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Verification documents</h3>
              <p className={styles.sectionSubtitle}>
                These documents are required for verification.
              </p>
            </div>

            <div className={styles.documentList}>
              {documents.length === 0 && (
                <p className={styles.sectionSubtitle}>No documents were attached to this submission.</p>
              )}
              {documents.map((doc) => {
                const isImage = Boolean(doc.url) && IMAGE_FILE.test(doc.fileType)
                return (
                  <div key={doc.id} className={styles.documentBlock}>
                    {isImage && (
                      <button
                        type="button"
                        className={styles.docPreview}
                        onClick={() => setPreview(doc)}
                        aria-label={`Enlarge ${doc.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={doc.url} alt={doc.title} loading="lazy" />
                      </button>
                    )}
                    <div className={styles.documentItem}>
                      <div className={styles.docInfo}>
                        <h4 className={styles.docTitle}>{doc.title}</h4>
                        <span className={styles.docMeta}>
                          {[doc.fileType, doc.fileSize].filter(Boolean).join(' • ')}
                        </span>
                      </div>

                      <div className={styles.docActions}>
                        <span className={styles.uploadedBadge}>{doc.status}</span>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewDocButton}
                          >
                            <span>Open</span>
                            <ExternalLink className={styles.externalIcon} />
                          </a>
                        ) : (
                          <button type="button" className={styles.viewDocButton} disabled>
                            <span>No file</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reject Verification Box */}
        {isRejecting && (
          <div className={styles.rejectCard}>
            <div className={styles.rejectHeader}>
              <div className={styles.alertIconCircle}>
                <AlertCircle className={styles.alertIcon} />
              </div>
              <div className={styles.rejectHeaderText}>
                <h4 className={styles.rejectTitle}>Reject verification</h4>
                <p className={styles.rejectDesc}>
                  {isOrg
                    ? 'Provide a reason for rejection. The organization will be notified and can reapply with corrected documents.'
                    : 'Provide a reason for rejection. The user will be notified and can update their details and try again.'}
                </p>
              </div>
            </div>

            {/* Custom Dropdown */}
            <div className={styles.dropdownContainer}>
              <button
                type="button"
                className={styles.dropdownTrigger}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={selectedReason ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                  {selectedReason || 'Select a reason...'}
                </span>
                <ChevronDown
                  className={`${styles.chevronDropdown} ${isDropdownOpen ? styles.chevronRotated : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {reasons.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.dropdownOption} ${
                        selectedReason === option ? styles.dropdownOptionActive : ''
                      }`}
                      onClick={() => {
                        setSelectedReason(option)
                        setIsDropdownOpen(false)
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Common Reasons Radio Group */}
            <div className={styles.reasonsListSection}>
              <h5 className={styles.reasonsHeading}>Common reasons</h5>
              <div className={styles.reasonsRadioList}>
                {reasons.map((option) => {
                  const isChecked = selectedReason === option
                  return (
                    <label
                      key={option}
                      className={`${styles.radioLabel} ${isChecked ? styles.radioLabelSelected : ''}`}
                      onClick={() => setSelectedReason(option)}
                    >
                      <span className={`${styles.customRadio} ${isChecked ? styles.customRadioChecked : ''}`}>
                        {isChecked && <span className={styles.radioInnerDot} />}
                      </span>
                      <span className={styles.reasonText}>{option}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {selectedReason === 'Other' && (
              <textarea
                className={styles.otherReason}
                placeholder="Describe the reason…"
                value={otherReason}
                rows={3}
                onChange={(event) => setOtherReason(event.target.value)}
                aria-label="Rejection reason"
              />
            )}
          </div>
        )}

        {error && <ErrorState message={error} compact />}

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          {!isRejecting ? (
            <>
              <button
                type="button"
                className={styles.rejectInitialButton}
                onClick={() => setIsRejecting(true)}
                disabled={busy !== null}
              >
                Reject verification
              </button>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={handleAccept}
                disabled={busy !== null || !canAccept}
                title={canAccept ? undefined : 'Nothing has been submitted for review yet'}
              >
                {busy === 'accept' && <InlineSpinner />} Accept verification
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.cancelRejectButton}
                onClick={() => {
                  setIsRejecting(false)
                  setSelectedReason('')
                  setError(null)
                }}
                disabled={busy !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmRejectButton}
                onClick={handleConfirmReject}
                disabled={busy !== null || !reason}
              >
                {busy === 'reject' && <InlineSpinner />} Reject verification
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document lightbox */}
      {preview?.url && (
        <div
          className={styles.lightbox}
          onClick={(event) => {
            event.stopPropagation()
            setPreview(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
        >
          <button type="button" className={styles.lightboxClose} aria-label="Close preview">
            <X />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt={preview.title} onClick={(event) => event.stopPropagation()} />
          <span className={styles.lightboxCaption}>{preview.title}</span>
        </div>
      )}
    </div>
  )
}

const Fact: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.fact}>
    <dt>{label}</dt>
    <dd>{children || <span className={styles.factEmpty}>Not provided</span>}</dd>
  </div>
)

const Verified: React.FC<{ value: string; ok: boolean }> = ({ value, ok }) => (
  <span className={styles.verifiedValue}>
    <span className={styles.factText}>{value}</span>
    <span className={ok ? styles.tagOk : styles.tagMissing}>{ok ? 'Verified' : 'Unverified'}</span>
  </span>
)

const CopyValue: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked; value is still selectable.
    }
  }
  return (
    <span className={styles.verifiedValue}>
      <span className={styles.factText}>{value}</span>
      <button
        type="button"
        className={styles.copyButton}
        onClick={copy}
        aria-label={copied ? 'Copied' : `Copy ${value}`}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? <Check /> : <Copy />}
      </button>
    </span>
  )
}

export default KYCDetailDrawer
