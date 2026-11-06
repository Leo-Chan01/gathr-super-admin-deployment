'use client'

import { useState } from 'react'
import { listFeed } from '../../lib/api/feed'
import { useResource } from '../../lib/hooks/useResource'
import type { FeedPost, FeedTab, GathrFilter } from './feedData'

const PAGE_SIZE = 10

/**
 * Paginated feed for one tab/filter/search. Pages accumulate for "Load more";
 * changing the tab, filter or search starts over at page 1.
 */
export function useFeed(tab: FeedTab, gathrFilter: GathrFilter, search: string) {
  const key = `${tab}|${tab === 'gathr' ? gathrFilter : ''}|${search}`
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [prevKey, setPrevKey] = useState(key)
  if (key !== prevKey) {
    setPrevKey(key)
    setPage(1)
    setPosts([])
  }

  const result = useResource(
    (signal) =>
      listFeed({ tab, gathrFilter, search, page, limit: PAGE_SIZE }, { signal }).then((data) => ({ ...data, key, page })),
    [key, page]
  )

  // Fold each newly loaded page into the list (render-time state sync).
  const [merged, setMerged] = useState<typeof result.data>()
  if (result.data && result.data !== merged && result.data.key === key) {
    const data = result.data
    setMerged(data)
    setPosts((current) => {
      if (data.page === 1) return data.items
      const seen = new Set(current.map((post) => post.id))
      return [...current, ...data.items.filter((post) => !seen.has(post.id))]
    })
  }

  const fresh = result.data?.key === key
  return {
    posts,
    setPosts,
    total: fresh ? result.data?.meta.totalItems : undefined,
    loading: result.loading,
    initialLoading: result.loading && posts.length === 0,
    error: result.error,
    hasMore: Boolean(fresh && result.data?.meta.hasNext),
    loadMore: () => setPage((current) => current + 1),
    reload: () => (page === 1 ? result.reload() : setPage(1))
  }
}
