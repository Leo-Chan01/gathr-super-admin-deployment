'use client'


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css'
import Image from 'next/image';
import appLogo from '@/public/images/gathr-logo(light).png';

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
                        <Image src={appLogo} alt={'Gathr Logo'} className={styles.logo} />
                        <div className={styles.email}> email@gmail.com</div>
                        <nav className={styles.navigationItems}>
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
                                <div>
                                        <div>Settings</div>
                                        <div>
                                                <div>
                                                        Slyvester John
                                                </div>
                                                <div>
                                                        Admin
                                                </div>
                                        </div>
                                </div>
                                <div className={styles.logoutTextButton}>Log out</div>
                        </div>
                </aside >
        )
}

export default SideBar