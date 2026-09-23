'use client'

import React, { useState } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'
import styles from './TopNavbar.module.css'

interface TopNavbarProps {
  onSearch?: (query: string) => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('')
  const { toggleSidebar } = useSidebar()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  return (
    <header className={styles.header}>
      {/* Top Left Menu Button for Mobile */}
      <div className={styles.leftControls}>
        <button
          type="button"
          onClick={toggleSidebar}
          className={styles.mobileMenuButton}
          aria-label="Toggle navigation menu"
        >
          <Menu className={styles.menuIcon} />
        </button>
      </div>

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

