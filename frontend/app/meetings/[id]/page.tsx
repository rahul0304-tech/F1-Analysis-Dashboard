"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Calendar, MapPin, Clock, Flag, Users, Timer, ArrowLeft, TestTube, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { f1Api, type Meeting, type Session, type Position } from "../../../lib/api"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

const CountryFlag = ({ countryCode, meetingName }: { countryCode: string; meetingName: string }) => {
  if (meetingName?.toLowerCase().includes('testing')) {
    return (
      <div className="w-10 h-[27px] flex items-center justify-center bg-gray-800 rounded-sm" title="Pre-Season Testing">
        <TestTube className="w-5 h-5 text-gray-400" />
      </div>
    );
  }
  const codeMapping: { [key: string]: string } = {
    UAE: "ae", AUS: "au", AUT: "at", AZE: "az", BHR: "bh", BEL: "be", BRA: "br",
    CAN: "ca", CHN: "cn", ESP: "es", FRA: "fr", GBR: "gb", HUN: "hu", ITA: "it",
    JPN: "jp", MCO: "mc", MEX: "mx", NED: "nl", QAT: "qa", SAU: "sa", SGP: "sg",
    USA: "us",
  };
  const isoCode = codeMapping[countryCode?.toUpperCase()];
  if (!isoCode) {
    return (
      <div className="w-10 h-[27px] flex items-center justify-center bg-gray-800 rounded-sm" title="Flag not available">
        <Flag className="w-5 h-5 text-gray-400" />
      </div>
    );
  }
  return <img src={`https://flagcdn.com/w40/${isoCode}.png`} width="40" alt={countryCode || 'Flag'} className="rounded-sm bg-gray-800" />;
};

const getSessionId = (session: any): string => {
    if (!session || !session._id) return `invalid-session-${Math.random()}`;
    if (typeof session._id === 'object' && session._id.$oid) return session._id.$oid;
    return session._id.toString();
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [winner, setWinner] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMeetingData = async () => {
      if (!meetingId) return
      setLoading(true)
      setError(null)
      try {
        const details = await f1Api.getMeetingDetails(meetingId);
        if (!details) throw new Error("Meeting not found.");
        
        setMeeting(details.meeting_details);
        setSessions(details.sessions || []);
        setWinner(details.winner || null);

      } catch (err: any) {
        setError(err.message || "Failed to fetch meeting data.");
        console.error("Error fetching meeting data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetingData()
  }, [meetingId])

  const getSessionTypeIcon = (sessionType: string) => {
    const lowerType = sessionType.toLowerCase();
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
            <p className="text-white">Loading meeting details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold text-white mb-2">Meeting Not Found</h3>
            <p className="text-white/60 mb-4">{error || "The requested meeting could not be found."}</p>
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
      <Button onClick={() => router.back()} variant="outline" className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Meetings
      </Button>
      <Card className="bg-gradient-to-r from-gray-900 via-red-900/50 to-gray-900 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <CountryFlag countryCode={meeting.country_code} meetingName={meeting.meeting_name} />
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{meeting.meeting_name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/70">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{meeting.location}, {meeting.country_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(meeting.date_start).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                {meeting.year}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Circuit</CardTitle>
            <Flag className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{meeting.circuit_short_name}</div>
            <p className="text-xs text-white/60">Circuit Key: {meeting.circuit_key}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Sessions</CardTitle>
            <Timer className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <p className="text-xs text-white/60">Available sessions</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => {
                const sessionId = getSessionId(session);
                return (
                  <Link
                    key={sessionId}
                    href={`/sessions/${sessionId}?meetingId=${meeting._id}`}
                    className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSessionTypeIcon(session.session_name)}</span>
                        <div>
                          <h3 className="font-semibold text-white">{session.session_name}</h3>
                          <p className="text-sm text-white/60">{session.session_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(session.date_start).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {winner && (
          <Card className="bg-white/5 backdrop-blur-md border-white/10 flex flex-col overflow-hidden"
            style={{
              backgroundImage: `url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 H50 V50 H0 Z M50 50 H100 V100 H50 Z" fill="%231a1a1a" fill-opacity="0.4" /></svg>')`,
              backgroundSize: '15px 15px',
            }}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Race Winner
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col md:flex-row items-center justify-center gap-8 p-6">
                <div className="relative">
                    <Avatar className="w-48 h-48 md:w-56 md:h-56 border-4 border-yellow-400 shadow-2xl">
                    <AvatarImage src={winner.headshot_url} alt={winner.full_name} className="object-cover"/>
                    <AvatarFallback className="text-5xl" style={{backgroundColor: `#${winner.team_color}`}}>
                        {winner.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                    </Avatar>
                    <Badge className="absolute bottom-2 right-2 bg-yellow-400 text-black font-bold text-lg px-3 py-1">P1</Badge>
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-4xl font-bold text-white tracking-tight">{winner.full_name}</h2>
                    <p className="text-xl text-white/80">{winner.team_name}</p>
                    <div className="w-24 h-1 mt-2 rounded-full mx-auto md:mx-0" style={{backgroundColor: `#${winner.team_color}`}}></div>
                    <p className="text-md text-white/60 mt-4">{winner.laps_completed} Laps Completed</p>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
