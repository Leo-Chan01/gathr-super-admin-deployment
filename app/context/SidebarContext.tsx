'use client'

import React, { createContext, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextType {
  isOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {}
})

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsOpen(false)
  }

  const toggleSidebar = () => setIsOpen((prev) => !prev)
  const closeSidebar = () => setIsOpen(false)
  const openSidebar = () => setIsOpen(true)

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, openSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
