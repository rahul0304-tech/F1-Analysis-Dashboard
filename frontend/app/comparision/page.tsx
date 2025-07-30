"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Button } from "../../components/ui/button"
import * as Lucide from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useF1Data } from "../../hooks/use-f1-data"
import { 
  f1Api, 
  type Driver, 
  type Meeting, 
  type Session,
  type ComparisonLapsResponse,
  type ComparisonLap
} from "@/lib/api"
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, type ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- Type Definitions ---
interface ComparisonColumn {
    id: string;
    driver: Driver | null;
    year: number | null;
    meetingKey: number | null;
    sessionKey: number | null;
}

interface CalculatedStats {
    columnId: string;
    fastestLap: number | null;
    averageLap: number | null;
    consistency: number | null; // Standard Deviation
}

// --- Helper Functions & Components ---
const formatLapTime = (seconds: number | null) => {
    if (seconds === null) return "N/A";
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = (seconds % 60).toFixed(3)
    return `${minutes}:${remainingSeconds.padStart(6, "0")}`
}

const DraggableDriver = ({ driver }: { driver: Driver }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: driver._id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="flex items-center gap-2 p-2 bg-white/10 rounded-lg cursor-grab active:cursor-grabbing">
      <Avatar className="w-8 h-8"><AvatarImage src={driver.headshot_url} /><AvatarFallback>{driver.full_name.slice(0,1)}</AvatarFallback></Avatar>
      <p className="text-sm font-semibold text-white truncate">{driver.full_name}</p>
    </div>
  );
};

// --- Main Page Component ---
export default function ComparisonPage() {
  const { allDrivers, meetings, loading: initialLoading } = useF1Data();
  
  const [columns, setColumns] = useState<ComparisonColumn[]>([
    { id: crypto.randomUUID(), driver: null, year: null, meetingKey: null, sessionKey: null }
  ]);
  const [comparisonData, setComparisonData] = useState<ComparisonLapsResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [chartType, setChartType] = useState<'lap_time' | 'sector_1' | 'sector_2' | 'sector_3'>('lap_time');

  const addColumn = () => {
    if (columns.length < 4) {
      setColumns(prev => [...prev, { id: crypto.randomUUID(), driver: null, year: null, meetingKey: null, sessionKey: null }]);
    }
  };

  const removeColumn = (id: string) => {
    if (columns.length === 1) {
        setColumns([{ id: crypto.randomUUID(), driver: null, year: null, meetingKey: null, sessionKey: null }]);
    } else {
        setColumns(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateColumn = (id: string, updates: Partial<ComparisonColumn>) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const driverId = event.active.id as number;
    const columnId = event.over?.id as string;
    if (columnId && columnId.startsWith('slot-')) {
      const targetColumnId = columnId.replace('slot-', '');
      const driver = allDrivers.find(d => d._id === driverId);
      if (driver) {
        updateColumn(targetColumnId, { driver });
        const isLastColumn = columns[columns.length - 1].id === targetColumnId;
        if (isLastColumn && columns.length < 4) {
          addColumn();
        }
      }
    }
  };

  const handleCompare = async () => {
    const validColumns = columns.filter(c => c.driver && c.sessionKey);
    if (validColumns.length === 0) return;
    setIsComparing(true);
    setComparisonData(null);
    const payload = validColumns.map(c => ({
        id: c.id,
        driverNumber: c.driver!._id,
        sessionKey: c.sessionKey!
    }));
    const data = await f1Api.getComparisonLaps(payload);
    setComparisonData(data);
    setIsComparing(false);
  };

  const calculatedStats = useMemo((): CalculatedStats[] | null => {
    if (!comparisonData) return null;
    return comparisonData.map(colData => {
        const laps = colData.laps.filter(l => l.lap_duration).map(l => l.lap_duration);
        if (laps.length === 0) {
            return { columnId: colData.columnId, fastestLap: null, averageLap: null, consistency: null };
        }
        const fastestLap = Math.min(...laps);
        const averageLap = laps.reduce((sum, l) => sum + l, 0) / laps.length;
        
        // Calculate standard deviation for consistency
        const mean = averageLap;
        const variance = laps.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / laps.length;
        const consistency = Math.sqrt(variance);

        return { columnId: colData.columnId, fastestLap, averageLap, consistency };
    });
  }, [comparisonData]);

  const bestOverallFastestLap = useMemo(() => {
    if (!calculatedStats) return null;
    return Math.min(...calculatedStats.map(s => s.fastestLap || Infinity).filter(l => l !== Infinity));
  }, [calculatedStats]);

  const mostConsistent = useMemo(() => {
    if (!calculatedStats) return null;
    return Math.min(...calculatedStats.map(s => s.consistency || Infinity).filter(c => c !== Infinity));
  }, [calculatedStats]);

  const chartOptions: ChartOptions<'line'> = {
    maintainAspectRatio: false, responsive: true,
    scales: {
        y: { ticks: { color: 'white' }, grid: { color: '#ffffff20' } },
        x: { ticks: { color: 'white' }, grid: { color: '#ffffff20' }, title: { display: true, text: 'Lap Number', color: 'white' } }
    },
    plugins: {
        legend: { labels: { color: 'white' } },
        tooltip: { callbacks: { label: (context) => `${context.dataset.label || ''}: ${context.parsed.y !== null ? context.parsed.y.toFixed(3) + 's' : 'N/A'}` } }
    }
  };

  const chartData = useMemo(() => {
    if (!comparisonData) return { labels: [], datasets: [] };
    const allLaps = comparisonData.flatMap(c => c.laps);
    const maxLaps = Math.max(0, ...allLaps.map(l => l.lap_number));
    const labels = Array.from({ length: maxLaps }, (_, i) => i + 1);
    return {
        labels,
        datasets: comparisonData.map(colData => {
            const column = columns.find(c => c.id === colData.columnId);
            if (!column || !column.driver) return {};
            const data = labels.map(lapNum => {
                const lap = colData.laps.find(l => l.lap_number === lapNum);
                if (!lap) return null;
                switch(chartType) {
                    case 'lap_time': return lap.lap_duration;
                    case 'sector_1': return lap.sector_1_time;
                    case 'sector_2': return lap.sector_2_time;
                    case 'sector_3': return lap.sector_3_time;
                    default: return null;
                }
            });
            return {
                label: `${column.driver.full_name} (${column.year})`,
                data: data,
                borderColor: `#${column.driver.team_colour}`,
                backgroundColor: `#${column.driver.team_colour}80`,
                tension: 0.2,
            };
        })
    };
  }, [comparisonData, columns, chartType]);

  if (initialLoading) return <div className="text-center p-8 text-white">Loading initial data...</div>

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tactical Comparison</h1>
          <p className="text-xl text-gray-300">Build your own comparison of lap and sector times.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 lg:col-span-1">
            <CardHeader><CardTitle className="text-white">Driver Pool</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {allDrivers.map(driver => <DraggableDriver key={driver._id} driver={driver} />)}
            </CardContent>
          </Card>
          <div className="lg:col-span-2 space-y-4">
            {columns.map((col) => 
                <ComparisonColumn key={col.id} column={col} onUpdate={updateColumn} onRemove={removeColumn} meetings={meetings} />
            )}
          </div>
        </div>
        
        <Card className="bg-white/5 backdrop-blur-md border-white/10 mb-8">
            <CardHeader><CardTitle className="text-white">Analyze</CardTitle></CardHeader>
            <CardContent className="flex justify-end">
                <Button onClick={handleCompare} disabled={isComparing || columns.filter(c => c.driver && c.sessionKey).length < 1} size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold">
                {isComparing ? <><Lucide.Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Run Comparison'}
                </Button>
            </CardContent>
        </Card>

        {comparisonData && calculatedStats && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
                <Card className="lg:col-span-4 bg-white/5 backdrop-blur-md border-white/10">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-white">Lap & Sector Analysis</CardTitle>
                            <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
                                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lap_time">Lap Times</SelectItem>
                                    <SelectItem value="sector_1">Sector 1</SelectItem>
                                    <SelectItem value="sector_2">Sector 2</SelectItem>
                                    <SelectItem value="sector_3">Sector 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="h-96"><Line data={chartData} options={chartOptions} /></CardContent>
                </Card>

                <StatCard title="Fastest Lap" icon={Lucide.Zap}>
                    {calculatedStats.map(stat => {
                        const column = columns.find(c => c.id === stat.columnId);
                        const isBest = stat.fastestLap === bestOverallFastestLap;
                        return (
                            <div key={stat.columnId}>
                                <p className="text-sm text-white/70">{column?.driver?.full_name}</p>
                                <p className={`text-2xl font-bold font-mono ${isBest ? 'text-purple-400' : 'text-white'}`}>{formatLapTime(stat.fastestLap)}</p>
                            </div>
                        );
                    })}
                </StatCard>
                <StatCard title="Average Lap" icon={Lucide.Timer}>
                     {calculatedStats.map(stat => {
                        const column = columns.find(c => c.id === stat.columnId);
                        return (
                            <div key={stat.columnId}>
                                <p className="text-sm text-white/70">{column?.driver?.full_name}</p>
                                <p className="text-2xl font-bold font-mono text-white">{formatLapTime(stat.averageLap)}</p>
                            </div>
                        );
                    })}
                </StatCard>
                 <StatCard title="Lap Time Consistency" icon={Lucide.Gauge}>
                     {calculatedStats.map(stat => {
                        const column = columns.find(c => c.id === stat.columnId);
                        const isBest = stat.consistency === mostConsistent;
                        return (
                            <div key={stat.columnId}>
                                <p className="text-sm text-white/70">{column?.driver?.full_name}</p>
                                <p className={`text-2xl font-bold font-mono ${isBest ? 'text-green-400' : 'text-white'}`}>
                                    {stat.consistency?.toFixed(3)}
                                    <span className="text-sm">s</span>
                                </p>
                            </div>
                        );
                    })}
                </StatCard>
            </div>
        )}
      </div>
    </DndContext>
  )
}

// --- Sub-components ---
function ComparisonColumn({ column, onUpdate, onRemove, meetings }: { column: ComparisonColumn, onUpdate: (id: string, updates: Partial<ComparisonColumn>) => void, onRemove: (id: string) => void, meetings: Meeting[] }) {
    const { isOver, setNodeRef } = useDroppable({ id: `slot-${column.id}` });
    const [sessions, setSessions] = useState<Session[]>([]);
    const availableYears = useMemo(() => Array.from(new Set(meetings.map(m => m.year))).sort((a, b) => b - a), [meetings]);
    const meetingsForYear = useMemo(() => meetings.filter(m => m.year === column.year), [meetings, column.year]);

    useEffect(() => {
        if (column.meetingKey) {
            const fetchSessions = async () => {
                const sessionData = await f1Api.getSessions(column.meetingKey!);
                setSessions(sessionData || []);
            };
            fetchSessions();
        } else {
            setSessions([]);
        }
    }, [column.meetingKey]);

    const handleUpdate = (field: keyof ComparisonColumn, value: any) => {
        const updates: Partial<ComparisonColumn> = { [field]: value };
        if (field === 'driver') { updates.year = null; updates.meetingKey = null; updates.sessionKey = null; }
        if (field === 'year') { updates.meetingKey = null; updates.sessionKey = null; }
        if (field === 'meetingKey') { updates.sessionKey = null; }
        onUpdate(column.id, updates);
    };

    return (
        <Card ref={setNodeRef} className={`relative p-4 rounded-lg border-2 bg-white/5 backdrop-blur-md ${isOver ? 'border-blue-400 bg-blue-500/20' : 'border-white/20'} transition-colors`}>
            <Button onClick={() => onRemove(column.id)} variant="ghost" size="sm" className="absolute top-2 right-2 w-6 h-6 p-0 z-10 text-white/50 hover:text-white">&times;</Button>
            {!column.driver ? (
                <div className="text-center text-white/50 h-24 flex flex-col justify-center items-center">
                    <Lucide.Plus className="mx-auto w-8 h-8 mb-2" />
                    <p>Drag a driver here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center justify-center">
                        <Avatar className="w-16 h-16 mb-2"><AvatarImage src={column.driver.headshot_url} /><AvatarFallback style={{backgroundColor: `#${column.driver.team_colour}`}}>{column.driver.full_name.split(' ').map(n=>n[0])}</AvatarFallback></Avatar>
                        <p className="text-md font-bold text-white text-center">{column.driver.full_name}</p>
                    </div>
                    <div className="w-full">
                        <label className="text-xs text-white/70">Year</label>
                        <Select value={column.year?.toString()} onValueChange={v => handleUpdate('year', Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>{availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="w-full">
                        <label className="text-xs text-white/70">Meeting</label>
                        <Select disabled={!column.year} value={column.meetingKey?.toString()} onValueChange={v => handleUpdate('meetingKey', Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Meeting" /></SelectTrigger>
                            <SelectContent>{meetingsForYear.map(m => <SelectItem key={m._id} value={m._id.toString()}>{m.meeting_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="w-full">
                        <label className="text-xs text-white/70">Session</label>
                        <Select disabled={!column.meetingKey} value={column.sessionKey?.toString()} onValueChange={v => handleUpdate('sessionKey', Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
                            <SelectContent>{sessions.map(s => <SelectItem key={s._id} value={s._id.toString()}>{s.session_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </Card>
    );
}

function StatCard({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) {
    return (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Icon className="w-5 h-5" /> {title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                {children}
            </CardContent>
        </Card>
    );
}
