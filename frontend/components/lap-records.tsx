"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Timer, Target, TrendingUp, Award, Zap } from "lucide-react"
import { useState, useMemo } from "react"
import type { Meeting, Session, Lap, Driver } from "@/lib/api"

interface LapRecordsProps {
  meetings: Meeting[]
  sessions: Session[]
  laps: Lap[]
  drivers: Driver[]
  selectedMeeting: Meeting | null
  setSelectedMeeting: (meeting: Meeting | null) => void
  selectedSession: Session | null
  setSelectedSession: (session: Session | null) => void
}

export function LapRecords({
  meetings,
  sessions,
  laps,
  drivers,
  selectedMeeting,
  setSelectedMeeting,
  selectedSession,
  setSelectedSession,
}: LapRecordsProps) {
  const [selectedSessionType, setSelectedSessionType] = useState<string>("all")

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
    let filtered = laps.filter((lap) => lap.lap_duration > 0)

    // Filter by selected session type (from the currently loaded sessions)
    if (selectedSessionType !== "all") {
      const typeSessions = sessions.filter((s) => s.session_type === selectedSessionType)
      const sessionKeys = typeSessions.map((s) => s._id)
      filtered = filtered.filter((lap) => sessionKeys.includes(lap.session_key))
    }

    return filtered
  }, [laps, sessions, selectedSessionType])

  const records = useMemo(() => {
    if (!filteredLaps.length) return null

    // Overall fastest lap
    const fastestLap = filteredLaps.reduce((fastest, current) =>
      current.lap_duration < fastest.lap_duration ? current : fastest,
    )

    // Fastest by session type
    const sessionTypes = Array.from(new Set(sessions.map((s) => s.session_type)))
    const fastestBySessionType = sessionTypes
      .map((type) => {
        const typeSessions = sessions.filter((s) => s.session_type === type)
        const sessionKeys = typeSessions.map((s) => s._id)
        const typeLaps = filteredLaps.filter((lap) => sessionKeys.includes(lap.session_key))

        if (!typeLaps.length) return null

        const fastest = typeLaps.reduce((fastest, current) =>
          current.lap_duration < fastest.lap_duration ? current : fastest,
        )

        return { type, lap: fastest }
      })
      .filter(Boolean)

    // Fastest by driver
    const driverRecords = drivers
      .map((driver) => {
        const driverLaps = filteredLaps.filter((lap) => lap.driver_number === driver._id)
        if (!driverLaps.length) return null

        const fastest = driverLaps.reduce((fastest, current) =>
          current.lap_duration < fastest.lap_duration ? current : fastest,
        )

        const totalLaps = driverLaps.length
        const averageLap = driverLaps.reduce((sum, lap) => sum + lap.lap_duration, 0) / totalLaps

        return {
          driver,
          fastest,
          totalLaps,
          averageLap,
          consistency: Math.sqrt(
            driverLaps.reduce((sum, lap) => sum + Math.pow(lap.lap_duration - averageLap, 2), 0) / totalLaps,
          ),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.fastest.lap_duration - b!.fastest.lap_duration)

    // Fastest sectors
    const sector1Laps = filteredLaps.filter((lap) => lap.sector_1_time > 0)
    const fastestSector1 =
      sector1Laps.length > 0
        ? sector1Laps.reduce((fastest, current) => (current.sector_1_time < fastest.sector_1_time ? current : fastest))
        : null

    const sector2Laps = filteredLaps.filter((lap) => lap.sector_2_time > 0)
    const fastestSector2 =
      sector2Laps.length > 0
        ? sector2Laps.reduce((fastest, current) => (current.sector_2_time < fastest.sector_2_time ? current : fastest))
        : null

    const sector3Laps = filteredLaps.filter((lap) => lap.sector_3_time > 0)
    const fastestSector3 =
      sector3Laps.length > 0
        ? sector3Laps.reduce((fastest, current) => (current.sector_3_time < fastest.sector_3_time ? current : fastest))
        : null

    // Most laps
    const lapCounts = drivers
      .map((driver) => ({
        driver,
        count: filteredLaps.filter((lap) => lap.driver_number === driver._id).length,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      fastestLap,
      fastestBySessionType,
      driverRecords,
      fastestSector1,
      fastestSector2,
      fastestSector3,
      lapCounts,
    }
  }, [filteredLaps, sessions, drivers])

  const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
  }

  const getSessionInfo = (sessionKey: number) => {
    const session = sessions.find((s) => s._id === sessionKey)
    const meeting = session ? meetings.find((m) => m._id === session.meeting_key) : null
    return { session, meeting }
  }

  if (!records) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="text-center py-12">
          <Timer className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Records Available</h3>
          <p className="text-white/60">No lap data found for the selected filters</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Lap Records & Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Meeting</label>
              <Select value={selectedMeeting?._id.toString() || "all"} onValueChange={handleMeetingChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meetings (Current Data)</SelectItem>
                  {meetings.map((meeting) => (
                    <SelectItem key={meeting._id} value={meeting._id.toString()}>
                      {meeting.meeting_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Session</label>
              <Select value={selectedSession?._id.toString() || "all"} onValueChange={handleSessionChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions (Current Meeting)</SelectItem>
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
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Session Type</label>
              <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Session Types</SelectItem>
                  {Array.from(new Set(sessions.map((s) => s.session_type))).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-4">
            Note: "All Meetings" and "All Sessions" filters apply to the data currently loaded for the selected
            meeting/session. For comprehensive historical records, a backend endpoint providing aggregated data would be
            more efficient.
          </p>
        </CardContent>
      </Card>

      {/* Overall Fastest Lap */}
      <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6" />
            Overall Fastest Lap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-yellow-100 text-sm">Lap Time</p>
              <p className="text-4xl font-mono font-bold">{formatLapTime(records.fastestLap.lap_duration)}</p>
            </div>
            <div>
              <p className="text-yellow-100 text-sm">Driver</p>
              <p className="text-2xl font-bold">
                {drivers.find((d) => d._id === records.fastestLap.driver_number)?.full_name ||
                  `Driver ${records.fastestLap.driver_number}`}
              </p>
              <p className="text-yellow-100">Lap {records.fastestLap.lap_number}</p>
            </div>
            <div>
              <p className="text-yellow-100 text-sm">Session</p>
              <p className="text-xl font-semibold">
                {getSessionInfo(records.fastestLap.session_key).session?.session_name}
              </p>
              <p className="text-yellow-100">{getSessionInfo(records.fastestLap.session_key).meeting?.meeting_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records by Session Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {records.fastestBySessionType.map((record) => {
          if (!record) return null

          const { session, meeting } = getSessionInfo(record.lap.session_key)

          return (
            <Card key={record.type} className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Fastest {record.type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-mono font-bold text-yellow-400">
                    {formatLapTime(record.lap.lap_duration)}
                  </p>
                  <p className="text-white font-semibold">
                    {drivers.find((d) => d._id === record.lap.driver_number)?.full_name ||
                      `Driver ${record.lap.driver_number}`}
                  </p>
                  <p className="text-white/60 text-sm">{session?.session_name}</p>
                  <p className="text-white/60 text-sm">{meeting?.meeting_name}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sector Records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {records.fastestSector1 && (
          <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Fastest Sector 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold">{records.fastestSector1.sector_1_time.toFixed(3)}s</p>
              <p className="text-green-100 font-semibold">
                {drivers.find((d) => d._id === records.fastestSector1.driver_number)?.full_name ||
                  `Driver ${records.fastestSector1.driver_number}`}
              </p>
              <p className="text-green-200 text-sm">
                {getSessionInfo(records.fastestSector1.session_key).meeting?.meeting_name}
              </p>
            </CardContent>
          </Card>
        )}

        {records.fastestSector2 && (
          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Fastest Sector 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold">{records.fastestSector2.sector_2_time.toFixed(3)}s</p>
              <p className="text-purple-100 font-semibold">
                {drivers.find((d) => d._id === records.fastestSector2.driver_number)?.full_name ||
                  `Driver ${records.fastestSector2.driver_number}`}
              </p>
              <p className="text-purple-200 text-sm">
                {getSessionInfo(records.fastestSector2.session_key).meeting?.meeting_name}
              </p>
            </CardContent>
          </Card>
        )}

        {records.fastestSector3 && (
          <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Fastest Sector 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold">{records.fastestSector3.sector_3_time.toFixed(3)}s</p>
              <p className="text-orange-100 font-semibold">
                {drivers.find((d) => d._id === records.fastestSector3.driver_number)?.full_name ||
                  `Driver ${records.fastestSector3.driver_number}`}
              </p>
              <p className="text-orange-200 text-sm">
                {getSessionInfo(records.fastestSector3.session_key).meeting?.meeting_name}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Driver Records Table */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Driver Performance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Driver</th>
                  <th className="text-left p-3">Fastest Lap</th>
                  <th className="text-left p-3">Average Lap</th>
                  <th className="text-left p-3">Total Laps</th>
                  <th className="text-left p-3">Consistency</th>
                </tr>
              </thead>
              <tbody>
                {records.driverRecords.slice(0, 10).map((record, index) => {
                  if (!record) return null

                  return (
                    <tr key={record.driver._id} className="border-b border-white/10 hover:bg-white/5">
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
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: `#${record.driver.team_color}` }}
                          ></div>
                          <div>
                            <p className="font-semibold">{record.driver.full_name}</p>
                            <p className="text-white/60 text-sm">{record.driver.team_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-yellow-400">
                        {formatLapTime(record.fastest.lap_duration)}
                      </td>
                      <td className="p-3 font-mono">{formatLapTime(record.averageLap)}</td>
                      <td className="p-3 font-bold">{record.totalLaps}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            record.consistency < 1 ? "default" : record.consistency < 2 ? "secondary" : "destructive"
                          }
                        >
                          {record.consistency < 1 ? "Excellent" : record.consistency < 2 ? "Good" : "Poor"}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Most Active Drivers */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Most Active Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.lapCounts.slice(0, 6).map((record, index) => (
              <div key={record.driver._id} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `#${record.driver.team_color}` }}
                    ></div>
                    <span className="font-semibold text-white">{record.driver.full_name}</span>
                  </div>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{record.count}</div>
                <div className="text-white/60 text-sm">Total laps completed</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
