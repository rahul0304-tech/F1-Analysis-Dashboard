import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutContent } from "@/components/layout-content"

const inter = Inter({ subsets: ["latin"] })

// Metadata is exported from this Server Component layout
export const metadata: Metadata = {
  title: "F1 Analysis Dashboard",
  description: "Formula 1 Data Analysis Platform",
  icons: {
    icon: "/f1.jpeg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Let next-themes handle reading the cookie internally
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black">
            {/* Render the new client component to handle Navbar logic */}
            <LayoutContent>{children}</LayoutContent>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
