'use client'

import React, { useState } from 'react'
import { X, ExternalLink, AlertCircle, ChevronDown } from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import { KYCItem, KYCDocument } from './KYCCard'
import styles from './KYCDetailDrawer.module.css'

interface KYCDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  item: KYCItem | null
  onAccept?: (item: KYCItem) => void
  onReject?: (item: KYCItem, reason: string) => void
}

const COMMON_REASONS = [
  'TIN document is invalid',
  'Certificate of incorporation is invalid',
  'Document is unreadable',
  "Information doesn't match",
  'Documents are expired',
  'Wrong document submitted',
  'Other'
]

const DEFAULT_DOCUMENTS: KYCDocument[] = [
  {
    id: 'doc-1',
    title: 'TIN Document',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    status: 'Uploaded'
  },
  {
    id: 'doc-2',
    title: 'Certificate of Incorporation',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    status: 'Uploaded'
  }
]

export const KYCDetailDrawer: React.FC<KYCDetailDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onAccept,
  onReject
}) => {
  const [isRejecting, setIsRejecting] = useState(false)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!isOpen || !item) return null

  const documents = item.documents && item.documents.length > 0 ? item.documents : DEFAULT_DOCUMENTS

  const handleClose = () => {
    setIsRejecting(false)
    setSelectedReason('')
    setIsDropdownOpen(false)
    onClose()
  }

  const handleAccept = () => {
    onAccept?.(item)
    handleClose()
  }

  const handleConfirmReject = () => {
    onReject?.(item, selectedReason || 'Document verification failed')
    handleClose()
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <AvatarIllustration />
            <div className={styles.headerInfo}>
              <h2 className={styles.title}>{item.name}</h2>
              <div className={styles.metaRow}>
                <span className={styles.badge}>{item.category}</span>
                <span className={styles.bullet}>•</span>
                <span className={styles.timeAgo}>{item.timeAgo}</span>
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

        {/* Status Summary Banner */}
        <div className={styles.summaryCard}>
          {/* Required documents stat */}
          <div className={styles.statItem}>
            <div className={styles.statIconBox}>
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
            </div>
            <div className={styles.statContent}>
              <span className={styles.statPrimary}>
                {item.docsSubmitted} / {item.totalDocs}
              </span>
              <span className={styles.statSecondary}>Required documents</span>
            </div>
          </div>

          {/* Submission time stat */}
          <div className={styles.statItem}>
            <div className={styles.statIconBox}>
              <svg
                className={styles.statIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statPrimary}>{item.timeAgo.replace('ago', '').trim()} ago</span>
              <span className={styles.statSecondary}>Submitted</span>
            </div>
          </div>
        </div>

        {/* Verification Documents Section */}
        <div className={styles.documentsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Verification documents</h3>
            <p className={styles.sectionSubtitle}>
              These documents are required for verification.
            </p>
          </div>

          <div className={styles.documentList}>
            {documents.map((doc) => (
              <div key={doc.id} className={styles.documentItem}>
                <div className={styles.docInfo}>
                  <h4 className={styles.docTitle}>{doc.title}</h4>
                  <span className={styles.docMeta}>
                    {doc.fileType} • {doc.fileSize}
                  </span>
                </div>

                <div className={styles.docActions}>
                  <span className={styles.uploadedBadge}>Uploaded</span>
                  <button
                    type="button"
                    className={styles.viewDocButton}
                    onClick={() => {
                      if (doc.url) window.open(doc.url, '_blank')
                    }}
                  >
                    <span>View</span>
                    <ExternalLink className={styles.externalIcon} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reject Verification Box (Shown when isRejecting === true) */}
        {isRejecting && (
          <div className={styles.rejectCard}>
            <div className={styles.rejectHeader}>
              <div className={styles.alertIconCircle}>
                <AlertCircle className={styles.alertIcon} />
              </div>
              <div className={styles.rejectHeaderText}>
                <h4 className={styles.rejectTitle}>Reject verification</h4>
                <p className={styles.rejectDesc}>
                  Provide a reason for rejection. The organization will be
                  notified and can reapply with corrected documents.
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
                  className={`${styles.chevronDropdown} ${
                    isDropdownOpen ? styles.chevronRotated : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {COMMON_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      className={`${styles.dropdownOption} ${
                        selectedReason === reason ? styles.dropdownOptionActive : ''
                      }`}
                      onClick={() => {
                        setSelectedReason(reason)
                        setIsDropdownOpen(false)
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Common Reasons Radio Group */}
            <div className={styles.reasonsListSection}>
              <h5 className={styles.reasonsHeading}>Common reasons</h5>
              <div className={styles.reasonsRadioList}>
                {COMMON_REASONS.map((reason) => {
                  const isChecked = selectedReason === reason
                  return (
                    <label
                      key={reason}
                      className={`${styles.radioLabel} ${
                        isChecked ? styles.radioLabelSelected : ''
                      }`}
                      onClick={() => setSelectedReason(reason)}
                    >
                      <span className={`${styles.customRadio} ${isChecked ? styles.customRadioChecked : ''}`}>
                        {isChecked && <span className={styles.radioInnerDot} />}
                      </span>
                      <span className={styles.reasonText}>{reason}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          {!isRejecting ? (
            <>
              <button
                type="button"
                className={styles.rejectInitialButton}
                onClick={() => setIsRejecting(true)}
              >
                Reject verification
              </button>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={handleAccept}
              >
                Accept verification
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
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmRejectButton}
                onClick={handleConfirmReject}
              >
                Reject verification
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default KYCDetailDrawer
