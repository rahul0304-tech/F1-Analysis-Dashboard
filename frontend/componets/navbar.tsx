"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flag, BarChart3, Users, Timer, Trophy, Calendar, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Overview", href: "/overview", icon: BarChart3 },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Sessions", href: "/sessions", icon: Flag },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Lap Analysis", href: "/laps", icon: Timer },
  { name: "Records", href: "/records", icon: Trophy },
  { name: "Comparison", href: "/comparison", icon: Target },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <img src="/f1.jpeg" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold italic text-white">Formula One</h1>
              <p className="text-xs text-gray-400">Analysis Dashboard</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive ? "bg-red-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
