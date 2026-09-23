'use client'

import React from 'react'
import SideBar from '../sidebar/Sidebar'
import TopNavbar from '../dashboard/TopNavbar'
import { SidebarProvider } from '../../context/SidebarContext'
import styles from './AppShell.module.css'

export const AppShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.container}>
      {/* Persistent Sidebar */}
      <SideBar />

      {/* Main Content Area */}
      <div className={styles.mainArea}>
        {/* Top Navbar */}
        <TopNavbar />

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  )
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  )
}

export default AppShell
