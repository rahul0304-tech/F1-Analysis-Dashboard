import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Zap, Flag } from "lucide-react"

const liveData = [
  {
    position: 1,
    driver: "M. Verstappen",
    team: "RBR",
    gap: "Leader",
    lastLap: "1:19.234",
    sector1: "23.456",
    sector2: "28.789",
    sector3: "27.123",
    speed: 342,
  },
  {
    position: 2,
    driver: "L. Norris",
    team: "MCL",
    gap: "+2.345",
    lastLap: "1:19.567",
    sector1: "23.567",
    sector2: "28.890",
    sector3: "27.234",
    speed: 340,
  },
  {
    position: 3,
    driver: "C. Leclerc",
    team: "FER",
    gap: "+5.678",
    lastLap: "1:19.789",
    sector1: "23.678",
    sector2: "28.901",
    sector3: "27.345",
    speed: 338,
  },
  {
    position: 4,
    driver: "O. Piastri",
    team: "MCL",
    gap: "+8.901",
    lastLap: "1:20.012",
    sector1: "23.789",
    sector2: "29.012",
    sector3: "27.456",
    speed: 336,
  },
  {
    position: 5,
    driver: "G. Russell",
    team: "MER",
    gap: "+12.234",
    lastLap: "1:20.345",
    sector1: "23.890",
    sector2: "29.123",
    sector3: "27.567",
    speed: 334,
  },
]

export function LiveTiming() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold">Live Timing</h2>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Practice Session
          </Badge>
        </div>
        <div className="text-sm text-gray-600">Last updated: 2 seconds ago</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Fastest Lap</span>
            </div>
            <div className="text-2xl font-bold">1:19.234</div>
            <div className="text-sm text-gray-600">M. Verstappen</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Top Speed</span>
            </div>
            <div className="text-2xl font-bold">342 km/h</div>
            <div className="text-sm text-gray-600">Speed trap</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Session Time</span>
            </div>
            <div className="text-2xl font-bold">45:23</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {liveData.map((driver) => (
              <div key={driver.position} className="grid grid-cols-12 gap-2 p-3 rounded-lg hover:bg-gray-50 text-sm">
                <div className="col-span-1 font-bold">{driver.position}</div>
                <div className="col-span-2 font-medium">{driver.driver}</div>
                <div className="col-span-1 text-gray-600">{driver.team}</div>
                <div className="col-span-1 font-mono">{driver.gap}</div>
                <div className="col-span-1 font-mono">{driver.lastLap}</div>
                <div className="col-span-1 font-mono text-green-600">{driver.sector1}</div>
                <div className="col-span-1 font-mono text-purple-600">{driver.sector2}</div>
                <div className="col-span-1 font-mono text-yellow-600">{driver.sector3}</div>
                <div className="col-span-1 font-mono">{driver.speed}</div>
                <div className="col-span-2">
                  <Progress value={Math.random() * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
