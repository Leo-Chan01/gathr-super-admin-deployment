'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Sidebar.module.css'
import { usePathname } from 'next/navigation'
import appLogo from '@/public/images/gathr-logo(light).png'
import { useSidebar } from '../../context/SidebarContext'
import SidebarControlButton from './SidebarControlButton'
import SettingsDialog from '../settings/SettingsDialog'

import {
        LayoutDashboard,
        Users,
        Wallet,
        Newspaper,
        AlertTriangle,
        Bell,
        Headphones,
        Settings,
        LogOut,
        X
} from 'lucide-react'

interface NavigationTileItem {
        name: string
        href: string
        icon: React.ComponentType<{ className?: string }>
}

const navigationTileItems: NavigationTileItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Wallets', href: '/wallets', icon: Wallet },
        { name: 'Gathr feed', href: '/gathr-feed', icon: Newspaper },
        { name: 'Reports', href: '/reports', icon: AlertTriangle },
        { name: 'Notification', href: '/notifications', icon: Bell },
        { name: 'Help & Support', href: '/help-support', icon: Headphones },
        { name: 'Settings', href: '/settings', icon: Settings }
]

const SideBar = () => {
        const pathname = usePathname()
        const { isOpen, closeSidebar } = useSidebar()
        const [collapsed, setCollapsed] = useState(false)
        const [settingsOpen, setSettingsOpen] = useState(false)

        return (
                <>
                        {/* Mobile Backdrop */}
                        {isOpen && (
                                <div
                                        className={styles.backdrop}
                                        onClick={closeSidebar}
                                        aria-hidden="true"
                                />
                        )}

                        <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
                        <button
                                type="button"
                                className={styles.collapseButton}
                                onClick={() => setCollapsed((open) => !open)}
                                aria-expanded={!collapsed}
                                aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
                        >
                                <SidebarControlButton />
                        </button>
                        <aside className={`${styles.aside} ${isOpen ? styles.asideMobileOpen : ''}`}>
                                <div>
                                        <div className={styles.brandHeader}>
                                                <div className={styles.brandLeft}>
                                                        <Image src={appLogo} alt='Gathr Logo' className={styles.logo} width={70} />
                                                        <div className={styles.email}>sammy@gmail.com</div>
                                                </div>

                                                {/* Mobile Close Button */}
                                                <button
                                                        type="button"
                                                        className={styles.mobileCloseButton}
                                                        onClick={closeSidebar}
                                                        aria-label="Close menu"
                                                >
                                                        <X className={styles.closeIcon} />
                                                </button>
                                        </div>

                                        {/* Navigation Links */}
                                        <nav className={styles.navigationItems}>
                                                {navigationTileItems.map((item) => {
                                                        const Icon = item.icon
                                                        const isSettings = item.name === 'Settings'
                                                        const isActive = !isSettings && (pathname === item.href || (item.href === '/dashboard' && pathname === '/'))

                                                        if (isSettings) {
                                                                return (
                                                                        <button
                                                                                key={item.name}
                                                                                type="button"
                                                                                className={`${styles.link} ${settingsOpen ? styles.linkActive : ''}`}
                                                                                onClick={() => {
                                                                                        closeSidebar()
                                                                                        setSettingsOpen(true)
                                                                                }}
                                                                        >
                                                                                <div className={styles.linkContent}>
                                                                                        <Icon className={`${styles.icon} ${settingsOpen ? styles.iconActive : ''}`} />
                                                                                        <span>{item.name}</span>
                                                                                </div>
                                                                        </button>
                                                                )
                                                        }

                                                        return (
                                                                <Link
                                                                        key={item.href}
                                                                        href={item.href}
                                                                        onClick={closeSidebar}
                                                                        className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                                                                >
                                                                        <div className={styles.linkContent}>
                                                                                <Icon className={`${styles.icon} ${isActive ? styles.iconActive : ''}`} />
                                                                                <span>{item.name}</span>
                                                                        </div>
                                                                </Link>
                                                        )
                                                })}
                                        </nav>
                                </div>

                                {/* Bottom User Profile Section */}
                                <div className={styles.dashboardFooter}>
                                        <div className={styles.userProfile}>
                                                <div className={styles.avatarContainer}>
                                                        <Image
                                                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                                                                alt="Sylvester John"
                                                                width={36}
                                                                height={36}
                                                                className={styles.avatarImage}
                                                        />
                                                </div>
                                                <div>
                                                        <p className={styles.userName}>Sylvester John</p>
                                                        <span className={styles.adminBadge}>Admin</span>
                                                </div>
                                        </div>

                                        <button type="button" className={styles.logoutButton}>
                                                <LogOut className={styles.logoutIcon} />
                                                <span>Log out</span>
                                        </button>
                                </div>
                        </aside>
                        </div>
                        <SettingsDialog
                                open={settingsOpen}
                                onClose={() => setSettingsOpen(false)}
                        />
                </>
        )
}

export default SideBar

