'use client'

import React from 'react'
import styles from './AvatarIllustration.module.css'

interface AvatarIllustrationProps {
  className?: string
}

export const AvatarIllustration: React.FC<AvatarIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <svg
        className={styles.svgIcon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Face Outline */}
        <circle cx="12" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.4" />
        {/* Glasses Left Frame */}
        <rect x="8.5" y="8.5" width="3" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        {/* Glasses Right Frame */}
        <rect x="12.5" y="8.5" width="3" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        {/* Glasses Bridge */}
        <path d="M11.5 9.5H12.5" stroke="currentColor" strokeWidth="1.2" />
        {/* Glasses Temples */}
        <path d="M8.5 9.5H7.5M15.5 9.5H16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Smile */}
        <path d="M10.5 12.2C11 12.8 13 12.8 13.5 12.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Hair Tufts */}
        <path d="M10.5 5.5C11 4.5 13 4.5 13.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Shoulders */}
        <path d="M6 19.5C6 16.5 8.7 15 12 15C15.3 15 18 16.5 18 19.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default AvatarIllustration
