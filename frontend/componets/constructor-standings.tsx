import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Constructor } from "@/lib/api"

interface ConstructorStandingsProps {
  constructors: Constructor[]
}

export function ConstructorStandings({ constructors }: ConstructorStandingsProps) {
  const maxPoints = Math.max(...constructors.map((c) => c.points))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Constructor Championship</span>
          <Badge variant="secondary">2024</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {constructors.map((constructor) => (
            <div key={constructor.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold">
                    {constructor.position}
                  </div>
                  <div className={`w-4 h-4 rounded ${constructor.color}`}></div>
                  <span className="font-medium">{constructor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{constructor.points}</span>
                </div>
              </div>
              <Progress value={(constructor.points / maxPoints) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
