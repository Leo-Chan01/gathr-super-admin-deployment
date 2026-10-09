'use client'

import React, { useRef, useState } from 'react'
import KYCCard, { KYCItem } from './KYCCard'
import WithdrawalCard, { WithdrawalItem } from './WithdrawalCard'
import FlaggedCard, { FlaggedItem } from './FlaggedCard'
import KYCDetailDrawer from './KYCDetailDrawer'
import { useReflow, useTabIndicator } from '../motion/useMotion'
import styles from './AttentionNeeded.module.css'

type TabType = 'flagged' | 'kyc' | 'withdrawal'

interface TabConfig {
  key: TabType
  label: string
  count: number
}

const tabOrder: TabType[] = ['flagged', 'kyc', 'withdrawal']

const tabs: TabConfig[] = [
  { key: 'flagged', label: 'Flagged content', count: 14 },
  { key: 'kyc', label: 'Pending KYC', count: 247 },
  { key: 'withdrawal', label: 'Withdrawal request', count: 24 }
]

// Mock KYC items (16 items to fill 4x4 grid as in screenshot)
const initialKycItems: KYCItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: `kyc-${i + 1}`,
  name: 'The Mindgeek Collective',
  category: 'Non-profit',
  timeAgo: '2hrs ago',
  docsSubmitted: 2,
  totalDocs: 2,
  documents: [
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
const flaggedItems: FlaggedItem[] = [
  {
    id: 'flag-1',
    username: '@ademide_jerry',
    name: 'Ademide Jerry',
    timeAgo: '2hrs ago',
    comment: 'This is actually really despicable. Racist content shoul...',
    targetTitle: 'A close friend named Alex is in need of immediate surgery.',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    targetImage:
      'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'flag-2',
    username: '@sarah_daniels',
    name: 'Sarah Daniels',
    timeAgo: '3hrs ago',
    comment: 'This campaign contains copyright protected imagery without permission...',
    targetTitle: 'Help rebuild the Springfield Community Center after storm damage.',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    targetImage:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'flag-3',
    username: '@michael_c',
    name: 'Michael Chen',
    timeAgo: '5hrs ago',
    comment: 'Misleading fundraiser goal and suspicious fund beneficiary details...',
    targetTitle: 'Clean Water Initiative for Rural Schools & Orphanages.',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    targetImage:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'flag-4',
    username: '@ademide_jerry',
    name: 'Ademide Jerry',
    timeAgo: '6hrs ago',
    comment: 'This is actually really despicable. Racist content shoul...',
    targetTitle: 'Emergency medical expenses for baby Lucas cardiology care.',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    targetImage:
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'flag-5',
    username: '@karen_white',
    name: 'Karen White',
    timeAgo: '8hrs ago',
    comment: 'Unverified medical claims and misleading promotional descriptions...',
    targetTitle: 'Support local animal shelter expansion project winter 2026.',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    targetImage:
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'flag-6',
    username: '@david_ross',
    name: 'David Ross',
    timeAgo: '12hrs ago',
    comment: 'Spam comments promoting unrelated commercial crypto projects...',
    targetTitle: 'Scholarship endowment for underprivileged tech students.',
    avatarUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    targetImage:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&auto=format&fit=crop&q=80'
  }
]

export const AttentionNeeded: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('kyc')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [showAll, setShowAll] = useState(false)
  const [kycList, setKycList] = useState<KYCItem[]>(initialKycItems)
  const [flaggedList, setFlaggedList] = useState<FlaggedItem[]>(flaggedItems)
  const [selectedKYCItem, setSelectedKYCItem] = useState<KYCItem | null>(null)
  const { tabsRef, indicator } = useTabIndicator(activeTab)
  const flaggedGridRef = useRef<HTMLDivElement>(null)
  const beginFlaggedRemove = useReflow(flaggedGridRef)

  const getActiveCount = () => {
    switch (activeTab) {
      case 'kyc':
        return { showing: kycList.length, total: 247 }
      case 'withdrawal':
        return { showing: withdrawalItems.length, total: 24 }
      case 'flagged':
        return { showing: flaggedList.length, total: 14 }
    }
  }

  const { showing, total } = getActiveCount()

  const handleAcceptKYC = (item: KYCItem) => {
    setKycList((prev) => prev.filter((k) => k.id !== item.id))
  }

  const handleRejectKYC = (item: KYCItem) => {
    setKycList((prev) => prev.filter((k) => k.id !== item.id))
  }

  const selectTab = (next: TabType) => {
    if (next === activeTab) return
    setDirection(tabOrder.indexOf(next) > tabOrder.indexOf(activeTab) ? 1 : -1)
    setActiveTab(next)
  }

  const dismissFlagged = (item: FlaggedItem) => {
    beginFlaggedRemove(String(item.id))
    setFlaggedList((current) => current.filter((entry) => entry.id !== item.id))
  }

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
        <div className={styles.tabsContainer} role="tablist" aria-label="Attention needed" ref={tabsRef}>
          {indicator.ready && (
            <span
              className={styles.tabIndicator}
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.x}px)`
              }}
            />
          )}
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(tab.key)}
                className={`${styles.tabButton} ${
                  isActive ? styles.tabButtonActive : ''
                }`}
              >
                <span>
                  {tab.label} ({tab.count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className={styles.contentGridArea}>
        <div
          key={activeTab}
          className={`${styles.pane} ${direction < 0 ? styles.paneBack : ''}`}
        >
          {activeTab === 'flagged' && (
            flaggedList.length > 0 ? (
              <div className={styles.flaggedGrid} ref={flaggedGridRef}>
                {flaggedList.map((item) => (
                  <div key={item.id} data-flip-id={String(item.id)} className={styles.flipItem}>
                    <FlaggedCard item={item} onDismiss={dismissFlagged} />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No flagged content in this view.</p>
            )
          )}

          {activeTab === 'kyc' && (
            <div className={styles.kycGrid}>
              {kycList.map((item) => (
                <KYCCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedKYCItem(item)}
                />
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

      {/* KYC Right Aside Drawer */}
      <KYCDetailDrawer
        isOpen={Boolean(selectedKYCItem)}
        item={selectedKYCItem}
        onClose={() => setSelectedKYCItem(null)}
        onAccept={handleAcceptKYC}
        onReject={handleRejectKYC}
      />
    </div>
  )
}

export default AttentionNeeded
