"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Flag, Users, ArrowLeft, Car, Gauge, Zap, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { f1Api, type Session, type Meeting, type Position, type Lap } from "@/lib/api"

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  // State is now much simpler
  const [session, setSession] = useState<Session | null>(null)
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [fastestLaps, setFastestLaps] = useState<Lap[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return

      setLoading(true)
      setError(null)

      try {
        // --- HIGHLY EFFICIENT: ONE API CALL ---
        const details = await f1Api.getSessionDetails(sessionId);

        if (!details) {
          throw new Error(`Session not found (ID: ${sessionId})`)
        }
        
        // Set all state from the single response object
        setSession(details.session);
        setMeeting(details.meeting);
        setPositions(details.positions || []);
        setFastestLaps(details.fastest_laps || []);

      } catch (err: any) {
        console.error("Error fetching session data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [sessionId])

  const getSessionTypeIcon = (type: string | undefined) => {
    if (!type) return "🏁";
    const lowerType = type.toLowerCase();
    if (lowerType.includes("race")) return "🏆";
    if (lowerType.includes("qualifying")) return "⚡️";
    if (lowerType.includes("practice")) return "🔧";
    if (lowerType.includes("sprint")) return "🏃";
    return "🏁";
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Loading session details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-2">Session Not Found</h3>
            <p className="text-white/60 mb-4">{error || "The requested session could not be found."}</p>
            <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Button
        onClick={() => router.back()}
        variant="outline"
        className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="bg-gradient-to-r from-gray-900 via-purple-900/50 to-gray-900 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{getSessionTypeIcon(session.session_name)}</div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{session.session_name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/70">
                  {meeting && (
                    <Link href={`/meetings/${meeting._id}`} className="flex items-center gap-2 hover:underline">
                      <Flag className="w-4 h-4" />
                      <span>{meeting.meeting_name}</span>
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(session.date_start).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Session Type</CardTitle>
            <Car className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{session.session_type}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Drivers</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{positions.length}</div>
            <p className="text-xs text-white/60">Participating drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Laps</CardTitle>
            <Gauge className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{positions[0]?.laps_completed || 'N/A'}</div>
            <p className="text-xs text-white/60">Completed by leader</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Final Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto hide-scrollbar">
              {positions.map((driver) => (
                <div
                  key={driver.driver_number}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                >
                  <div className="w-6 text-center font-bold text-white/80">{driver.dnf ? 'DNF' : driver.position}</div>
                  <div className="w-2 h-4 rounded-sm" style={{ backgroundColor: `#${driver.team_color}` }}></div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{driver.full_name}</p>
                    <p className="text-xs text-white/60">{driver.team_name}</p>
                  </div>
                  {driver.dnf && (
                      <Badge variant="destructive">DNF</Badge>
                  )}
                  <div className="text-sm text-white/60">{driver.laps_completed} Laps</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-fuchsia-400" />
              Fastest Laps (by Driver)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto hide-scrollbar">
              {fastestLaps.map((lap, index) => (
                <div key={lap.driver_number} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-bold text-white/80">{index + 1}</div>
                    <div className="w-2 h-4 rounded-sm" style={{ backgroundColor: `#${lap.team_color}` }}></div>
                    <div>
                      <p className="text-white text-sm font-semibold">{lap.full_name}</p>
                      <p className="text-white/60 text-xs">{lap.team_name} - Lap {lap.lap_number}</p>
                    </div>
                  </div>
                  <span className="text-white font-mono">{lap.lap_duration.toFixed(3)}s</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
