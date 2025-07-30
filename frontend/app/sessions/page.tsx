"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flag, Calendar, Clock, Timer } from "lucide-react"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useF1Data } from "@/hooks/use-f1-data" // Import the hook

export default function SessionsPage() {
  const { meetings, selectedMeeting, setSelectedMeeting, sessions, loading } = useF1Data()
  const [selectedType, setSelectedType] = useState<string>("all")

  // Update selectedMeeting when the filter changes
  const handleMeetingChange = (meetingId: string) => {
    if (meetingId === "all") {
      setSelectedMeeting(null) // Or set to the most recent meeting if you want a default
    } else {
      const meeting = meetings.find((m) => m._id.toString() === meetingId)
      if (meeting) {
        setSelectedMeeting(meeting)
      }
    }
  }

  const filteredSessions = useMemo(() => {
    let filtered = sessions

    if (selectedType !== "all") {
      filtered = filtered.filter((session) => session.session_type === selectedType)
    }

    return filtered.sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
  }, [sessions, selectedType])

  const sessionTypes = useMemo(() => {
    const types = Array.from(new Set(sessions.map((s) => s.session_type))).sort()
    return types
  }, [sessions])

  const getSessionTypeIcon = (sessionType: string) => {
    switch (sessionType) {
      case "Race":
        return "🏆"
      case "Qualifying":
        return "⚡"
      case "Practice":
        return "🔧"
      case "Sprint":
        return "🏃"
      default:
        return "🏁"
    }
  }

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case "Race":
        return "bg-red-500/20 text-red-200 border-red-300/30"
      case "Qualifying":
        return "bg-yellow-500/20 text-yellow-200 border-yellow-300/30"
      case "Practice":
        return "bg-blue-500/20 text-blue-200 border-blue-300/30"
      case "Sprint":
        return "bg-green-500/20 text-green-200 border-green-300/30"
      default:
        return "bg-gray-500/20 text-gray-200 border-gray-300/30"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Loading sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">F1 Sessions</h1>
        <p className="text-xl text-gray-300">Browse all Formula 1 practice, qualifying, and race sessions</p>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Meeting</label>
              <Select value={selectedMeeting?._id.toString() || "all"} onValueChange={handleMeetingChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meetings</SelectItem>
                  {meetings.map((meeting) => (
                    <SelectItem key={meeting._id} value={meeting._id.toString()}>
                      {meeting.meeting_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
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

            <div className="flex items-end">
              <div className="text-white">
                <p className="text-sm text-white/60">Results</p>
                <p className="text-2xl font-bold">{filteredSessions.length}</p>
                <p className="text-xs text-white/60">sessions found</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map((session) => (
          <Link key={session._id} href={`/sessions/${session._id}`}>
            <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{getSessionTypeIcon(session.session_type)}</div>
                  <Badge variant="outline" className={getSessionTypeColor(session.session_type)}>
                    {session.session_type}
                  </Badge>
                </div>
                <CardTitle className="text-white text-xl">{session.session_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/80">
                    <Flag className="w-4 h-4" />
                    <span className="text-sm">{getMeetingName(session.meeting_key)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(session.date_start).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-white/80">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(session.date_start).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(session.date_end).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="pt-2">
                    <p className="text-white/40 text-xs">Session Key: {session._id}</p>
                    <p className="text-white/40 text-xs">Meeting Key: {session.meeting_key}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
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
