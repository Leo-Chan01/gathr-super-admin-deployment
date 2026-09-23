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
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hair Accent */}
        <path
          d="M12 9C14 7.2 18 7.2 20 9"
          stroke="#B5CC18"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Head and Profile Outline (facing right) */}
        <path
          d="M13 22V16.5C13 13.5 14.5 9.8 19 9.8C23 9.8 24.2 12.8 24.2 15C24.2 15.6 25.5 15.9 25.8 16.8C26 17.8 24.8 18.2 24.8 18.8C24.8 19.5 23 20.2 21.5 20.2V22.5"
          stroke="#1E293B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glasses Frame and Bridge */}
        <rect
          x="17"
          y="13.5"
          width="5.5"
          height="4"
          rx="1"
          stroke="#1E293B"
          strokeWidth="1.4"
          fill="none"
        />
        {/* Glasses Temple (Arm) */}
        <path
          d="M17 14.8H11.5"
          stroke="#1E293B"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* Ear Accent */}
        <path
          d="M11 14.2C10.2 14.8 10.2 16.2 11.2 16.8"
          stroke="#B5CC18"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Collar / Chin Accent */}
        <path
          d="M14 21.5C15.2 22.8 18.8 22.8 20 21.5"
          stroke="#B5CC18"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default AvatarIllustration

