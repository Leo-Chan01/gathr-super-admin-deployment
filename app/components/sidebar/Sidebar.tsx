'use client'


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css'

interface NavigationTileItem {
        name: string
        href: string
}

const navigationTileItems: NavigationTileItem[] = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Users', href: '/users' },
        { name: 'Wallets', href: '/wallets' },
        { name: 'Gathr Feed', href: '/gathr-feed' },
        { name: 'Reports', href: '/reports' },
        { name: 'Notifications', href: '/notifications' },
        { name: 'Help & Support', href: '/help-support' },
        { name: 'Settings', href: '/settings' }
]

const SideBar = () => {
        const pathname = usePathname();

        return (
                <aside className={styles.aside}>
                        <div className={styles.logo}>
                                Gathr
                        </div>
                        <nav className={styles.navigation}>

                                {navigationTileItems.map((navigationTileItem) => (

                                        <Link
                                                key={navigationTileItem.href}
                                                href={navigationTileItem.href}
                                                className={`${styles.link} ${pathname === navigationTileItem.href ? styles.active : ""}`}>
                                                {navigationTileItem.name}

                                        </Link>
                                ))}
                        </nav>
                        <div className={styles.dashboardFooter}>
                                Profile
                        </div>
                </aside >
        )
}

export default SideBar