import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Flag, Timer } from "lucide-react"
import type { Session, Meeting } from "@/lib/api"

interface SessionAnalysisProps {
  sessions: Session[]
  selectedSession: Session | null
  selectedMeeting: Meeting | null
}

export function SessionAnalysis({ sessions, selectedSession, selectedMeeting }: SessionAnalysisProps) {
  const getSessionTypeColor = (sessionType: string) => {
    const colors: { [key: string]: string } = {
      Practice: "bg-blue-500",
      Qualifying: "bg-yellow-500",
      Race: "bg-red-500",
      Sprint: "bg-green-500",
    }
    return colors[sessionType] || "bg-gray-500"
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateSessionDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const duration = (endTime - startTime) / (1000 * 60) // minutes
    return Math.round(duration)
  }

  return (
    <div className="space-y-6">
      {/* Session Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Session Timeline
            {selectedMeeting && <Badge variant="outline">{selectedMeeting.meeting_name}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div
                key={session.session_key}
                className={`relative p-4 rounded-lg border-l-4 ${
                  selectedSession?.session_key === session.session_key
                    ? "bg-red-50 border-l-red-500"
                    : "bg-gray-50 border-l-gray-300"
                } transition-all hover:bg-gray-100`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getSessionTypeColor(session.session_type)}`}></div>
                    <div>
                      <h3 className="font-semibold">{session.session_name}</h3>
                      <p className="text-sm text-gray-600">{session.session_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatDateTime(session.date_start)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {calculateSessionDuration(session.date_start, session.date_end)} min
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="mt-3">
                  <Progress value={selectedSession?.session_key === session.session_key ? 100 : 0} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Session Details */}
      {selectedSession && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{selectedSession.session_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Type:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedSession.session_type}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Session Key:</span>
                  <p className="font-mono text-sm">{selectedSession.session_key}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Start:</span>
                  <p className="font-medium">{formatDateTime(selectedSession.date_start)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">End:</span>
                  <p className="font-medium">{formatDateTime(selectedSession.date_end)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">GMT Offset:</span>
                  <p className="font-medium">{selectedSession.gmt_offset}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Session Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {calculateSessionDuration(selectedSession.date_start, selectedSession.date_end)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant="default">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
