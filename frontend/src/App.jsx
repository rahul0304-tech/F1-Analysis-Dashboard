import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components we will use
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Configuration ---
// IMPORTANT: Replace this with your live Render URL
const API_BASE_URL = 'https://f1-backend-deployment.onrender.com/api';

// --- Helper Components ---
const Loader = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-f1Black text-f1LightGray p-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-f1Red"></div>
    <p className="ml-4 text-xl mt-4">{message}</p>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-f1Black text-f1Red p-4">
    <p className="text-2xl font-bold mb-4">An Error Occurred</p>
    <p className="text-lg text-center bg-f1Gray p-4 rounded-lg">{message}</p>
    <p className="mt-4 text-f1LightGray">Please check if the backend service is running correctly on Render.</p>
  </div>
);

const App = () => {
  // --- State Management ---
  const [meetings, setMeetings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [laps, setLaps] = useState([]);

  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDrivers, setSelectedDrivers] = useState([]);

  const [loading, setLoading] = useState('Loading meetings...');
  const [error, setError] = useState(null);

  // --- Data Fetching Effects ---

  // Effect 1: Fetch all meetings on initial component mount
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setError(null);
        const response = await fetch(`${API_BASE_URL}/meetings`);
        if (!response.ok) throw new Error(`Failed to fetch meetings. Status: ${response.status}`);
        const data = await response.json();
        setMeetings(data);
        if (data.length > 0) {
          setSelectedMeeting(String(data[0]._id)); // Select the most recent meeting by default
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(null);
      }
    };
    fetchMeetings();
  }, []);

  // Effect 2: Fetch sessions when a meeting is selected
  useEffect(() => {
    if (!selectedMeeting) return;

    const fetchSessions = async () => {
      setLoading('Loading sessions...');
      setError(null);
      setSessions([]); // Clear previous sessions
      setDrivers([]);   // Clear previous drivers
      setLaps([]);      // Clear previous laps
      setSelectedSession('');
      setSelectedDrivers([]);
      
      try {
        const response = await fetch(`${API_BASE_URL}/sessions?meeting_key=${selectedMeeting}`);
        if (!response.ok) throw new Error(`Failed to fetch sessions. Status: ${response.status}`);
        const data = await response.json();
        setSessions(data);
        if (data.length > 0) {
          // Default to the first session (usually Race or latest session)
          setSelectedSession(String(data[0]._id));
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(null);
      }
    };
    fetchSessions();
  }, [selectedMeeting]);

  // Effect 3: Fetch drivers and laps when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    const fetchSessionData = async () => {
      setLoading('Loading session data...');
      setError(null);
      setDrivers([]);
      setLaps([]);
      setSelectedDrivers([]);

      try {
        // Fetch both drivers and laps in parallel for efficiency
        const [driversRes, lapsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/drivers?session_key=${selectedSession}`),
          fetch(`${API_BASE_URL}/laps?session_key=${selectedSession}`)
        ]);

        if (!driversRes.ok) throw new Error(`Failed to fetch drivers. Status: ${driversRes.status}`);
        if (!lapsRes.ok) throw new Error(`Failed to fetch laps. Status: ${lapsRes.status}`);

        const driversData = await driversRes.json();
        const lapsData = await lapsRes.json();

        setDrivers(driversData);
        setLaps(lapsData);

        // Auto-select top 2 drivers by default for a cleaner initial chart
        if (driversData.length > 0) {
          setSelectedDrivers(driversData.slice(0, 2).map(d => d._id));
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(null);
      }
    };
    fetchSessionData();
  }, [selectedSession]);

  // --- Memoized Chart Data ---
  const chartData = useMemo(() => {
    const allLapNumbers = Array.from(new Set(laps.map(lap => lap.lap_number))).sort((a, b) => a - b);

    return {
      labels: allLapNumbers,
      datasets: drivers
        .filter(driver => selectedDrivers.includes(driver._id))
        .map(driver => {
          const driverLaps = laps.filter(lap => lap.driver_number === driver._id);
          return {
            label: driver.full_name,
            data: allLapNumbers.map(lapNum => {
              const lap = driverLaps.find(l => l.lap_number === lapNum);
              return lap ? lap.lap_duration : null;
            }),
            borderColor: `#${driver.team_color}` || '#FFFFFF',
            backgroundColor: `#${driver.team_color}80`, // Add some transparency
            tension: 0.2,
            pointRadius: 2,
            pointHoverRadius: 6,
            borderWidth: 2,
            spanGaps: true, // Connect lines even with null data points
          };
        }),
    };
  }, [laps, drivers, selectedDrivers]);

  // --- Chart Options ---
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#F0F0F0', font: { size: 14 } } },
      title: { display: true, text: 'Lap Time Comparison', color: '#FFFFFF', font: { size: 20, weight: 'bold' } },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              const totalSeconds = context.parsed.y;
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = (totalSeconds % 60).toFixed(3);
              label += `${minutes}:${seconds.padStart(6, '0')}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Lap Number', color: '#A0A0A0' },
        ticks: { color: '#A0A0A0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        title: { display: true, text: 'Lap Time', color: '#A0A0A0' },
        ticks: {
          color: '#A0A0A0',
          callback: (value) => {
            const totalSeconds = Number(value);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = (totalSeconds % 60).toFixed(0);
            return `${minutes}:${seconds.padStart(2, '0')}`;
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };
  
  // --- Event Handlers ---
  const handleDriverToggle = (driverId) => {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        // Limit selection to a max of 8 drivers for readability
        : prev.length < 8 ? [...prev, driverId] : prev
    );
  };

  // --- Render Logic ---
  if (loading) return <Loader message={loading} />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="min-h-screen bg-f1Black text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-f1Red tracking-tight">F1 Dashboard</h1>
        <p className="text-f1LightGray text-lg mt-1">Post-Session Lap Analysis</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* --- Controls Column --- */}
        <aside className="lg:col-span-3 bg-f1Gray p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 border-b-2 border-f1Red pb-2">Controls</h2>
          
          {/* Meeting Selector */}
          <div className="mb-6">
            <label htmlFor="meeting-select" className="block text-sm font-medium text-f1LightGray mb-2">Grand Prix</label>
            <select
              id="meeting-select"
              value={selectedMeeting}
              onChange={(e) => setSelectedMeeting(e.target.value)}
              className="w-full bg-f1Black border-2 border-gray-600 rounded-lg p-2 focus:border-f1Red focus:ring-f1Red transition"
            >
              {meetings.map(m => <option key={m._id} value={m._id}>{m.year} - {m.meeting_name}</option>)}
            </select>
          </div>

          {/* Session Selector */}
          <div className="mb-6">
            <label htmlFor="session-select" className="block text-sm font-medium text-f1LightGray mb-2">Session</label>
            <select
              id="session-select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              disabled={!sessions.length}
              className="w-full bg-f1Black border-2 border-gray-600 rounded-lg p-2 focus:border-f1Red focus:ring-f1Red transition"
            >
              {sessions.map(s => <option key={s._id} value={s._id}>{s.session_name}</option>)}
            </select>
          </div>

          {/* Driver Selector */}
          <div>
            <label className="block text-sm font-medium text-f1LightGray mb-2">Compare Drivers</label>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {drivers.map(driver => (
                <button
                  key={driver._id}
                  onClick={() => handleDriverToggle(driver._id)}
                  className={`w-full text-left p-2 rounded-lg transition-all duration-200 text-sm font-bold flex items-center
                    ${selectedDrivers.includes(driver._id) ? 'text-white shadow-md' : 'bg-f1Black text-f1LightGray hover:bg-gray-700'}`
                  }
                  style={{ backgroundColor: selectedDrivers.includes(driver._id) ? `#${driver.team_color}` : undefined }}
                >
                  <div 
                    className="w-2 h-5 rounded-sm mr-3"
                    style={{ backgroundColor: `#${driver.team_color}` }}
                  ></div>
                  {driver.full_name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* --- Chart Column --- */}
        <section className="lg:col-span-9 bg-f1Gray p-6 rounded-xl shadow-lg">
          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px]">
            {laps.length > 0 && selectedDrivers.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-f1LightGray">
                <p>
                  {drivers.length > 0 ? "Select drivers to display lap times." : "No data available for this session."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <footer className="text-center text-f1LightGray text-xs mt-8">
        <p>Data provided by <a href="https://openf1.org/" target="_blank" rel="noopener noreferrer" className="text-f1Red hover:underline">OpenF1 API</a>.</p>
        <p>Dashboard built with React, Chart.js, and Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;
