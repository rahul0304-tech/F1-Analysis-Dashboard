import React from 'react';
import { Link } from 'react-router-dom';
import { Home, BarChart, Users, Flag, Droplets } from 'lucide-react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-f1Black text-f1LightGray flex flex-col">
      <header className="bg-f1Red p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">F1 Dashboard</h1>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="text-white hover:text-f1DarkGray flex items-center">
                <Home className="mr-2" size={20} />Home
              </Link>
            </li>
            <li>
              <Link to="/analysis" className="text-white hover:text-f1DarkGray flex items-center">
                <BarChart className="mr-2" size={20} />Analysis
              </Link>
            </li>
            <li>
              <Link to="/drivers" className="text-white hover:text-f1DarkGray flex items-center">
                <Users className="mr-2" size={20} />Driver List
              </Link>
            </li>
            <li>
              <Link to="/meetings" className="text-white hover:text-f1DarkGray flex items-center">
                <Flag className="mr-2" size={20} />Meetings
              </Link>
            </li>
            <li>
              <Link to="/tyres" className="text-white hover:text-f1DarkGray flex items-center">
                <Droplets className="mr-2" size={20} />Tyres
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="flex-grow p-6">
        {children}
      </main>
      <footer className="bg-f1DarkGray p-4 text-center text-f1LightGray text-sm">
        <p>&copy; 2024 F1 Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;