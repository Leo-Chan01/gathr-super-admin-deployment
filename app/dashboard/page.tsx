import React from 'react'
import { Search } from 'lucide-react'
import DashboardOverview from '../components/dashboard/DashboardOverview'
import styles from './Dashboard.module.css'

const DashboardPage = () => {
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <label className={styles.search}>
          <input
            type="search"
            placeholder="Search"
            aria-label="Search"
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} />
        </label>
      </header>

      <DashboardOverview />
    </div>
  )
}

export default DashboardPage
