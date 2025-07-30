"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Button } from "../../components/ui/button"
import { Timer, TrendingUp, Award, Download, Filter } from "lucide-react"
import { useState, useMemo } from "react"
import { useF1Data } from "../../hooks/use-f1-data"
import { type Lap } from "../../lib/api"

export default function LapsPage() {
  const {
    meetings,
    selectedMeeting,
    setSelectedMeeting,
    sessions,
    selectedSession,
    setSelectedSession,
    laps,
    drivers,
    loading,
  } = useF1Data()
  const [selectedDriver, setSelectedDriver] = useState<string>("all")

  const handleMeetingChange = (meetingId: string) => {
    if (meetingId === "all") {
      setSelectedMeeting(null)
    } else {
      const meeting = meetings.find((m) => m._id.toString() === meetingId)
      if (meeting) {
        setSelectedMeeting(meeting)
      }
    }
  }

  const handleSessionChange = (sessionId: string) => {
    if (sessionId === "all") {
      setSelectedSession(null)
    } else {
      const session = sessions.find((s) => s._id.toString() === sessionId)
      if (session) {
        setSelectedSession(session)
      }
    }
  }

  const filteredLaps = useMemo(() => {
    let filtered: Lap[] = Array.isArray(laps) ? laps.filter((lap) => lap.lap_duration > 0) : [];

    if (selectedDriver !== "all") {
      const driverNumber = Number.parseInt(selectedDriver)
      filtered = filtered.filter((lap) => lap.driver_number === driverNumber)
    }

    return filtered.sort((a, b) => a.lap_duration - b.lap_duration)
  }, [laps, selectedDriver])

  const lapStats = useMemo(() => {
    if (!filteredLaps.length) return null

    const fastestLap = filteredLaps[0]
    const averageLap = filteredLaps.reduce((sum, lap) => sum + lap.lap_duration, 0) / filteredLaps.length
    const totalLaps = filteredLaps.length
    const pitOutLaps = filteredLaps.filter((lap) => lap.is_pit_out_lap).length

    return {
      fastestLap,
      averageLap,
      totalLaps,
      pitOutLaps,
    }
  }, [filteredLaps])

  const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
  }

  const getSessionName = (sessionKey: number) => {
    const session = sessions.find((s) => s._id === sessionKey)
    return session ? session.session_name : `Session ${sessionKey}`
  }

  const getMeetingName = (sessionKey: number) => {
    const session = sessions.find((s) => s._id === sessionKey)
    if (!session) return "Unknown Meeting"
    const meeting = meetings.find((m) => m._id === session.meeting_key)
    return meeting ? meeting.meeting_name : `Meeting ${session.meeting_key}`
  }

  const exportData = () => {
    const csvContent = [
      ["Lap Number", "Driver", "Session", "Meeting", "Lap Time"],
      ...filteredLaps
        .slice(0, 1000)
        .map((lap) => [
          lap.lap_number,
          lap.full_name,
          getSessionName(lap.session_key),
          getMeetingName(lap.session_key),
          formatLapTime(lap.lap_duration),
        ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `f1-lap-analysis-${selectedMeeting?.meeting_name || "session"}-${selectedSession?.session_name || "all"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && laps.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Loading lap data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Lap Analysis</h1>
        <p className="text-xl text-gray-300">Detailed Formula 1 lap time analysis and statistics</p>
      </div>

      <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Meeting</label>
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
              <label className="text-sm font-medium text-white/90 mb-2 block">Session</label>
              <Select value={selectedSession?._id.toString() || "all"} onValueChange={handleSessionChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions
                    .filter((session) =>
                      selectedMeeting === null ? true : session.meeting_key === selectedMeeting._id,
                    )
                    .map((session) => (
                      <SelectItem key={session._id} value={session._id.toString()}>
                        {session.session_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Driver</label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver._id} value={driver._id.toString()}>
                      {driver.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Actions</label>
              <Button onClick={exportData} className="w-full bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {lapStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fastest Lap</CardTitle>
              <Award className="h-4 w-4 text-yellow-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatLapTime(lapStats.fastestLap.lap_duration)}</div>
              <p className="text-xs text-yellow-200">{lapStats.fastestLap.full_name}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Lap</CardTitle>
              <Timer className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{formatLapTime(lapStats.averageLap)}</div>
              <p className="text-xs text-blue-200">Across {lapStats.totalLaps} laps</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Laps</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lapStats.totalLaps}</div>
              <p className="text-xs text-green-200">Analyzed laps</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pit Out Laps</CardTitle>
              <Filter className="h-4 w-4 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lapStats.pitOutLaps}</div>
              <p className="text-xs text-purple-200">Pit lane exits</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Lap Times</span>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {filteredLaps.length} laps
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3 text-white">Rank</th>
                  <th className="text-left p-3 text-white">Driver</th>
                  <th className="text-left p-3 text-white">Lap Time</th>
                  <th className="text-left p-3 text-white">Lap #</th>
                  <th className="text-left p-3 text-white">Session</th>
                </tr>
              </thead>
              <tbody>
                {filteredLaps.slice(0, 100).map((lap, index) => (
                  <tr
                    key={lap._id.$oid}
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      index === 0 ? "bg-yellow-500/10" : ""
                    }`}
                  >
                    <td className="p-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                              ? "bg-gray-400 text-black"
                              : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-white/20 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `#${lap.team_color}` }}
                        ></div>
                        <span className="text-white font-medium">{lap.full_name}</span>
                      </div>
                    </td>
                    <td className={`p-3 font-mono font-bold ${index === 0 ? "text-yellow-400" : "text-white"}`}>
                      {formatLapTime(lap.lap_duration)}
                      {index === 0 && <span className="ml-2 text-yellow-400">🏆</span>}
                    </td>
                    <td className="p-3 font-mono text-white">{lap.lap_number}</td>
                    <td className="p-3 text-white/80 text-xs">{getSessionName(lap.session_key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLaps.length > 100 && (
            <div className="text-center mt-4">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                Showing first 100 of {filteredLaps.length} laps
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredLaps.length === 0 && !loading && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="text-center py-12">
            <Timer className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Laps Found</h3>
            <p className="text-white/60">Try adjusting your filter criteria or selecting a different session.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
