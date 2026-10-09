import React from 'react'
import Image from 'next/image'
import { walletSummary } from './walletData'
import styles from './WalletSummaryCards.module.css'

export const WalletSummaryCards: React.FC = () => {
  return (
    <div className={styles.grid}>
      <article className={`${styles.card} ${styles.balanceCard}`}>
        <p className={styles.badge}>Available balance</p>
        <p className={styles.value}>{walletSummary.availableBalance}</p>
        <Image
          src="/images/safe-box.png"
          alt=""
          width={152}
          height={152}
          className={styles.balanceArt}
        />
      </article>

      <article className={`${styles.card} ${styles.payoutsCard}`}>
        <p className={styles.badge}>Total payouts sent</p>
        <p className={styles.value}>{walletSummary.totalPayoutsSent}</p>
        <Image
          src="/images/arrow-box.png"
          alt=""
          width={134}
          height={134}
          className={styles.payoutArt}
        />
      </article>
    </div>
  )
}

export default WalletSummaryCards
