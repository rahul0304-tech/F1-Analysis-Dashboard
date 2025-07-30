import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"

const races = [
  {
    round: 19,
    name: "Las Vegas Grand Prix",
    date: "November 23, 2024",
    circuit: "Las Vegas Street Circuit",
    country: "🇺🇸 United States",
    status: "upcoming",
    sessions: {
      practice1: "Nov 22, 02:30",
      practice2: "Nov 22, 06:00",
      practice3: "Nov 23, 02:30",
      qualifying: "Nov 23, 06:00",
      race: "Nov 24, 06:00",
    },
  },
  {
    round: 20,
    name: "Qatar Grand Prix",
    date: "December 1, 2024",
    circuit: "Lusail International Circuit",
    country: "🇶🇦 Qatar",
    status: "upcoming",
    sessions: {
      practice1: "Nov 29, 14:30",
      sprint: "Nov 30, 14:00",
      qualifying: "Nov 30, 18:00",
      race: "Dec 1, 17:00",
    },
  },
  {
    round: 21,
    name: "Abu Dhabi Grand Prix",
    date: "December 8, 2024",
    circuit: "Yas Marina Circuit",
    country: "🇦🇪 UAE",
    status: "upcoming",
    sessions: {
      practice1: "Dec 6, 13:30",
      practice2: "Dec 6, 17:00",
      practice3: "Dec 7, 14:30",
      qualifying: "Dec 7, 18:00",
      race: "Dec 8, 17:00",
    },
  },
]

export function RaceCalendar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            2024 Race Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {races.map((race) => (
              <div key={race.round} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Round {race.round}</Badge>
                      <Badge variant={race.status === "upcoming" ? "default" : "secondary"}>{race.status}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{race.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {race.circuit}
                      </div>
                      <span>{race.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{race.date}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  {Object.entries(race.sessions).map(([session, time]) => (
                    <div key={session} className="bg-gray-100 rounded p-2">
                      <div className="font-medium capitalize">{session.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
