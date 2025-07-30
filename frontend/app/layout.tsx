"use client" // This directive is necessary to use hooks like usePathname

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { usePathname } from "next/navigation" // Import usePathname

const inter = Inter({ subsets: ["latin"] })

// Metadata is a server-only export, so it stays outside the client component
// Note: In Next.js 13+ App Router, metadata can be exported directly from layout.tsx
// or page.tsx files.
const metadata: Metadata = {
  title: "F1 Analysis Dashboard",
  description: "Formula 1 Data Analysis Platform",
  generator: 'v0.dev', // Retaining the user's specified generator
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() // Get the current pathname

  // Determine if the Navbar should be visible
  // It should be hidden only on the root path "/"
  const showNavbar = pathname !== "/"

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black">
          {/* Conditionally render the Navbar */}
          {showNavbar && <Navbar />}
          {/* The children prop will render the page component for the current route.
              This means your app/page.tsx (bentobox) will render here for the root route,
              and other pages like overview/page.tsx will render here for their routes. */}
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
