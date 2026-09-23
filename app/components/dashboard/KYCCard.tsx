'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import styles from './KYCCard.module.css'

export interface KYCDocument {
  id: string
  title: string
  fileType: string
  fileSize: string
  status: 'Uploaded' | 'Pending' | 'Rejected'
  url?: string
}

export interface KYCItem {
  id: string | number
  name: string
  category: string
  timeAgo: string
  docsSubmitted: number
  totalDocs: number
  documents?: KYCDocument[]
}

interface KYCCardProps {
  item: KYCItem
  onClick?: () => void
}

export const KYCCard: React.FC<KYCCardProps> = ({ item, onClick }) => {
  return (
    <div onClick={onClick} className={styles.card}>
      {/* Top Header */}
      <div className={styles.header}>
        <AvatarIllustration />
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>{item.name}</h3>
          <div className={styles.metaRow}>
            <span className={styles.badge}>{item.category}</span>
            <span className={styles.bullet}>•</span>
            <span className={styles.timeAgo}>{item.timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Bottom Documents Row */}
      <div className={styles.footerRow}>
        <div className={styles.docStatus}>
          <svg
            className={styles.docIcon}
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
          <span className={styles.docText}>
            {item.docsSubmitted} of {item.totalDocs} documents submitted
          </span>
        </div>
        <ChevronRight className={styles.chevronIcon} />
      </div>
    </div>
  )
}

export default KYCCard

