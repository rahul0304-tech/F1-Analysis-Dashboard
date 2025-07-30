"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Users, TrendingUp, Timer, Target, Plus, X } from "lucide-react"
import { useState, useMemo } from "react"
import type { Driver, Lap, Session, Meeting } from "@/lib/api"

interface DriverComparisonProps {
  meetings: Meeting[]
  sessions: Session[]
  laps: Lap[]
  drivers: Driver[]
  selectedMeeting: Meeting | null
  setSelectedMeeting: (meeting: Meeting | null) => void
  selectedSession: Session | null
  setSelectedSession: (session: Session | null) => void
  comparisonDrivers: number[]
  setComparisonDrivers: (drivers: number[]) => void
}

export function DriverComparison({
  meetings,
  sessions,
  laps,
  drivers,
  selectedMeeting,
  setSelectedMeeting,
  selectedSession,
  setSelectedSession,
  comparisonDrivers,
  setComparisonDrivers,
}: DriverComparisonProps) {
  const [selectedDriverToAdd, setSelectedDriverToAdd] = useState<string>("")

  const handleMeetingChange = (meetingId: string) => {
    if (meetingId === "all") {
      setSelectedMeeting(null)
    } else {
      const meeting = meetings.find((m) => m._id.toString() === meetingId)
      if (meeting) {
        setSelectedMeeting(meeting)
      }
    }
    setComparisonDrivers([]) // Clear comparison when meeting changes
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
    setComparisonDrivers([]) // Clear comparison when session changes
  }

  const addDriverToComparison = (driverNumber: string) => {
    const num = Number.parseInt(driverNumber)
    if (!comparisonDrivers.includes(num) && comparisonDrivers.length < 4) {
      setComparisonDrivers([...comparisonDrivers, num])
    }
    setSelectedDriverToAdd("")
  }

  const removeDriverFromComparison = (driverNumber: number) => {
    setComparisonDrivers(comparisonDrivers.filter((d) => d !== driverNumber))
  }

  const comparisonData = useMemo(() => {
    if (!comparisonDrivers.length || !selectedSession) return []

    const sessionLaps = laps.filter((lap) => lap.session_key === selectedSession._id)

    const maxLaps = Math.max(
      ...comparisonDrivers.map((driverNum) => sessionLaps.filter((lap) => lap.driver_number === driverNum).length),
    )

    return Array.from({ length: maxLaps }, (_, lapIndex) => {
      const lapData: any = { lap: lapIndex + 1 }

      comparisonDrivers.forEach((driverNum) => {
        const driver = drivers.find((d) => d._id === driverNum)
        const driverLaps = sessionLaps.filter((lap) => lap.driver_number === driverNum)
        const lapTime = driverLaps[lapIndex]?.lap_duration || null

        if (driver && lapTime) {
          lapData[driver.name_acronym] = lapTime
        }
      })

      return lapData
    }).filter((lap) => Object.keys(lap).length > 1)
  }, [comparisonDrivers, laps, drivers, selectedSession])

  const driverStats = useMemo(() => {
    if (!selectedSession) return []
    const sessionLaps = laps.filter((lap) => lap.session_key === selectedSession._id)

    return comparisonDrivers
      .map((driverNum) => {
        const driver = drivers.find((d) => d._id === driverNum)
        const driverLaps = sessionLaps.filter((lap) => lap.driver_number === driverNum)

        if (!driver || !driverLaps.length) return null

        const validLaps = driverLaps.filter((lap) => lap.lap_duration > 0)
        if (validLaps.length === 0) return null

        const fastestLap = validLaps.reduce((fastest, current) =>
          current.lap_duration < fastest.lap_duration ? current : fastest,
        )
        const averageLap = validLaps.reduce((sum, lap) => sum + lap.lap_duration, 0) / validLaps.length
        const consistency = Math.sqrt(
          validLaps.reduce((sum, lap) => sum + Math.pow(lap.lap_duration - averageLap, 2), 0) / validLaps.length,
        )

        const sector1Avg =
          validLaps.filter((l) => l.sector_1_time > 0).reduce((sum, lap) => sum + (lap.sector_1_time || 0), 0) /
          validLaps.filter((l) => l.sector_1_time > 0).length
        const sector2Avg =
          validLaps.filter((l) => l.sector_2_time > 0).reduce((sum, lap) => sum + (lap.sector_2_time || 0), 0) /
          validLaps.filter((l) => l.sector_2_time > 0).length
        const sector3Avg =
          validLaps.filter((l) => l.sector_3_time > 0).reduce((sum, lap) => sum + (lap.sector_3_time || 0), 0) /
          validLaps.filter((l) => l.sector_3_time > 0).length

        return {
          driver,
          totalLaps: validLaps.length,
          fastestLap: fastestLap.lap_duration,
          averageLap,
          consistency,
          sector1Avg: isFinite(sector1Avg) ? sector1Avg : 0,
          sector2Avg: isFinite(sector2Avg) ? sector2Avg : 0,
          sector3Avg: isFinite(sector3Avg) ? sector3Avg : 0,
        }
      })
      .filter(Boolean)
  }, [comparisonDrivers, drivers, laps, selectedSession])

  const radarData = useMemo(() => {
    if (!driverStats.length) return []

    const maxValues = {
      speed: Math.max(...driverStats.map((s) => s!.fastestLap)),
      consistency: Math.max(...driverStats.map((s) => s!.consistency)),
      sector1: Math.max(...driverStats.map((s) => s!.sector1Avg)),
      sector2: Math.max(...driverStats.map((s) => s!.sector2Avg)),
      sector3: Math.max(...driverStats.map((s) => s!.sector3Avg)),
    }

    return [
      {
        metric: "Speed",
        ...Object.fromEntries(
          driverStats.map((stat) => [
            stat!.driver.name_acronym,
            ((maxValues.speed - stat!.fastestLap) / maxValues.speed) * 100,
          ]),
        ),
      },
      {
        metric: "Consistency",
        ...Object.fromEntries(
          driverStats.map((stat) => [
            stat!.driver.name_acronym,
            ((maxValues.consistency - stat!.consistency) / maxValues.consistency) * 100,
          ]),
        ),
      },
      {
        metric: "Sector 1",
        ...Object.fromEntries(
          driverStats.map((stat) => [
            stat!.driver.name_acronym,
            ((maxValues.sector1 - stat!.sector1Avg) / maxValues.sector1) * 100,
          ]),
        ),
      },
      {
        metric: "Sector 2",
        ...Object.fromEntries(
          driverStats.map((stat) => [
            stat!.driver.name_acronym,
            ((maxValues.sector2 - stat!.sector2Avg) / maxValues.sector2) * 100,
          ]),
        ),
      },
      {
        metric: "Sector 3",
        ...Object.fromEntries(
          driverStats.map((stat) => [
            stat!.driver.name_acronym,
            ((maxValues.sector3 - stat!.sector3Avg) / maxValues.sector3) * 100,
          ]),
        ),
      },
    ]
  }, [driverStats])

  const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
  }

  const getDriverColor = (driverNumber: number) => {
    const driver = drivers.find((d) => d._id === driverNumber)
    return `#${driver?.team_color || "FF0000"}`
  }

  return (
    <div className="space-y-6">
      {/* Driver Selection */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Driver Comparison Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <label className="text-sm font-medium text-white/90 mb-2 block">Add Driver</label>
              <div className="flex gap-2">
                <Select value={selectedDriverToAdd} onValueChange={setSelectedDriverToAdd}>
                  <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers
                      .filter((driver) => !comparisonDrivers.includes(driver._id))
                      .map((driver) => (
                        <SelectItem key={driver._id} value={driver._id.toString()}>
                          {driver.full_name} - {driver.team_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedDriverToAdd && addDriverToComparison(selectedDriverToAdd)}
                  disabled={!selectedDriverToAdd || comparisonDrivers.length >= 4}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Drivers */}
          <div className="flex flex-wrap gap-2">
            {comparisonDrivers.map((driverNum) => {
              const driver = drivers.find((d) => d._id === driverNum)
              if (!driver) return null

              return (
                <Badge
                  key={driverNum}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 px-3 py-1"
                  style={{ borderColor: `#${driver.team_color}` }}
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: `#${driver.team_color}` }}></div>
                  {driver.full_name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-red-500"
                    onClick={() => removeDriverFromComparison(driverNum)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {comparisonDrivers.length > 0 && (
        <>
          {/* Lap Time Comparison Chart */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Lap Time Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="lap" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  {comparisonDrivers.map((driverNum) => {
                    const driver = drivers.find((d) => d._id === driverNum)
                    if (!driver) return null

                    return (
                      <Line
                        key={driverNum}
                        type="monotone"
                        dataKey={driver.name_acronym}
                        stroke={getDriverColor(driverNum)}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        name={driver.full_name}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "white", fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: "white", fontSize: 10 }} />
                  {comparisonDrivers.map((driverNum) => {
                    const driver = drivers.find((d) => d._id === driverNum)
                    if (!driver) return null

                    return (
                      <Radar
                        key={driverNum}
                        name={driver.full_name}
                        dataKey={driver.name_acronym}
                        stroke={getDriverColor(driverNum)}
                        fill={getDriverColor(driverNum)}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    )
                  })}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stats Comparison Table */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Detailed Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-3">Driver</th>
                      <th className="text-left p-3">Fastest Lap</th>
                      <th className="text-left p-3">Average Lap</th>
                      <th className="text-left p-3">Total Laps</th>
                      <th className="text-left p-3">Consistency</th>
                      <th className="text-left p-3">Avg S1</th>
                      <th className="text-left p-3">Avg S2</th>
                      <th className="text-left p-3">Avg S3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverStats.map((stat) => {
                      if (!stat) return null

                      return (
                        <tr key={stat.driver._id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: `#${stat.driver.team_color}` }}
                              ></div>
                              <span className="font-semibold">{stat.driver.full_name}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-yellow-400">{formatLapTime(stat.fastestLap)}</td>
                          <td className="p-3 font-mono">{formatLapTime(stat.averageLap)}</td>
                          <td className="p-3 font-bold">{stat.totalLaps}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                stat.consistency < 1 ? "default" : stat.consistency < 2 ? "secondary" : "destructive"
                              }
                            >
                              {stat.consistency < 1 ? "Excellent" : stat.consistency < 2 ? "Good" : "Poor"}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-sm">{stat.sector1Avg.toFixed(3)}</td>
                          <td className="p-3 font-mono text-sm">{stat.sector2Avg.toFixed(3)}</td>
                          <td className="p-3 font-mono text-sm">{stat.sector3Avg.toFixed(3)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {comparisonDrivers.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Drivers Selected</h3>
            <p className="text-white/60 mb-4">Add drivers to start comparing their performance</p>
            <Button
              onClick={() => drivers.length > 0 && addDriverToComparison(drivers[0]._id.toString())}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add First Driver
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
