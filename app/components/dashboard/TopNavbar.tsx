'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'
import styles from './TopNavbar.module.css'

export const TopNavbar: React.FC = () => {
  const { toggleSidebar } = useSidebar()

  return (
    <header className={`${styles.header} ${styles.headerCompact}`}>
      <button
        type="button"
        onClick={toggleSidebar}
        className={styles.mobileMenuButton}
        aria-label="Toggle navigation menu"
      >
        <Menu className={styles.menuIcon} />
      </button>
    </header>
  )
}

export default TopNavbar
