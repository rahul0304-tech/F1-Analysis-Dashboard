// frontend/lib/api.ts

// --- Configuration ---
const BASE_URL = "https://f1-backend-deployment.onrender.com/api";

// --- TypeScript Interfaces ---

export interface Meeting {
  _id: number;
  meeting_name: string;
  circuit_short_name: string;
  location: string;
  country_name: string;
  country_code: string;
  year: number;
  date_start: string;
  circuit_key: number;
}

export interface Session {
  _id: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
}

export interface Driver {
  _id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  team_name: string;
  team_colour: string;
  headshot_url: string;
  country_code: string;
}

export interface Lap {
  _id: { $oid: string };
  session_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number;
  stint: number;
  is_pit_out_lap: boolean;
  tyre_compound: string;
  team_name: string;
  full_name: string;
  team_color: string;
}

export interface Position {
  position: number | null;
  driver_number: number;
  full_name: string;
  team_name: string;
  team_color: string;
  laps_completed: number;
  headshot_url: string;
  dnf: boolean;
}

export interface SeasonStats {
  year: number;
  total_sessions: number;
  total_drivers: number;
}

export interface DriverStats {
    driver_number: number;
    grand_prix_victories: number;
    championships_won: number;
}

export interface DriverComparisonStats {
  driver_number: number;
  position: number | 'N/A';
  fastest_lap: number | 'N/A';
  pit_stops: number;
}

export interface MeetingDetailsResponse {
    meeting_details: Meeting;
    sessions: Session[];
    winner: Position | null;
}

export interface SessionDetailsResponse {
    session: Session;
    meeting: Meeting | null;
    positions: Position[];
    fastest_laps: Lap[];
}

export interface SeasonChampionRecord {
    _id: number;
    total_points: number;
    driver_info: Driver;
}

export interface MostWinsRecord {
    _id: number;
    wins: number;
    driver_info: Driver;
}

export interface FastestLapRecord {
    _id: { $oid: string };
    lap_duration: number;
    driver_info: Driver;
    meeting_info: Meeting;
}

export interface RecordsResponse {
    year: number;
    season_champion: SeasonChampionRecord | null;
    most_wins: MostWinsRecord | null;
    fastest_lap: FastestLapRecord | null;
}

export interface CareerAnalysisResult {
    driver_number: number;
    wins: number;
    podiums: number;
    poles: number;
}
export interface SeasonAnalysisResult {
    driver_number: number;
    wins: number;
    podiums: number;
}
export interface TrackAnalysisResult {
    driver_number: number;
    best_lap_time: {
        fastest_lap: number;
        year: number;
    };
}
export type AnalysisResult = CareerAnalysisResult[] | SeasonAnalysisResult[] | TrackAnalysisResult[];

// --- NEW: Interfaces for the robust Comparison Page ---
export interface ComparisonLap {
    lap_number: number;
    lap_duration: number;
    sector_1_time: number | null;
    sector_2_time: number | null;
    sector_3_time: number | null;
    tyre_compound: string;
}

export interface ComparisonColumnData {
    columnId: string;
    laps: ComparisonLap[];
}

export type ComparisonLapsResponse = ComparisonColumnData[];


// --- API Service Class ---

class F1ApiService {
  private async fetchWithErrorHandling<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error: ${response.status} - ${response.statusText}`, errorData);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Network or parsing error for ${endpoint}:`, error);
      return null;
    }
  }

  // --- Core API Methods ---

  async getStatus(): Promise<{ status: string } | null> {
    return this.fetchWithErrorHandling<{ status: string }>("/status");
  }

  async getMeetings(): Promise<Meeting[] | null> {
    return this.fetchWithErrorHandling<Meeting[]>("/meetings");
  }

  async getMeeting(meetingKey: number | string): Promise<Meeting | null> {
      return this.fetchWithErrorHandling<Meeting>(`/meetings/${meetingKey}`);
  }

  async getMeetingDetails(meetingKey: number | string): Promise<MeetingDetailsResponse | null> {
    return this.fetchWithErrorHandling<MeetingDetailsResponse>(`/meetings/${meetingKey}/details`);
  }

  async getSessions(meetingKey: number | string): Promise<Session[] | null> {
    return this.fetchWithErrorHandling<Session[]>(`/meetings/${meetingKey}/sessions`);
  }
  
  async getSession(sessionKey: number | string): Promise<Session | null> {
      return this.fetchWithErrorHandling<Session>(`/sessions/${sessionKey}`);
  }

  async getSessionDetails(sessionKey: number | string): Promise<SessionDetailsResponse | null> {
      return this.fetchWithErrorHandling<SessionDetailsResponse>(`/sessions/${sessionKey}/details`);
  }

  async getSessionPositions(sessionKey: number | string): Promise<Position[] | null> {
    return this.fetchWithErrorHandling<Position[]>(`/sessions/${sessionKey}/positions`);
  }

  async getFastestLaps(sessionKey: number | string): Promise<Lap[] | null> {
    return this.fetchWithErrorHandling<Lap[]>(`/laps?session_key=${sessionKey}&sort=fastest`);
  }
  
  async getLaps(sessionKey: number | string): Promise<Lap[] | null> {
    return this.fetchWithErrorHandling<Lap[]>(`/laps?session_key=${sessionKey}`);
  }

  async getDriversForSession(sessionKey: number | string): Promise<Driver[] | null> {
    return this.fetchWithErrorHandling<Driver[]>(`/drivers?session_key=${sessionKey}`);
  }

  async getAllDrivers(): Promise<Driver[] | null> {
    return this.fetchWithErrorHandling<Driver[]>('/drivers/all');
  }

  async getSeasonStats(year: number): Promise<SeasonStats | null> {
    return this.fetchWithErrorHandling<SeasonStats>(`/stats/season/${year}`);
  }

  async getDriverStats(driverNumber: number): Promise<DriverStats | null> {
    return this.fetchWithErrorHandling<DriverStats>(`/drivers/${driverNumber}/stats`);
  }

  async getComparisonData(sessionKey: number, driverIds: number[]): Promise<DriverComparisonStats[] | null> {
    const driversQuery = driverIds.join(',');
    return this.fetchWithErrorHandling<DriverComparisonStats[]>(`/sessions/${sessionKey}/compare?drivers=${driversQuery}`);
  }

  async getRecords(year: number): Promise<RecordsResponse | null> {
    return this.fetchWithErrorHandling<RecordsResponse>(`/records?year=${year}`);
  }

  async getAvailableYears(): Promise<number[] | null> {
    return this.fetchWithErrorHandling<number[]>('/years');
  }

  async getAnalysis(params: {
    type: 'career' | 'season' | 'track';
    drivers: number[];
    year?: number;
    circuit_key?: number;
  }): Promise<AnalysisResult | null> {
    const query = new URLSearchParams({
        type: params.type,
        drivers: params.drivers.join(','),
    });
    if (params.year) query.append('year', params.year.toString());
    if (params.circuit_key) query.append('circuit_key', params.circuit_key.toString());
    
    return this.fetchWithErrorHandling<AnalysisResult>(`/analysis?${query.toString()}`);
  }

  // --- NEW: Method for the robust Comparison Page ---
  async getComparisonLaps(columns: {id: string, driverNumber: number, sessionKey: number}[]): Promise<ComparisonLapsResponse | null> {
    return this.fetchWithErrorHandling<ComparisonLapsResponse>('/comparison/laps', {
        method: 'POST',
        body: JSON.stringify(columns)
    });
  }
}

export const f1Api = new F1ApiService();
