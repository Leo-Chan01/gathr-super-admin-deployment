'use client'

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useTabIndicator(activeKey: string) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const root = tabsRef.current
    if (!root) return

    const measure = () => {
      const active = root.querySelector('[role="tab"][aria-selected="true"]') as HTMLElement | null
      if (!active) return
      const rootRect = root.getBoundingClientRect()
      const rect = active.getBoundingClientRect()
      const x = rect.left - rootRect.left + root.scrollLeft
      const width = rect.width
      setIndicator((current) => {
        if (
          current.ready &&
          Math.abs(current.x - x) < 0.5 &&
          Math.abs(current.width - width) < 0.5
        ) {
          return current
        }
        return { x, width, ready: true }
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    Array.from(root.children).forEach((child) => {
      if (child instanceof HTMLElement) observer.observe(child)
    })
    return () => observer.disconnect()
  }, [activeKey])

  return { tabsRef, indicator }
}

export function useReflow(ref: RefObject<HTMLDivElement | null>) {
  const positions = useRef(new Map<string, DOMRect>())
  const shouldAnimate = useRef(false)
  const pending = useRef(new Set<string>())

  const read = () => {
    const map = new Map<string, DOMRect>()
    ref.current?.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((node) => {
      const id = node.dataset.flipId
      if (id) map.set(id, node.getBoundingClientRect())
    })
    return map
  }

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) {
      positions.current = new Map()
      return
    }

    const next = read()
    if (shouldAnimate.current && !prefersReducedMotion()) {
      next.forEach((rect, id) => {
        const prev = positions.current.get(id)
        if (!prev) return
        const dx = prev.left - rect.left
        const dy = prev.top - rect.top
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
        const node = root.querySelector<HTMLElement>(`[data-flip-id="${CSS.escape(id)}"]`)
        if (!node) return
        node.getAnimations().forEach((animation) => animation.cancel())
        node.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 520, easing: EASE }
        )
      })
    }

    shouldAnimate.current = false
    positions.current = next
  })

  useEffect(() => {
    const refresh = () => {
      const map = new Map<string, DOMRect>()
      ref.current?.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((node) => {
        const id = node.dataset.flipId
        if (id) map.set(id, node.getBoundingClientRect())
      })
      positions.current = map
    }
    window.addEventListener('resize', refresh)
    return () => window.removeEventListener('resize', refresh)
  }, [ref])

  const beginRemove = (id: string) => {
    if (pending.current.has(id)) return
    pending.current.add(id)
    if (prefersReducedMotion()) return

    shouldAnimate.current = true
    const node = ref.current?.querySelector<HTMLElement>(`[data-flip-id="${CSS.escape(id)}"]`)
    if (!node) return

    const rect = node.getBoundingClientRect()
    const ghost = node.cloneNode(true) as HTMLElement
    ghost.removeAttribute('data-flip-id')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.style.position = 'fixed'
    ghost.style.left = `${rect.left}px`
    ghost.style.top = `${rect.top}px`
    ghost.style.width = `${rect.width}px`
    ghost.style.height = `${rect.height}px`
    ghost.style.margin = '0'
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '30'
    ghost.style.boxSizing = 'border-box'
    document.body.appendChild(ghost)

    const animation = ghost.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.96)' }
      ],
      { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
    )
    const cleanup = () => ghost.remove()
    animation.finished.then(cleanup, cleanup)
  }

  return beginRemove
}
