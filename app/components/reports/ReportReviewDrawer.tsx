'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import { getReport, reviewReport } from '../../lib/api/admin'
import { toReportDetail } from '../../lib/api/adapters'
import { errorMessage } from '../../lib/api/client'
import type { ReviewDecision } from '../../lib/api/types'
import { useResource } from '../../lib/hooks/useResource'
import drawer from '../dashboard/KYCDetailDrawer.module.css'
import styles from '../common/DetailRows.module.css'

const DECISIONS: { value: ReviewDecision; label: string; hint: string }[] = [
  { value: 'REMOVED', label: 'Remove content', hint: 'Takes the content down for everyone.' },
  { value: 'RESOLVED', label: 'Resolve', hint: 'Action taken outside removal (e.g. warning).' },
  { value: 'DISMISSED', label: 'Dismiss', hint: 'Report is not a violation.' }
]

interface ReportReviewDrawerProps {
  reportId: string | null
  onClose: () => void
  onReviewed: (id: string, status: ReviewDecision) => void
}

export const ReportReviewDrawer: React.FC<ReportReviewDrawerProps> = ({ reportId, onClose, onReviewed }) => {
  if (!reportId) return null
  // Keyed so form state resets per report.
  return <ReviewPanel key={reportId} reportId={reportId} onClose={onClose} onReviewed={onReviewed} />
}

const ReviewPanel: React.FC<{ reportId: string } & Omit<ReportReviewDrawerProps, 'reportId'>> = ({
  reportId,
  onClose,
  onReviewed
}) => {
  const report = useResource((signal) => getReport(reportId, { signal }).then(toReportDetail), [reportId])
  const [decision, setDecision] = useState<ReviewDecision | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const detail = report.data
  const isOpen = !detail || detail.item.status === 'OPEN'

  const close = () => {
    if (!submitting) onClose()
  }

  const submit = async () => {
    if (!decision || !reason.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await reviewReport(reportId, decision, reason.trim())
      onReviewed(reportId, decision)
      onClose()
    } catch (err) {
      setSubmitError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className={drawer.overlay} onClick={close}>
      <div
        className={drawer.drawer}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Review report"
      >
        <div className={drawer.header}>
          <div className={drawer.headerLeft}>
            {detail?.item.avatarUrl ? (
              <Image src={detail.item.avatarUrl} alt="" width={44} height={44} style={{ borderRadius: '50%' }} />
            ) : (
              <AvatarIllustration />
            )}
            <div className={drawer.headerInfo}>
              <h2 className={drawer.title}>{detail?.item.username ?? detail?.item.name ?? 'Report'}</h2>
              <div className={drawer.metaRow}>
                <span className={drawer.badge}>{detail?.item.entityType?.replace(/_/g, ' ').toLowerCase() ?? 'report'}</span>
                <span className={drawer.bullet}>•</span>
                <span className={drawer.timeAgo}>{detail?.item.timeAgo}</span>
              </div>
            </div>
          </div>
          <button type="button" className={drawer.closeButton} onClick={close} aria-label="Close drawer">
            <X className={drawer.closeIcon} />
          </button>
        </div>

        {report.loading && !detail && (
          <div className={styles.loading} aria-busy="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
        {report.error && <ErrorState message={report.error} onRetry={report.reload} />}

        {detail && (
          <>
            <div className={styles.quote}>
              <span className={styles.quoteLabel}>Reason for report</span>
              {detail.item.comment}
            </div>

            <div className={styles.quote}>
              <span className={styles.quoteLabel}>
                Reported content{detail.contentAuthor ? ` · by ${detail.contentAuthor}` : ''}
              </span>
              {detail.contentBody ?? detail.item.targetTitle}
              {detail.item.targetImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.item.targetImage} alt="" className={styles.media} />
              )}
            </div>

            <dl className={styles.rows}>
              {detail.rows.map((row) => (
                <React.Fragment key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </React.Fragment>
              ))}
            </dl>

            {isOpen ? (
              <div className={drawer.rejectCard}>
                <h4 className={drawer.rejectTitle}>Decision</h4>
                <div className={styles.decisions} role="radiogroup" aria-label="Decision">
                  {DECISIONS.map((option) => {
                    const checked = decision === option.value
                    return (
                      <label
                        key={option.value}
                        className={`${drawer.radioLabel} ${checked ? drawer.radioLabelSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="decision"
                          value={option.value}
                          checked={checked}
                          onChange={() => setDecision(option.value)}
                          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />
                        <span className={`${drawer.customRadio} ${checked ? drawer.customRadioChecked : ''}`}>
                          {checked && <span className={drawer.radioInnerDot} />}
                        </span>
                        <span className={drawer.reasonText}>
                          <strong>{option.label}</strong> — {option.hint}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <textarea
                  className={styles.reasonInput}
                  rows={3}
                  placeholder="Reason (saved to the audit log)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  aria-label="Review reason"
                />
              </div>
            ) : (
              <p className={styles.reviewed}>This report has already been reviewed.</p>
            )}
          </>
        )}

        {submitError && <ErrorState message={submitError} compact />}

        <div className={styles.spacer} />
        <div className={drawer.footerActions}>
          <button type="button" className={drawer.cancelRejectButton} onClick={close} disabled={submitting}>
            {isOpen ? 'Cancel' : 'Close'}
          </button>
          {detail && isOpen && (
            <button
              type="button"
              className={decision === 'DISMISSED' ? drawer.acceptButton : drawer.confirmRejectButton}
              onClick={submit}
              disabled={submitting || !decision || !reason.trim()}
            >
              {submitting && <InlineSpinner />} {DECISIONS.find((d) => d.value === decision)?.label ?? 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportReviewDrawer
