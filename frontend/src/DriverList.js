import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch('/api/drivers');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDrivers(data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Loading drivers...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">F1 Drivers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => (
          <Link to={`/drivers/${driver.driver_number}`} key={driver.driver_number} className="block p-4 border rounded shadow hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-xl font-semibold">{driver.full_name}</h3>
            <p className="text-gray-600">Team: {driver.team_name}</p>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `#${driver.team_color}` }}></div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DriverList;