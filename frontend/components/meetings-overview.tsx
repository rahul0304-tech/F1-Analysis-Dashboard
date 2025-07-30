import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"
import type { Meeting } from "@/lib/api"

interface MeetingsOverviewProps {
  meetings: Meeting[]
  selectedMeeting: Meeting | null
}

export function MeetingsOverview({ meetings, selectedMeeting }: MeetingsOverviewProps) {
  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      AE: "🇦🇪",
      AU: "🇦🇺",
      AT: "🇦🇹",
      AZ: "🇦🇿",
      BH: "🇧🇭",
      BE: "🇧🇪",
      BR: "🇧🇷",
      CA: "🇨🇦",
      CN: "🇨🇳",
      ES: "🇪🇸",
      FR: "🇫🇷",
      GB: "🇬🇧",
      HU: "🇭🇺",
      IT: "🇮🇹",
      JP: "🇯🇵",
      MC: "🇲🇨",
      MX: "🇲🇽",
      NL: "🇳🇱",
      QA: "🇶🇦",
      SA: "🇸🇦",
      SG: "🇸🇬",
      US: "🇺🇸",
    }
    return flags[countryCode] || "🏁"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Selected Meeting Details */}
      {selectedMeeting && (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{getCountryFlag(selectedMeeting.country_code)}</div>
                <div>
                  <CardTitle className="text-2xl">{selectedMeeting.meeting_official_name}</CardTitle>
                  <p className="text-lg text-gray-600">{selectedMeeting.circuit_short_name}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white">
                Round {selectedMeeting.meeting_key}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>
                  {selectedMeeting.location}, {selectedMeeting.country_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(selectedMeeting.date_start)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>GMT {selectedMeeting.gmt_offset}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((meeting) => (
          <Card
            key={meeting.meeting_key}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMeeting?.meeting_key === meeting.meeting_key
                ? "ring-2 ring-red-500 bg-red-50"
                : "hover:bg-gray-50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{getCountryFlag(meeting.country_code)}</div>
                <Badge variant="outline" className="text-xs">
                  {meeting.year}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">{meeting.meeting_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{meeting.circuit_short_name}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{meeting.location}</span>
                <span>{formatDate(meeting.date_start)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
