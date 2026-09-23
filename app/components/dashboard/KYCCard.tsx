'use client'

import React from 'react'
import { FileText, ChevronRight } from 'lucide-react'
import AvatarIllustration from './AvatarIllustration'
import styles from './KYCCard.module.css'

export interface KYCItem {
  id: string | number
  name: string
  category: string
  timeAgo: string
  docsSubmitted: number
  totalDocs: number
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
          <FileText className={styles.docIcon} />
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
