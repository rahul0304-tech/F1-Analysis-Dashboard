import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DriverDetail = () => {
  const { driverId } = useParams();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const response = await fetch(`/api/drivers/${driverId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDriver(data);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [driverId]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading driver details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error.message}</div>;
  }

  if (!driver) {
    return <div className="container mx-auto p-4">Driver not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{driver.full_name}</h2>
      <p className="text-gray-700">Team: {driver.team_name}</p>
      <p className="text-gray-700">Driver Number: {driver.driver_number}</p>
      <div className="flex items-center mt-2">
        <p className="text-gray-700 mr-2">Team Color:</p>
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${driver.team_color}` }}></div>
      </div>
    </div>
  );
};

export default DriverDetail;