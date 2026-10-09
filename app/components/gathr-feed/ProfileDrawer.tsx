'use client'

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Bell,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  HandCoins,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Search,
  SlidersHorizontal,
  Star,
  UserRound,
  X
} from 'lucide-react'
import { formatCount, type ProfileReview, type ReviewRelation, type UserProfile } from './feedData'
import styles from './FeedBoard.module.css'

const relations: Array<ReviewRelation | 'All'> = ['All', 'Donated to', 'Received from', 'Attended']

const relationIcon = (relation: ReviewRelation) => {
  if (relation === 'Donated to') return <HandCoins className={styles.relationIcon} />
  if (relation === 'Received from') return <Heart className={styles.relationIcon} />
  return <CalendarCheck className={styles.relationIcon} />
}

interface ProfileDrawerProps {
  profile: UserProfile
  onClose: () => void
  onBack: () => void
  motion: 'enter' | 'forward' | 'back' | 'exit'
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ profile, onClose, onBack, motion }) => {
  const [tab, setTab] = useState<'about' | 'reviews' | 'alerts' | 'account'>('reviews')
  const [causesOpen, setCausesOpen] = useState(false)
  const [filter, setFilter] = useState<ReviewRelation | 'All'>('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [reviews, setReviews] = useState<ProfileReview[]>(profile.reviews)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })

  useLayoutEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const measure = () => {
      const active = root.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement | null
      if (!active) return
      const rootRect = root.getBoundingClientRect()
      const rect = active.getBoundingClientRect()
      setIndicator({ x: rect.left - rootRect.left, width: rect.width })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [tab])

  const visibleCauses = causesOpen ? profile.causes : profile.causes.slice(0, 2)
  const extraCauses = profile.causes.length - 2

  const visibleReviews = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return reviews.filter((review) => {
      if (filter !== 'All' && review.relation !== filter) return false
      if (!normalized) return true
      return `${review.username} ${review.body} ${review.relation}`.toLowerCase().includes(normalized)
    })
  }, [reviews, filter, query])

  const toggleLike = (id: string) => {
    setReviews((current) =>
      current.map((review) => {
        if (review.id !== id) return review
        const liked = !review.liked
        return { ...review, liked, likes: review.likes + (liked ? 1 : -1) }
      })
    )
  }

  const addReview = () => {
    const text = draft.trim()
    if (!text) return
    setReviews((current) => [
      {
        id: `local-${Date.now()}`,
        username: '@you',
        avatarUrl: profile.avatarUrl,
        relation: 'Attended',
        body: text.includes(profile.username) ? text : `Kudos to ${profile.username} ${text}`,
        likes: 0,
        comments: 0,
        liked: false
      },
      ...current
    ])
    setDraft('')
    setComposerOpen(false)
    setTab('reviews')
  }

  const copyHandle = async () => {
    await navigator.clipboard?.writeText(profile.username)
    setMenuOpen(false)
  }

  return (
    <div
      className={`${styles.detail} ${
        styles[
          motion === 'enter'
            ? 'drawerIn'
            : motion === 'forward'
              ? 'panelForward'
              : motion === 'back'
                ? 'panelBack'
                : 'drawerOut'
        ]
      }`}
    >
      <div className={styles.detailTop}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <button type="button" className={styles.crumbButton} onClick={onBack}>
            Post
          </button>
          <span className={styles.crumbSep} aria-hidden="true">
            /
          </span>
          <span className={`${styles.crumb} ${styles.crumbCurrent}`}>{profile.name}</span>
        </nav>
        <button type="button" className={styles.closeButton} aria-label="Close profile" onClick={onClose}>
          <X className={styles.closeIcon} />
        </button>
      </div>

      <div className={styles.cover}>
        <div className={styles.coverFrame}>
          <Image src={profile.coverUrl} alt="" fill sizes="420px" className={styles.coverPhoto} />
        </div>
        <div className={styles.coverBar}>
          <button type="button" className={styles.coverButton} aria-label="Back" onClick={onBack}>
            <ChevronLeft className={styles.coverIcon} />
          </button>
          <div className={styles.coverActions}>
            <button
              type="button"
              className={styles.coverButton}
              aria-label="Search reviews"
              aria-pressed={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search className={styles.coverIcon} />
            </button>
            <div className={styles.rowMenu}>
              <button
                type="button"
                className={styles.coverButton}
                aria-label="Profile actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreHorizontal className={styles.coverIcon} />
              </button>
              {menuOpen && (
                <div className={styles.rowMenuList}>
                  <button type="button" className={styles.menuItem} onClick={copyHandle}>
                    Copy handle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {searchOpen && (
          <input
            className={styles.coverSearch}
            placeholder="Search reviews"
            value={query}
            aria-label="Search reviews"
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        <Image src={profile.avatarUrl} alt="" width={74} height={74} className={styles.profileAvatar} />
      </div>

      <div className={styles.profileNameRow}>
        <h2 className={styles.profileName}>{profile.name}</h2>
        <span className={styles.profileRating}>
          {profile.rating.toFixed(1)}
          <Star className={styles.starFilled} />
        </span>
      </div>
      <p className={styles.profileHandle}>{profile.username}</p>
      <p className={styles.profileBio}>{profile.bio}</p>

      <div className={styles.profileMeta}>
        <span>
          <MapPin className={styles.metaIcon} />
          {profile.location}
        </span>
        <span>
          <Calendar className={styles.metaIcon} />
          {profile.since}
        </span>
      </div>

      <div className={styles.causeRow}>
        {visibleCauses.map((cause) => (
          <span key={cause} className={styles.cause}>
            {cause}
          </span>
        ))}
        {!causesOpen && extraCauses > 0 && (
          <button type="button" className={styles.causeMore} onClick={() => setCausesOpen(true)}>
            + {extraCauses}
          </button>
        )}
      </div>

      <div className={styles.statRow}>
        <p>
          <strong>{profile.following}</strong> Following
        </p>
        <p>
          <strong>{profile.followers}</strong> Followers
        </p>
        <p>
          <strong>{profile.karma}</strong> Karma
        </p>
      </div>

      <div className={styles.profileTabs} role="tablist" aria-label="Profile" ref={tabsRef}>
        <span
          className={styles.profileIndicator}
          style={{ transform: `translateX(${indicator.x}px)`, width: indicator.width }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'about'}
          className={`${styles.profileTab} ${tab === 'about' ? styles.profileTabActive : ''}`}
          aria-label="About"
          onClick={() => setTab('about')}
        >
          <PenLine className={styles.profileTabIcon} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'reviews'}
          className={`${styles.profileTab} ${tab === 'reviews' ? styles.profileTabActive : ''}`}
          onClick={() => setTab('reviews')}
        >
          <MessageCircle className={styles.profileTabIcon} />
          Reviews
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'alerts'}
          className={`${styles.profileTab} ${tab === 'alerts' ? styles.profileTabActive : ''}`}
          aria-label="Alerts"
          onClick={() => setTab('alerts')}
        >
          <Bell className={styles.profileTabIcon} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'account'}
          className={`${styles.profileTab} ${tab === 'account' ? styles.profileTabActive : ''}`}
          aria-label="Account"
          onClick={() => setTab('account')}
        >
          <UserRound className={styles.profileTabIcon} />
        </button>
      </div>

      <div key={tab} className={styles.profilePane}>
      {tab === 'reviews' ? (
        <>
          <div className={styles.feedbackHead}>
            <h3 className={styles.feedbackTitle}>Community feedback</h3>
            <div className={styles.feedbackScore}>
              <span>{profile.feedbackScore.toFixed(1)}</span>
              <span className={styles.scoreStars} aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={
                      index < Math.floor(profile.feedbackScore) ? styles.starFilled : styles.starEmpty
                    }
                  />
                ))}
              </span>
              <span className={styles.feedbackCount}>({profile.feedbackCount})</span>
            </div>
          </div>

          <div className={styles.feedbackTools}>
            <div className={styles.commentSort}>
              <button
                type="button"
                className={styles.filterButton}
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <SlidersHorizontal className={styles.metaIcon} />
                {filter === 'All' ? 'ALL' : filter}
                <ChevronDown className={styles.tabChevron} />
              </button>
              {filterOpen && (
                <ul className={`${styles.menu} ${styles.filterMenu}`} role="listbox" aria-label="Review filter">
                  {relations.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={`${styles.menuItem} ${filter === item ? styles.menuItemActive : ''}`}
                        onClick={() => {
                          setFilter(item)
                          setFilterOpen(false)
                        }}
                      >
                        {item === 'All' ? 'ALL' : item}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" className={styles.leaveReview} onClick={() => setComposerOpen(true)}>
              Leave a review
            </button>
          </div>

          {composerOpen && (
            <form
              className={styles.reviewForm}
              onSubmit={(event) => {
                event.preventDefault()
                addReview()
              }}
            >
              <input
                className={styles.composer}
                placeholder="Share what you saw"
                value={draft}
                aria-label="Review"
                onChange={(event) => setDraft(event.target.value)}
              />
            </form>
          )}

          <ul className={styles.reviewList}>
            {visibleReviews.length === 0 && <li className={styles.empty}>No reviews match this view.</li>}
            {visibleReviews.map((review) => (
              <li key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <Image src={review.avatarUrl} alt="" width={36} height={36} className={styles.commentAvatar} />
                  <strong className={styles.reviewUser}>{review.username}</strong>
                  <span className={styles.relation}>
                    {relationIcon(review.relation)}
                    {review.relation}
                    <Image src={profile.avatarUrl} alt="" width={18} height={18} className={styles.relationAvatar} />
                  </span>
                </div>
                <p className={styles.reviewText}>
                  {review.body.split(profile.username).map((part, index, list) => (
                    <React.Fragment key={`${review.id}-${index}`}>
                      {part}
                      {index < list.length - 1 && (
                        <span className={styles.mention}>{profile.username}</span>
                      )}
                    </React.Fragment>
                  ))}
                </p>
                <div className={styles.reviewActions}>
                  <button
                    type="button"
                    className={`${styles.commentAction} ${review.liked ? styles.commentActionActive : ''}`}
                    aria-pressed={review.liked}
                    onClick={() => toggleLike(review.id)}
                  >
                    <Heart className={`${styles.commentIcon} ${review.liked ? styles.heartFilled : ''}`} />
                    {formatCount(review.likes)}
                  </button>
                  <span className={styles.commentAction}>
                    <MessageCircle className={styles.commentIcon} />
                    {formatCount(review.comments)}
                  </span>
                  <button type="button" className={styles.reviewShare} aria-label="Share review">
                    <MessageCircle className={styles.commentIcon} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.profilePanel}>
          {tab === 'about' && profile.bio}
          {tab === 'alerts' && 'No new alerts for this profile.'}
          {tab === 'account' && `${profile.name} joined ${profile.since.replace('Since ', '')}.`}
        </p>
      )}
      </div>
    </div>
  )
}

export default ProfileDrawer
