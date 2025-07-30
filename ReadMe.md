# F1 Analysis Dashboard

## 🏁 Overview

The F1 Analysis Dashboard is a comprehensive, data-rich web application designed for Formula 1 enthusiasts and data analysts. It provides a detailed, interactive platform to explore and compare performance data across multiple F1 seasons. The application features a modern, responsive user interface and is powered by a robust Python backend that serves data from a comprehensive F1 database.

---

## ✨ Features

This dashboard is composed of several key pages, each offering a unique analytical perspective:

* **📊 Overview:** A high-level summary of the most recent season, including total meetings, sessions, and participating drivers. It also provides quick links and a list of the most recent race meetings.
* **🗓️ Meetings:** A browsable list of all race weekends, searchable by name and filterable by year.
* **⏱️ Sessions:** A detailed view of all sessions (Practice, Qualifying, Sprint, Race) within a given meeting. Users can filter sessions by meeting and type.
* **🏎️ Drivers Directory:** A master list of all drivers in the database. It features a search by name, a filter by team, and a popup for each driver displaying their career statistics, including Grand Prix wins and World Championships.
* **📈 Lap Analysis:** A powerful tool for analyzing lap times from any session. It includes statistical summaries (fastest lap, average lap) and a detailed, sortable table of all laps. It also includes a CSV export feature.
* **🏆 Records:** A page dedicated to showcasing key season records. Users can select a year to view the World Champion, the driver with the most wins, and the driver who set the fastest lap of the season.
* **⚔️ Tactical Comparison:** A highly flexible and robust tool for head-to-head analysis. Users can create up to four "comparison columns" to compare drivers against each other or even against themselves in different contexts (e.g., Max Verstappen in 2024 vs. 2025). The tool generates detailed charts for lap times and sector times, alongside key statistical metrics like fastest lap and lap time consistency.

---

## 🛠️ Tech Stack

The project is built with a modern, decoupled architecture.

### **Frontend**

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
* **Charting:** [Chart.js](https://www.chartjs.org/)
* **Drag & Drop:** [DND Kit](https://dndkit.com/)

### **Backend**

* **Framework:** [Flask](https://flask.palletsprojects.com/) (Python)
* **Database:** [MongoDB](https://www.mongodb.com/)
* **API:** REST

---

## 📂 Project Structure

The frontend application is organized into the following key directories:

* `app/`: Contains the page components for each route in the Next.js App Router.
* `components/`: Shared UI components, including the `shadcn/ui` library.
* `hooks/`: Custom React hooks, notably the central `use-f1-data.ts` for state management.
* `lib/`: Core application logic, including the `api.ts` service for backend communication and `utils.ts`.

---

## 🔗 Backend API Endpoints

The Flask backend exposes a comprehensive REST API to serve the data:

| Method | Endpoint                             | Description                                                              |
| :----- | :----------------------------------- | :----------------------------------------------------------------------- |
| `GET`  | `/api/status`                        | Checks if the API service is running.                                    |
| `GET`  | `/api/years`                         | Returns a list of all years for which data is available.                 |
| `GET`  | `/api/meetings`                      | Returns a de-duplicated list of all race meetings.                       |
| `GET`  | `/api/meetings/<key>/details`        | Returns consolidated data for a meeting, its sessions, and the winner.   |
| `GET`  | `/api/sessions/<key>/details`        | Returns consolidated data for a session, its meeting, positions, and laps. |
| `GET`  | `/api/drivers/all`                   | Returns a master list of all drivers.                                    |
| `GET`  | `/api/drivers/<num>/stats`           | Returns career statistics (wins, championships) for a specific driver.   |
| `GET`  | `/api/records?year=<year>`           | Returns calculated records (Champion, Most Wins, etc.) for a season.     |
| `GET`  | `/api/analysis`                      | Provides career, season, or track-based analysis for selected drivers.   |
| `POST` | `/api/comparison/laps`               | Returns detailed lap and sector data for robust head-to-head comparisons.|

---

## 🚀 Setup and Installation

To run this project locally, follow these steps:

### **Prerequisites**

* Node.js (v18 or later)
* Python 3.x
* A MongoDB database instance (local or cloud)

### **Backend Setup**

1.  Navigate to the `backend` directory.
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Create a `.env` file and add your MongoDB connection string:
    ```
    MONGO_URI="your_mongodb_connection_string"
    ```
4.  Run the Flask server:
    ```bash
    python app.py
    ```

### **Frontend Setup**

1.  Navigate to the `frontend` directory.
2.  Install the required Node.js packages:
    ```bash
    npm install
    ```
3.  Run the Next.js development server:
    ```bash
    npm run dev
    ```
4.  Open your localhost in your browser.

---

## ☁️ Deployment

This application is designed for a decoupled deployment:

* **Frontend:** The Next.js application can be deployed as a static site on platforms like Vercel or Netlify for optimal performance.
* **Backend:** The Flask API should be deployed as a web service on a platform like Render or Heroku.
