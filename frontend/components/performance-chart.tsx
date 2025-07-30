"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const performanceData = [
  { race: "Bahrain", verstappen: 25, norris: 8, leclerc: 12, piastri: 10 },
  { race: "Saudi Arabia", verstappen: 18, norris: 15, leclerc: 25, piastri: 4 },
  { race: "Australia", verstappen: 0, norris: 25, leclerc: 6, piastri: 18 },
  { race: "Japan", verstappen: 25, norris: 18, leclerc: 8, piastri: 15 },
  { race: "China", verstappen: 25, norris: 18, leclerc: 4, piastri: 15 },
  { race: "Miami", verstappen: 18, norris: 25, leclerc: 15, piastri: 12 },
  { race: "Imola", verstappen: 25, norris: 18, leclerc: 6, piastri: 15 },
  { race: "Monaco", verstappen: 6, norris: 18, leclerc: 25, piastri: 15 },
]

const teamPerformance = [
  { team: "McLaren", wins: 8, podiums: 16, points: 648 },
  { team: "Ferrari", wins: 5, podiums: 12, points: 615 },
  { team: "Red Bull", wins: 9, podiums: 11, points: 581 },
  { team: "Mercedes", wins: 3, podiums: 8, points: 351 },
]

export function PerformanceChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="race" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="verstappen" stroke="#1f77b4" strokeWidth={2} name="Verstappen" />
              <Line type="monotone" dataKey="norris" stroke="#ff7f0e" strokeWidth={2} name="Norris" />
              <Line type="monotone" dataKey="leclerc" stroke="#d62728" strokeWidth={2} name="Leclerc" />
              <Line type="monotone" dataKey="piastri" stroke="#2ca02c" strokeWidth={2} name="Piastri" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="wins" fill="#8884d8" name="Wins" />
              <Bar dataKey="podiums" fill="#82ca9d" name="Podiums" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
