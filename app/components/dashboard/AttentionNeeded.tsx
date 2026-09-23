'use client'

import React, { useState } from 'react'
import KYCCard, { KYCItem } from './KYCCard'
import WithdrawalCard, { WithdrawalItem } from './WithdrawalCard'
import FlaggedCard, { FlaggedItem } from './FlaggedCard'
import styles from './AttentionNeeded.module.css'

type TabType = 'flagged' | 'kyc' | 'withdrawal'

interface TabConfig {
  key: TabType
  label: string
  count: number
}

const tabs: TabConfig[] = [
  { key: 'flagged', label: 'Flagged content', count: 14 },
  { key: 'kyc', label: 'Pending KYC', count: 247 },
  { key: 'withdrawal', label: 'Withdrawal request', count: 24 }
]

// Mock KYC items (16 items to fill 4x4 grid as in screenshot)
const kycItems: KYCItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: `kyc-${i + 1}`,
  name: 'The Mindgeek Collective',
  category: 'Non-profit',
  timeAgo: '2hrs ago',
  docsSubmitted: 2,
  totalDocs: 2
}))

// Mock Withdrawal items (6 items in 3x2 grid as in screenshot)
const withdrawalItems: WithdrawalItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `w-${i + 1}`,
  name: 'The Mindgeek Collective',
  category: 'Non-profit',
  timeAgo: '2hrs ago',
  amount: '$150,000',
  bankName: 'Wema Bank',
  accountLast4: '6734',
  walletType: 'Campaign wallet',
  campaignName: 'Help Alex raise the money for his ...',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=150&auto=format&fit=crop&q=80'
}))

// Mock Flagged items
const flaggedItems: FlaggedItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `flag-${i + 1}`,
  name: 'The Mindgeek Collective',
  category: 'Non-profit',
  timeAgo: '2hrs ago',
  reason: 'Misleading Campaign Description',
  reportCount: 5,
  targetTitle: 'Clean Water Initiative for Rural Schools'
}))

export const AttentionNeeded: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('kyc')
  const [showAll, setShowAll] = useState(false)

  const getActiveCount = () => {
    switch (activeTab) {
      case 'kyc':
        return { showing: kycItems.length, total: 247 }
      case 'withdrawal':
        return { showing: withdrawalItems.length, total: 24 }
      case 'flagged':
        return { showing: flaggedItems.length, total: 14 }
    }
  }

  const { showing, total } = getActiveCount()

  return (
    <div className={styles.container}>
      {/* Section Header with Title and Tabs */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Attention Needed</h2>
          <p className={styles.subtitle}>
            High-priority items requiring immediate intervention
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''
                  }`}
              >
                <span>
                  {tab.label} ({tab.count})
                </span>
                {isActive && <span className={styles.activeUnderline} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Content */}
      {activeTab === 'flagged' && (
        <div className={styles.flaggedGrid}>
          {flaggedItems.map((item) => (
            <FlaggedCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className={styles.contentGridArea}>
        {activeTab === 'kyc' && (
          <div className={styles.kycGrid}>
            {kycItems.map((item) => (
              <KYCCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {activeTab === 'withdrawal' && (
          <div className={styles.withdrawalGrid}>
            {withdrawalItems.map((item) => (
              <WithdrawalCard key={item.id} item={item} />
            ))}
          </div>
        )}


      </div>

      {/* Footer Navigation Bar */}
      <div className={styles.footerBar}>
        <span className={styles.showingText}>
          Showing {showing} of {total} items
        </span>

        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className={styles.viewAllButton}
        >
          {showAll ? 'Show less' : 'View all'}
        </button>
      </div>
    </div>
  )
}

export default AttentionNeeded
