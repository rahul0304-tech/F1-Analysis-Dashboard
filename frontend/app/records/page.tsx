"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Trophy, Crown, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { f1Api, type RecordsResponse } from "../../lib/api"
import Link from "next/link"

const formatLapTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
}

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    const fetchYears = async () => {
        const yearsData = await f1Api.getAvailableYears();
        if (yearsData) {
            const yearStrings = yearsData.map(y => y.toString());
            setAvailableYears(yearStrings);
            if (yearStrings.length > 0) {
                setSelectedYear(yearStrings[0]); // Set the most recent year as default
            }
        }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    const fetchRecords = async () => {
      setLoading(true);
      const recordsData = await f1Api.getRecords(Number(selectedYear));
      setRecords(recordsData);
      setLoading(false);
    };
    fetchRecords();
  }, [selectedYear]);

  if (loading && !records) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Calculating Season Records...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-4xl font-bold text-white">Season Records</h1>
            <p className="text-lg text-gray-400">Key achievements for the selected season.</p>
        </div>
        <div className="w-full md:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-[180px] bg-gray-900/50 border-white/20">
                    <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                    {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </header>

      {!records ? (
         <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardContent className="text-center py-12">
                <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Records Found</h3>
                <p className="text-white/60">Could not calculate records for the selected season.</p>
            </CardContent>
         </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Season Champion Card (Large) */}
            <Card className="lg:col-span-2 bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-yellow-400 flex items-center gap-2 text-2xl">
                        <Crown className="w-8 h-8" />
                        {records.year} World Champion
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-8 p-6">
                    {records.season_champion ? (
                        <>
                            <Avatar className="w-40 h-40 border-4 border-yellow-400">
                                <AvatarImage src={records.season_champion.driver_info.headshot_url} />
                                <AvatarFallback>{records.season_champion.driver_info.first_name?.[0] || ''}{records.season_champion.driver_info.last_name?.[0] || ''}</AvatarFallback>
                            </Avatar>
                            <div className="text-center md:text-left">
                                <h3 className="text-4xl font-bold text-white">{records.season_champion.driver_info.full_name}</h3>
                                <p className="text-xl text-white/70">{records.season_champion.driver_info.team_name}</p>
                                <p className="text-5xl font-bold text-yellow-400 mt-2">{records.season_champion.total_points} PTS</p>
                            </div>
                        </>
                    ) : <p className="text-white/60 text-center w-full">Data not available</p>}
                </CardContent>
            </Card>

            {/* Most Wins Card (Small) */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        Most Wins
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-6">
                    {records.most_wins ? (
                        <>
                            <Avatar className="w-24 h-24 mx-auto border-4 border-blue-400">
                                <AvatarImage src={records.most_wins.driver_info.headshot_url} />
                                <AvatarFallback>{records.most_wins.driver_info.first_name?.[0] || ''}{records.most_wins.driver_info.last_name?.[0] || ''}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold text-white mt-3">{records.most_wins.driver_info.full_name}</h3>
                            <p className="text-white/70 text-sm">{records.most_wins.driver_info.team_name}</p>
                            <p className="text-3xl font-bold text-blue-400 mt-2">{records.most_wins.wins} WINS</p>
                        </>
                    ) : <p className="text-white/60">Data not available</p>}
                </CardContent>
            </Card>

            {/* Fastest Lap Card (Full Width) */}
            <Card className="lg:col-span-3 bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-purple-400 flex items-center gap-2 text-2xl">
                        <Zap className="w-8 h-8" />
                        Fastest Lap of the Season
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-8 p-6">
                    {records.fastest_lap ? (
                        <>
                            <Avatar className="w-40 h-40 border-4 border-purple-400">
                                <AvatarImage src={records.fastest_lap.driver_info.headshot_url} />
                                <AvatarFallback>{records.fastest_lap.driver_info.first_name?.[0] || ''}{records.fastest_lap.driver_info.last_name?.[0] || ''}</AvatarFallback>
                            </Avatar>
                            <div className="text-center md:text-left">
                                <p className="text-5xl font-bold text-purple-400 font-mono">{formatLapTime(records.fastest_lap.lap_duration)}</p>
                                <h3 className="text-3xl font-bold text-white mt-2">{records.fastest_lap.driver_info.full_name}</h3>
                                <Link href={`/meetings/${records.fastest_lap.meeting_info._id}`} className="text-lg text-white/70 hover:underline mt-1 block">
                                    at the {records.fastest_lap.meeting_info.meeting_name}
                                </Link>
                            </div>
                        </>
                    ) : <p className="text-white/60 text-center w-full">Data not available</p>}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  )
}
