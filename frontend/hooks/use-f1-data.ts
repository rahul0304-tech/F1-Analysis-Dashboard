"use client"

import { useState, useEffect, useCallback } from "react"
import { f1Api, type Meeting, type Session, type Lap, type Driver, type SeasonStats } from "@/lib/api"

export function useF1Data() {
  // Core data states
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]) // For the comparison pool
  const [laps, setLaps] = useState<Lap[]>([])
  const [seasonStats, setSeasonStats] = useState<SeasonStats>({ year: 0, total_sessions: 0, total_drivers: 0 });
  
  // Filter/selection states
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  
  // Status states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<string>("checking")

  // Check API status
  const checkApiStatus = useCallback(async () => {
    try {
      const status = await f1Api.getStatus();
      setApiStatus(status?.status === 'ok' ? "Connected" : "Offline");
    } catch {
      setApiStatus("offline");
    }
  }, []);

  // Effect 1: Fetch initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      await checkApiStatus();
      try {
        const currentYear = new Date().getFullYear();
        const [meetingsData, statsData, allDriversData] = await Promise.all([
          f1Api.getMeetings(),
          f1Api.getSeasonStats(currentYear),
          f1Api.getAllDrivers() // Fetch all drivers for the pool
        ]);
        
        setMeetings(meetingsData || []);
        setAllDrivers(allDriversData || []);
        
        if (meetingsData && meetingsData.length > 0) {
          setSelectedMeeting(meetingsData[0]);
        }
        
        setSeasonStats(statsData || { year: currentYear, total_sessions: 0, total_drivers: 0 });

      } catch (err) {
        setError("Failed to load initial F1 data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [checkApiStatus]);
  
  // Effect 2: Fetch sessions for the selected meeting
  useEffect(() => {
    if (!selectedMeeting) return;
    const loadSessions = async () => {
      setLoading(true);
      const sessionsData = await f1Api.getSessions(selectedMeeting._id);
      if (sessionsData) {
        setSessions(sessionsData);
        const raceSession = sessionsData.find(s => s.session_name.toLowerCase() === 'race');
        setSelectedSession(raceSession || sessionsData[0] || null);
      }
      setLoading(false);
    };
    loadSessions();
  }, [selectedMeeting]);

  // Effect 3: Fetch detailed data for the selected session
  useEffect(() => {
    if (!selectedSession) {
        setDrivers([]);
        setLaps([]);
        return;
    };
    const loadSessionData = async () => {
      setLoading(true);
      const [driversData, lapsData] = await Promise.all([
        f1Api.getDriversForSession(selectedSession._id),
        f1Api.getLaps(selectedSession._id)
      ]);
      setDrivers(driversData || []);
      setLaps(lapsData || []);
      setLoading(false);
    };
    loadSessionData();
  }, [selectedSession]);
  
  return {
    meetings,
    selectedMeeting,
    setSelectedMeeting,
    sessions,
    selectedSession,
    setSelectedSession,
    drivers,
    allDrivers, // Expose the full driver list
    laps,
    loading,
    error,
    apiStatus,
    seasonStats,
  };
}
