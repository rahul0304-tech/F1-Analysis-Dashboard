"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  Timer,
  Flag,
  TrendingUp,
  Activity,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { useF1Data } from "@/hooks/use-f1-data"
import { useMemo } from "react"

export default function OverviewPage() {
  const { meetings, loading, apiStatus, seasonStats } = useF1Data()

  // Helper function to get a reliable, unique string ID from a meeting object
  const getMeetingId = (meeting: any): string => {
    if (!meeting || !meeting._id) {
      return `invalid-meeting-${Math.random()}`
    }
    if (typeof meeting._id === "object" && meeting._id.$oid) {
      return meeting._id.$oid
    }
    return meeting._id.toString()
  }

  // De-duplicate the meetings array
  const uniqueMeetings = useMemo(() => {
    const seen = new Set<string>()
    return meetings.filter((meeting) => {
      const id = getMeetingId(meeting)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }, [meetings])

  if (loading && meetings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Loading F1 data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          F1 Analysis Dashboard
        </h1>
        <p className="text-xl text-gray-300">
          Comprehensive Formula 1 data analysis and insights
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Badge className={apiStatus === "Connected" ? "bg-green-500" : "bg-red-500"}>
            API Status: {apiStatus}
          </Badge>
          <Badge className="bg-white/10 text-white border-white/20">
            {meetings.length} Total Meetings
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-blue-200">Race weekends analyzed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions This Season</CardTitle>
            <Flag className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seasonStats.total_sessions}</div>
            <p className="text-xs text-green-200">In {seasonStats.year}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers This Season</CardTitle>
            <Users className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seasonStats.total_drivers}</div>
            <p className="text-xs text-purple-200">In {seasonStats.year}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Source</CardTitle>
            <Activity className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OpenF1</div>
            <p className="text-xs text-orange-200">Post-session historical data</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Meetings */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uniqueMeetings.slice(0, 5).map((meeting) => {
                const meetingId = getMeetingId(meeting)
                return (
                  <Link
                    key={meetingId}
                    href={`/meetings/${meetingId}`}
                    className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          {meeting.meeting_name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {meeting.location}, {meeting.country_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-white/10 text-white border-white/20">
                          {meeting.year}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/meetings"
                className="p-4 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition-all border border-blue-500/30 flex items-center gap-3"
              >
                <Calendar className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Browse Meetings</h3>
                  <p className="text-sm text-gray-400">Explore all race weekends</p>
                </div>
              </Link>
              <Link
                href="/drivers"
                className="p-4 rounded-lg bg-green-600/20 hover:bg-green-600/30 transition-all border border-green-500/30 flex items-center gap-3"
              >
                <Users className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white">Driver Analysis</h3>
                  <p className="text-sm text-gray-400">Compare driver performance</p>
                </div>
              </Link>
              <Link
                href="/laps"
                className="p-4 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 transition-all border border-purple-500/30 flex items-center gap-3"
              >
                <Timer className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Lap Times</h3>
                  <p className="text-sm text-gray-400">Detailed timing analysis</p>
                </div>
              </Link>
              <Link
                href="/records"
                className="p-4 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 transition-all border border-yellow-500/30 flex items-center gap-3"
              >
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-white">Records & Stats</h3>
                  <p className="text-sm text-gray-400">Track records and achievements</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
