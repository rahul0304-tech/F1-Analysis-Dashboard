"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()

  // Determine if the Navbar should be visible
  // It should be hidden only on the root path "/"
  const showNavbar = pathname !== "/"

  return (
    <>
      {showNavbar && <Navbar />}
      <main>{children}</main>
    </>
  )
}
