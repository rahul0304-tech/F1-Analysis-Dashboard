"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

export function ApiStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("https://f1-backend-deployment.onrender.com/api/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok) {
          setStatus("online")
        } else {
          setStatus("offline")
        }
      } catch (error) {
        setStatus("offline")
      }

      setLastChecked(new Date())
    }

    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = () => {
    switch (status) {
      case "checking":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Checking API
          </Badge>
        )
      case "online":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            API Online
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            API Offline
          </Badge>
        )
    }
  }

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      {lastChecked && <span className="text-xs text-gray-500">Last checked: {lastChecked.toLocaleTimeString()}</span>}
    </div>
  )
}
