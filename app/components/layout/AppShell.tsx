'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SideBar from '../sidebar/Sidebar'
import TopNavbar from '../dashboard/TopNavbar'
import { SidebarProvider } from '../../context/SidebarContext'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import styles from './AppShell.module.css'

const LOGIN_PATH = '/login'

export const AppShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useAuth()
  const onLogin = pathname === LOGIN_PATH

  // Client-side guard: tokens live in localStorage, so the server can't check them.
  useEffect(() => {
    if (session === undefined) return
    if (!session && !onLogin) router.replace(LOGIN_PATH)
    if (session && onLogin) router.replace('/dashboard')
  }, [session, onLogin, router])

  if (onLogin) {
    return <div className={styles.bare}>{session ? null : children}</div>
  }

  // Storage not read yet, or redirecting to login.
  if (!session) return <div className={styles.bare} aria-busy="true" />

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
    <AuthProvider>
      <SidebarProvider>
        <AppShellContent>{children}</AppShellContent>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default AppShell
