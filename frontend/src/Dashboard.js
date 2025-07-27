import React, { useState, useEffect } from 'react';
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
  BarElement,
} from 'chart.js';
import { GaugeCircle, Clock, Users, Flag } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

const API_BASE_URL = 'https://f1-backend-deployment.onrender.com/';

const Dashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedMeetingKey, setSelectedMeetingKey] = useState(null);
  const [selectedSessionKey, setSelectedSessionKey] = useState(null);
  const [selectedDriverNumbers, setSelectedDriverNumbers] = useState([]);
  const [lapData, setLapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState(null);

  // Poll backend for ingestion status
  useEffect(() => {
    const checkIngestStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/status`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setIsIngesting(data.updating);
      } catch (e) {
        console.error("Failed to fetch ingestion status:", e);
        setIsIngesting(false);
      }
    };

    checkIngestStatus();
    const interval = setInterval(checkIngestStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Meetings on component mount or when ingestion status changes to false
  useEffect(() => {
    const fetchMeetings = async () => {
      if (isIngesting) {
        setLoading(true);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/meetings`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setMeetings(data);
        if (data.length > 0) {
          setSelectedMeetingKey(data[0].meeting_key);
        } else {
          setSelectedMeetingKey(null);
        }
      } catch (e) {
        setError(`Failed to fetch meetings: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, [isIngesting]);

  // Fetch Sessions when selectedMeetingKey changes
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedMeetingKey || isIngesting) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/sessions?meeting_key=${selectedMeetingKey}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setSessions(data);
        if (data.length > 0) {
          const raceSession = data.find(s => s.session_type === 'Race');
          setSelectedSessionKey(raceSession ? raceSession.session_key : data[0].session_key);
        } else {
          setSelectedSessionKey(null);
        }
      } catch (e) {
        setError(`Failed to fetch sessions: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [selectedMeetingKey, isIngesting]);

  // Fetch Drivers and Lap Data when selectedSessionKey changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSessionKey || isIngesting) {
        setDrivers([]);
        setLapData([]);
        setSelectedDriverNumbers([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const driversResponse = await fetch(`${API_BASE_URL}/drivers?session_key=${selectedSessionKey}`);
        if (!driversResponse.ok) throw new Error(`HTTP error! status: ${driversResponse.status}`);
        const driversData = await driversResponse.json();
        setDrivers(driversData);

        const lapsResponse = await fetch(`${API_BASE_URL}/laps?session_key=${selectedSessionKey}`);
        if (!lapsResponse.ok) throw new Error(`HTTP error! status: ${lapsResponse.status}`);
        const lapsData = await lapsResponse.json();
        setLapData(lapsData);

        const uniqueDriverNumbers = Array.from(new Set(lapsData.map(lap => lap.driver_number)));
        const topDriversForSession = driversData
          .filter(d => uniqueDriverNumbers.includes(d.driver_number))
          .sort((a, b) => {
            const avgLapA = calculateAverageLapTime(a.driver_number, lapsData);
            const avgLapB = calculateAverageLapTime(b.driver_number, lapsData);
            return avgLapA - avgLapB;
          })
          .slice(0, 3)
          .map(d => d.driver_number);
        setSelectedDriverNumbers(topDriversForSession);

      } catch (e) {
        setError(`Failed to fetch data for session: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSessionKey, isIngesting]);

  // Helper function to format time (seconds to M:SS.mmm)
  const formatTime = (seconds) => {
    if (seconds === null || isNaN(seconds)) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  // Helper function to calculate average lap time for a driver
  const calculateAverageLapTime = (driverNumber, laps) => {
    const driverLaps = laps.filter(lap => lap.driver_number === driverNumber && lap.lap_duration > 0);
    if (driverLaps.length === 0) return Infinity;
    const totalDuration = driverLaps.reduce((sum, lap) => sum + lap.lap_duration, 0);
    return totalDuration / driverLaps.length;
  };

  // Helper function to get fastest lap for a driver
  const getFastestLap = (driverNumber, laps) => {
    const driverLaps = laps.filter(lap => lap.driver_number === driverNumber && lap.lap_duration > 0);
    if (driverLaps.length === 0) return null;
    return Math.min(...driverLaps.map(lap => lap.lap_duration));
  };

  // Handle driver selection for the chart
  const handleDriverToggle = (driverNumber) => {
    setSelectedDriverNumbers(prev =>
      prev.includes(driverNumber)
        ? prev.filter(num => num !== driverNumber)
        : [...prev, driverNumber]
    );
  };

  // Combined loading state for initial load and ingestion
  const showOverallLoader = loading || isIngesting;

  // Prepare data for the Line Chart (Lap Times)
  const chartLabels = lapData.length > 0 ? Array.from(new Set(lapData.map(lap => lap.lap_number))).sort((a, b) => a - b) : [];
  const chartDatasets = selectedDriverNumbers.map(driverNumber => {
    const driverInfo = drivers.find(d => d.driver_number === driverNumber);
    const driverLaps = lapData.filter(lap => lap.driver_number === driverNumber);
    return {
      label: driverInfo ? driverInfo.full_name : `Driver ${driverNumber}`,
      data: chartLabels.map(lapNum => {
        const lap = driverLaps.find(l => l.lap_number === lapNum);
        return lap ? lap.lap_duration : null;
      }),
      borderColor: driverInfo ? `#${driverInfo.team_color}` : 'rgb(75, 192, 192)',
      backgroundColor: driverInfo?.team_color ? `rgba(${parseInt(driverInfo.team_color.substring(0, 2), 16)}, ${parseInt(driverInfo.team_color.substring(2, 4), 16)}, ${parseInt(driverInfo.team_color.substring(4, 6), 16)}, 0.5)` : 'rgba(75, 192, 192, 0.5)',
      tension: 0.1,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      fill: false,
      spanGaps: true, // Connect lines across missing data points
    };
  });

  const chartData = {
    labels: chartLabels,
    datasets: chartDatasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#F0F0F0',
        },
      },
      title: {
        display: true,
        text: 'Lap Times Comparison',
        color: '#F0F0F0',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.raw !== null) {
              label += formatTime(context.raw);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Lap Number',
          color: '#F0F0F0',
        },
        ticks: {
          color: '#F0F0F0',
          callback: function(value, index, values) {
            // Display integer ticks only
            if (Number.isInteger(value)) {
              return value;
            }
            return '';
          }
        },
        grid: {
          color: 'rgba(240, 240, 240, 0.1)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Lap Duration (M:SS.mmm)',
          color: '#F0F0F0',
        },
        ticks: {
          color: '#F0F0F0',
          callback: function(value, index, values) {
            return formatTime(value);
          }
        },
        grid: {
          color: 'rgba(240, 240, 240, 0.1)',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-f1Black text-f1LightGray p-6">
      {showOverallLoader ? (
        <div className="flex flex-col items-center justify-center h-full">
          <GaugeCircle className="animate-spin text-f1Red mb-4" size={48} />
          <p className="text-white text-lg">{isIngesting ? 'Ingesting data, please wait...' : 'Loading data...'}</p>
        </div>
      ) : error ? (
        <div className="text-center text-f1Red text-lg">
          <p>Error: {error}</p>
          <p>Please try refreshing the page or check the backend server.</p>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-bold text-white mb-8 text-center">F1 Race Analysis Dashboard</h1>

          {/* Control Panel */}
          <div className="bg-f1DarkGray p-6 rounded-lg shadow-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="meeting-select" className="block text-f1LightGray text-sm font-bold mb-2">Select Meeting:</label>
              <select
                id="meeting-select"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-f1Black leading-tight focus:outline-none focus:shadow-outline bg-f1LightGray"
                value={selectedMeetingKey || ''}
                onChange={(e) => setSelectedMeetingKey(e.target.value)}
              >
                {meetings.map(meeting => (
                  <option key={meeting.meeting_key} value={meeting.meeting_key}>
                    {meeting.meeting_name} ({meeting.year})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="session-select" className="block text-f1LightGray text-sm font-bold mb-2">Select Session:</label>
              <select
                id="session-select"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-f1Black leading-tight focus:outline-none focus:shadow-outline bg-f1LightGray"
                value={selectedSessionKey || ''}
                onChange={(e) => setSelectedSessionKey(e.target.value)}
              >
                {sessions.map(session => (
                  <option key={session.session_key} value={session.session_key}>
                    {session.session_name} - {new Date(session.date_start).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="block text-f1LightGray text-sm font-bold mb-2">Select Drivers for Chart:</h3>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                {drivers.map(driver => (
                  <div key={driver.driver_number} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`driver-${driver.driver_number}`}
                      checked={selectedDriverNumbers.includes(driver.driver_number)}
                      onChange={() => handleDriverToggle(driver.driver_number)}
                      className="form-checkbox h-4 w-4 text-f1Red rounded focus:ring-f1Red-dark"
                      style={{ accentColor: `#${driver.team_color}` }} // Apply team color to checkbox
                    />
                    <label htmlFor={`driver-${driver.driver_number}`} className="ml-2 text-f1LightGray text-sm flex items-center">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: `#${driver.team_color}` }}
                      ></span>
                      {driver.full_name} ({driver.driver_number})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-f1DarkGray p-4 rounded-lg shadow-lg flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="text-f1Red mr-3" size={24} />
                <div>
                  <p className="text-f1LightGray text-sm">Average Lap Time (Selected Drivers)</p>
                  <p className="text-white text-xl font-semibold">
                    {selectedDriverNumbers.length > 0 ? formatTime(calculateAverageLapTime(selectedDriverNumbers[0], lapData)) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Another stat for example, e.g., Fastest Lap */} 
            <div className="bg-f1DarkGray p-4 rounded-lg shadow-lg flex items-center justify-between">
              <div className="flex items-center">
                <Flag className="text-f1Red mr-3" size={24} />
                <div>
                  <p className="text-f1LightGray text-sm">Fastest Lap (Selected Drivers)</p>
                  <p className="text-white text-xl font-semibold">
                    {selectedDriverNumbers.length > 0 ? formatTime(getFastestLap(selectedDriverNumbers[0], lapData)) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Another stat for example, e.g., Total Drivers */} 
            <div className="bg-f1DarkGray p-4 rounded-lg shadow-lg flex items-center justify-between">
              <div className="flex items-center">
                <Users className="text-f1Red mr-3" size={24} />
                <div>
                  <p className="text-f1LightGray text-sm">Total Drivers in Session</p>
                  <p className="text-white text-xl font-semibold">
                    {drivers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lap Times Chart */} 
          <div className="bg-f1DarkGray p-6 rounded-lg shadow-lg mb-8" style={{ height: '500px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
