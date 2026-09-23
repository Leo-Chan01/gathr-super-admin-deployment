import React from 'react'
import SideBar from '../components/sidebar/Sidebar'
import styles from './Dashboard.module.css'

const DashboardPage = () => {
        return (
                <div className={styles.dashboard}>
                        <SideBar />
                        <div className={styles.content}>
                                <h1>Hello world</h1>
                        </div>
                </div>
        )
}

export default DashboardPage