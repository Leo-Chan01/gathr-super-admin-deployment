'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Sidebar.module.css'
import { usePathname, useRouter } from 'next/navigation'
import appLogo from '@/public/images/gathr-logo(light).png'
import { useSidebar } from '../../context/SidebarContext'
import { useAuth } from '../../context/AuthContext'
import { str, userName } from '../../lib/api/adapters'
import SidebarControlButton from './SidebarControlButton'
import SettingsDialog from '../settings/SettingsDialog'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import { getUnreadCount, UNREAD_EVENT } from '../../lib/api/notifications'
import { useResource } from '../../lib/hooks/useResource'

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
        const router = useRouter()
        const { isOpen, closeSidebar } = useSidebar()
        const [collapsed, setCollapsed] = useState(false)
        const [settingsOpen, setSettingsOpen] = useState(false)
        const { session, logout } = useAuth()
        const user = session?.user ?? null
        const displayName = user ? userName(user) : 'Admin'
        const avatarUrl = str(user, 'avatar', 'avatar.url')
        const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super admin' : user?.role === 'MODERATOR' ? 'Moderator' : 'Admin'

        // Unread badge: refresh on navigation and when the inbox changes.
        const unread = useResource((signal) => getUnreadCount({ signal }).catch(() => 0), [pathname])
        const reloadUnread = unread.reload
        useEffect(() => {
                window.addEventListener(UNREAD_EVENT, reloadUnread)
                return () => window.removeEventListener(UNREAD_EVENT, reloadUnread)
        }, [reloadUnread])
        const unreadCount = unread.data ?? 0

        const handleLogout = async () => {
                await logout()
                router.replace('/login')
        }

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
                                                                <div className={styles.email}>{user?.email ?? ''}</div>
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
                                                                const isActive =
                                                                        !isSettings &&
                                                                        (pathname === item.href ||
                                                                                pathname.startsWith(`${item.href}/`) ||
                                                                                (item.href === '/dashboard' && pathname === '/'))

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
                                                                                        {item.href === '/notifications' && unreadCount > 0 && (
                                                                                                <span className={styles.badge} aria-label={`${unreadCount} unread`}>
                                                                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                                                                </span>
                                                                                        )}
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
                                                                {avatarUrl ? (
                                                                        // Plain <img>: avatars come from several hosts (S3, Google).
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                                src={avatarUrl}
                                                                                alt={displayName}
                                                                                width={36}
                                                                                height={36}
                                                                                className={styles.avatarImage}
                                                                                referrerPolicy="no-referrer"
                                                                        />
                                                                ) : (
                                                                        <AvatarIllustration />
                                                                )}
                                                        </div>
                                                        <div>
                                                                <p className={styles.userName}>{displayName}</p>
                                                                <span className={styles.adminBadge}>{roleLabel}</span>
                                                        </div>
                                                </div>

                                                <button
                                                        type="button"
                                                        className={styles.logoutButton}
                                                        onClick={handleLogout}
                                                >
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

