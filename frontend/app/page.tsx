"use client"

import { CardContent } from "../components/ui/card"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BarChart3, Calendar, Users, Timer, Trophy, Flag, Target } from "lucide-react"
import { motion } from "framer-motion"

const navigation = [
  { name: "Overview", href: "/overview", icon: BarChart3, image: "/f1-overview.jpeg" },
  { name: "Meetings", href: "/meetings", icon: Calendar, image: "/f1-meetings.jpeg" },
  { name: "Sessions", href: "/sessions", icon: Flag, image: "/f1-sessions.jpg" },
  { name: "Drivers", href: "/drivers", icon: Users, image: "/f1-drivers.jpg" },
  { name: "Lap Analysis", href: "/laps", icon: Timer, image: "/f1-lap-analysis.jpeg" },
  { name: "Records", href: "/records", icon: Trophy, image: "/f1-records.jpeg" },
  { name: "Comparison", href: "/comparison", icon: Target, image: "/f1-comparision.jpeg" },
]

export default function LandingPage() {
  const [hasMounted, setHasMounted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setHasMounted(true)
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Autoplay prevented:", error)
      })
    }
  }, [])

  if (!hasMounted) return null

  // Animation logic based on index
  const getAnimation = (index: number) => {
    if (index === 0) return { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 } } // top-left
    if (index === 1) return { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 } } // top-center
    if (index === 2) return { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 } } // top-right
    if (index === 3) return { initial: { opacity: 0 }, animate: { opacity: 1 } } // middle-center
    if (index === 4) return { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 } } // middle-left
    if (index === 5) return { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 } } // middle-right
    if (index === 6) return { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 } } // bottom-center
    return { initial: { opacity: 0 }, animate: { opacity: 1 } }
  }

  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-gray-900 via-red-900 to-black overflow-hidden">

      {/* Content */}
      <div className="relative z-10 h-screen w-screen flex items-center justify-center overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 w-screen h-screen box-border overflow-hidden">
          {navigation.map((item, index) => {
            const animation = getAnimation(index)
            return (
              <motion.div
                key={item.name}
                initial={animation.initial}
                animate={animation.animate}
                transition={{ duration: 0.9, delay: index * 0.1  }}
                className={`relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md shadow-lg group
                  ${index === 0 && "md:col-span-2 md:row-span-2"}
                  ${index === 1 && "md:col-span-2"}
                  ${index === 2 && "md:col-span-2"}
                  ${index === 3 && "md:col-span-2"}
                  ${index === 4 && "md:col-span-2 md:row-span-2"}
                  ${index === 5 && "md:col-span-2"}
                  ${index === 6 && "md:col-span-2"}
                `}
                style={{
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <Link href={item.href} prefetch={true}>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/50 transition-colors duration-300"></div>
                  <CardContent className="relative z-10 p-6 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                      <p className="text-sm text-gray-300 mt-1">Explore {item.name} data</p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <item.icon className="w-8 h-8 text-white/70 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </CardContent>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
