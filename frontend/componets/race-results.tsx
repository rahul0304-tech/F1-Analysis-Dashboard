import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const latestRace = {
  name: "Brazilian Grand Prix",
  date: "November 3, 2024",
  circuit: "Interlagos",
  results: [
    { position: 1, driver: "Max Verstappen", team: "Red Bull Racing", time: "2:06:54.430", points: 25, flag: "🇳🇱" },
    { position: 2, driver: "Esteban Ocon", team: "Alpine", time: "+19.477", points: 18, flag: "🇫🇷" },
    { position: 3, driver: "Pierre Gasly", team: "Alpine", time: "+22.532", points: 15, flag: "🇫🇷" },
    { position: 4, driver: "George Russell", team: "Mercedes", time: "+23.265", points: 12, flag: "🇬🇧" },
    { position: 5, driver: "Charles Leclerc", team: "Ferrari", time: "+30.177", points: 10, flag: "🇲🇨" },
    { position: 6, driver: "Lando Norris", team: "McLaren", time: "+31.372", points: 8, flag: "🇬🇧" },
    { position: 7, driver: "Yuki Tsunoda", team: "RB", time: "+42.056", points: 6, flag: "🇯🇵" },
    { position: 8, driver: "Oscar Piastri", team: "McLaren", time: "+44.943", points: 4, flag: "🇦🇺" },
  ],
}

const upcomingRaces = [
  { name: "Las Vegas Grand Prix", date: "November 23, 2024", circuit: "Las Vegas Street Circuit", status: "upcoming" },
  { name: "Qatar Grand Prix", date: "December 1, 2024", circuit: "Lusail International Circuit", status: "upcoming" },
  { name: "Abu Dhabi Grand Prix", date: "December 8, 2024", circuit: "Yas Marina Circuit", status: "upcoming" },
]

export function RaceResults() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="latest" className="w-full">
        <TabsList>
          <TabsTrigger value="latest">Latest Results</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Races</TabsTrigger>
        </TabsList>

        <TabsContent value="latest">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{latestRace.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {latestRace.circuit} • {latestRace.date}
                  </p>
                </div>
                <Badge>Completed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {latestRace.results.map((result) => (
                  <div
                    key={result.position}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          result.position === 1
                            ? "bg-yellow-100 text-yellow-800"
                            : result.position === 2
                              ? "bg-gray-100 text-gray-800"
                              : result.position === 3
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {result.position}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.driver}</span>
                          <span className="text-lg">{result.flag}</span>
                        </div>
                        <div className="text-sm text-gray-600">{result.team}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{result.time}</div>
                      <div className="text-xs text-gray-600">{result.points} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            {upcomingRaces.map((race, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{race.name}</h3>
                      <p className="text-sm text-muted-foreground">{race.circuit}</p>
                      <p className="text-sm text-muted-foreground">{race.date}</p>
                    </div>
                    <Badge variant="outline">Upcoming</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
