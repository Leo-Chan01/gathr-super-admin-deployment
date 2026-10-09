'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Share2,
  Users,
  Wallet,
  X
} from 'lucide-react'
import {
  attentionItems,
  feedComments,
  feedPosts,
  formatCount,
  getProfile,
  initialActivity,
  isVerifiedAuthor,
  type ActivityItem,
  type BroadcastAudience,
  type FeedComment,
  type FeedPost,
  type UserProfile,
  type FeedTab,
  type GathrFilter
} from './feedData'
import ProfileDrawer from './ProfileDrawer'
import styles from './FeedBoard.module.css'

const tabs: { key: FeedTab; label: string; menu?: boolean }[] = [
  { key: 'impact', label: 'Impact' },
  { key: 'gathr', label: 'Gathr', menu: true },
  { key: 'communities', label: 'Communities' },
  { key: 'events', label: 'Events' }
]

const gathrFilters: { value: GathrFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'updates', label: 'Updates' },
  { value: 'campaigns', label: 'Campaigns' }
]

const audiences: { value: BroadcastAudience; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'impact', label: 'Impact' },
  { value: 'gathr', label: 'Gathr' },
  { value: 'communities', label: 'Communities' },
  { value: 'events', label: 'Events' }
]

interface PostDetailProps {
  post: FeedPost
  imageIndex: number
  saved: boolean
  comments: FeedComment[]
  sort: 'latest' | 'oldest'
  sortOpen: boolean
  draft: string
  menuId: string | null
  menuOpen: boolean
  onClose: () => void
  onLike: () => void
  onShare: () => void
  onSave: () => void
  onShowImage: (delta: number) => void
  onSelectImage: (index: number) => void
  onToggleMenu: () => void
  onHide: () => void
  onDraft: (value: string) => void
  onSubmit: () => void
  onSort: (value: 'latest' | 'oldest') => void
  onToggleSort: () => void
  onCommentLike: (id: string) => void
  onCommentMenu: (id: string) => void
  onHideComment: (id: string) => void
  onOpenProfile: (username: string) => void
  motion: 'enter' | 'forward' | 'back' | 'exit'
}

interface CommentNode {
  id: string
  username: string
  avatarUrl: string
  time: string
  body: string
  likes: number
  liked: boolean
}

const CommentStats: React.FC<{
  item: CommentNode
  replyCount: number
  canToggleReplies: boolean
  repliesOpen?: boolean
  onLike: () => void
  onToggleReplies?: () => void
}> = ({ item, replyCount, canToggleReplies, repliesOpen, onLike, onToggleReplies }) => (
  <div className={styles.commentStatsPill}>
    <button
      type="button"
      className={`${styles.commentStatsSegment} ${item.liked ? styles.commentStatsSegmentActive : ''}`}
      aria-pressed={item.liked}
      onClick={onLike}
    >
      <Heart className={`${styles.commentStatsIcon} ${item.liked ? styles.heartFilled : ''}`} />
      {formatCount(item.likes)}
    </button>
    {replyCount > 0 && (
      <>
        <span className={styles.commentStatsDivider} aria-hidden />
        <button
          type="button"
          className={styles.commentStatsSegment}
          aria-expanded={canToggleReplies ? repliesOpen : undefined}
          aria-label={`${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
          disabled={!canToggleReplies}
          onClick={onToggleReplies}
        >
          <MessageCircle className={styles.commentStatsIcon} />
          {formatCount(replyCount)}
        </button>
      </>
    )}
  </div>
)

const CommentRow: React.FC<{
  item: CommentNode
  variant: 'root' | 'reply'
  delay: number
  hookDelay: number
  menuId: string | null
  replyCount: number
  canToggleReplies?: boolean
  repliesOpen?: boolean
  onToggleReplies?: () => void
  onOpenProfile: (username: string) => void
  onCommentLike: (id: string) => void
  onCommentMenu: (id: string) => void
  onHideComment: (id: string) => void
}> = ({
  item,
  variant,
  delay,
  hookDelay,
  menuId,
  replyCount,
  canToggleReplies = false,
  repliesOpen,
  onToggleReplies,
  onOpenProfile,
  onCommentLike,
  onCommentMenu,
  onHideComment
}) => (
  <div
    className={`${styles.comment} ${variant === 'reply' ? styles.commentReply : styles.commentRoot}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={styles.commentRail}>
      {variant === 'reply' && (
        <span
          className={styles.replyHook}
          style={{ animationDelay: `${hookDelay}ms` }}
          aria-hidden
        />
      )}
      <Image src={item.avatarUrl} alt="" width={36} height={36} className={styles.commentAvatar} />
    </div>
    <div className={styles.commentBody}>
      <p className={styles.commentMeta}>
        <button type="button" className={styles.commentUser} onClick={() => onOpenProfile(item.username)}>
          {item.username}
        </button>
        {isVerifiedAuthor(item.username) && (
          <span className={styles.commentVerified} aria-label="Verified">
            <Check className={styles.commentVerifiedIcon} strokeWidth={3} />
          </span>
        )}
        <span>·</span>
        <span>{item.time}</span>
      </p>
      <p className={styles.commentText}>{item.body}</p>
      <div className={styles.commentActions}>
        <CommentStats
          item={item}
          replyCount={replyCount}
          canToggleReplies={canToggleReplies}
          repliesOpen={repliesOpen}
          onLike={() => onCommentLike(item.id)}
          onToggleReplies={onToggleReplies}
        />
        <div className={styles.rowMenu} data-menu-root>
          <button
            type="button"
            className={styles.moreButton}
            aria-label={`Actions for comment by ${item.username}`}
            aria-expanded={menuId === item.id}
            onClick={() => onCommentMenu(item.id)}
          >
            <MoreHorizontal className={styles.moreIcon} />
          </button>
          {menuId === item.id && (
            <div className={styles.rowMenuList}>
              <button type="button" className={styles.menuItem} onClick={() => onHideComment(item.id)}>
                Hide comment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)

const CommentThread: React.FC<{
  comments: FeedComment[]
  menuId: string | null
  onCommentLike: (id: string) => void
  onCommentMenu: (id: string) => void
  onHideComment: (id: string) => void
  onOpenProfile: (username: string) => void
}> = ({ comments, menuId, onCommentLike, onCommentMenu, onHideComment, onOpenProfile }) => {
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({})
  const replyTreeRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const measureReplySpines = useCallback(() => {
    replyTreeRefs.current.forEach((tree) => {
      const last = tree.querySelector(`.${styles.commentReply}:last-child`) as HTMLElement | null
      if (!last) {
        tree.style.removeProperty('--spine-trim')
        return
      }
      tree.style.setProperty('--spine-trim', `${Math.max(0, last.offsetHeight - 18)}px`)
    })
  }, [])

  useLayoutEffect(() => {
    measureReplySpines()
    window.addEventListener('resize', measureReplySpines)
    return () => window.removeEventListener('resize', measureReplySpines)
  }, [comments, openThreads, measureReplySpines])

  return (
    <ul className={styles.commentList}>
      {comments.map((comment, index) => {
        const hasReplies = comment.replies.length > 0
        const open = (openThreads[comment.id] ?? true) && hasReplies
        const pillReplyCount = comment.replyCount ?? comment.replies.length

        return (
          <li key={comment.id} className={styles.thread}>
            <div className={`${styles.threadBlock} ${open ? styles.threadBlockOpen : ''}`}>
              <div className={styles.commentMain}>
                <CommentRow
                  item={comment}
                  variant="root"
                  delay={index * 50}
                  hookDelay={0}
                  menuId={menuId}
                  replyCount={pillReplyCount}
                  canToggleReplies={hasReplies}
                  repliesOpen={open}
                  onToggleReplies={() =>
                    setOpenThreads((current) => ({
                      ...current,
                      [comment.id]: !(current[comment.id] ?? true)
                    }))
                  }
                  onOpenProfile={onOpenProfile}
                  onCommentLike={onCommentLike}
                  onCommentMenu={onCommentMenu}
                  onHideComment={onHideComment}
                />
              </div>
              {open && (
                <div
                  ref={(element) => {
                    if (element) replyTreeRefs.current.set(comment.id, element)
                    else replyTreeRefs.current.delete(comment.id)
                  }}
                  className={styles.replyTree}
                >
                  {comment.replies.map((reply, replyIndex) => (
                    <CommentRow
                      key={reply.id}
                      item={reply}
                      variant="reply"
                      delay={160 + replyIndex * 70}
                      hookDelay={180 + replyIndex * 70}
                      menuId={menuId}
                      replyCount={reply.replyCount ?? 0}
                      onOpenProfile={onOpenProfile}
                      onCommentLike={onCommentLike}
                      onCommentMenu={onCommentMenu}
                      onHideComment={onHideComment}
                    />
                  ))}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const PostDetail: React.FC<PostDetailProps> = ({
  post,
  imageIndex,
  saved,
  comments,
  sort,
  sortOpen,
  draft,
  menuId,
  menuOpen,
  onClose,
  onLike,
  onShare,
  onSave,
  onShowImage,
  onSelectImage,
  onToggleMenu,
  onHide,
  onDraft,
  onSubmit,
  onSort,
  onToggleSort,
  onCommentLike,
  onCommentMenu,
  onHideComment,
  onOpenProfile,
  motion
}) => (
  <div className={`${styles.detail} ${styles[motion === 'enter' ? 'drawerIn' : motion === 'forward' ? 'panelForward' : motion === 'back' ? 'panelBack' : 'drawerOut']}`}>
    <div className={styles.detailTop}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <span className={styles.crumb}>Post</span>
      </nav>
      <button type="button" className={styles.closeButton} aria-label="Close details" onClick={onClose}>
        <X className={styles.closeIcon} />
      </button>
    </div>

    <div className={styles.detailPost}>
      <div className={styles.postHeader}>
        <button
          type="button"
          className={styles.identityButton}
          onClick={() => onOpenProfile(post.username)}
        >
          <Image src={post.avatarUrl} alt="" width={40} height={40} className={styles.avatar} />
          <div className={styles.identity}>
            <div className={styles.nameRow}>
              <span className={styles.username}>{post.username}</span>
              {post.verified && <span className={styles.verified} aria-label="Verified" />}
            </div>
            <span className={styles.location}>{post.location}</span>
          </div>
        </button>
        <div className={styles.rowMenu} data-menu-root>
          <button
            type="button"
            className={styles.moreButton}
            aria-label={`Actions for ${post.username}`}
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <MoreHorizontal className={styles.moreIcon} />
          </button>
          {menuOpen && (
            <div className={styles.rowMenuList}>
              <button type="button" className={styles.menuItem} onClick={onHide}>
                Hide post
              </button>
            </div>
          )}
        </div>
      </div>

      <p className={styles.caption}>{post.caption}</p>

      <div className={styles.detailMedia}>
        <Image
          src={post.images[imageIndex] ?? post.images[0]}
          alt=""
          fill
          sizes="420px"
          className={styles.photo}
        />
        {post.images.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              aria-label="Previous image"
              onClick={() => onShowImage(-1)}
            >
              <ChevronLeft className={styles.arrowIcon} />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              aria-label="Next image"
              onClick={() => onShowImage(1)}
            >
              <ChevronRight className={styles.arrowIcon} />
            </button>
            <div className={styles.dots} role="tablist" aria-label="Post images">
              {post.images.map((image, index) => {
                const active = imageIndex === index
                return (
                  <button
                    key={image}
                    type="button"
                    role="tab"
                    aria-label={`Image ${index + 1}`}
                    aria-selected={active}
                    className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                    onClick={() => onSelectImage(index)}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className={styles.detailActions}>
        <button
          type="button"
          className={`${styles.countButton} ${post.liked ? styles.countButtonActive : ''}`}
          aria-pressed={post.liked}
          onClick={onLike}
        >
          <Heart className={`${styles.actionIcon} ${post.liked ? styles.heartFilled : ''}`} />
          {formatCount(post.likes)}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Join the conversation"
          onClick={() => document.getElementById('feed-composer')?.focus()}
        >
          <MessageCircle className={styles.actionIcon} />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Share post" onClick={onShare}>
          <Share2 className={styles.actionIcon} />
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${saved ? styles.iconButtonActive : ''}`}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark post'}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Bookmark className={`${styles.actionIcon} ${saved ? styles.bookmarkFilled : ''}`} />
        </button>
      </div>
    </div>

    <form
      className={styles.composerForm}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <input
        id="feed-composer"
        className={styles.composer}
        placeholder="Join the conversation"
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
      />
    </form>

    <div className={styles.commentSort} data-menu-root>
      <button
        type="button"
        className={styles.sortButton}
        aria-expanded={sortOpen}
        onClick={onToggleSort}
      >
        {sort === 'latest' ? 'Latest' : 'Oldest'}
        <ChevronDown className={styles.tabChevron} />
      </button>
      {sortOpen && (
        <ul className={styles.menu} role="listbox" aria-label="Comment order">
          <li>
            <button
              type="button"
              className={`${styles.menuItem} ${sort === 'latest' ? styles.menuItemActive : ''}`}
              onClick={() => onSort('latest')}
            >
              Latest
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`${styles.menuItem} ${sort === 'oldest' ? styles.menuItemActive : ''}`}
              onClick={() => onSort('oldest')}
            >
              Oldest
            </button>
          </li>
        </ul>
      )}
    </div>

    <CommentThread
      comments={comments}
      menuId={menuId}
      onCommentLike={onCommentLike}
      onCommentMenu={onCommentMenu}
      onHideComment={onHideComment}
      onOpenProfile={onOpenProfile}
    />
  </div>
)

export const FeedBoard: React.FC = () => {
  const [tab, setTab] = useState<FeedTab>('impact')
  const [gathrFilter, setGathrFilter] = useState<GathrFilter>('all')
  const [gathrOpen, setGathrOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<FeedPost[]>(feedPosts)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({})
  const [menuId, setMenuId] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<BroadcastAudience>('all')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [profileUser, setProfileUser] = useState<string | null>(null)
  const [comments, setComments] = useState<FeedComment[]>(feedComments)
  const [commentSort, setCommentSort] = useState<'latest' | 'oldest'>('latest')
  const [sortOpen, setSortOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const railRef = useRef<HTMLElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0 })

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const scroller = (() => {
      let parent = rail.parentElement
      while (parent) {
        const overflow = getComputedStyle(parent).overflowY
        if (overflow === 'auto' || overflow === 'scroll') return parent
        parent = parent.parentElement
      }
      return document.documentElement
    })()

    const update = () => {
      if (rail.dataset.detail === 'open') {
        rail.style.top = '0px'
        return
      }
      if (getComputedStyle(rail).position !== 'sticky') {
        rail.style.top = ''
        return
      }
      const gap = 24
      const top = Math.min(16, scroller.clientHeight - rail.offsetHeight - gap)
      rail.style.top = `${top}px`
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(rail)
    observer.observe(scroller)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [selectedId, profileUser])

  useEffect(() => {
    if (!selectedId && !profileUser) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (profileUser) {
        setProfileUser(null)
        return
      }
      setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, profileUser])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-menu-root]')) return
      setGathrOpen(false)
      setMenuId(null)
      setAudienceOpen(false)
      setSortOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return posts.filter((post) => {
      if (post.tab !== tab) return false
      if (tab === 'gathr' && gathrFilter !== 'all' && post.gathrKind !== gathrFilter) return false
      if (!normalized) return true
      return `${post.username} ${post.location} ${post.caption}`.toLowerCase().includes(normalized)
    })
  }, [posts, tab, gathrFilter, query])

  const visibleActivity = showAllActivity ? activity : activity.slice(0, 3)
  const activeAudience = audiences.find((item) => item.value === audience) ?? audiences[0]
  const selectedPost = posts.find((post) => post.id === selectedId) ?? null
  const profile = useMemo(
    () => (profileUser ? getProfile(profileUser) : null),
    [profileUser]
  )
  const drawerOpen = Boolean(profile || selectedPost)
  const visibleComments = useMemo(() => {
    const list = comments.filter((comment) => comment.postId === selectedId)
    return commentSort === 'oldest' ? [...list].reverse() : list
  }, [comments, selectedId, commentSort])

  const nextView = profile ? 'profile' : selectedPost ? 'post' : 'closed'
  const [trackedView, setTrackedView] = useState(nextView)
  const [snapshot, setSnapshot] = useState<{
    post: FeedPost | null
    profile: UserProfile | null
    comments: FeedComment[]
  }>({ post: null, profile: null, comments: [] })
  const [mountedDrawer, setMountedDrawer] = useState(false)
  const [phase, setPhase] = useState<'in' | 'out'>('out')
  const [swap, setSwap] = useState<'enter' | 'forward' | 'back'>('enter')
  const [shellArmed, setShellArmed] = useState(false)

  if (nextView !== trackedView) {
    setTrackedView(nextView)
    if (nextView !== 'closed') {
      setSnapshot({ post: selectedPost, profile, comments: visibleComments })
      setMountedDrawer(true)
      setPhase('in')
      if (trackedView === 'closed') setSwap('enter')
      else if (trackedView === 'post' && nextView === 'profile') setSwap('forward')
      else if (trackedView === 'profile' && nextView === 'post') setSwap('back')
    } else {
      setPhase('out')
    }
  } else if (
    nextView !== 'closed' &&
    (snapshot.post !== selectedPost ||
      snapshot.profile !== profile ||
      snapshot.comments !== visibleComments)
  ) {
    setSnapshot({ post: selectedPost, profile, comments: visibleComments })
  }

  const wantShell = mountedDrawer && phase === 'in'
  const [prevWantShell, setPrevWantShell] = useState(wantShell)
  if (wantShell !== prevWantShell) {
    setPrevWantShell(wantShell)
    if (!wantShell) setShellArmed(false)
  }

  useEffect(() => {
    if (phase !== 'out' || !mountedDrawer) return
    const timer = window.setTimeout(() => setMountedDrawer(false), 460)
    return () => window.clearTimeout(timer)
  }, [phase, mountedDrawer])

  useEffect(() => {
    if (mountedDrawer) return
    window.dispatchEvent(new Event('resize'))
  }, [mountedDrawer])

  useEffect(() => {
    if (!wantShell) return
    const frame = requestAnimationFrame(() => setShellArmed(true))
    return () => cancelAnimationFrame(frame)
  }, [wantShell])

  const shellIn = wantShell && shellArmed

  useLayoutEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const measure = () => {
      const active = root.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement | null
      if (!active) return
      const rootRect = root.getBoundingClientRect()
      const rect = active.getBoundingClientRect()
      const inset = 18
      setTabIndicator({
        x: rect.left - rootRect.left + inset,
        width: Math.max(rect.width - inset * 2, 18)
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [tab])

  const showingSnapshot = mountedDrawer && !drawerOpen
  const panelMotion = showingSnapshot || phase === 'out' ? 'exit' : swap
  const panelPost = showingSnapshot ? snapshot.post : selectedPost
  const panelProfile = showingSnapshot ? snapshot.profile : profile
  const panelComments = showingSnapshot ? snapshot.comments : visibleComments

  const selectTab = (next: FeedTab) => {
    setTab(next)
    setMenuId(null)
    setAudienceOpen(false)
    if (next === 'gathr') {
      setGathrOpen((open) => (tab === 'gathr' ? !open : true))
      return
    }
    setGathrOpen(false)
  }

  const toggleLike = (id: string) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== id) return post
        const liked = !post.liked
        return { ...post, liked, likes: post.likes + (liked ? 1 : -1) }
      })
    )
  }

  const toggleSaved = (id: string) => {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    )
  }

  const showImage = (id: string, count: number, delta: number) => {
    setImageIndex((current) => {
      const index = current[id] ?? 0
      const next = (index + delta + count) % count
      return { ...current, [id]: next }
    })
  }

  const hidePost = (id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id))
    setMenuId(null)
    setSelectedId((current) => (current === id ? null : current))
    setProfileUser(null)
  }

  const openProfile = (username: string, postId?: string) => {
    setMenuId(null)
    setProfileUser(username)
    if (postId) setSelectedId(postId)
  }

  const closeDrawer = () => {
    setProfileUser(null)
    setSelectedId(null)
  }

  const openPost = (event: React.MouseEvent, id: string) => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, [data-menu-root]')) return
    setDraft('')
    setSortOpen(false)
    setProfileUser(null)
    setSelectedId(id)
  }

  const toggleCommentLike = (id: string) => {
    setComments((current) =>
      current.map((comment) => {
        if (comment.id === id) {
          const liked = !comment.liked
          return { ...comment, liked, likes: comment.likes + (liked ? 1 : -1) }
        }
        return {
          ...comment,
          replies: comment.replies.map((reply) => {
            if (reply.id !== id) return reply
            const liked = !reply.liked
            return { ...reply, liked, likes: reply.likes + (liked ? 1 : -1) }
          })
        }
      })
    )
  }

  const hideComment = (id: string) => {
    setComments((current) =>
      current
        .filter((comment) => comment.id !== id)
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== id)
        }))
    )
    setMenuId(null)
  }

  const addComment = () => {
    const text = draft.trim()
    if (!text || !selectedId) return
    setComments((current) => [
      {
        id: `local-${Date.now()}`,
        postId: selectedId,
        username: '@you',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        time: 'Just now',
        body: text,
        likes: 0,
        liked: false,
        replies: []
      },
      ...current
    ])
    setPosts((current) =>
      current.map((post) =>
        post.id === selectedId ? { ...post, comments: post.comments + 1 } : post
      )
    )
    setDraft('')
    setCommentSort('latest')
  }

  const sharePost = async (post: FeedPost) => {
    const text = `${post.username}: ${post.caption}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Gathr feed', text })
        return
      } catch {
        return
      }
    }
    await navigator.clipboard?.writeText(text)
  }

  const sendBroadcast = () => {
    const text = message.trim()
    if (!text) return
    const audienceLabel = activeAudience.label
    setActivity((current) => [
      {
        id: `broadcast-${Date.now()}`,
        time: 'Just now',
        actor: 'You',
        detail: `broadcast to ${audienceLabel}: ${text}`
      },
      ...current
    ])
    setMessage('')
    setShowAllActivity(true)
  }

  return (
    <div className={styles.page}>
      {mountedDrawer && (
        <button
          type="button"
          className={`${styles.backdrop} ${phase === 'out' ? styles.backdropOut : ''}`}
          aria-label="Close details"
          onClick={closeDrawer}
        />
      )}
      <div className={`${styles.body} ${mountedDrawer ? styles.bodyOpen : ''}`}>
        <div className={styles.main}>
          <header className={styles.header}>
            <h1 className={styles.title}>Live feed</h1>
            <label className={styles.search}>
              <span className={styles.srOnly}>Search feed</span>
              <input
                type="search"
                value={query}
                placeholder="Search"
                className={styles.searchInput}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Search className={styles.searchIcon} />
            </label>
          </header>
          <div className={styles.tabs} role="tablist" aria-label="Feed" ref={tabsRef}>
            <span
              className={styles.tabIndicator}
              style={{ transform: `translateX(${tabIndicator.x}px)`, width: tabIndicator.width }}
            />
            {tabs.map((item) => {
              const isActive = tab === item.key
              return (
                <div key={item.key} className={styles.tabWrap} data-menu-root={item.menu ? true : undefined}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                    onClick={() => selectTab(item.key)}
                  >
                    {item.label}
                    {item.menu && <ChevronDown className={styles.tabChevron} />}
                  </button>
                  {item.menu && gathrOpen && (
                    <ul className={styles.menu} role="listbox" aria-label="Gathr feed">
                      {gathrFilters.map((filter) => (
                        <li key={filter.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={gathrFilter === filter.value}
                            className={`${styles.menuItem} ${
                              gathrFilter === filter.value ? styles.menuItemActive : ''
                            }`}
                            onClick={() => {
                              setGathrFilter(filter.value)
                              setTab('gathr')
                              setGathrOpen(false)
                            }}
                          >
                            {filter.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.feed} key={`${tab}-${gathrFilter}`}>
            {visiblePosts.length === 0 && (
              <p className={styles.empty}>No posts match this view.</p>
            )}
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className={`${styles.post} ${selectedId === post.id ? styles.postSelected : ''}`}
                onClick={(event) => openPost(event, post.id)}
              >
                <div className={styles.postHeader}>
                  <button
                    type="button"
                    className={styles.identityButton}
                    onClick={() => openProfile(post.username, post.id)}
                  >
                    <Image src={post.avatarUrl} alt="" width={40} height={40} className={styles.avatar} />
                    <div className={styles.identity}>
                      <div className={styles.nameRow}>
                        <span className={styles.username}>{post.username}</span>
                        {post.verified && <span className={styles.verified} aria-label="Verified" />}
                      </div>
                      <span className={styles.location}>{post.location}</span>
                    </div>
                  </button>
                  <div className={styles.rowMenu} data-menu-root>
                    <button
                      type="button"
                      className={styles.moreButton}
                      aria-label={`Actions for ${post.username}`}
                      aria-expanded={menuId === post.id}
                      onClick={() => setMenuId(menuId === post.id ? null : post.id)}
                    >
                      <MoreHorizontal className={styles.moreIcon} />
                    </button>
                    {menuId === post.id && (
                      <div className={styles.rowMenuList}>
                        <button type="button" className={styles.menuItem} onClick={() => hidePost(post.id)}>
                          Hide post
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className={styles.caption}>{post.caption}</p>

                <div className={styles.media}>
                  <Image
                    src={post.images[imageIndex[post.id] ?? 0]}
                    alt=""
                    fill
                    sizes="(max-width: 1100px) 100vw, 720px"
                    className={styles.photo}
                  />
                  {post.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className={`${styles.arrow} ${styles.arrowPrev}`}
                        aria-label="Previous image"
                        onClick={() => showImage(post.id, post.images.length, -1)}
                      >
                        <ChevronLeft className={styles.arrowIcon} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.arrow} ${styles.arrowNext}`}
                        aria-label="Next image"
                        onClick={() => showImage(post.id, post.images.length, 1)}
                      >
                        <ChevronRight className={styles.arrowIcon} />
                      </button>
                    </>
                  )}
                  {post.images.length > 1 && (
                    <div className={styles.dots} role="tablist" aria-label="Post images">
                      {post.images.map((image, index) => {
                        const active = (imageIndex[post.id] ?? 0) === index
                        return (
                          <button
                            key={image}
                            type="button"
                            role="tab"
                            aria-label={`Image ${index + 1}`}
                            aria-selected={active}
                            className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                            onClick={() =>
                              setImageIndex((current) => ({ ...current, [post.id]: index }))
                            }
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={`${styles.countButton} ${post.liked ? styles.countButtonActive : ''}`}
                      aria-pressed={post.liked}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart className={`${styles.actionIcon} ${post.liked ? styles.heartFilled : ''}`} />
                      {formatCount(post.likes)}
                    </button>
                    <span className={styles.countButton}>
                      <MessageCircle className={styles.actionIcon} />
                      {formatCount(post.comments)}
                    </span>
                  </div>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label="Share post"
                      onClick={() => sharePost(post)}
                    >
                      <Share2 className={styles.actionIcon} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${
                        savedIds.includes(post.id) ? styles.iconButtonActive : ''
                      }`}
                      aria-label={savedIds.includes(post.id) ? 'Remove bookmark' : 'Bookmark post'}
                      aria-pressed={savedIds.includes(post.id)}
                      onClick={() => toggleSaved(post.id)}
                    >
                      <Bookmark
                        className={`${styles.actionIcon} ${
                          savedIds.includes(post.id) ? styles.bookmarkFilled : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside
          className={`${styles.rail} ${mountedDrawer ? styles.railDetail : ''} ${shellIn ? styles.shellIn : ''}`}
          data-detail={mountedDrawer ? 'open' : undefined}
          ref={railRef}
          aria-label={panelProfile ? 'User profile' : panelPost ? 'Post details' : 'Feed tools'}
        >
          {mountedDrawer && panelProfile ? (
            <ProfileDrawer
              key={panelProfile.username}
              profile={panelProfile}
              motion={panelMotion}
              onClose={closeDrawer}
              onBack={() => setProfileUser(null)}
            />
          ) : mountedDrawer && panelPost ? (
            <PostDetail
              key={panelPost.id}
              motion={panelMotion}
              post={panelPost}
              imageIndex={imageIndex[panelPost.id] ?? 0}
              saved={savedIds.includes(panelPost.id)}
              comments={panelComments}
              sort={commentSort}
              sortOpen={sortOpen}
              draft={draft}
              menuId={menuId}
              onClose={closeDrawer}
              onLike={() => toggleLike(panelPost.id)}
              onShare={() => sharePost(panelPost)}
              onSave={() => toggleSaved(panelPost.id)}
              onShowImage={(delta) => showImage(panelPost.id, panelPost.images.length, delta)}
              onSelectImage={(index) =>
                setImageIndex((current) => ({ ...current, [panelPost.id]: index }))
              }
              onToggleMenu={() =>
                setMenuId(menuId === panelPost.id ? null : panelPost.id)
              }
              onHide={() => hidePost(panelPost.id)}
              menuOpen={menuId === panelPost.id}
              onDraft={setDraft}
              onSubmit={addComment}
              onSort={(value) => {
                setCommentSort(value)
                setSortOpen(false)
              }}
              onToggleSort={() => setSortOpen((open) => !open)}
              onCommentLike={toggleCommentLike}
              onCommentMenu={(id) => setMenuId(menuId === id ? null : id)}
              onHideComment={hideComment}
              onOpenProfile={(username) => openProfile(username)}
            />
          ) : (
          <>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Attention needed</h2>
            <ul className={styles.attentionList}>
              {attentionItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={styles.attentionRow}>
                    <span className={`${styles.attentionIcon} ${styles[item.tone]}`}>
                      {item.tone === 'alert' && <AlertTriangle className={styles.inlineIcon} />}
                      {item.tone === 'people' && <Users className={styles.inlineIcon} />}
                      {item.tone === 'payout' && <Wallet className={styles.inlineIcon} />}
                    </span>
                    <span className={styles.attentionLabel}>{item.label}</span>
                    <ChevronRight className={styles.chevron} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Recent activity</h2>
            <ul className={styles.activityList}>
              {visibleActivity.map((item) => (
                <li key={item.id} className={styles.activityItem}>
                  <span className={styles.activityDot} />
                  <div>
                    <p className={styles.activityTime}>{item.time}</p>
                    <p className={styles.activityText}>
                      <strong>{item.actor}</strong> {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {activity.length > 3 && (
              <button
                type="button"
                className={styles.viewAll}
                onClick={() => setShowAllActivity((open) => !open)}
              >
                {showAllActivity ? 'Show less' : 'View all'}
              </button>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.broadcastHeader}>
              <h2 className={styles.cardTitle}>Broadcast</h2>
              <div className={styles.audience} data-menu-root>
                <button
                  type="button"
                  className={styles.audienceButton}
                  aria-expanded={audienceOpen}
                  onClick={() => setAudienceOpen((open) => !open)}
                >
                  {activeAudience.label}
                  <ChevronDown className={styles.audienceIcon} />
                </button>
                {audienceOpen && (
                  <ul className={styles.menu} role="listbox" aria-label="Broadcast audience">
                    {audiences.map((item) => (
                      <li key={item.value}>
                        <button
                          type="button"
                          className={`${styles.menuItem} ${
                            audience === item.value ? styles.menuItemActive : ''
                          }`}
                          onClick={() => {
                            setAudience(item.value)
                            setAudienceOpen(false)
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <textarea
              className={styles.message}
              placeholder="Message here..."
              value={message}
              rows={3}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendBroadcast()
                }
              }}
            />
            <div className={styles.broadcastFooter}>
              <button
                type="button"
                className={styles.sendButton}
                aria-label="Send broadcast"
                disabled={!message.trim()}
                onClick={sendBroadcast}
              >
                <Send className={styles.sendIcon} />
              </button>
            </div>
          </section>
          </>
          )}
        </aside>
      </div>
    </div>
  )
}

export default FeedBoard
