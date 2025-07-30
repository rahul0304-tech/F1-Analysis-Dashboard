import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Driver } from "@/lib/api"

interface DriverStandingsProps {
  drivers: Driver[]
}

export function DriverStandings({ drivers }: DriverStandingsProps) {
  const getNationalityFlag = (nationality: string) => {
    const flags: { [key: string]: string } = {
      Dutch: "🇳🇱",
      British: "🇬🇧",
      Monégasque: "🇲🇨",
      Australian: "🇦🇺",
      Spanish: "🇪🇸",
      Mexican: "🇲🇽",
      French: "🇫🇷",
      Japanese: "🇯🇵",
    }
    return flags[nationality] || "🏁"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Driver Championship</span>
          <Badge variant="secondary">2024</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                  {driver.position}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{driver.name}</span>
                    <span className="text-lg">{getNationalityFlag(driver.nationality)}</span>
                  </div>
                  <div className="text-sm text-gray-600">{driver.team}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{driver.points}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
