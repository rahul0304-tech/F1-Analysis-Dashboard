"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Users, Trophy, Search, X } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { f1Api, type Driver, type DriverStats } from "@/lib/api"

// --- Helper Components ---
const CountryFlag = ({ countryCode }: { countryCode: string }) => {
    const flags: { [key: string]: string } = {
      NED: "🇳🇱", GBR: "🇬🇧", MON: "🇲🇨", AUS: "🇦🇺", ESP: "🇪🇸", MEX: "🇲🇽", 
      FRA: "🇫�", JPN: "🇯🇵", GER: "🇩🇪", CAN: "🇨🇦", FIN: "🇫🇮", DEN: "🇩🇰", 
      THA: "🇹🇭", CHN: "🇨🇳", ITA: "🇮🇹", SUI: "🇨🇭", USA: "🇺🇸",
    }
    return <span className="text-2xl">{flags[countryCode] || "🏁"}</span>
};

const DriverStatsPopup = ({ driver, open, onOpenChange }: { driver: Driver | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [stats, setStats] = useState<DriverStats | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (driver && open) {
            const fetchStats = async () => {
                setLoading(true);
                const fetchedStats = await f1Api.getDriverStats(driver._id);
                setStats(fetchedStats);
                setLoading(false);
            };
            fetchStats();
        }
    }, [driver, open]);

    if (!driver) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900/80 backdrop-blur-lg border-white/20 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 border-2" style={{borderColor: `#${driver.team_colour}`}}>
                            <AvatarImage src={driver.headshot_url} alt={driver.full_name} />
                            {/* FIX: Safely access first/last name for initials */}
                            <AvatarFallback>{driver.first_name?.[0] || ''}{driver.last_name?.[0] || ''}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-3xl font-bold">{driver.full_name}</DialogTitle>
                            <DialogDescription className="text-white/70">{driver.team_name}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4">
                    <h3 className="text-lg font-semibold mb-4">Career Statistics</h3>
                    {loading ? (
                         <div className="flex items-center justify-center h-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                         </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white/5 p-4">
                                <CardHeader className="p-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-white/80">Grand Prix Wins</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <p className="text-4xl font-bold">{stats?.grand_prix_victories ?? 0}</p>
                                </CardContent>
                            </Card>
                             <Card className="bg-white/5 p-4">
                                <CardHeader className="p-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-white/80">Championships</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                     <p className="text-4xl font-bold">{stats?.championships_won ?? 0}</p>
                                     <p className="text-xs text-white/60">(Placeholder)</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- Main Page Component ---
export default function DriversPage() {
  // Local state for this page only
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  
  // State for the popup
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fetch all drivers when the component mounts
  useEffect(() => {
    const fetchAllDrivers = async () => {
      setLoading(true);
      const driversData = await f1Api.getAllDrivers();
      setAllDrivers(driversData || []);
      setLoading(false);
    };
    fetchAllDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    let filtered = allDrivers;
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedTeam !== "all") {
      filtered = filtered.filter(driver => driver.team_name === selectedTeam);
    }
    return filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [allDrivers, searchTerm, selectedTeam]);

  const availableTeams = useMemo(() => 
    Array.from(new Set(allDrivers.map(d => d.team_name))).sort()
  , [allDrivers]);

  const handleDriverClick = (driver: Driver) => {
      setSelectedDriver(driver);
      setIsPopupOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Loading Driver Directory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DriverStatsPopup driver={selectedDriver} open={isPopupOpen} onOpenChange={setIsPopupOpen} />
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white">F1 Driver Directory</h1>
        <p className="text-lg text-gray-400">Explore all Formula 1 drivers.</p>
      </header>

      <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by driver name..."
              className="pl-10 bg-gray-900/50 border-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full md:w-[240px] bg-gray-900/50 border-white/20">
              <SelectValue placeholder="Filter by Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {availableTeams.map((team) => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredDrivers.map((driver) => (
          <button key={driver._id} onClick={() => handleDriverClick(driver)} className="w-full text-left">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 h-full hover:border-red-500/50 transition-all group">
              <CardHeader className="text-center p-4">
                <div className="relative w-24 h-24 mx-auto">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={driver.headshot_url} alt={driver.full_name} />
                        {/* FIX: Safely access first/last name for initials */}
                        <AvatarFallback className="text-white font-bold text-2xl" style={{ backgroundColor: `#${driver.team_colour}` }}>
                            {driver.first_name?.[0] || ''}{driver.last_name?.[0] || ''}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1">
                        <CountryFlag countryCode={driver.country_code} />
                    </div>
                </div>
              </CardHeader>
              <CardContent className="text-center p-4 pt-0">
                <p className="font-bold text-white truncate group-hover:text-red-400 transition-colors">{driver.full_name}</p>
                <p className="text-sm text-white/60 truncate">{driver.team_name}</p>
                <div className="w-1/2 h-1 rounded-full mt-2 mx-auto" style={{ backgroundColor: `#${driver.team_colour}` }}></div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {filteredDrivers.length === 0 && !loading && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Drivers Found</h3>
            <p className="text-white/60">Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
