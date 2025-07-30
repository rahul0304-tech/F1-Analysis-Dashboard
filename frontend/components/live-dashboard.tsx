"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Activity, Timer, TrendingUp, Users, Flag } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import type { Meeting, Session, Lap, Driver } from "@/lib/api"
import { F1Car3D } from "./f1-car-3d"

interface LiveDashboardProps {
  meetings: Meeting[]
  selectedMeeting: Meeting | null
  sessions: Session[]
  selectedSession: Session | null
  laps: Lap[]
  drivers: Driver[]
  apiStatus: string
}

export function LiveDashboard({
  meetings,
  selectedMeeting,
  sessions,
  selectedSession,
  laps,
  drivers,
  apiStatus,
}: LiveDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [liveData, setLiveData] = useState<any[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const realtimeStats = useMemo(() => {
    if (!laps.length) return []

    const last10Laps = laps.slice(-10).map((lap, index) => ({
      lap: lap.lap_number,
      time: lap.lap_duration,
      driver: drivers.find((d) => d._id === lap.driver_number)?.full_name || `Driver ${lap.driver_number}`,
      sector1: lap.sector_1_time,
      sector2: lap.sector_2_time,
      sector3: lap.sector_3_time,
      timestamp: index,
    }))

    return last10Laps
  }, [laps, drivers])

  const fastestCurrentLap = useMemo(() => {
    if (!laps.length) return null
    return laps.reduce((fastest, current) => (current.lap_duration < fastest.lap_duration ? current : fastest))
  }, [laps])

  const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Live Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-red-600 to-red-800 text-white border-0 col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Activity className="w-6 h-6 animate-pulse" />
                  Live Session Monitor
                </CardTitle>
                <p className="text-red-100">Real-time F1 data streaming</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold">{currentTime.toLocaleTimeString()}</div>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  {apiStatus === "ok" ? "🟢 LIVE" : "🔴 OFFLINE"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedMeeting && selectedSession && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-red-200 text-sm">Current Event</p>
                  <p className="text-xl font-bold">{selectedMeeting.meeting_name}</p>
                  <p className="text-red-200">{selectedMeeting.location}</p>
                </div>
                <div>
                  <p className="text-red-200 text-sm">Active Session</p>
                  <p className="text-xl font-bold">{selectedSession.session_name}</p>
                  <p className="text-red-200">{selectedSession.session_type}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Fastest Lap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fastestCurrentLap ? (
              <div className="space-y-2">
                <div className="text-3xl font-mono font-bold">{formatLapTime(fastestCurrentLap.lap_duration)}</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: `#${drivers.find((d) => d._id === fastestCurrentLap.driver_number)?.team_color}`,
                    }}
                  ></div>
                  <span className="font-semibold">
                    {drivers.find((d) => d._id === fastestCurrentLap.driver_number)?.full_name ||
                      `Driver ${fastestCurrentLap.driver_number}`}
                  </span>
                </div>
                <div className="text-sm text-yellow-100">Lap {fastestCurrentLap.lap_number}</div>
              </div>
            ) : (
              <div className="text-center text-yellow-200">No lap data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Timing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Lap Chart */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Lap Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={realtimeStats}>
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
                <Area type="monotone" dataKey="time" stroke="#ff6b6b" fill="url(#colorGradient)" strokeWidth={3} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Driver Position Grid */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Current Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {drivers.map((driver, index) => {
                const driverLaps = laps.filter((lap) => lap.driver_number === driver._id)
                const lastLap = driverLaps[driverLaps.length - 1]

                return (
                  <div
                    key={driver._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `#${driver.team_color}` }}></div>
                      <div>
                        <p className="text-white font-semibold">{driver.full_name}</p>
                        <p className="text-white/60 text-sm">{driver.team_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono">{lastLap ? formatLapTime(lastLap.lap_duration) : "--:--"}</p>
                      <p className="text-white/60 text-sm">{driverLaps.length} laps</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D Car Showcase */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Team Showcase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from(new Set(drivers.map((d) => d.team_name)))
              .slice(0, 6)
              .map((teamName, index) => {
                const teamDriver = drivers.find((d) => d.team_name === teamName)
                return (
                  <div
                    key={teamName}
                    className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <F1Car3D teamColor={`#${teamDriver?.team_color || "FF0000"}`} size={80} animate={true} />
                    <p className="text-white text-sm font-semibold mt-2">{teamName}</p>
                    <p className="text-white/60 text-xs">
                      {drivers.filter((d) => d.team_name === teamName).length} drivers
                    </p>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Session Progress */}
      {selectedSession && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Session Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-white">
                <span>Session: {selectedSession.session_name}</span>
                <span>Status: Active</span>
              </div>
              <Progress value={75} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{laps.length}</p>
                  <p className="text-white/60 text-sm">Total Laps</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{drivers.length}</p>
                  <p className="text-white/60 text-sm">Active Drivers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {Math.round((new Date().getTime() - new Date(selectedSession.date_start).getTime()) / 60000)}
                  </p>
                  <p className="text-white/60 text-sm">Minutes Elapsed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
