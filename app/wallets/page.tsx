import React from 'react'
import { Search } from 'lucide-react'
import WalletSummaryCards from '../components/wallets/WalletSummaryCards'
import PayoutOverview from '../components/wallets/PayoutOverview'
import RequestsActivity from '../components/wallets/RequestsActivity'
import styles from './Wallets.module.css'

const WalletsPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Wallet</h1>
          <label className={styles.search}>
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className={styles.searchInput}
            />
            <Search className={styles.searchIcon} />
          </label>
        </div>
        <p className={styles.subtitle}>
          Manage payouts, schedule disbursals, and monitor treasury flow.
        </p>
      </header>

      <WalletSummaryCards />
      <PayoutOverview />
      <RequestsActivity />
    </div>
  )
}

export default WalletsPage
