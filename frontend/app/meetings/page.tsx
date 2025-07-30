"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Search, Filter, TestTube, Flag } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useF1Data } from "@/hooks/use-f1-data" // Using the updated hook
import { type Meeting } from "@/lib/api"
import Link from "next/link"

// --- Helper function to get a reliable, unique string ID from a meeting object ---
const getMeetingId = (meeting: any): string => {
  if (!meeting || !meeting._id) {
    return `invalid-meeting-${Math.random()}`;
  }
  if (typeof meeting._id === 'object' && meeting._id.$oid) {
    return meeting._id.$oid;
  }
  return meeting._id.toString();
}

// --- Helper function to get a country flag image URL ---
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

  return (
    <img
      src={`https://flagcdn.com/w40/${isoCode}.png`}
      width="40"
      alt={countryCode || 'Flag'}
      className="rounded-sm bg-gray-800"
    />
  );
};

export default function MeetingsPage() {
  const { meetings, loading } = useF1Data(); // Get the clean meetings list from the hook
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("all")

  const filteredMeetings = useMemo(() => {
    let filtered = meetings // This list is already unique and sorted

    if (searchTerm) {
      filtered = filtered.filter(
        (meeting) =>
          meeting.meeting_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.country_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter((meeting) => meeting.year.toString() === selectedYear)
    }

    return filtered; // No need for extra de-duplication or sorting here
  }, [meetings, searchTerm, selectedYear])

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(meetings.map((m) => m.year))).sort((a, b) => b - a)
    return years
  }, [meetings])

  if (loading && meetings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Loading meetings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">F1 Meetings</h1>
        <p className="text-xl text-gray-300">Browse all Formula 1 race weekends</p>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Search Meetings</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  placeholder="Search by name, location, or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">Filter by Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-white">
                <p className="text-sm text-white/60">Results</p>
                <p className="text-2xl font-bold">{filteredMeetings.length}</p>
                <p className="text-xs text-white/60">meetings found</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeetings.map((meeting) => {
            const meetingId = getMeetingId(meeting);
            return (
              <Link key={meetingId} href={`/meetings/${meetingId}`}>
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CountryFlag countryCode={meeting.country_code} meetingName={meeting.meeting_name} />
                      <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                        {meeting.year}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-xl pt-2">{meeting.meeting_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-white/80">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{meeting.location}, {meeting.country_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(meeting.date_start).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
        })}
      </div>

      {filteredMeetings.length === 0 && !loading && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="text-center py-12">
            <Filter className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Meetings Found</h3>
            <p className="text-white/60">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
