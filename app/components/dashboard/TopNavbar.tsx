'use client'

import React, { useState } from 'react'
import { Search, Bell } from 'lucide-react'
import styles from './TopNavbar.module.css'

interface TopNavbarProps {
  onSearch?: (query: string) => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.rightControls}>
        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search..."
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className={styles.notificationButton}
        >
          <Bell className={styles.bellIcon} />
          <span className={styles.badge}>3</span>
        </button>
      </div>
    </header>
  )
}

export default TopNavbar
