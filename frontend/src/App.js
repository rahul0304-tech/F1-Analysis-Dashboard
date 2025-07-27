import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import DriverList from './DriverList';
import DriverDetail from './DriverDetail';

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drivers" element={<DriverList />} />
          <Route path="/drivers/:driverId" element={<DriverDetail />} />
          <Route path="/analysis" element={<Dashboard />} />
          <Route path="/meetings" element={<Dashboard />} />
          <Route path="/tyres" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;