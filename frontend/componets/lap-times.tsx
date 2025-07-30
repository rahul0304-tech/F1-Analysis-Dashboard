"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Timer, TrendingUp, Award, Zap, Download } from "lucide-react"
import { useState, useMemo } from "react"
import type { Lap, Driver, Session } from "@/lib/api"

interface LapTimesProps {
  laps: Lap[]
  drivers: Driver[]
  selectedSession: Session | null
  searchTerm: string
}

export function LapTimes({ laps, drivers, selectedSession, searchTerm }: LapTimesProps) {
  const [selectedDriver, setSelectedDriver] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart")
  const [sortBy, setSortBy] = useState<"lap_number" | "lap_time" | "sector_total">("lap_number")

  const filteredDrivers = useMemo(() => {
    return drivers.filter(
      (driver) =>
        driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.team_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [drivers, searchTerm])

  const processedLapData = useMemo(() => {
    if (!laps.length) return []

    let filteredLaps = laps.filter((lap) => lap.lap_duration > 0)

    // Filter by selected driver
    if (selectedDriver !== "all") {
      filteredLaps = filteredLaps.filter((lap) => lap.driver_number.toString() === selectedDriver)
    }

    // Filter by search term
    if (searchTerm) {
      const searchDriverNumbers = filteredDrivers.map((d) => d._id)
      filteredLaps = filteredLaps.filter((lap) => searchDriverNumbers.includes(lap.driver_number))
    }

    const processed = filteredLaps.map((lap) => ({
      ...lap,
      lap_time_seconds: lap.lap_duration,
      sector_total: (lap.sector_1_time || 0) + (lap.sector_2_time || 0) + (lap.sector_3_time || 0),
    }))

    // Sort data
    return processed.sort((a, b) => {
      switch (sortBy) {
        case "lap_time":
          return a.lap_time_seconds - b.lap_time_seconds
        case "sector_total":
          return a.sector_total - b.sector_total
        default:
          return a.lap_number - b.lap_number
      }
    })
  }, [laps, selectedDriver, searchTerm, filteredDrivers, sortBy])

  const fastestLap = useMemo(() => {
    if (!processedLapData.length) return null
    return processedLapData.reduce((fastest, current) =>
      current.lap_time_seconds < fastest.lap_time_seconds ? current : fastest,
    )
  }, [processedLapData])

  const averageLapTime = useMemo(() => {
    if (!processedLapData.length) return 0
    const total = processedLapData.reduce((sum, lap) => sum + lap.lap_time_seconds, 0)
    return total / processedLapData.length
  }, [processedLapData])

  const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
  }

  const getDriverColor = (driverNumber: number) => {
    const driver = drivers.find((d) => d._id === driverNumber)
    return driver?.team_color ? `#${driver.team_color}` : "#666666"
  }

  const chartData = processedLapData.map((lap) => ({
    lap: lap.lap_number,
    time: lap.lap_time_seconds,
    driver: drivers.find((d) => d._id === lap.driver_number)?.full_name || `Driver ${lap.driver_number}`,
    sector1: lap.sector_1_time,
    sector2: lap.sector_2_time,
    sector3: lap.sector_3_time,
  }))

  const exportData = () => {
    const csvContent = [
      ["Lap", "Driver", "Lap Time", "Sector 1", "Sector 2", "Sector 3", "Pit Out", "Stint", "Tyre Compound"],
      ...processedLapData.map((lap) => [
        lap.lap_number,
        drivers.find((d) => d._id === lap.driver_number)?.full_name || `Driver ${lap.driver_number}`,
        formatLapTime(lap.lap_time_seconds),
        lap.sector_1_time?.toFixed(3) || "",
        lap.sector_2_time?.toFixed(3) || "",
        lap.sector_3_time?.toFixed(3) || "",
        lap.is_pit_out_lap ? "Yes" : "No",
        lap.stint,
        lap.tyre_compound,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lap-times-${selectedSession?.session_name || "session"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Driver Filter</label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers ({filteredDrivers.length})</SelectItem>
                  {filteredDrivers.map((driver) => (
                    <SelectItem key={driver._id} value={driver._id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `#${driver.team_color}` }}
                        ></div>
                        {driver.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: "chart" | "table") => setViewMode(value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chart">📊 Chart View</SelectItem>
                  <SelectItem value="table">📋 Table View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Sort By</label>
              <Select
                value={sortBy}
                onValueChange={(value: "lap_number" | "lap_time" | "sector_total") => setSortBy(value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lap_number">Lap Number</SelectItem>
                  <SelectItem value="lap_time">Lap Time</SelectItem>
                  <SelectItem value="sector_total">Sector Total</SelectItem>
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

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Session</label>
              {selectedSession && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/20 text-blue-200 border-blue-300/30 w-full justify-center py-2"
                >
                  {selectedSession.session_name}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fastest Lap</CardTitle>
            <Award className="h-5 w-5 text-yellow-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {fastestLap ? formatLapTime(fastestLap.lap_time_seconds) : "--:--"}
            </div>
            <p className="text-xs text-yellow-200">
              {fastestLap
                ? drivers.find((d) => d._id === fastestLap.driver_number)?.full_name ||
                  `Driver ${fastestLap.driver_number}`
                : "No data"}
            </p>
            {fastestLap && (
              <div className="mt-2 flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getDriverColor(fastestLap.driver_number) }}
                ></div>
                <span className="text-xs text-yellow-200">Lap {fastestLap.lap_number}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Lap</CardTitle>
            <Timer className="h-5 w-5 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {averageLapTime ? formatLapTime(averageLapTime) : "--:--"}
            </div>
            <p className="text-xs text-blue-200">Across {processedLapData.length} laps</p>
            <div className="mt-2">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: "65%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laps</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedLapData.length}</div>
            <p className="text-xs text-green-200">{selectedDriver === "all" ? "All drivers" : "Selected driver"}</p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(processedLapData.length / 10)) }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-green-300 rounded-full"></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers Active</CardTitle>
            <Zap className="h-5 w-5 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDrivers.length}</div>
            <p className="text-xs text-purple-200">In current filter</p>
            <div className="mt-2 flex -space-x-1">
              {filteredDrivers.slice(0, 4).map((driver, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `#${driver.team_color}` }}
                >
                  {driver.name_acronym}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === "chart" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Lap Times Chart */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Lap Times Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="lap" stroke="rgba(255,255,255,0.7)" />
                  <YAxis
                    domain={["dataMin - 5", "dataMax + 5"]}
                    tickFormatter={(value) => formatLapTime(value)}
                    stroke="rgba(255,255,255,0.7)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    formatter={(value: number) => [formatLapTime(value), "Lap Time"]}
                    labelFormatter={(label) => `Lap ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="time"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#dc2626" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Enhanced Sector Times Chart */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Sector Times Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData.slice(-15)}>
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
                  <Bar dataKey="sector1" stackId="a" fill="#3b82f6" name="Sector 1" />
                  <Bar dataKey="sector2" stackId="a" fill="#10b981" name="Sector 2" />
                  <Bar dataKey="sector3" stackId="a" fill="#f59e0b" name="Sector 3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Enhanced Table View */
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Detailed Lap Times</span>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {processedLapData.length} laps
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3 text-white">Lap</th>
                    <th className="text-left p-3 text-white">Driver</th>
                    <th className="text-left p-3 text-white">Lap Time</th>
                    <th className="text-left p-3 text-white">Sector 1</th>
                    <th className="text-left p-3 text-white">Sector 2</th>
                    <th className="text-left p-3 text-white">Sector 3</th>
                    <th className="text-left p-3 text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processedLapData.slice(0, 50).map((lap, index) => (
                    <tr
                      key={`${lap.driver_number}-${lap.lap_number}`}
                      className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                        lap === fastestLap ? "bg-yellow-500/10" : ""
                      }`}
                    >
                      <td className="p-3 font-mono text-white font-bold">{lap.lap_number}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getDriverColor(lap.driver_number) }}
                          ></div>
                          <span className="text-white font-medium">
                            {drivers.find((d) => d._id === lap.driver_number)?.full_name ||
                              `Driver ${lap.driver_number}`}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`p-3 font-mono font-bold ${lap === fastestLap ? "text-yellow-400" : "text-white"}`}
                      >
                        {formatLapTime(lap.lap_time_seconds)}
                        {lap === fastestLap && <span className="ml-2 text-yellow-400">🏆</span>}
                      </td>
                      <td className="p-3 font-mono text-green-400">{lap.sector_1_time?.toFixed(3) || "--"}</td>
                      <td className="p-3 font-mono text-purple-400">{lap.sector_2_time?.toFixed(3) || "--"}</td>
                      <td className="p-3 font-mono text-yellow-400">{lap.sector_3_time?.toFixed(3) || "--"}</td>
                      <td className="p-3">
                        {lap.is_pit_out_lap && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-orange-500/20 text-orange-200 border-orange-300/30"
                          >
                            Pit Out
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processedLapData.length > 50 && (
              <div className="text-center mt-4">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  Showing first 50 of {processedLapData.length} laps
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
