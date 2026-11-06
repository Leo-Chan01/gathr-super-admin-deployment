'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  formatCount,
  type BroadcastAudience,
  type FeedComment,
  type FeedReply,
  type FeedPost,
  type FeedTab,
  type GathrFilter
} from './feedData'
import AvatarIllustration from '../dashboard/AvatarIllustration'
import { ErrorState, InlineSpinner } from '../common/AsyncState'
import {
  createComment,
  deleteComment,
  deleteImpactPost,
  featureGathr,
  listAuditLogs,
  listComments,
  listReplies,
  setGathrStatus,
  toggleLike as apiToggleLike
} from '../../lib/api/feed'
import { getDashboard } from '../../lib/api/admin'
import { toDashboard } from '../../lib/api/adapters'
import { errorMessage } from '../../lib/api/client'
import { useDebounced, useResource } from '../../lib/hooks/useResource'
import { useFeed } from './useFeed'
import styles from './FeedBoard.module.css'

const tabs: { key: FeedTab; label: string; menu?: boolean }[] = [
  { key: 'impact', label: 'Impact' },
  { key: 'gathr', label: 'Gathr', menu: true },
  { key: 'communities', label: 'Communities' },
  { key: 'events', label: 'Events' }
]

const gathrFilters: { value: GathrFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'offers', label: 'Offers' },
  { value: 'requests', label: 'Requests' }
]

const audiences: { value: BroadcastAudience; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'impact', label: 'Impact' },
  { value: 'gathr', label: 'Gathr' },
  { value: 'communities', label: 'Communities' },
  { value: 'events', label: 'Events' }
]

type ImageSlide = { index: number; from: number; dir: 1 | -1 }

const restingSlide: ImageSlide = { index: 0, from: 0, dir: 1 }

/** Author avatar with an illustration fallback (many accounts have none). */
const Avatar: React.FC<{ src?: string; size: number; className: string }> = ({ src, size, className }) =>
  src ? (
    <Image src={src} alt="" width={size} height={size} className={className} />
  ) : (
    <span className={className} style={{ width: size, height: size, display: 'inline-flex', overflow: 'hidden' }}>
      <AvatarIllustration />
    </span>
  )


const PostPhotos: React.FC<{
  images: string[]
  slide: ImageSlide
  sizes: string
}> = ({ images, slide, sizes }) => {
  const animate = slide.from !== slide.index
  const motion = slide.dir > 0 ? styles.photoNext : styles.photoPrev

  return (
    <>
      {images.map((src, imagePosition) => {
        const current = imagePosition === slide.index
        const leaving = animate && imagePosition === slide.from
        return (
          <Image
            key={`${src}-${imagePosition}`}
            src={src}
            alt=""
            fill
            sizes={sizes}
            className={[
              styles.photo,
              current ? styles.photoCurrent : '',
              leaving ? styles.photoLeaving : '',
              animate && (current || leaving) ? motion : ''
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )
      })}
    </>
  )
}

interface PostDetailProps {
  post: FeedPost
  imageSlide: ImageSlide
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
  postMenu: React.ReactNode
  commentsState: { loading: boolean; error: string | null; reload: () => void }
  posting: boolean
  onDraft: (value: string) => void
  onSubmit: () => void
  onSort: (value: 'latest' | 'oldest') => void
  onToggleSort: () => void
  onCommentMenu: (id: string) => void
  onHideComment: (id: string) => void
  onAddReply: (parentId: string, text: string) => void
  onExpandThread: (id: string) => void
  onOpenProfile: (userId?: string) => void
  motion: 'enter' | 'forward' | 'back' | 'exit'
}

interface CommentNode {
  id: string
  userId?: string
  username: string
  avatarUrl?: string
  time: string
  body: string
  likes: number
  liked: boolean
}

const CommentStats: React.FC<{
  item: CommentNode
  replyCount: number
  replying?: boolean
  onLike?: () => void
  onReply?: () => void
}> = ({ item, replyCount, replying, onLike, onReply }) => (
    <div className={styles.commentStatsPill}>
      <button
        type="button"
        className={`${styles.commentStatsSegment} ${item.liked ? styles.commentStatsSegmentActive : ''}`}
        aria-pressed={item.liked}
        aria-label={onLike ? undefined : `${item.likes} likes`}
        disabled={!onLike}
        onClick={onLike}
      >
        <Heart className={`${styles.commentStatsIcon} ${item.liked ? styles.heartFilled : ''}`} />
        {formatCount(item.likes)}
      </button>
      <span className={styles.commentStatsDivider} aria-hidden />
      <button
        type="button"
        className={`${styles.commentStatsSegment} ${replying ? styles.commentStatsSegmentActive : ''}`}
        aria-expanded={replying}
        aria-label={`Reply to ${item.username}`}
        onClick={onReply}
      >
        <MessageCircle className={styles.commentStatsIcon} />
        {replyCount > 0 ? formatCount(replyCount) : null}
      </button>
    </div>
)

/** Removing a comment deletes it for everyone, so it takes a second click. */
const RemoveCommentMenu: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const [armed, setArmed] = useState(false)
  return (
    <div className={styles.rowMenuList}>
      <button
        type="button"
        className={`${styles.menuItem} ${armed ? styles.menuItemDanger : ''}`}
        onClick={() => (armed ? onConfirm() : setArmed(true))}
      >
        {armed ? 'Click again to remove' : 'Remove comment'}
      </button>
    </div>
  )
}

const CommentRow: React.FC<{
  item: CommentNode
  variant: 'root' | 'reply'
  delay: number
  hookDelay: number
  menuId: string | null
  replyCount: number
  canToggleReplies?: boolean
  repliesOpen?: boolean
  replying?: boolean
  onToggleReplies?: () => void
  onReply?: () => void
  onOpenProfile: (userId?: string) => void
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
  replying,
  onToggleReplies,
  onReply,
  onOpenProfile,
  onCommentMenu,
  onHideComment
}) => (
  <div
    className={`${styles.comment} ${variant === 'reply' ? styles.commentReply : styles.commentRoot} ${
      canToggleReplies ? styles.commentOpenable : ''
    }`}
    style={{ animationDelay: `${delay}ms` }}
    onClick={(event) => {
      if (!canToggleReplies) return
      const target = event.target as HTMLElement
      if (target.closest('button, a, input, textarea, [data-menu-root]')) return
      onToggleReplies?.()
    }}
  >
    <div className={styles.commentRail}>
      {variant === 'reply' && (
        <span
          className={styles.replyHook}
          style={{ animationDelay: `${hookDelay}ms` }}
          aria-hidden
        />
      )}
      <Avatar src={item.avatarUrl} size={36} className={styles.commentAvatar} />
    </div>
    <div className={styles.commentBody}>
      <p className={styles.commentMeta}>
        <button type="button" className={styles.commentUser} onClick={() => onOpenProfile(item.userId)}>
          {item.username}
        </button>
        <span>·</span>
        <span>{item.time}</span>
      </p>
      {canToggleReplies ? (
        <button
          type="button"
          className={styles.commentTextButton}
          aria-expanded={repliesOpen}
          onClick={onToggleReplies}
        >
          {item.body}
        </button>
      ) : (
        <p className={styles.commentText}>{item.body}</p>
      )}
      <div className={styles.commentActions}>
        <CommentStats
          item={item}
          replyCount={replyCount}
          replying={replying}
          onReply={onReply}
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
          {menuId === item.id && <RemoveCommentMenu onConfirm={() => onHideComment(item.id)} />}
        </div>
      </div>
    </div>
  </div>
)

const CommentBranch: React.FC<{
  item: FeedComment | FeedReply
  variant: 'root' | 'reply'
  delay: number
  menuId: string | null
  replyingTo: string | null
  openThreads: Record<string, boolean>
  onToggleThread: (id: string) => void
  onStartReply: (id: string) => void
  onSubmitReply: (parentId: string, text: string) => void
  onCancelReply: () => void
  onOpenProfile: (userId?: string) => void
  onCommentMenu: (id: string) => void
  onHideComment: (id: string) => void
}> = ({
  item,
  variant,
  delay,
  menuId,
  replyingTo,
  openThreads,
  onToggleThread,
  onStartReply,
  onSubmitReply,
  onCancelReply,
  onOpenProfile,
  onCommentMenu,
  onHideComment
}) => {
  const replies = item.replies ?? []
  const replying = replyingTo === item.id
  const wantsOpen = Boolean(openThreads[item.id]) || replying
  const [entered, setEntered] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const replyInputRef = useRef<HTMLInputElement>(null)
  if (!wantsOpen && entered) setEntered(false)

  useEffect(() => {
    if (!wantsOpen) return
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [wantsOpen])

  useEffect(() => {
    if (!entered || !replying) return
    replyInputRef.current?.focus()
  }, [entered, replying])

  const pillReplyCount = item.replyCount ?? replies.length

  const submitReply = (event: React.FormEvent) => {
    event.preventDefault()
    const text = replyDraft.trim()
    if (!text) return
    onSubmitReply(item.id, text)
    setReplyDraft('')
  }

  return (
    <div
      className={`${styles.commentBranch} ${variant === 'reply' ? styles.commentBranchReply : styles.threadBlock} ${
        entered ? styles.commentBranchOpen : ''
      }`}
    >
      <CommentRow
        item={item}
        variant={variant}
        delay={delay}
        hookDelay={0}
        menuId={menuId}
        replyCount={pillReplyCount}
        canToggleReplies={pillReplyCount > 0}
        repliesOpen={entered && pillReplyCount > 0}
        replying={replying}
        onToggleReplies={() => onToggleThread(item.id)}
        onReply={() => {
          onStartReply(item.id)
          if (replying && entered) replyInputRef.current?.focus()
        }}
        onOpenProfile={onOpenProfile}
        onCommentMenu={onCommentMenu}
        onHideComment={onHideComment}
      />
      <div
        className={`${styles.replyCollapse} ${entered ? styles.replyCollapseOpen : ''}`}
        inert={!entered}
        aria-hidden={!entered}
      >
        <div className={styles.replyCollapseInner}>
          {entered && pillReplyCount > 0 && replies.length === 0 && (
            <p className={styles.replyLoading}>
              <InlineSpinner /> Loading replies…
            </p>
          )}
          {replies.length > 0 && (
            <div className={styles.replyTree}>
              {replies.map((reply, replyIndex) => (
                <CommentBranch
                  key={reply.id}
                  item={reply}
                  variant="reply"
                  delay={replyIndex * 45}
                  menuId={menuId}
                  replyingTo={replyingTo}
                  openThreads={openThreads}
                  onToggleThread={onToggleThread}
                  onStartReply={onStartReply}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  onOpenProfile={onOpenProfile}
                  onCommentMenu={onCommentMenu}
                  onHideComment={onHideComment}
                />
              ))}
            </div>
          )}
          {replying && (
            <form className={styles.replyForm} onSubmit={submitReply}>
              <input
                ref={replyInputRef}
                className={styles.replyInput}
                value={replyDraft}
                placeholder={`Reply to ${item.username}`}
                aria-label={`Reply to ${item.username}`}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') onCancelReply()
                }}
              />
              <button type="submit" className={styles.replySubmit} disabled={!replyDraft.trim()}>
                Reply
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const CommentThread: React.FC<{
  comments: FeedComment[]
  menuId: string | null
  onCommentMenu: (id: string) => void
  onHideComment: (id: string) => void
  onOpenProfile: (userId?: string) => void
  onAddReply: (parentId: string, text: string) => void
  /** Called when a thread opens so its replies can be fetched. */
  onExpand: (id: string) => void
}> = ({ comments, menuId, onCommentMenu, onHideComment, onOpenProfile, onAddReply, onExpand }) => {
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const toggleThread = (id: string) => {
    const closing = Boolean(openThreads[id])
    if (!closing) onExpand(id)
    setOpenThreads((current) => ({ ...current, [id]: !current[id] }))
    if (closing) {
      setReplyingTo((current) => (current === id ? null : current))
    }
  }

  const startReply = (id: string) => {
    setReplyingTo(id)
    setOpenThreads((current) => ({ ...current, [id]: true }))
  }

  return (
    <ul className={styles.commentList}>
      {comments.map((comment, index) => (
        <li key={comment.id} className={styles.thread}>
          <CommentBranch
            item={comment}
            variant="root"
            delay={index * 50}
            menuId={menuId}
            replyingTo={replyingTo}
            openThreads={openThreads}
            onToggleThread={toggleThread}
            onStartReply={startReply}
            onSubmitReply={onAddReply}
            onCancelReply={() => setReplyingTo(null)}
            onOpenProfile={onOpenProfile}
            onCommentMenu={onCommentMenu}
            onHideComment={onHideComment}
          />
        </li>
      ))}
    </ul>
  )
}

const statusLabel = (status?: string) =>
  status && status !== 'ACTIVE'
    ? status.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
    : undefined

/** Title (gathr/communities/events), caption, and the one-line summary. */
const PostText: React.FC<{ post: FeedPost }> = ({ post }) => {
  const status = statusLabel(post.status)
  return (
    <>
      {(post.title || post.featured || status) && (
        <p className={styles.postTitle}>
          {post.title}
          {post.featured && <span className={styles.postBadge}>Featured</span>}
          {status && <span className={`${styles.postBadge} ${styles.postBadgeMuted}`}>{status}</span>}
        </p>
      )}
      {post.caption && <p className={styles.caption}>{post.caption}</p>}
      {post.meta && <p className={styles.postMeta}>{post.meta}</p>}
    </>
  )
}

const PostDetail: React.FC<PostDetailProps> = ({
  post,
  imageSlide,
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
  postMenu,
  commentsState,
  posting,
  onDraft,
  onSubmit,
  onSort,
  onToggleSort,
  onCommentMenu,
  onHideComment,
  onAddReply,
  onExpandThread,
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
          onClick={() => onOpenProfile(post.userId)}
        >
          <Avatar src={post.avatarUrl} size={40} className={styles.avatar} />
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
          {menuOpen && postMenu}
        </div>
      </div>

      <PostText post={post} />

      {post.images.length > 0 && (
      <div className={styles.detailMedia}>
        <PostPhotos images={post.images} slide={imageSlide} sizes="420px" />
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
                const active = imageSlide.index === index
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
      )}

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
        placeholder="Comment as Gathr admin"
        value={draft}
        disabled={posting}
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

    {commentsState.error ? (
      <ErrorState message={commentsState.error} onRetry={commentsState.reload} compact />
    ) : commentsState.loading && comments.length === 0 ? (
      <p className={styles.replyLoading}>
        <InlineSpinner /> Loading comments…
      </p>
    ) : comments.length === 0 ? (
      <p className={styles.empty}>No comments yet.</p>
    ) : (
      <CommentThread
        comments={comments}
        menuId={menuId}
        onCommentMenu={onCommentMenu}
        onHideComment={onHideComment}
        onOpenProfile={onOpenProfile}
        onAddReply={onAddReply}
        onExpand={onExpandThread}
      />
    )}
  </div>
)

export const FeedBoard: React.FC = () => {
  const router = useRouter()
  const [tab, setTab] = useState<FeedTab>('impact')
  const [gathrFilter, setGathrFilter] = useState<GathrFilter>('all')
  const [gathrOpen, setGathrOpen] = useState(false)
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const feed = useFeed(tab, gathrFilter, search)
  const posts = feed.posts
  const setPosts = feed.setPosts
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [imageSlides, setImageSlides] = useState<Record<string, ImageSlide>>({})
  const [menuId, setMenuId] = useState<string | null>(null)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<BroadcastAudience>('all')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [commentSort, setCommentSort] = useState<'latest' | 'oldest'>('latest')
  const [sortOpen, setSortOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [busyPost, setBusyPost] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [loadedReplies, setLoadedReplies] = useState<Record<string, true>>({})
  const railRef = useRef<HTMLElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0 })

  const selectedPost = posts.find((post) => post.id === selectedId) ?? null

  // Rail data
  const dashboard = useResource((signal) => getDashboard({ signal }).then(toDashboard), [])
  const audit = useResource((signal) => listAuditLogs(10, { signal }), [])
  // Comments for the open post (re-fetched per post).
  const commentsRes = useResource<FeedComment[]>(
    (signal) => (selectedPost ? listComments(selectedPost, { signal }) : Promise.resolve([])),
    [selectedId]
  )
  const comments = useMemo(() => commentsRes.data ?? [], [commentsRes.data])

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
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-menu-root]')) return
      setGathrOpen(false)
      setMenuId(null)
      setConfirmDelete(null)
      setAudienceOpen(false)
      setSortOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const activity = audit.data ?? []
  const visibleActivity = showAllActivity ? activity : activity.slice(0, 3)
  const activeAudience = audiences.find((item) => item.value === audience) ?? audiences[0]
  const drawerOpen = Boolean(selectedPost)
  const visibleComments = useMemo(
    () => (commentSort === 'oldest' ? [...comments].reverse() : comments),
    [comments, commentSort]
  )

  const counts = dashboard.data?.counts
  const attentionItems = [
    { id: 'flagged', label: `${counts?.flagged ?? '—'} flagged posts need review`, href: '/reports', tone: 'alert' as const },
    { id: 'kyc', label: `${counts?.kyc ?? '—'} verifications pending`, href: '/users?tab=pending', tone: 'people' as const },
    { id: 'withdrawals', label: `${counts?.withdrawals ?? '—'} withdrawal requests`, href: '/wallets', tone: 'payout' as const }
  ]

  const nextView = selectedPost ? 'post' : 'closed'
  const [trackedView, setTrackedView] = useState(nextView)
  const [snapshot, setSnapshot] = useState<{ post: FeedPost | null; comments: FeedComment[] }>({
    post: null,
    comments: []
  })
  const [mountedDrawer, setMountedDrawer] = useState(false)
  const [phase, setPhase] = useState<'in' | 'out'>('out')
  const [shellArmed, setShellArmed] = useState(false)

  if (nextView !== trackedView) {
    setTrackedView(nextView)
    if (nextView !== 'closed') {
      setSnapshot({ post: selectedPost, comments: visibleComments })
      setMountedDrawer(true)
      setPhase('in')
    } else {
      setPhase('out')
    }
  } else if (
    nextView !== 'closed' &&
    (snapshot.post !== selectedPost || snapshot.comments !== visibleComments)
  ) {
    setSnapshot({ post: selectedPost, comments: visibleComments })
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
  const panelMotion = showingSnapshot || phase === 'out' ? 'exit' : 'enter'
  const panelPost = showingSnapshot ? snapshot.post : selectedPost
  const panelComments = showingSnapshot ? snapshot.comments : visibleComments

  const patchPost = (id: string, patch: Partial<FeedPost>) =>
    setPosts((current) => current.map((post) => (post.id === id ? { ...post, ...patch } : post)))

  const selectTab = (next: FeedTab) => {
    setTab(next)
    setMenuId(null)
    setAudienceOpen(false)
    setSelectedId(null)
    if (next === 'gathr') {
      setGathrOpen((open) => (tab === 'gathr' ? !open : true))
      return
    }
    setGathrOpen(false)
  }

  const toggleLike = async (id: string) => {
    const post = posts.find((entry) => entry.id === id)
    if (!post) return
    const liked = !post.liked
    patchPost(id, { liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) })
    try {
      const serverLiked = await apiToggleLike(post)
      if (serverLiked !== undefined && serverLiked !== liked) {
        patchPost(id, { liked: serverLiked, likes: post.likes + (serverLiked ? 1 : 0) - (post.liked ? 1 : 0) })
      }
    } catch (err) {
      patchPost(id, { liked: post.liked, likes: post.likes })
      setActionError(errorMessage(err))
    }
  }

  const toggleSaved = (id: string) => {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    )
  }

  const showImage = (id: string, count: number, delta: number) => {
    setImageSlides((current) => {
      const previous = current[id]?.index ?? 0
      const index = (previous + delta + count) % count
      if (index === previous) return current
      return { ...current, [id]: { index, from: previous, dir: delta >= 0 ? 1 : -1 } }
    })
  }

  const selectImage = (id: string, index: number) => {
    setImageSlides((current) => {
      const previous = current[id]?.index ?? 0
      if (index === previous) return current
      return { ...current, [id]: { index, from: previous, dir: index > previous ? 1 : -1 } }
    })
  }

  /** Runs a moderation call for a post with busy/error handling. */
  const moderate = async (post: FeedPost, action: () => Promise<unknown>, onDone: () => void) => {
    setBusyPost(post.id)
    setActionError(null)
    try {
      await action()
      onDone()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyPost(null)
      setMenuId(null)
      setConfirmDelete(null)
    }
  }

  const removePost = (id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id))
    setSelectedId((current) => (current === id ? null : current))
  }

  const postMenu = (post: FeedPost) => {
    const busy = busyPost === post.id
    return (
      <div className={styles.rowMenuList}>
        {post.userId && (
          <Link href={`/users/${post.userId}`} className={styles.menuItem}>
            View author
          </Link>
        )}
        {post.tab === 'gathr' && (
          <>
            <button
              type="button"
              className={styles.menuItem}
              disabled={busy}
              onClick={() => moderate(post, () => featureGathr(post.id), () => patchPost(post.id, { featured: !post.featured }))}
            >
              {post.featured ? 'Unfeature' : 'Feature'}
            </button>
            <button
              type="button"
              className={styles.menuItem}
              disabled={busy}
              onClick={() => {
                const next = post.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED'
                moderate(post, () => setGathrStatus(post.id, next), () => patchPost(post.id, { status: next }))
              }}
            >
              {post.status === 'PAUSED' ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              disabled={busy}
              onClick={() =>
                confirmDelete === post.id
                  ? moderate(post, () => setGathrStatus(post.id, 'REJECTED'), () => patchPost(post.id, { status: 'REJECTED' }))
                  : setConfirmDelete(post.id)
              }
            >
              {confirmDelete === post.id ? 'Click again to reject' : 'Reject'}
            </button>
          </>
        )}
        {post.tab === 'impact' && (
          <button
            type="button"
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            disabled={busy}
            onClick={() =>
              confirmDelete === post.id
                ? moderate(post, () => deleteImpactPost(post.id), () => removePost(post.id))
                : setConfirmDelete(post.id)
            }
          >
            {busy ? <InlineSpinner /> : confirmDelete === post.id ? 'Click again to delete' : 'Delete post'}
          </button>
        )}
      </div>
    )
  }

  const openProfile = (userId?: string) => {
    setMenuId(null)
    if (userId) router.push(`/users/${userId}`)
  }

  const closeDrawer = () => setSelectedId(null)

  const openPost = (event: React.MouseEvent, id: string) => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, [data-menu-root]')) return
    setDraft('')
    setSortOpen(false)
    setLoadedReplies({})
    setSelectedId(id)
  }

  /** Lazily fetch a thread's replies the first time it opens. */
  const expandThread = async (id: string) => {
    if (loadedReplies[id]) return
    const find = (nodes: FeedReply[]): FeedReply | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node
        const hit = find(node.replies ?? [])
        if (hit) return hit
      }
      return undefined
    }
    const node = find(comments)
    if (!node || (node.replyCount ?? 0) === 0 || (node.replies?.length ?? 0) >= (node.replyCount ?? 0)) return
    setLoadedReplies((current) => ({ ...current, [id]: true }))
    try {
      const replies = await listReplies(id)
      const insert = <T extends FeedReply>(nodes: T[]): T[] =>
        nodes.map((entry) =>
          entry.id === id ? { ...entry, replies } : { ...entry, replies: insert(entry.replies ?? []) }
        )
      commentsRes.mutate((current) => (current ? insert(current) : current))
    } catch (err) {
      setLoadedReplies((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      setActionError(errorMessage(err))
    }
  }

  const hideComment = async (id: string) => {
    setMenuId(null)
    try {
      await deleteComment(id)
    } catch (err) {
      setActionError(errorMessage(err))
      return
    }
    const prune = <T extends FeedReply>(nodes: T[]): T[] =>
      nodes
        .filter((node) => node.id !== id)
        .map((node) => {
          const before = node.replies ?? []
          const after = prune(before)
          return after.length === before.length
            ? node
            : { ...node, replies: after, replyCount: Math.max(0, (node.replyCount ?? before.length) - 1) }
        })
    commentsRes.mutate((current) => (current ? prune(current) : current))
    if (selectedId) {
      const post = posts.find((entry) => entry.id === selectedId)
      if (post) patchPost(post.id, { comments: Math.max(0, post.comments - 1) })
    }
  }

  const addReply = async (parentId: string, text: string) => {
    if (!selectedPost) return
    try {
      const reply = await createComment(selectedPost, text, parentId)
      const insert = <T extends FeedReply>(nodes: T[]): T[] =>
        nodes.map((node) =>
          node.id === parentId
            ? {
                ...node,
                replies: [...(node.replies ?? []), reply],
                replyCount: (node.replyCount ?? node.replies?.length ?? 0) + 1
              }
            : { ...node, replies: insert(node.replies ?? []) }
        )
      commentsRes.mutate((current) => (current ? insert(current) : current))
      patchPost(selectedPost.id, { comments: selectedPost.comments + 1 })
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  const addComment = async () => {
    const text = draft.trim()
    if (!text || !selectedPost || posting) return
    setPosting(true)
    setActionError(null)
    try {
      const created = await createComment(selectedPost, text)
      const comment: FeedComment = { ...created, postId: selectedPost.id, replies: [] }
      commentsRes.mutate((current) => [comment, ...(current ?? [])])
      patchPost(selectedPost.id, { comments: selectedPost.comments + 1 })
      setDraft('')
      setCommentSort('latest')
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setPosting(false)
    }
  }

  const sharePost = async (post: FeedPost) => {
    const text = `${post.username}: ${post.title ?? post.caption}`
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

          {actionError && <ErrorState message={actionError} compact />}

          <div className={styles.feed} key={`${tab}-${gathrFilter}`}>
            {feed.error && posts.length === 0 && <ErrorState message={feed.error} onRetry={feed.reload} />}
            {feed.initialLoading &&
              Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={`${styles.post} ${styles.postSkeleton}`} aria-hidden="true" />
              ))}
            {!feed.loading && !feed.error && posts.length === 0 && (
              <p className={styles.empty}>No posts match this view.</p>
            )}
            {posts.map((post) => (
              <article
                key={post.id}
                className={`${styles.post} ${selectedId === post.id ? styles.postSelected : ''}`}
                onClick={(event) => openPost(event, post.id)}
                aria-busy={busyPost === post.id}
              >
                <div className={styles.postHeader}>
                  <button
                    type="button"
                    className={styles.identityButton}
                    onClick={() => openProfile(post.userId)}
                  >
                    <Avatar src={post.avatarUrl} size={40} className={styles.avatar} />
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
                      onClick={() => {
                        setConfirmDelete(null)
                        setMenuId(menuId === post.id ? null : post.id)
                      }}
                    >
                      {busyPost === post.id ? <InlineSpinner /> : <MoreHorizontal className={styles.moreIcon} />}
                    </button>
                    {menuId === post.id && postMenu(post)}
                  </div>
                </div>

                <PostText post={post} />

                {post.images.length > 0 && (
                <div className={styles.media}>
                  <PostPhotos
                    images={post.images}
                    slide={imageSlides[post.id] ?? restingSlide}
                    sizes="(max-width: 1100px) 100vw, 720px"
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
                        const active = (imageSlides[post.id]?.index ?? 0) === index
                        return (
                          <button
                            key={image}
                            type="button"
                            role="tab"
                            aria-label={`Image ${index + 1}`}
                            aria-selected={active}
                            className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                            onClick={() => selectImage(post.id, index)}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
                )}

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

            {feed.hasMore && (
              <button
                type="button"
                className={styles.loadMore}
                onClick={feed.loadMore}
                disabled={feed.loading}
              >
                {feed.loading ? <InlineSpinner /> : null}
                {feed.loading ? 'Loading' : `Load more${feed.total ? ` (${posts.length} of ${feed.total.toLocaleString('en-US')})` : ''}`}
              </button>
            )}
            {feed.error && posts.length > 0 && <ErrorState message={feed.error} onRetry={feed.loadMore} compact />}
          </div>
        </div>

        <aside
          className={`${styles.rail} ${mountedDrawer ? styles.railDetail : ''} ${shellIn ? styles.shellIn : ''}`}
          data-detail={mountedDrawer ? 'open' : undefined}
          ref={railRef}
          aria-label={panelPost ? 'Post details' : 'Feed tools'}
        >
          {mountedDrawer && panelPost ? (
            <PostDetail
              key={panelPost.id}
              motion={panelMotion}
              post={panelPost}
              imageSlide={imageSlides[panelPost.id] ?? restingSlide}
              saved={savedIds.includes(panelPost.id)}
              comments={panelComments}
              commentsState={commentsRes}
              posting={posting}
              sort={commentSort}
              sortOpen={sortOpen}
              draft={draft}
              menuId={menuId}
              onClose={closeDrawer}
              onLike={() => toggleLike(panelPost.id)}
              onShare={() => sharePost(panelPost)}
              onSave={() => toggleSaved(panelPost.id)}
              onShowImage={(delta) => showImage(panelPost.id, panelPost.images.length, delta)}
              onSelectImage={(index) => selectImage(panelPost.id, index)}
              onToggleMenu={() => {
                setConfirmDelete(null)
                setMenuId(menuId === panelPost.id ? null : panelPost.id)
              }}
              postMenu={postMenu(panelPost)}
              menuOpen={menuId === panelPost.id}
              onDraft={setDraft}
              onSubmit={addComment}
              onSort={(value) => {
                setCommentSort(value)
                setSortOpen(false)
              }}
              onToggleSort={() => setSortOpen((open) => !open)}
              onCommentMenu={(id) => setMenuId(menuId === id ? null : id)}
              onHideComment={hideComment}
              onAddReply={addReply}
              onExpandThread={expandThread}
              onOpenProfile={openProfile}
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
            {audit.error ? (
              <ErrorState message={audit.error} onRetry={audit.reload} compact />
            ) : audit.loading && !audit.data ? (
              <p className={styles.replyLoading}>
                <InlineSpinner /> Loading…
              </p>
            ) : activity.length === 0 ? (
              <p className={styles.empty}>No admin activity yet.</p>
            ) : (
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
            )}
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
              disabled
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className={styles.broadcastFooter}>
              <span className={styles.broadcastNote}>Needs a broadcast endpoint from the API.</span>
              <button type="button" className={styles.sendButton} aria-label="Send broadcast" disabled>
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
