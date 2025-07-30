"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Flag, Calendar, Clock, Timer } from "lucide-react"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useF1Data } from "@/hooks/use-f1-data"

// Helper to get session ID
const getSessionId = (session: any): string => {
  if (!session || !session._id) return `invalid-session-${Math.random()}`
  if (typeof session._id === "object" && session._id.$oid) return session._id.$oid
  return session._id.toString()
}

// Helper to get meeting ID
const getMeetingId = (meeting: any): string => {
  if (!meeting || !meeting._id) return `invalid-meeting-${Math.random()}`
  if (typeof meeting._id === "object" && meeting._id.$oid) return meeting._id.$oid
  return meeting._id.toString()
}

// Date/time formatting utilities
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

const isLive = (start: string, end: string) => {
  const now = new Date()
  return new Date(start) <= now && now <= new Date(end)
}

export default function SessionsPage() {
  const { meetings, selectedMeeting, setSelectedMeeting, sessions, loading } = useF1Data()
  const [selectedType, setSelectedType] = useState<string>("all")

  const handleMeetingChange = (meetingId: string) => {
    if (meetingId === "all") {
      setSelectedMeeting(null)
    } else {
      const meeting = meetings.find((m) => getMeetingId(m) === meetingId)
      if (meeting) setSelectedMeeting(meeting)
    }
  }

  const getSessionTypeName = (s: any): string => {
    if (typeof s.session_type === "string") return s.session_type
    if (s.session_type && typeof s.session_type.name === "string") return s.session_type.name
    return "Unknown"
  }

  const filteredSessions = useMemo(() => {
    let filtered = sessions
    if (selectedType !== "all") {
      filtered = filtered.filter((session) => getSessionTypeName(session) === selectedType)
    }
    return filtered.sort(
      (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    )
  }, [sessions, selectedType])

  const sessionTypes = useMemo(() => {
    return Array.from(new Set(sessions.map(getSessionTypeName))).sort()
  }, [sessions])

  const getSessionTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case "Race": return "🏆"
      case "Qualifying": return "⚡"
      case "Practice": return "🔧"
      case "Sprint": return "🏃"
      default: return "🏁"
    }
  }

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case "Race": return "bg-red-500/20 text-red-200 border-red-300/30"
      case "Qualifying": return "bg-yellow-500/20 text-yellow-200 border-yellow-300/30"
      case "Practice": return "bg-blue-500/20 text-blue-200 border-blue-300/30"
      case "Sprint": return "bg-green-500/20 text-green-200 border-green-300/30"
      default: return "bg-gray-500/20 text-gray-200 border-gray-300/30"
    }
  }

  const getMeetingName = (meetingKey: number) => {
    const meeting = meetings.find((m) => m._id === meetingKey)
    return meeting ? meeting.meeting_name : `Meeting ${meetingKey}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
            <p className="text-white">Loading sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2" role="heading" aria-level={1}>
          F1 Sessions
        </h1>
        <p className="text-xl text-gray-300">
          Browse all Formula 1 practice, qualifying, and race sessions
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-6">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Meeting Filter */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Meeting</label>
              <Select
                value={selectedMeeting ? getMeetingId(selectedMeeting) : "all"}
                onValueChange={handleMeetingChange}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a meeting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meetings</SelectItem>
                  {meetings.map((meeting) => {
                    const meetingId = getMeetingId(meeting)
                    return (
                      <SelectItem key={meetingId} value={meetingId}>
                        {meeting.meeting_name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Session Type Filter */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getSessionTypeIcon(type)} {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Count Summary */}
            <div className="flex items-end">
              <div className="text-white">
                <p className="text-sm text-white/60">Results</p>
                <p className="text-2xl font-bold">{filteredSessions.length}</p>
                <p className="text-xs text-white/60">sessions found</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSessions.map((session) => {
          const sessionId = getSessionId(session)
          const type = getSessionTypeName(session)
          return (
            <Link key={sessionId} href={`/sessions/${sessionId}`}>
              <Card className="bg-white/5 backdrop-blur-md border border-white/5 hover:border-white/20 hover:shadow-lg hover:scale-[1.01] transition-transform duration-200 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{getSessionTypeIcon(type)}</div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className={getSessionTypeColor(type)}>
                        {type}
                      </Badge>
                      {isLive(session.date_start, session.date_end) && (
                        <Badge className="bg-green-600/30 text-green-200 border-green-500/30">
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-white text-xl truncate">{session.session_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-white/80">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <span className="text-sm truncate">{getMeetingName(session.meeting_key)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDate(session.date_start)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {formatTime(session.date_start)} - {formatTime(session.date_end)}
                      </span>
                    </div>
                    <div className="pt-2 text-white/40 text-xs">
                      <p>Session Key: {sessionId}</p>
                      <p>Meeting Key: {session.meeting_key}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredSessions.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10 mt-6">
          <CardContent className="text-center py-12">
            <Timer className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Sessions Found</h3>
            <p className="text-white/60">Try adjusting your filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
