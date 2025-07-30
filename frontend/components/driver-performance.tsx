"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Timer, Target, Users, Award } from "lucide-react"
import { useMemo, useState } from "react"
import type { Driver, Lap, Session } from "@/lib/api"

interface DriverPerformanceProps {
  drivers: Driver[]
  laps: Lap[]
  selectedSession: Session | null
  searchTerm: string
}

export function DriverPerformance({ drivers, laps, selectedSession, searchTerm }: DriverPerformanceProps) {
  const [sortBy, setSortBy] = useState<"fastest" | "average" | "consistency" | "laps">("fastest")
  const [showTeamView, setShowTeamView] = useState(false)

  const filteredDrivers = useMemo(() => {
    return drivers.filter(
      (driver) =>
        driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.name_acronym.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [drivers, searchTerm])

  const driverStats = useMemo(() => {
    if (!selectedSession) return []
    const sessionLaps = laps.filter((lap) => lap.session_key === selectedSession._id)

    return filteredDrivers
      .map((driver) => {
        const driverLaps = sessionLaps.filter((lap) => lap.driver_number === driver._id)
        const validLaps = driverLaps.filter((lap) => lap.lap_duration > 0)

        if (validLaps.length === 0) {
          return {
            ...driver,
            totalLaps: 0,
            fastestLap: null,
            averageLap: 0,
            consistency: 0,
            pitStops: 0,
            sector1Best: 0,
            sector2Best: 0,
            sector3Best: 0,
          }
        }

        const fastestLap = validLaps.reduce((fastest, current) =>
          current.lap_duration < fastest.lap_duration ? current : fastest,
        )

        const averageLap = validLaps.reduce((sum, lap) => sum + lap.lap_duration, 0) / validLaps.length

        const variance =
          validLaps.reduce((sum, lap) => sum + Math.pow(lap.lap_duration - averageLap, 2), 0) / validLaps.length
        const consistency = Math.sqrt(variance)

        const pitStops = driverLaps.filter((lap) => lap.is_pit_out_lap).length

        const sector1Best = Math.min(...validLaps.filter((l) => l.sector_1_time > 0).map((l) => l.sector_1_time))
        const sector2Best = Math.min(...validLaps.filter((l) => l.sector_2_time > 0).map((l) => l.sector_2_time))
        const sector3Best = Math.min(...validLaps.filter((l) => l.sector_3_time > 0).map((l) => l.sector_3_time))

        return {
          ...driver,
          totalLaps: validLaps.length,
          fastestLap,
          averageLap,
          consistency,
          pitStops,
          sector1Best: isFinite(sector1Best) ? sector1Best : 0,
          sector2Best: isFinite(sector2Best) ? sector2Best : 0,
          sector3Best: isFinite(sector3Best) ? sector3Best : 0,
        }
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "average":
            return a.averageLap - b.averageLap
          case "consistency":
            return a.consistency - b.consistency
          case "laps":
            return b.totalLaps - a.totalLaps
          default: // fastest
            if (a.fastestLap && b.fastestLap) {
              return a.fastestLap.lap_duration - b.fastestLap.lap_duration
            }
            return b.totalLaps - a.totalLaps
        }
      })
  }, [filteredDrivers, laps, sortBy, selectedSession])

  const teamStats = useMemo(() => {
    const teams = Array.from(new Set(filteredDrivers.map((d) => d.team_name)))
    return teams
      .map((teamName) => {
        const teamDrivers = driverStats.filter((d) => d.team_name === teamName)
        const totalLaps = teamDrivers.reduce((sum, d) => sum + d.totalLaps, 0)
        const bestLap = teamDrivers
          .filter((d) => d.fastestLap)
          .reduce(
            (best, current) =>
              !best || (current.fastestLap && current.fastestLap.lap_duration < best.fastestLap!.lap_duration)
                ? current
                : best,
            null as (typeof teamDrivers)[0] | null,
          )

        const avgConsistency = teamDrivers.reduce((sum, d) => sum + d.consistency, 0) / teamDrivers.length

        return {
          teamName,
          drivers: teamDrivers,
          totalLaps,
          bestLap,
          avgConsistency,
          teamColor: teamDrivers[0]?.team_color,
        }
      })
      .sort((a, b) => {
        if (a.bestLap && b.bestLap) {
          return a.bestLap.fastestLap!.lap_duration - b.bestLap.fastestLap!.lap_duration
        }
        return b.totalLaps - a.totalLaps
      })
  }, [driverStats, filteredDrivers])

  const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
  }

  const getConsistencyRating = (consistency: number) => {
    if (consistency < 1) return { rating: "Excellent", color: "text-green-400", bg: "bg-green-500/20" }
    if (consistency < 2) return { rating: "Good", color: "text-blue-400", bg: "bg-blue-500/20" }
    if (consistency < 3) return { rating: "Average", color: "text-yellow-400", bg: "bg-yellow-500/20" }
    return { rating: "Poor", color: "text-red-400", bg: "bg-red-500/20" }
  }

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      NED: "🇳🇱",
      GBR: "🇬🇧",
      MON: "🇲🇨",
      AUS: "🇦🇺",
      ESP: "🇪🇸",
      MEX: "🇲🇽",
      FRA: "🇫🇷",
      JPN: "🇯🇵",
      GER: "🇩🇪",
      CAN: "🇨🇦",
      FIN: "🇫🇮",
      DEN: "🇩🇰",
      THA: "🇹🇭",
      CHN: "🇨🇳",
      ITA: "🇮🇹",
      SUI: "🇨🇭",
      USA: "🇺🇸",
    }
    return flags[countryCode] || "🏁"
  }

  const topPerformers = useMemo(() => {
    const fastest = driverStats.find((d) => d.fastestLap)
    const mostLaps = driverStats.reduce(
      (max, current) => (current.totalLaps > max.totalLaps ? current : max),
      driverStats[0],
    )
    const mostConsistent = driverStats
      .filter((d) => d.totalLaps > 5)
      .reduce(
        (best, current) => (current.consistency < best.consistency ? current : best),
        driverStats.filter((d) => d.totalLaps > 5)[0],
      )

    return { fastest, mostLaps, mostConsistent }
  }, [driverStats])

  return (
    <div className="space-y-6">
      {/* Session Header with Search Results */}
      {selectedSession && (
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedSession.session_name}</h2>
                <p className="text-white/80">Driver Performance Analysis</p>
                {searchTerm && (
                  <Badge variant="outline" className="mt-2 bg-white/10 text-white border-white/20">
                    Filtered: "{searchTerm}" ({filteredDrivers.length} drivers)
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-400">{filteredDrivers.length}</div>
                <p className="text-white/60">Active Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-sm">Sort by:</span>
                {["fastest", "average", "consistency", "laps"].map((option) => (
                  <Button
                    key={option}
                    variant={sortBy === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option as any)}
                    className={
                      sortBy === option ? "bg-blue-600" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    }
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showTeamView ? "outline" : "default"}
                size="sm"
                onClick={() => setShowTeamView(false)}
                className={!showTeamView ? "bg-blue-600" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}
              >
                <Users className="w-4 h-4 mr-1" />
                Drivers
              </Button>
              <Button
                variant={showTeamView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTeamView(true)}
                className={showTeamView ? "bg-blue-600" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}
              >
                <Target className="w-4 h-4 mr-1" />
                Teams
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Fastest Lap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.fastest?.fastestLap ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback
                    className="text-white font-bold"
                    style={{ backgroundColor: `#${topPerformers.fastest.team_color}` }}
                  >
                    {topPerformers.fastest.name_acronym}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{topPerformers.fastest.full_name}</p>
                  <p className="text-3xl font-mono font-bold">
                    {formatLapTime(topPerformers.fastest.fastestLap.lap_duration)}
                  </p>
                  <p className="text-yellow-200 text-sm">{topPerformers.fastest.team_name}</p>
                </div>
              </div>
            ) : (
              <p className="text-yellow-200">No lap data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Most Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.mostLaps && (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback
                    className="text-white font-bold"
                    style={{ backgroundColor: `#${topPerformers.mostLaps.team_color}` }}
                  >
                    {topPerformers.mostLaps.name_acronym}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{topPerformers.mostLaps.full_name}</p>
                  <p className="text-3xl font-bold">{topPerformers.mostLaps.totalLaps}</p>
                  <p className="text-blue-200 text-sm">Laps completed</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Most Consistent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.mostConsistent && (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback
                    className="text-white font-bold"
                    style={{ backgroundColor: `#${topPerformers.mostConsistent.team_color}` }}
                  >
                    {topPerformers.mostConsistent.name_acronym}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{topPerformers.mostConsistent.full_name}</p>
                  <p className="text-2xl font-bold">
                    {getConsistencyRating(topPerformers.mostConsistent.consistency).rating}
                  </p>
                  <p className="text-green-200 text-sm">Lap consistency</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {showTeamView ? (
        /* Team Performance View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamStats.map((team) => (
            <Card key={team.teamName} className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `#${team.teamColor}` }}></div>
                  {team.teamName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{team.drivers.length}</p>
                      <p className="text-white/60 text-sm">Drivers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{team.totalLaps}</p>
                      <p className="text-white/60 text-sm">Total Laps</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {team.bestLap?.fastestLap ? formatLapTime(team.bestLap.fastestLap.lap_duration) : "--:--"}
                      </p>
                      <p className="text-white/60 text-sm">Best Lap</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {team.drivers.map((driver) => (
                      <div key={driver._id} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(driver.country_code)}</span>
                          <span className="text-white font-medium">{driver.full_name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-mono text-sm">
                            {driver.fastestLap ? formatLapTime(driver.fastestLap.lap_duration) : "--:--"}
                          </p>
                          <p className="text-white/60 text-xs">{driver.totalLaps} laps</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Driver Performance Table */
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Complete Driver Analysis</span>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {driverStats.length} drivers
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {driverStats.map((driver, index) => (
                <div
                  key={driver._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold w-10 text-center ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                            ? "text-gray-300"
                            : index === 2
                              ? "text-orange-400"
                              : "text-white/60"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <Avatar className="w-14 h-14">
                      <AvatarFallback
                        className="text-white font-bold text-lg"
                        style={{ backgroundColor: `#${driver.team_color}` }}
                      >
                        {driver.name_acronym}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-white">{driver.full_name}</span>
                        <span className="text-2xl">{getCountryFlag(driver.country_code)}</span>
                        {index < 3 && (
                          <Award
                            className={`w-5 h-5 ${
                              index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : "text-orange-400"
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-white/70">{driver.team_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-6 text-center">
                    <div>
                      <p className="text-white/60 text-sm">Fastest Lap</p>
                      <p className={`font-mono font-bold ${index === 0 ? "text-yellow-400" : "text-white"}`}>
                        {driver.fastestLap ? formatLapTime(driver.fastestLap.lap_duration) : "--:--"}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Average</p>
                      <p className="font-mono text-white">
                        {driver.averageLap > 0 ? formatLapTime(driver.averageLap) : "--:--"}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Laps</p>
                      <p className="font-bold text-lg text-white">{driver.totalLaps}</p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Consistency</p>
                      <Badge
                        variant="outline"
                        className={`${getConsistencyRating(driver.consistency).bg} ${getConsistencyRating(driver.consistency).color} border-white/20`}
                      >
                        {getConsistencyRating(driver.consistency).rating}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm">Best Sectors</p>
                      <div className="text-xs space-y-1">
                        <div className="text-green-400">
                          S1: {driver.sector1Best > 0 ? driver.sector1Best.toFixed(3) : "--"}
                        </div>
                        <div className="text-purple-400">
                          S2: {driver.sector2Best > 0 ? driver.sector2Best.toFixed(3) : "--"}
                        </div>
                        <div className="text-yellow-400">
                          S3: {driver.sector3Best > 0 ? driver.sector3Best.toFixed(3) : "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
